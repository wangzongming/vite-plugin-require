
import { parse } from '@babel/parser';
import traverse, { NodePath } from "@babel/traverse";
import generate from "@babel/generator"; 
import { importDeclaration, importDefaultSpecifier, stringLiteral, identifier, newExpression, expressionStatement, memberExpression, ExpressionStatement, Node, Identifier, conditionalExpression, TemplateLiteral, ConditionalExpression, Expression } from "@babel/types";

/** 从 AST 中解析出 require 参数的静态路径，无法解析时返回 null */
function resolveStaticString(node: Node, ast: any): string | null {
	switch (node.type) {
		case "StringLiteral":
			return node.value;
		case "Identifier": {
			let stringVal = "";
			const IdentifierName = node.name;
			traverse(ast, {
				Identifier: (path: NodePath<Identifier>) => {
					if (path.node.name === IdentifierName) {
						if (!Array.isArray(path.container) && (path.container as any).init?.type === "StringLiteral") {
							stringVal = (path.container as any).init.value;
						}
					}
				},
			});
			return stringVal || null;
		}
		case "BinaryExpression": {
			const left = resolveStaticString(node.left, ast);
			const right = resolveStaticString(node.right, ast);
			if (left === null || right === null) return null;
			return left + right;
		}
		case "TemplateLiteral":
			if (node.expressions.length > 0) return null;
			return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("");
		case "MemberExpression":
			if (node.property.type === "Identifier") {
				return resolveStaticString(node.property, ast);
			}
			return null;
		default:
			return null;
	}
}

function genUniqueId() {
	return `vitePluginRequire_${new Date().getTime()}_${parseInt(Math.random() * 100000000 + 100 + "")}`;
}

/** 将 require 参数替换为 import 导入的变量名 */
function applyStaticImport(ast: any, container: Record<string, any>, stringVal: string) {
	const realPath = genUniqueId();
	const importAst = importDeclaration([importDefaultSpecifier(identifier(realPath))], stringLiteral(stringVal));
	ast.program.body.unshift(importAst as any);
	container.arguments[0] = identifier(realPath);
}

/** 将 require 参数替换为 new URL(..., import.meta.url).href 表达式 */
function applyImportMetaUrlArg(container: Record<string, any>, argNode: Expression) {
	const metaObj = memberExpression(memberExpression(identifier("import"), identifier("meta")), identifier("url"));
	const urlExpr = newExpression(identifier("URL"), [argNode, metaObj]);
	const hrefExpr = expressionStatement(memberExpression(urlExpr, identifier("href")));
	const strCode = generate(hrefExpr as any, {}).code.replace(/\;$/, '');
	container.arguments[0] = identifier(strCode);
}

/** 处理 ConditionalExpression：两分支均为静态路径时分别 import，否则回退 importMetaUrl */
function handleConditionalExpression(ast: any, container: Record<string, any>, arg: ConditionalExpression, translateType: string) {
	const consequentStr = resolveStaticString(arg.consequent, ast);
	const alternateStr = resolveStaticString(arg.alternate, ast);

	if (consequentStr && alternateStr && translateType === "import") {
		const id1 = genUniqueId();
		const id2 = genUniqueId();
		ast.program.body.unshift(
			importDeclaration([importDefaultSpecifier(identifier(id1))], stringLiteral(consequentStr)) as any,
			importDeclaration([importDefaultSpecifier(identifier(id2))], stringLiteral(alternateStr)) as any,
		);
		container.arguments[0] = conditionalExpression(arg.test, identifier(id1), identifier(id2));
	} else {
		applyImportMetaUrlArg(container, arg);
	}
}

/** 处理 TemplateLiteral：无插值时按静态路径处理，有插值时回退 importMetaUrl */
function handleTemplateLiteral(ast: any, container: Record<string, any>, arg: TemplateLiteral, translateType: string) {
	const staticStr = resolveStaticString(arg, ast);
	if (staticStr) {
		if (translateType === "import") {
			applyStaticImport(ast, container, staticStr);
		} else {
			applyImportMetaUrlArg(container, stringLiteral(staticStr));
		}
	} else {
		applyImportMetaUrlArg(container, arg);
	}
}

export default function vitePluginRequire(opts?: {
	fileRegex?: RegExp;
	log?: (...arg: any[]) => void;
	// 转换方式，默认用 import 方式替换，可使用 https://vitejs.cn/guide/assets.html#new-url-url-import-meta-url 方式
	// importMetaUrl | import
	translateType?: "importMetaUrl" | "import";
}) {
	const { fileRegex = /(.jsx?|.tsx?|.vue)$/, log, translateType = "import" } = opts || {};
	let sourcemap: boolean;
	return {
		name: "vite-plugin-require",
		configResolved(resolvedConfig: any) {
			// dev model default true
			const isDev = resolvedConfig.env.MODE === "development";
			if (isDev) {
				sourcemap = true;
			} else {
				sourcemap = resolvedConfig.build.sourcemap as boolean;
			}
		},
		async transform(code: string, id: string) {
			//  Exclude files in node_modules
			if (/\/node_modules\//g.test(id)) return;
			let newCode = code;
			let newMap = null; // 没有更改源代码时为 null
			if (fileRegex.test(id)) {
				const isVueFile: Boolean = /(.vue)$/.test(id);
				let plugins = isVueFile ? [[require("vue-loader")]] : ["jsx"]; 

				const ast = parse(code, { 
					sourceType: "module",
					// 更新版本的 babel/parse 只能配置为二维数组，第二个选项为配置
					plugins: plugins as any, 
				}) as any; 				 

				traverse(ast, {
					enter(path: NodePath) {
						if (path.isIdentifier({ name: "require" })) {
							const container = path.container as Record<string, any>;
							const arg = container?.arguments?.[0];

							if (arg) {
								switch (arg?.type) {
									case "StringLiteral":
									case "Identifier":
									case "BinaryExpression": {
										const stringVal = resolveStaticString(arg, ast);
										if (stringVal) {
											path.node.name = "";
											if (translateType === "import") {
												applyStaticImport(ast, container, stringVal);
											} else {
												applyImportMetaUrlArg(container, stringLiteral(stringVal));
											}
										}
										break;
									}
									case "ConditionalExpression":
										path.node.name = "";
										handleConditionalExpression(ast, container, arg, translateType);
										break;
									case "TemplateLiteral":
										path.node.name = "";
										handleTemplateLiteral(ast, container, arg, translateType);
										break;
									case "MemberExpression":
										// require(new Url())
										break;
									default:
										throw `Unsupported type: ${arg?.type}`;
								}
							}
						}
					},
				});

				const output = generate(ast, {
					sourceMaps: true,
					//  sourceFileName: code  
					sourceFileName: id
				}, code);
				newCode = output.code;
				if (sourcemap) {
					newMap = output.map;
				}
			}
			return {
				code: newCode,
				// https://rollupjs.org/guide/en/#thisgetcombinedsourcemap 
				map: newMap,
			};
		},
	};
}
