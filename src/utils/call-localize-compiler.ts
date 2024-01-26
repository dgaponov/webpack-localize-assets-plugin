import type { Identifier } from 'estree';
import { LocalizeCompiler, LocalizeCompilerContext } from '../types-internal.js';
import { stringifyAstNode } from './stringify-ast-node.js';

export function callLocalizeCompiler<LocalizedData>(
	localizeCompiler: LocalizeCompiler<LocalizedData>,
	context: LocalizeCompilerContext<LocalizedData>,
	localeName: string,
	namespace?: string,
) {
	const callNodeArguments = context.callNode.arguments.map(stringifyAstNode);
	const functionName = (context.callNode.callee as Identifier).name;

	const functionToCall = typeof localizeCompiler === 'function' ? localizeCompiler : localizeCompiler[functionName];
	return functionToCall.call(context, callNodeArguments, localeName, namespace);
}
