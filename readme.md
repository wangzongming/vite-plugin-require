# vite-plugin-require [![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-plugin-require) [![npm](https://img.shields.io/npm/dm/vite-plugin-require.svg?style=flat)](https://www.npmjs.com/package/vite-plugin-require)

> Let Vite projects support `require("xxx")` syntax. [vite-plugin-require](https://www.npmjs.com/package/vite-plugin-require)

Install and use to achieve painless support for `require("xxx")`.

**If the project is useful to you, please click on star!**

---
-  [中文文档](https://github.com/wangzongming/vite-plugin-require/blob/master/readme-zh.md)
-  [English](https://github.com/wangzongming/vite-plugin-require)
---

## Other Projects

The simplest and lowest-cost solution for hardware + AI: https://github.com/wangzongming/esp-ai

## Community

QQ Group: 952051286

## Supported Vite Versions

- √ vite2
- √ vite3
- √ vite4
- √ vite5
- √ vite6
- √ vite7
- √ vite8
---

## Install

```
npm i vite-plugin-require | yarn add vite-plugin-require
```

---

## Usage

```js
import vue from '@vitejs/plugin-vue'
import vitePluginRequire from "vite-plugin-require";

export default {
	plugins: [
        vue(),

        // Must be placed after the vue plugin
		vitePluginRequire(),

        // vite4、vite5、vite6 (ESM)
        // vitePluginRequire.default()
	],
};
```

---

## Supported Features

### File Types

By default, the plugin transforms files matching `/(.jsx?|.tsx?|.vue)$/`.

| Extension | Supported |
|-----------|-----------|
| `.js` / `.jsx` | √ |
| `.ts` / `.tsx` | √ |
| `.vue` | √ (must be placed after `@vitejs/plugin-vue`) |

Files under `node_modules` are excluded automatically.

### `require()` Argument Types

#### 1. String Literal

Static path, converted to a top-level `import`.

```jsx
<img src={require("./imgs/logo.png")} alt="logo" />
```

#### 2. Identifier (Variable)

The variable must be initialized with a **string literal** in the same file. The plugin resolves the variable to a static path at compile time.

```jsx
const img = "./imgs/logo.png";
<img src={require(img)} alt="logo" />
```

#### 3. String Concatenation (`BinaryExpression`)

Supports `+` concatenation of string literals, variables, and nested expressions.

```jsx
const prefix = "./imgs/";
const suffix = "logo";
<img src={require(prefix + suffix + ".png")} alt="logo" />
```

#### 4. Conditional Expression (`ConditionalExpression`)

Supports ternary expressions inside `require()`.

**Both branches are static paths** (default `translateType: "import"`):

The plugin imports both assets and replaces `require()` with a ternary expression.

```jsx
<img src={require(isPrimary ? "./imgs/logo-blue.svg" : "./imgs/logo.svg")} alt="logo" />
```

**Either branch is dynamic**, or `translateType: "importMetaUrl"`:

Falls back to `new URL(..., import.meta.url).href`.

```jsx
<img src={require(isPrimary ? "./imgs/logo-blue.svg" : dynamicPath)} alt="logo" />
```

#### 5. Template Literal (`TemplateLiteral`)

**No interpolation** — treated as a static path:

```jsx
<img src={require(`./imgs/logo.png`)} alt="logo" />
```

**With interpolation** — converted to runtime URL resolution:

```jsx
<img src={require(`./imgs/${icon}.svg`)} alt="icon" />
// → new URL(`./imgs/${icon}.svg`, import.meta.url).href

<img src={require(`./imgs/${active ? `${name}_active` : name}.svg`)} alt="icon" />
// → new URL(`./imgs/${active ? `${name}_active` : name}.svg`, import.meta.url).href
```

### Path Resolution

- Relative paths (`./`, `../`) are resolved relative to the current file.
- Deeply nested directories are supported.
- Vite `resolve.alias` is supported.

```jsx
// src/views/Page1/index.jsx
<img src={require("../../../imgs/logo.png")} alt="logo" />
<img src={require("./imgs/logo.png")} alt="logo" />
```

```jsx
// with alias: @imgs → ./src/imgs/
<img src={require("@imgs/logo.png")} alt="logo" />
```

### Conversion Modes (`translateType`)

| Mode | Description |
|------|-------------|
| `import` (default) | Hoists static assets to top-level `import` statements |
| `importMetaUrl` | Converts to `new URL(path, import.meta.url).href`. See [Vite assets docs](https://vitejs.dev/guide/assets.html#new-url-url-import-meta-url) |

**`translateType: "import"`**

All resolvable static `require()` calls are replaced with top-level imports.

**`translateType: "importMetaUrl"`**

Uses `import.meta.url` instead of `import`. Supports on-demand loading — the original code is **not removed** at build time.

Only works when the asset variable exists before rendering:

```jsx
let imgUrl = process.env.NODE_ENV !== "development" ? require("../imgs/logo.png") : null;

return <>
    { imgUrl ? <img src={imgUrl}/> : null }
</>
```

> Do **not** put the conditional inside `src`, e.g. `src={xx ? require("../imgs/logo.png") : null}`. See [issue #28](https://github.com/wangzongming/vite-plugin-require/issues/28).

### Limitations

| Scenario | Status |
|----------|--------|
| Variable assigned a non-literal value | ✗ Cannot resolve |
| Complex variable reassignment | ✗ Only simple `const x = "path"` is supported |
| `require()` with unsupported argument types | ✗ Throws `Unsupported type: xxx` |
| `require(new URL(...))` (`MemberExpression`) | ✗ Not implemented yet |

---

## Options

All options are optional.

#### fileRegex

Files to transform. Default: `/(.jsx?|.tsx?|.vue)$/`

```js
vitePluginRequire({ fileRegex: /(.jsx?|.tsx?|.vue)$/ })
```

#### translateType

Conversion mode. Default: `"import"`

```js
vitePluginRequire({ translateType: "import" })
vitePluginRequire({ translateType: "importMetaUrl" })
```

#### log

Debug logger, receives internal transform info.

```js
vitePluginRequire({ log: (...args) => console.log(...args) })
```

---

## Demo

Suppose there are `app.jsx` and `imgs` folder in the `src` directory:

```jsx
// app.jsx
function App() {
    const img2 = "./img/1.png";
    const img3_1 = "./img/";
    const img3_2 = "./1/";
    const icon = "home";

    return (
        <div>
            {/* Static path */}
            <img src={require("./imgs/logo.png")} alt="logo1" />

            {/* Variable */}
            <img src={require(img2)} alt="logo2" />

            {/* String concatenation */}
            <img src={require(img3_1 + img3_2 + ".png")} alt="logo3" />

            {/* Conditional expression */}
            <img src={require(isBlue ? "./imgs/logo-blue.svg" : "./imgs/logo.svg")} alt="logo4" />

            {/* Template literal */}
            <img src={require(`./imgs/${icon}.svg`)} alt="logo5" />
        </div>
    );
}
export default App;
```

---

## Upgrade Log

https://github.com/wangzongming/vite-plugin-require/blob/master/version-log.md

---

## Alias

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

Upgrade to the latest version. Both are supported since v1.3.0+.
