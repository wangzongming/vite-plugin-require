# vite-plugin-require [![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-plugin-require) [![npm](https://img.shields.io/npm/dm/vite-plugin-require.svg?style=flat)](https://www.npmjs.com/package/vite-plugin-require)

> 让 vite 项目无痛支持 `require("xxx")` 语法。[vite-plugin-require](https://www.npmjs.com/package/vite-plugin-require)

安装即可实现项目支持 `require` 语法，大部分情况下无需配置。

**如果项目对你有用的话，请点个 star 吧！**

---
-  [中文文档](https://github.com/wangzongming/vite-plugin-require/blob/master/readme-zh.md)
-  [English](https://github.com/wangzongming/vite-plugin-require)
---

## 其他作品

硬件接入 AI 最简单、最低成本的方案：https://github.com/wangzongming/esp-ai

## 交流群

QQ 交流群：952051286

## 适配的 vite 版本

- √ vite2
- √ vite3
- √ vite4
- √ vite5
- √ vite6
- √ vite7
- √ vite8


```
npm i vite-plugin-require | yarn add vite-plugin-require
```

---

## 使用

```js
import vue from '@vitejs/plugin-vue'
import vitePluginRequire from "vite-plugin-require";

export default {
	plugins: [
        vue(),

        // 必须放在 vue 插件后面
		vitePluginRequire(),

        // vite4、vite5、vite6 (ESM)
        // vitePluginRequire.default()
	],
};
```

---

## 支持的功能

### 文件类型

默认转换匹配 `/(.jsx?|.tsx?|.vue)$/` 的文件。

| 扩展名 | 支持 |
|--------|------|
| `.js` / `.jsx` | √ |
| `.ts` / `.tsx` | √ |
| `.vue` | √（须放在 `@vitejs/plugin-vue` 之后） |

`node_modules` 下的文件会自动跳过。

### `require()` 参数类型

#### 1. 字符串字面量

静态路径，转换为顶部的 `import` 导入。

```jsx
<img src={require("./imgs/logo.png")} alt="logo" />
```

#### 2. 变量（Identifier）

变量必须在同一文件内用**字符串字面量**初始化，插件在编译期解析为静态路径。

```jsx
const img = "./imgs/logo.png";
<img src={require(img)} alt="logo" />
```

#### 3. 字符串拼接（BinaryExpression）

支持 `+` 拼接字符串字面量、变量及嵌套表达式。

```jsx
const prefix = "./imgs/";
const suffix = "logo";
<img src={require(prefix + suffix + ".png")} alt="logo" />
```

#### 4. 三元表达式（ConditionalExpression）

支持 `require()` 内使用三元表达式。

**两个分支均为静态路径**（默认 `translateType: "import"`）：

插件分别 import 两个资源，并将 `require()` 替换为三元表达式。

```jsx
<img src={require(isPrimary ? "./imgs/logo-blue.svg" : "./imgs/logo.svg")} alt="logo" />
```

**任一分支为动态路径**，或 `translateType: "importMetaUrl"`：

回退为 `new URL(..., import.meta.url).href`。

```jsx
<img src={require(isPrimary ? "./imgs/logo-blue.svg" : dynamicPath)} alt="logo" />
```

#### 5. 模板字符串（TemplateLiteral）

**无插值** — 按静态路径处理：

```jsx
<img src={require(`./imgs/logo.png`)} alt="logo" />
```

**有插值** — 转换为运行时 URL 解析：

```jsx
<img src={require(`./imgs/${icon}.svg`)} alt="icon" />
// → new URL(`./imgs/${icon}.svg`, import.meta.url).href

<img src={require(`./imgs/${active ? `${name}_active` : name}.svg`)} alt="icon" />
// → new URL(`./imgs/${active ? `${name}_active` : name}.svg`, import.meta.url).href
```

### 路径解析

- 相对路径（`./`、`../`）相对于当前文件解析。
- 支持深层嵌套目录。
- 支持 Vite `resolve.alias` 别名。

```jsx
// src/views/Page1/index.jsx
<img src={require("../../../imgs/logo.png")} alt="logo" />
<img src={require("./imgs/logo.png")} alt="logo" />
```

```jsx
// 别名 @imgs → ./src/imgs/
<img src={require("@imgs/logo.png")} alt="logo" />
```

### 转换模式（translateType）

| 模式 | 说明 |
|------|------|
| `import`（默认） | 将静态资源提升到顶部 `import` 导入 |
| `importMetaUrl` | 转换为 `new URL(path, import.meta.url).href`，见 [Vite 静态资源文档](https://cn.vitejs.dev/guide/assets.html#new-url-url-import-meta-url) |

**`translateType: "import"`**

所有可解析的静态 `require()` 均替换为顶部 import。

**`translateType: "importMetaUrl"`**

使用 `import.meta.url` 替代 `import`，支持按需加载，构建时**不会删除**原始代码。

仅适用于资源变量先赋值、再渲染的场景：

```jsx
let imgUrl = process.env.NODE_ENV !== "development" ? require("../imgs/logo.png") : null;

return <>
    { imgUrl ? <img src={imgUrl}/> : null }
</>
```

> 不要写在 `src` 里做判断，如 `src={xx ? require("../imgs/logo.png") : null}`。详见 [issue #28](https://github.com/wangzongming/vite-plugin-require/issues/28)。

### 限制说明

| 场景 | 状态 |
|------|------|
| 变量赋值为非字面量 | ✗ 无法解析 |
| 复杂变量重赋值 | ✗ 仅支持简单的 `const x = "path"` |
| 不支持的 `require()` 参数类型 | ✗ 抛出 `Unsupported type: xxx` |
| `require(new URL(...))`（MemberExpression） | ✗ 暂未实现 |

---

## 配置项

均为可选。

#### fileRegex

需要转换的文件，默认：`/(.jsx?|.tsx?|.vue)$/`

```js
vitePluginRequire({ fileRegex: /(.jsx?|.tsx?|.vue)$/ })
```

#### translateType

转换模式，默认：`"import"`

```js
vitePluginRequire({ translateType: "import" })
vitePluginRequire({ translateType: "importMetaUrl" })
```

#### log

调试日志，接收内部转换信息。

```js
vitePluginRequire({ log: (...args) => console.log(...args) })
```

---

## 案例

假设 `src` 目录下有 `app.jsx` 和 `imgs` 文件夹：

```jsx
// app.jsx
function App() {
    const img2 = "./img/1.png";
    const img3_1 = "./img/";
    const img3_2 = "./1/";
    const icon = "home";

    return (
        <div>
            {/* 静态路径 */}
            <img src={require("./imgs/logo.png")} alt="logo1" />

            {/* 变量 */}
            <img src={require(img2)} alt="logo2" />

            {/* 字符串拼接 */}
            <img src={require(img3_1 + img3_2 + ".png")} alt="logo3" />

            {/* 三元表达式 */}
            <img src={require(isBlue ? "./imgs/logo-blue.svg" : "./imgs/logo.svg")} alt="logo4" />

            {/* 模板字符串 */}
            <img src={require(`./imgs/${icon}.svg`)} alt="logo5" />
        </div>
    );
}
export default App;
```

---

## 升级日志

*保证每次的升级都不是破坏性的*

https://github.com/wangzongming/vite-plugin-require/blob/master/version-log.md

---

## 别名设置

vite.config.js

```js
resolve: {
  alias: [
    { find: "@imgs", replacement: path.resolve(__dirname, "./src/imgs/") },
  ],
},
```

page.jsx

```jsx
<img src={require("@imgs/logo.png")} alt="" />
```

---

## FAQ

### 1. vitePluginRequire is not a function

```js
import vitePluginRequire from "vite-plugin-require";

export default {
	plugins: [
        vitePluginRequire.default()
	],
};
```

### 2. Unsupported type: ConditionalExpression / TemplateLiteral

升级到最新版本即可，v1.3.0+ 已支持。
