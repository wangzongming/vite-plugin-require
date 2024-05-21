# vite-plugin-require [![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-plugin-require) [![npm](https://img.shields.io/npm/dm/vite-plugin-require.svg?style=flat)](https://www.npmjs.com/package/vite-plugin-require)

> can let vite projects to support `require` [vite-plugin-require](https://www.npmjs.com/package/vite-plugin-require)

Install and use to achieve painless support `require("xxx")`


**If the project is useful to you, please click on star!**



---
-  [中文文档](https://github.com/wangzongming/vite-plugin-require/blob/master/readme-zh.md)
-  [English](https://github.com/wangzongming/vite-plugin-require)
---

## 微信交流群 | Wechat communication group 

<img src="https://xiaomingio.top/img/i/2024/05/13/6641f99345733.jpg"/>

## Adaptive

- √ vite2
- √ vite3
- √ vite4
- √ vite5
  
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

        //  Must be placed after the vue plugin
		vitePluginRequire(),

        // vite4、vite5
        // vitePluginRequire.default()
	],
};
```
---
## options

Two options，which is not required in most cases

#### fileRegex

File to be converted, default configuration: /(.jsx? |.tsx? |.vue)$/

``` js
vitePluginRequire({ fileRegex:/(.jsx?|.tsx?|.vue)$/ })
```


#### translateType

Conversion mode. The default mode is "import"


"import" is resource introductio

"importMetaUrl" see https://vitejs.cn/guide/assets.html#new-url-url-import-meta-url 

``` js
vitePluginRequire({ translateType: "import" })
``` 


`translateType: "import"`

By default, plug-ins place all `require` references at the top and import them using import.


`translateType: "importMetaUrl"` 
In this mode, the plugin uses ` import.meta.url ` instead of`require` 
Therefore, on-demand loading can be implemented in this mode. eg:
```
let imgUrl = process.env.NODE_ENV !== "development" ? require("../imgs/logo.png") : null;

// some code...
```

ps： `translateType: "importMetaUrl"` Code is not deleted in mode。

Only the following requirements can be implemented.

detail see: https://github.com/wangzongming/vite-plugin-require/issues/28
```
let imgUrl = process.env.NODE_ENV !== "development" ? require("../imgs/logo.png") : null;

return <>
    { imgUrl ? <img src={imgUrl}/> : null }
</>

```


## Where is the root directory？

The entire project directory is the root directory。
It doesn't matter how you quote it.

---
## Demo

Suppose there are app.jsx and imgs folders in the src directory

```jsx
// app.jsx
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
---
## Upgrade log

https://github.com/wangzongming/vite-plugin-require/blob/master/version-log.md

---
## Other deeper subdirectories
img1： src/imgs/logo.png

img2：src/views/Page1/imgs/logo.png
 

```jsx
// src/views/Page1/index.jsx
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
---
  
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
---
## FAQ

### 1、vitePluginRequire is not a function

```js
import vitePluginRequire from "vite-plugin-require";

export default {
	plugins: [  
        vitePluginRequire.default()
	],
};
```
