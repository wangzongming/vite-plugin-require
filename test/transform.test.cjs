const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const pluginFactory = require("../dist/index.js").default;

/** 规范化动态 id，便于断言 */
function normalize(code) {
	return code.replace(/vitePluginRequire_\d+_\d+/g, "ID");
}

async function transform(code, opts = {}, file = "/src/App.jsx") {
	const plugin = pluginFactory(opts);
	plugin.configResolved({ env: { MODE: "production" }, build: { sourcemap: false } });
	const result = await plugin.transform(code, file);
	return result ? normalize(result.code) : result;
}

describe("vite-plugin-require", () => {
	before(() => {
		// 确保已构建 dist
		require.resolve("../dist/index.js");
	});

	it("StringLiteral: require(\"./a.png\") -> import", async () => {
		const out = await transform(`require("./a.png")`);
		assert.match(out, /import ID from "\.\/a\.png"/);
		assert.match(out, /\(ID\)/);
		assert.doesNotMatch(out, /\brequire\b/);
	});

	it("Identifier: 按作用域解析，互不覆盖 (#58)", async () => {
		const out = await transform(`
function Logo() { const icon = "./imgs/logo.png"; return <img src={require(icon)} />; }
function Banner() { const icon = "./imgs/banner.png"; return <img src={require(icon)} />; }
`);
		assert.match(out, /import ID from "\.\/imgs\/logo\.png"/);
		assert.match(out, /import ID from "\.\/imgs\/banner\.png"/);
		assert.equal((out.match(/import ID from/g) || []).length, 2);
	});

	it("Identifier: 内层声明遮蔽外层 (#58)", async () => {
		const out = await transform(`
const icon = "./outer.png";
function A() {
  const icon = "./inner.png";
  return require(icon);
}
`);
		assert.match(out, /import ID from "\.\/inner\.png"/);
		assert.doesNotMatch(out, /import ID from "\.\/outer\.png"/);
	});

	it("参数遮蔽文件级常量，不静态化 (#58)", async () => {
		const out = await transform(`
const name = "default.png";
function avatar(name) { return require("./avatars/" + name); }
`);
		assert.doesNotMatch(out, /import ID from "\.\/avatars\/default\.png"/);
		assert.match(out, /require\("\.\/avatars\/" \+ name\)/);
	});

	it("BinaryExpression: 两侧均为静态字符串可拼接", async () => {
		const out = await transform(`
const dir = "./imgs/";
const file = "x.png";
require(dir + file);
`);
		assert.match(out, /import ID from "\.\/imgs\/x\.png"/);
		assert.doesNotMatch(out, /\brequire\b/);
	});

	it("TemplateLiteral: 无插值走 import", async () => {
		const out = await transform("require(`./imgs/logo.png`)");
		assert.match(out, /import ID from "\.\/imgs\/logo\.png"/);
	});

	it("TemplateLiteral: 有插值回退 import.meta.url", async () => {
		const out = await transform("const name = 'x'; require(`./imgs/${name}.png`)");
		assert.match(out, /new URL\(`\.\/imgs\/\$\{name\}\.png`, import\.meta\.url\)\.href/);
		assert.doesNotMatch(out, /import ID from/);
	});

	it("ConditionalExpression: 两分支静态路径分别 import", async () => {
		const out = await transform(`require(cond ? "./a.png" : "./b.png")`);
		assert.match(out, /import ID from "\.\/a\.png"/);
		assert.match(out, /import ID from "\.\/b\.png"/);
		assert.match(out, /cond \? ID : ID/);
	});

	it("ConditionalExpression: 含动态分支回退 import.meta.url", async () => {
		const out = await transform(`
const dyn = x;
require(cond ? "./a.png" : dyn);
`);
		assert.match(out, /new URL\(cond \? "\.\/a\.png" : dyn, import\.meta\.url\)\.href/);
	});

	it("translateType=importMetaUrl", async () => {
		const out = await transform(`require("./a.png")`, { translateType: "importMetaUrl" });
		assert.match(out, /new URL\("\.\/a\.png", import\.meta\.url\)\.href/);
		assert.doesNotMatch(out, /import ID from/);
	});

	it("跳过 node_modules", async () => {
		const plugin = pluginFactory();
		plugin.configResolved({ env: { MODE: "production" }, build: { sourcemap: false } });
		const result = await plugin.transform(`require("./a.png")`, "/node_modules/pkg/index.js");
		assert.equal(result, undefined);
	});

	it("不匹配 fileRegex 时原样返回", async () => {
		const out = await transform(`require("./a.png")`, {}, "/src/App.css");
		assert.equal(out, `require("./a.png")`);
	});
});
