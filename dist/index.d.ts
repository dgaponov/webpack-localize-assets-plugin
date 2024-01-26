import { VariableDeclarator, SimpleCallExpression } from 'estree';

type LocaleName = string;
type LocaleFilePath = string;
type LocalizedStringKey = string;
type LocaleStrings<LocalizedData> = Record<LocalizedStringKey, LocalizedData>;
type UnprocessedLocalesMap<LocalizedData = string> = Record<
	LocaleName,
	LocaleFilePath | LocaleStrings<LocalizedData>
>;

type FunctionResolver = (node: VariableDeclarator) => {
	functionName: string;
	namespace?: string;
} | undefined;

type Options<LocalizedData = string> = {
	locales: UnprocessedLocalesMap<LocalizedData>;
	functionName?: string;
	throwOnMissing?: boolean;
	sourceMapForLocales?: string[];
	warnOnUnusedString?: boolean;
	functionResolver?: FunctionResolver;
} & LocalizeCompilerOption<LocalizedData>;

type LocalizeCompilerOption<LocalizedData>
	= LocalizedData extends string // optional if the localized data is a string
		? { localizeCompiler?: LocalizeCompiler<LocalizedData> }
		: { localizeCompiler: LocalizeCompiler<LocalizedData> };

interface LocalizeCompilerContext<LocalizedData = string> {
	readonly callNode: SimpleCallExpression;
	resolveKey(stringKey?: string): LocalizedData;
	emitWarning(message: string): void;
	emitError(message: string): void;
}

type LocalizeCompilerFunction<LocalizedData = string> = (
	this: LocalizeCompilerContext<LocalizedData>,
	functionArgments: string[],
	localeName: string,
	namespace?: string,
) => string;

type LocalizeCompiler<LocalizedData = string> = {
	[functionName: string]: LocalizeCompilerFunction<LocalizedData>;
} | LocalizeCompilerFunction<LocalizedData>

declare class LocalizeAssetsPlugin<LocalizedData = string> {
	constructor(options: Options<LocalizedData>);

	apply(compiler: any): void;
}

export { LocalizeAssetsPlugin as default };
