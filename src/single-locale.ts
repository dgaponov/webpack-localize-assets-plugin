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
	FunctionNamesOrResolver,
} from './types-internal.js';
import { encodeNamespaceKey } from './utils/namespaces.js';

export const handleSingleLocaleLocalization = (
	compilation: WP5.Compilation,
	normalModuleFactory: NormalModuleFactory,
	options: Options,
	locales: LocaleData,
	localizeCompiler: LocalizeCompiler,
	functionNamesOrResolver: FunctionNamesOrResolver,
	trackUsedKeys?: Set<string>,
) => {
	const [localeName] = locales.names;

	onLocalizerCall(
		normalModuleFactory,
		functionNamesOrResolver,
		onStringKey(
			locales,
			options,
			({
				key, callNode, module, namespace,
			}) => {
				const fullKey = encodeNamespaceKey({ key, namespace });
				trackUsedKeys?.delete(fullKey);

				return callLocalizeCompiler(
					localizeCompiler,
					{
						callNode,
						resolveKey: (stringKey = fullKey) => locales.data[localeName][stringKey],
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
					namespace,
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
