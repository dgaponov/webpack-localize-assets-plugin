import MagicString from 'magic-string';
import { RawSource, SourceMapSource, SourceAndMapResult } from 'webpack-sources';
import { RawSourceMap } from 'source-map';
import {
	isWebpack5Compilation,
	deleteAsset,
} from './utils/webpack';
import { sha256 } from './utils/sha256';
import * as base64 from './utils/base64';
import {
	Compilation,
	LocalesMap,
	LocaleName,
	WP5,
} from './types';
import type { StringKeysCollection } from './utils/track-unused-localized-strings';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { name } = require('../package.json');

function findSubstringLocations(
	string: string,
	substring: string,
): number[] {
	const indices: number[] = [];
	let index = string.indexOf(substring);

	while (index > -1) {
		indices.push(index);
		index = string.indexOf(substring, index + 1);
	}

	return indices;
}

type PlaceholderLocations = {
	stringKey: string;
	index: number;
	endIndex: number;
}[];

export const fileNameTemplatePlaceholder = `[locale:${sha256('locale-placeholder').slice(0, 8)}]`;

const fileNameTemplatePlaceholderPattern = new RegExp(fileNameTemplatePlaceholder.replace(/[[\]]/g, '\\$&'), 'g');
const isJsFile = /\.js$/;
const isSourceMap = /\.js\.map$/;

const placeholderPrefix = sha256('localize-assets-plugin-placeholder-prefix').slice(0, 8);
const placeholderSuffix = '|';

const locatePlaceholders = (sourceString: string) => {
	const placeholderLocations: PlaceholderLocations = [];

	const possibleLocations = findSubstringLocations(sourceString, placeholderPrefix);
	for (const placeholderIndex of possibleLocations) {
		const placeholderStartIndex = placeholderIndex + placeholderPrefix.length;
		const placeholderSuffixIndex = sourceString.indexOf(placeholderSuffix, placeholderStartIndex);

		if (placeholderSuffixIndex === -1) {
			continue;
		}

		const placeholder = sourceString.slice(
			placeholderStartIndex,
			placeholderSuffixIndex,
		);

		const stringKey = base64.decode(placeholder);
		if (stringKey) {
			placeholderLocations.push({
				stringKey,
				index: placeholderIndex,
				endIndex: placeholderSuffixIndex + placeholderSuffix.length,
			});
		}
	}

	return placeholderLocations;
};

function localizeAsset(
	locales: LocalesMap,
	locale: LocaleName,
	assetName: string,
	placeholderLocations: PlaceholderLocations,
	fileNamePlaceholderLocations: number[],
	source: string,
	map: RawSourceMap | null,
	trackStringKeys?: StringKeysCollection,
) {
	const localeData = locales[locale];
	const magicStringInstance = new MagicString(source);

	// Localze strings
	for (const { stringKey, index, endIndex } of placeholderLocations) {
		const localizedString = JSON.stringify(localeData[stringKey] || stringKey).slice(1, -1);

		// For Webpack 5 cache hits
		trackStringKeys?.delete(stringKey);

		magicStringInstance.overwrite(
			index,
			endIndex,
			localizedString,
		);
	}

	// Localize chunk requests
	for (const location of fileNamePlaceholderLocations) {
		magicStringInstance.overwrite(
			location,
			location + fileNameTemplatePlaceholder.length,
			locale,
		);
	}

	const localizedCode = magicStringInstance.toString();

	if (map) {
		const newSourceMap = magicStringInstance.generateMap({
			source: assetName,
			includeContent: true,
		});

		return new SourceMapSource(
			localizedCode,
			assetName,
			newSourceMap,
			source,
			map,
			true,
		);
	}

	return new RawSource(localizedCode);
}

export function generateLocalizedAssets(
	compilation: Compilation,
	localeNames: LocaleName[],
	locales: LocalesMap,
	sourceMapForLocales?: LocaleName[],
	trackStringKeys?: StringKeysCollection,
) {
	const generateLocalizedAssetsHandler = async () => {
		const assetsWithInfo = (compilation as WP5.Compilation).getAssets()
			.filter(asset => asset.name.includes(fileNameTemplatePlaceholder));

		await Promise.all(assetsWithInfo.map(async (asset) => {
			const { source, map } = asset.source.sourceAndMap() as SourceAndMapResult;
			const localizedAssetNames: string[] = [];

			if (isJsFile.test(asset.name)) {
				const sourceString = source.toString();
				const placeholderLocations = locatePlaceholders(sourceString);
				const fileNamePlaceholderLocations = findSubstringLocations(
					sourceString,
					fileNameTemplatePlaceholder,
				);

				await Promise.all(localeNames.map(async (locale) => {
					const newAssetName = asset.name.replace(fileNameTemplatePlaceholderPattern, locale);
					localizedAssetNames.push(newAssetName);

					const localizedSource = localizeAsset(
						locales,
						locale,
						newAssetName,
						placeholderLocations,
						fileNamePlaceholderLocations,
						sourceString,
						(
							(!sourceMapForLocales || sourceMapForLocales.includes(locale))
								? map
								: null
						),
						trackStringKeys,
					);

					// @ts-expect-error Outdated @type
					compilation.emitAsset(
						newAssetName,
						localizedSource,
						{
							...asset.info,
							locale,
						},
					);
				}));
			} else {
				let localesToIterate = localeNames;
				if (isSourceMap.test(asset.name) && sourceMapForLocales) {
					localesToIterate = sourceMapForLocales;
				}

				await Promise.all(localesToIterate.map(async (locale) => {
					const newAssetName = asset.name.replace(fileNameTemplatePlaceholderPattern, locale);
					localizedAssetNames.push(newAssetName);

					// @ts-expect-error Outdated @type
					compilation.emitAsset(
						newAssetName,
						asset.source,
						asset.info,
					);
				}));
			}

			// Delete original unlocalized asset
			deleteAsset(compilation, asset.name, localizedAssetNames);
		}));
	};

	// Apply after minification since we don't want to
	// duplicate the costs of that for each asset
	if (isWebpack5Compilation(compilation)) {
		// Happens after PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE
		compilation.hooks.processAssets.tapPromise(
			{
				name,
				stage: (compilation.constructor as typeof WP5.Compilation).PROCESS_ASSETS_STAGE_ANALYSE,
			},
			generateLocalizedAssetsHandler,
		);
	} else {
		// Triggered after minification, which usually happens in optimizeChunkAssets
		compilation.hooks.optimizeAssets.tapPromise(
			name,
			generateLocalizedAssetsHandler,
		);
	}
}

export const getPlaceholder = (
	value: string,
) => placeholderPrefix + base64.encode(value) + placeholderSuffix;