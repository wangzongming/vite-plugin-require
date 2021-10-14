import * as parser from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { Plugin } from "vite";

export default function vitePluginRequire(opts?: { fileRegex?: RegExp; log?: (...arg: any[]) => void }): Plugin {
	const { fileRegex = /(.jsx?|.tsx?|.vue)$/, log } = opts || {};
	return {
		name: "vite-plugin-require",
		async transform(code: string, id: string) {
			let newCode = code;
			if (fileRegex.test(id)) {
				let plugins: parser.ParserPlugin[] = ["jsx"];

				if (/(.vue)$/.test(id)) {
					plugins = [require("vue-loader")];
				}

				const ast = parser.parse(code, {
					sourceType: "module",
					plugins,
				});
				traverse(ast, {
					enter(path: any) {
						if (path.isIdentifier({ name: "require" })) {
							path.node.name = "";
							if (path.container.arguments[0]?.value) {
								const realPath = getRequireFilePage(id, path.container.arguments[0].value, log);
								path.container.arguments[0].value = realPath;
								path.container.arguments[0].extra.raw = realPath;
								path.container.arguments[0].extra.rawValue = realPath;
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

function getRequireFilePage(fileSrc: string, requireSrc: string, log?: (...arg: any[]) => void) {
	// Get up .. the number of, It could be a level
	const parentLevel = requireSrc.match(/(\.\.\/)/g)?.length || 0;
	const requireSrcLoc = requireSrc.replace(/(\.\.\/|\.\/)/g, "");
	const arrrs = fileSrc.split("/").reverse();
	// The current file must be deleted
	// arrrs.splice(0, parentLevel === 0 ? parentLevel + 1 : parentLevel);
	// All layers should be added by one
	arrrs.splice(0, parentLevel + 1);

	const reqPath = arrrs.reverse().join("/");
	let reaSrc = `${reqPath}/${requireSrcLoc}`;
	// public String getPath, Remove the drive letter
	reaSrc = reaSrc.replace(process.cwd().replace(/\\/g, "/"), "");

	return `"${reaSrc}"`;
}
