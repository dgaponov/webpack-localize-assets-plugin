import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import type {
	CallExpression, Expression, VariableDeclaration,
} from 'estree';
import { configureWebpack } from '../utils/configure-webpack.js';
import WebpackLocalizeAssetsPlugin from '#webpack-localize-assets-plugin'; // eslint-disable-line import/no-unresolved

const isI18nBind = (expr: Expression): expr is CallExpression => expr.type === 'CallExpression' && expr.callee.type === 'MemberExpression' && expr.callee.object.type === 'Identifier' && expr.callee.object.name === 'i18n';

const getNamespaceFromBind = (expr: CallExpression) => {
	if (expr.arguments.length === 2 && expr.arguments[1].type === 'Literal' && typeof expr.arguments[1].value === 'string') {
		return expr.arguments[1].value;
	}

	throw new Error('Incorrect args count');
};

const functionResolver = (node: VariableDeclaration) => {
	if (node.declarations.length === 1 && node.declarations[0].id.type === 'Identifier' && node.declarations[0].id.name.startsWith('i18n') && node.declarations[0].init && isI18nBind(node.declarations[0].init)) {
		return {
			functionName: node.declarations[0].id.name,
			namespace: getNamespaceFromBind(node.declarations[0].init),
		};
	}
};

export default testSuite(({ describe }) => {
	describe('functionResolver', ({ test }) => {
		test('single locale', async () => {
			const localesTest = {
				en: {
					'hello-key': 'hello-key-wrong',
					'namespace1:hello-key': 'Hello',
					'namespace2:check': 'checker',
				},
			};

			const built = await build(
				{
					'/src/index.js': `
					const i18n = (namespace) => (key) => key;
					const i18nK = i18n.bind(null, 'namespace1');
					const i18nM = i18n.bind(null, 'namespace2');
					export default i18nK('hello-key') + ' ' + i18nM('check');
					`,
				},
				(config) => {
					configureWebpack(config);

					config.plugins!.push(
						new WebpackLocalizeAssetsPlugin({
							locales: localesTest,
							functionResolver,
							localizeCompiler: new Proxy({ PLACEHOLDER_FN: () => '' }, {
								get(_) {
									return (callArguments, locale, namespace) => {
										const parts = callArguments[0].replaceAll("'", '').split('::');
										const key = parts.pop();
										const fullKey = namespace ? `${namespace}:${key}` : key;
										return `'${localesTest[locale][fullKey]}'`;
									};
								},
							}),
						}),
					);
				},
			);

			const enBuildMain = built.require('/dist/index.en.js');
			expect(enBuildMain).toBe(`${localesTest.en['namespace1:hello-key']} ${localesTest.en['namespace2:check']}`);
		});

		test('multi locale', async () => {
			const localesTest = {
				en: {
					'hello-key': 'hello-key-wrong',
					'namespace1:hello-key': 'Hello',
					'namespace2:check': 'checker',
				},
				es: {
					'hello-key': 'hala error',
					'namespace1:hello-key': 'hala',
					'namespace2:check': 'chacka-es',
				},
				ja: {
					'hello-key': 'holo wrong',
					'namespace1:hello-key': 'holo',
					'namespace2:check': 'choocka-ja',
				},
			};

			const built = await build(
				{
					'/src/index.js': `
					const i18n = (namespace) => (key) => key;
					const i18nK = i18n.bind(null, 'namespace1');
					const i18nM = i18n.bind(null, 'namespace2');
					export default i18nK('hello-key') + ' ' + i18nM('check');
					`,
				},
				(config) => {
					configureWebpack(config);

					config.plugins!.push(
						new WebpackLocalizeAssetsPlugin({
							locales: localesTest,
							functionResolver,
							localizeCompiler: new Proxy({ PLACEHOLDER_FN: () => '' }, {
								get(_) {
									return (callArguments, locale, namespace) => {
										const parts = callArguments[0].replaceAll("'", '').split('::');
										const key = parts.pop();
										const fullKey = namespace ? `${namespace}:${key}` : key;
										return `'${localesTest[locale][fullKey]}'`;
									};
								},
							}),
						}),
					);
				},
			);

			const { assets } = built.stats.compilation;
			expect(Object.keys(assets).length).toBe(3);

			const enBuild = built.require('/dist/index.en.js');
			expect(enBuild).toBe(`${localesTest.en['namespace1:hello-key']} ${localesTest.en['namespace2:check']}`);

			const esBuild = built.require('/dist/index.es.js');
			expect(esBuild).toBe(`${localesTest.es['namespace1:hello-key']} ${localesTest.es['namespace2:check']}`);

			const jaBuild = built.require('/dist/index.ja.js');
			expect(jaBuild).toBe(`${localesTest.ja['namespace1:hello-key']} ${localesTest.ja['namespace2:check']}`);

			const statsOutput = built.stats.toString();
			expect(statsOutput).toMatch(/index\.en\.js/);
			expect(statsOutput).toMatch(/index\.es\.js/);
			expect(statsOutput).toMatch(/index\.ja\.js/);
		});
	});
});
