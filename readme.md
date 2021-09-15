# vite-remark-html

[![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-remark-html)

> can let vite projects to support `require` [vite-plugin-require](https://www.npmjs.com/package/vite-plugin-require)

Install and use to achieve painless support `require`

&nbsp;

## Install

```
npm i vite-plugin-require | yarn add vite-plugin-require
```

## Usage

```ts
import vitePluginRequire from "./vite-plugin-require";

export default {
	plugins: [
		vitePluginRequire({
            // @fileRegex RegExp
            // optional：default file processing rules are as follows
			// fileRegex:/(.jsx?|.tsx?)$/
		}),
	],
};
```
