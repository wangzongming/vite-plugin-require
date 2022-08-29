# vite-plugin-require

[![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-plugin-require)

> can let vite projects to support `require` [vite-plugin-require](https://www.npmjs.com/package/vite-plugin-require)

Install and use to achieve painless support `require`

&nbsp;

## Install

```
npm i vite-plugin-require | yarn add vite-plugin-require
```

## Usage

```ts
import vitePluginRequire from "vite-plugin-require";

export default {
	plugins: [
		vitePluginRequire({
			// @fileRegex RegExp
			// optional：default file processing rules are as follows
			// fileRegex:/(.jsx?|.tsx?|.vue)$/
		}),
	],
};
```

## Where is the root directory？

The entire project directory is the root directory。
It doesn't matter how you quote it.

## Demo

Suppose there are app.jsx and imgs folders in the src directory

```jsx
function App() {
    // The variable must be placed on the top   变量必须放置到最上面
    // Do not use string templates  不可以使用字符串模板

    const img2 = "./img/1.png";
    const img3_1 = "./img/";
    const img3_2 = "./1/";

    return (
        <div>
            <!-- Will actually convert to: "src/imgs/logo.png" -->
            <img src={require("./imgs/logo.png")} alt="logo1" />
            <!-- You can use variables --> 
            <img src={require(img2)} alt="logo1" />
            <!-- You can use String splicing -->
            <img src={require(img3_1 + img3_2 + ".png")} alt="logo1" /> 
        </div>
    );
}
export default App;
```

## Upgrade log

https://github.com/wangzongming/vite-plugin-require/blob/master/version-log.md

Other deeper subdirectories

file path: `src/views/Page1/index.jsx`

```jsx
function Page() {
    return (
        <div>
            <!-- Will actually convert to: "src/imgs/logo.png" -->
            <img src={require("../../../imgs/logo.png")} alt="logo1" />
            
            <!-- Will actually convert to: "/src/views/Page1/imgs/logo.png" -->
			<img src={require("./imgs/logo.png")} alt="logo1" /> 
        </div>
    );
}
export default Page;
```

## Alias 

vite.config.js

```
resolve: {
  alias: [ 
    { find: "@imgs", replacement: path.resolve(__dirname, "./src/imgs/") },
  ],
},
```

page.jsx
```
<img src={require("@imgs/logo.png")} alt="" />
```
