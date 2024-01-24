import webpack from 'webpack';
import type WebpackError from 'webpack/lib/WebpackError.js';
import * as walk from 'acorn-walk';
import * as acorn from 'acorn';
import type { SimpleCallExpression, VariableDeclaration } from 'estree';
import {
	Webpack,
	Compilation,
	WP5,
	NormalModuleFactory,
	Module,
	FunctionNamesOrResolver,
} from '../types-internal.js';
import { name } from '../../package.json';

export const isWebpack5 = (wp: Webpack) => {
	const [major] = wp.version ? wp.version.split('.') : [];
	return major === '5';
};

export const isWebpack5Compilation = (
	compilation: Compilation,
): compilation is WP5.Compilation => ('processAssets' in compilation.hooks);

export const { toConstantDependency } = (
	isWebpack5(webpack)
		? require('webpack/lib/javascript/JavascriptParserHelpers') // eslint-disable-line node/global-require,import/no-unresolved
		: require('webpack/lib/ParserHelpers') // eslint-disable-line node/global-require
);

export const deleteAsset = (
	compilation: Compilation,
	assetName: string,
	newAssetNames: string[],
) => {
	// Delete original unlocalized asset
	if (isWebpack5Compilation(compilation)) {
		for (const chunk of compilation.chunks) {
			if (chunk.files.has(assetName)) {
				for (const newAssetName of newAssetNames) {
					chunk.files.add(newAssetName);
				}
			}
			if (chunk.auxiliaryFiles.has(assetName)) {
				for (const newAssetName of newAssetNames) {
					chunk.auxiliaryFiles.add(newAssetName);
				}
			}
		}

		compilation.deleteAsset(assetName);
	} else {
		delete compilation.assets[assetName];

		/**
		 * To support terser-webpack-plugin v1.4.5 (bundled with Webpack 4)
		 * which iterates over chunks instead of assets
		 * https://github.com/webpack-contrib/terser-webpack-plugin/blob/v1.4.5/src/index.js#L176
		 */
		for (const chunk of compilation.chunks) {
			const hasAsset = chunk.files.indexOf(assetName);
			if (hasAsset > -1) {
				chunk.files.splice(hasAsset, 1, ...newAssetNames);
			}
		}
	}
};

export const pushUniqueError = <T extends Error>(
	array: T[],
	element: T,
) => {
	const exists = array.find(
		elementB => elementB.message === element.message,
	);

	if (!exists) {
		array.push(element);
	}
};

export const reportModuleWarning = (
	module: Module,
	warning: WebpackError,
) => {
	if ('addWarning' in module) {
		module.addWarning(warning);
	} else {
		pushUniqueError(
			module.warnings,
			warning,
		);
	}
};

export const reportModuleError = (
	module: Module,
	error: WebpackError,
) => {
	if ('addError' in module) {
		module.addError(error);
	} else {
		pushUniqueError(
			module.errors,
			error,
		);
	}
};

export const onFunctionCall = (
	normalModuleFactory: NormalModuleFactory,
	functionNamesOrResolver: FunctionNamesOrResolver,
	callback: (
		functionName: string,
		parser: WP5.javascript.JavascriptParser,
		node: SimpleCallExpression,
		namespace?: string,
	) => void,
) => {
	const handler = (parser: WP5.javascript.JavascriptParser) => {
		const functionToNamespace: Record<string, string | undefined> = {};
		if (Array.isArray(functionNamesOrResolver)) {
			functionNamesOrResolver.forEach((functionName) => {
				functionToNamespace[functionName] = undefined;
			});
		}

		parser.hooks.program.tap(name, (ast) => {
			if (typeof functionNamesOrResolver === 'function') {
				walk.simple(ast as unknown as acorn.Node, {
					VariableDeclaration: (node) => {
						const result = functionNamesOrResolver(node as VariableDeclaration);

						if (result) {
							functionToNamespace[result.functionName] = result.namespace;
						}
					},
				});
			}

			walk.simple(ast as unknown as acorn.Node, {
				CallExpression: (node) => {
					if (node.callee.type === 'Identifier' && node.callee.name in functionToNamespace) {
						callback(
							node.callee.name,
							parser,
							node as SimpleCallExpression,
							functionToNamespace[node.callee.name],
						);
					}
				},
			});
		});
	};

	normalModuleFactory.hooks.parser
		.for('javascript/auto')
		.tap(name, handler);
	normalModuleFactory.hooks.parser
		.for('javascript/dynamic')
		.tap(name, handler);
	normalModuleFactory.hooks.parser
		.for('javascript/esm')
		.tap(name, handler);
};

export const onAssetPath = (
	compilation: Compilation,
	callback: (
		filePath: string | ((data: any) => string),
		data: any,
	) => string,
) => {
	if (isWebpack5Compilation(compilation)) {
		compilation.hooks.assetPath.tap(
			name,
			callback,
		);
	} else {
		// @ts-expect-error Missing assetPath hook from @type
		compilation.mainTemplate.hooks.assetPath.tap(
			name,
			callback,
		);
	}
};

export const onOptimizeAssets = (
	compilation: Compilation,
	callback: () => void,
) => {
	if (isWebpack5Compilation(compilation)) {
		/**
		 * Important this this happens before PROCESS_ASSETS_STAGE_OPTIMIZE_HASH, which is where
		 * RealContentHashPlugin re-hashes assets:
		 * https://github.com/webpack/webpack/blob/f0298fe46f/lib/optimize/RealContentHashPlugin.js#L140
		 *
		 * PROCESS_ASSETS_STAGE_SUMMARIZE happens after minification
		 * (PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE) but before re-hashing
		 * (PROCESS_ASSETS_STAGE_OPTIMIZE_HASH).
		 *
		 * PROCESS_ASSETS_STAGE_SUMMARIZE isn't actually used by Webpack, but there seemed
		 * to be other plugins that were relying on it to summarize assets, so it makes sense
		 * to run just before that.
		 *
		 * All "process assets" stages:
		 * https://github.com/webpack/webpack/blob/f0298fe46f/lib/Compilation.js#L5125-L5204
		 */
		const Webpack5Compilation = compilation.constructor as typeof WP5.Compilation;
		compilation.hooks.processAssets.tap(
			{
				name,
				stage: Webpack5Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE - 1,
				additionalAssets: true,
			},
			callback,
		);
	} else {
		// Triggered after minification, which usually happens in optimizeChunkAssets
		compilation.hooks.optimizeAssets.tap(
			name,
			callback,
		);
	}
};
