import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { Plugin } from "vite"; 
import { importDeclaration, importDefaultSpecifier, stringLiteral, identifier } from "@babel/types";

export default function vitePluginRequire(opts?: { fileRegex?: RegExp; log?: (...arg: any[]) => void }): Plugin {
	const { fileRegex = /(.jsx?|.tsx?|.vue)$/, log } = opts || {};
	return {
		name: "vite-plugin-require",
		async transform(code: string, id: string) {
			//  Exclude files in node_modules
			if (/\/node_modules\//g.test(id)) return;
			let newCode = code;
			if (fileRegex.test(id)) {
				let plugins: parser.ParserPlugin[] = /(.vue)$/.test(id) ? [require("vue-loader")] : ["jsx"];
				const ast = parser.parse(code, {
					sourceType: "module",
					plugins,
				});
				traverse(ast, {
					enter(path) {
						if (path.isIdentifier({ name: "require" })) {
							if ((path.container as Record<string, any>)?.arguments?.[0]) {
								path.node.name = "";
								if ((path.container as Record<string, any>)?.arguments?.[0]?.value) {
									// Insert import at the top to pack resources when vite packs
									const realPath = `vitePluginRequire_${new Date().getTime()}_${parseInt(Math.random() * 10000 + 100 + "")}`;
									const importAst = importDeclaration(
										[importDefaultSpecifier(identifier(realPath))],
										stringLiteral((path.container as Record<string, any>)?.arguments?.[0]?.value as string)
									); 
									ast.program.body.unshift(importAst as any);  
									(path.container as Record<string, any>).arguments[0].value = realPath;
									(path.container as Record<string, any>).arguments[0].extra.raw = realPath;
									(path.container as Record<string, any>).arguments[0].extra.rawValue = realPath;
								}
							}
						}
					},
				});
				const output = generate(ast, {});
				newCode = output.code;
			}
			return { code: newCode };
		},
	};
} 