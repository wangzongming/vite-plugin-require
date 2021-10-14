# vite-plugin-require

[![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-plugin-css-modules)

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
    return (
        <div>
            <!-- Will actually convert to: "src/imgs/logo.png" -->
            <img src={require("./imgs/logo.png")} alt="logo1" />
        </div>
    );
}
export default App;
```

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
