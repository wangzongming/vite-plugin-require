import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { Plugin } from "vite";
import { importDeclaration, importDefaultSpecifier, stringLiteral, declareVariable, identifier, BinaryExpression } from "@babel/types";
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
					// 更新版本的 babel/parse 只能配置为二维数组，第二个选项为配置
					plugins: [plugins] as any, 
				});
				traverse(ast, {
					enter(path) {
						if (path.isIdentifier({ name: "require" })) {
							const arg = (path.container as Record<string, any>)?.arguments?.[0];

							if (arg) {
								let stringVal: string = "";
								switch (arg?.type) {
									case "StringLiteral":
										stringVal = arg.value;
										break;
									case "Identifier":
										const IdentifierName = arg.name;
										traverse(ast, {
											Identifier: (path) => {
												// 这里不处理各种变量赋值，只考虑唯一变量
												if (path.node.name === IdentifierName) {
													if (!Array.isArray(path.container) && (path.container as any).init?.type === "StringLiteral") {
														stringVal = (path.container as any).init.value;
													}
												}
											},
										});
										break;
									case "BinaryExpression":
										const binaryExpressionLoopFn = (lOr: BinaryExpression["right"] | BinaryExpression["left"]) => {
											if (lOr.type === "BinaryExpression") {
												binaryExpressionLoopFn(lOr.left);
												binaryExpressionLoopFn(lOr.right);
											} else {
												// 只处理变量或者字符串
												if (lOr.type === "StringLiteral") {
													stringVal += lOr.value;
												} else if (lOr.type === "Identifier") {
													// 这里不处理各种变量赋值，只考虑唯一变量
													const IdentifierName = lOr.name;
													traverse(ast, {
														Identifier: (path) => {
															// 这里不处理各种变量赋值，只考虑唯一变量
															if (path.node.name === IdentifierName) {
																if (!Array.isArray(path.container) && (path.container as any).init?.type === "StringLiteral") {
																	// log((path.container as any).init.value);
																	stringVal += (path.container as any).init.value;
																}
															}
														},
													});
												} else {
													throw `不支持的: BinaryExpression 组成类型 ${lOr.type}`;
												}
											}
										};
										binaryExpressionLoopFn(arg.left);
										binaryExpressionLoopFn(arg.right);
										break;
									default:
										throw `Unsupported type: ${arg?.type}`;
								}
								path.node.name = "";
								if (stringVal) {
									// Insert import at the top to pack resources when vite packs
									const realPath = `vitePluginRequire_${new Date().getTime()}_${parseInt(Math.random() * 100000000 + 100 + "")}`;
									const importAst = importDeclaration([importDefaultSpecifier(identifier(realPath))], stringLiteral(stringVal as string));
									ast.program.body.unshift(importAst as any);
									switch (arg?.type) {
										case "StringLiteral":
											(path.container as Record<string, any>).arguments[0].value = realPath;
											if ((path.container as Record<string, any>).arguments[0].extra) {
												(path.container as Record<string, any>).arguments[0].extra.raw = realPath;
												(path.container as Record<string, any>).arguments[0].extra.rawValue = realPath;
											}
											break;
										case "Identifier":
											(path.container as Record<string, any>).arguments[0].name = realPath;
											break;
										case "BinaryExpression":
											// 直接改成变量
											(path.container as Record<string, any>).arguments[0] = identifier(realPath);
											break;
										default:
											throw `Unsupported type: ${arg?.type}`;
									}
								}
							}
						}
					},
				});
				const output = generate(ast, {});
				newCode = output.code;
			}
			return {
				code: newCode,
				// https://rollupjs.org/guide/en/#thisgetcombinedsourcemap
				map: null,
			};
		},
	};
}
