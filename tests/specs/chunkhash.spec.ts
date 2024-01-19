import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import { localesSingle, localesMulti } from '../utils/localization-data.js';
import { configureWebpack } from '../utils/configure-webpack.js';
import WebpackLocalizeAssetsPlugin from '#webpack-localize-assets-plugin'; // eslint-disable-line import/no-unresolved

export default testSuite(({ describe }) => {
	describe('chunkhash', ({ test }) => {
		test('single locale', async () => {
			const volume = {
				'/src/index.js': 'import i18n from "./i18n"; const i18nK = i18n.bind(null, "ahahha"); const i18nSomeKeyset = i18n.bind(null, "SomeKeyset"); console.log(i18nSomeKeyset("some_key")); export default i18nK("hello-key");',
			};

			const builtA = await build(
				volume,
				(config) => {
					configureWebpack(config);

					config.output!.filename = '[name].[chunkhash].[locale].js';
					config.plugins!.push(
						new WebpackLocalizeAssetsPlugin({
							locales: localesSingle,
							localizeCompiler: new Proxy({ PLACEHOLDER_FN: () => '' }, {
								get(_, functionName) {
									console.log('functionName', functionName);

									return (callArguments, locale) => {
										console.log(callArguments, 'args');
										console.log('locale', locale);
										return 'yes';
									};
								},
							}),
						}),
					);
				},
			);

			const assetFilenameA = Object.keys(builtA.stats.compilation.assets)[0];

			const enBuildA = builtA.require(`/dist/${assetFilenameA}`);
			expect(enBuildA).toBe('Hello');

			const builtB = await build(
				volume,
				(config) => {
					configureWebpack(config);

					config.output!.filename = '[name].[chunkhash].[locale].js';
					config.plugins!.push(
						new WebpackLocalizeAssetsPlugin({
							locales: {
								...localesSingle,
								en: {
									'hello-key': 'Wazzup',
								},
							},
						}),
					);
				},
			);

			const assetFilenameB = Object.keys(builtB.stats.compilation.assets)[0];

			const enBuildB = builtB.require(`/dist/${assetFilenameB}`);
			expect(enBuildB).toBe('Wazzup');

			expect(assetFilenameA).not.toBe(assetFilenameB);
		});

		test('multi locale', async () => {
			const volume = {
				'/src/index.js': 'const i18n = (yes) => ""; const i18nKK = i18n.bind("ahahha"); export default i18nKK("hello-key");',
			};

			const builtA = await build(
				volume,
				(config) => {
					configureWebpack(config);

					config.output!.filename = '[name].[chunkhash].[locale].js';
					config.plugins!.push(
						new WebpackLocalizeAssetsPlugin({
							locales: localesMulti,
						}),
					);
				},
			);

			const assetFilenameA = Object.keys(builtA.stats.compilation.assets)[0];
			console.log(builtA.stats.compilation.assets, 'qq');

			const enBuildA = builtA.require(`/dist/${assetFilenameA}`);
			expect(enBuildA).toBe('Hello');

			const builtB = await build(
				volume,
				(config) => {
					configureWebpack(config);

					config.output!.filename = '[name].[chunkhash].[locale].js';
					config.plugins!.push(
						new WebpackLocalizeAssetsPlugin({
							locales: {
								...localesMulti,
								en: {
									'hello-key': 'Wazzup',
									stringWithDoubleQuotes: '"quotes"',
								},
							},
						}),
					);
				},
			);

			const assetsB = Object.keys(builtB.stats.compilation.assets);
			const assetFilenameB = assetsB[0];

			const enBuildB = builtB.require(`/dist/${assetFilenameB}`);
			expect(enBuildB).toBe('Wazzup');

			expect(assetFilenameA).not.toBe(assetFilenameB);

			// All assets are coming from the same chunk, so they should share the same chunkhash
			const hashPattern = /[a-f\d]{20}/;
			expect(assetsB[0].match(hashPattern)?.[0]).toBe(assetsB[1].match(hashPattern)?.[0]);
		});
	});
});
