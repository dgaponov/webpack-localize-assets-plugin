import type { Identifier } from 'estree';
import { LocalizeCompiler, LocalizeCompilerContext } from '../types-internal.js';
import { stringifyAstNode } from './stringify-ast-node.js';

export function callLocalizeCompiler<LocalizedData>(
	localizeCompiler: LocalizeCompiler<LocalizedData>,
	context: LocalizeCompilerContext<LocalizedData>,
	localeName: string,
) {
	const callNodeArguments = context.callNode.arguments.map(stringifyAstNode);
	const functionName = (context.callNode.callee as Identifier).name;
	console.log('tut dernuli', functionName);
	return localizeCompiler[functionName].call(context, callNodeArguments, localeName);
}
