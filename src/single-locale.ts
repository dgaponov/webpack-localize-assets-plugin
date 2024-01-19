import WebpackError from 'webpack/lib/WebpackError.js';
import { callLocalizeCompiler } from './utils/call-localize-compiler.js';
import type { LocaleData } from './utils/load-locale-data.js';
import {
	reportModuleWarning,
	reportModuleError,
	onAssetPath,
} from './utils/webpack.js';
import {
	onLocalizerCall,
	onStringKey,
} from './utils/on-localizer-call.js';
import { replaceLocaleInAssetName } from './utils/localize-filename.js';
import type {
	Options,
	LocalizeCompiler,
	WP5,
	NormalModuleFactory,
} from './types-internal.js';

export const handleSingleLocaleLocalization = (
	compilation: WP5.Compilation,
	normalModuleFactory: NormalModuleFactory,
	options: Options,
	locales: LocaleData,
	localizeCompiler: LocalizeCompiler,
	functionNames: string[],
	trackUsedKeys?: Set<string>,
	useKeysets?: boolean,
) => {
	const [localeName] = locales.names;

	onLocalizerCall(
		normalModuleFactory,
		functionNames,
		onStringKey(
			locales,
			options,
			({
				key, callNode, module, keyset,
			}) => {
				const fullKey = useKeysets && keyset ? `${keyset}:${key}` : key;
				trackUsedKeys?.delete(fullKey);
				console.log('tut dernuli', fullKey);

				return callLocalizeCompiler(
					localizeCompiler,
					{
						callNode,
						resolveKey: (stringKey = key) => {
							if (useKeysets && keyset) {
								return locales.data[localeName][keyset][stringKey];
							}
							return locales.data[localeName][stringKey];
						},
						emitWarning: message => reportModuleWarning(
							module,
							new WebpackError(message),
						),
						emitError: message => reportModuleError(
							module,
							new WebpackError(message),
						),
					},
					localeName,
				);
			},
		),
	);

	onAssetPath(
		compilation,
		replaceLocaleInAssetName(
			compilation,
			localeName,
		),
	);
};
