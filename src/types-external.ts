import type { SimpleCallExpression, VariableDeclaration } from 'estree';

export type LocaleName = string;
export type LocaleFilePath = string;
export type LocalizedStringKey = string;
export type LocaleStrings<LocalizedData> = Record<LocalizedStringKey, LocalizedData>;
export type UnprocessedLocalesMap<LocalizedData = string> = Record<
	LocaleName,
	LocaleFilePath | LocaleStrings<LocalizedData>
>;

export type FunctionResolver = (node: VariableDeclaration) => {
	functionName: string;
	namespace?: string;
} | undefined;

export type FunctionNamesOrResolver = FunctionResolver | string[]

export type Options<LocalizedData = string> = {
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

export interface LocalizeCompilerContext<LocalizedData = string> {
	readonly callNode: SimpleCallExpression;
	resolveKey(stringKey?: string): LocalizedData;
	emitWarning(message: string): void;
	emitError(message: string): void;
}

export interface LocalizeCompiler<LocalizedData = string> {
	[functionName: string]: (
		this: LocalizeCompilerContext<LocalizedData>,
		functionArgments: string[],
		localeName: string,
		namespace?: string,
	) => string;
}
