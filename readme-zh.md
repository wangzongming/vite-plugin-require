# vite-plugin-require

[![npm](https://img.shields.io/npm/v/vite-plugin-require.svg)](https://www.npmjs.com/package/vite-plugin-require)

> 让 vite 项目无痛支持 `require("xxx")` [vite-plugin-require](https://www.npmjs.com/package/vite-plugin-require)

安装即可实现项目支持 `require` 语法，大部分情况下无需配置。


---
-  [中文文档](https://github.com/wangzongming/vite-plugin-require/blob/master/readme-zh.md)
-  [English](https://github.com/wangzongming/vite-plugin-require)
---

## 适配的 vite 版本

- √ vite2
- √ vite3
- √ vite4

---

## 安装

```
npm i vite-plugin-require | yarn add vite-plugin-require
```

---
## 使用

```js
import vitePluginRequire from "vite-plugin-require";

export default {
	plugins: [
		vitePluginRequire(),
        
        // vite4 需要像下面这样写
        // vitePluginRequire.default()
	],
};
```
---
## 配置项

两个选项，这在大多数情况下不是必需的

### fileRegex

需要转换的文件，默认配置：/(.jsx?|.tsx?|.vue)$/

``` js
vitePluginRequire({ fileRegex:/(.jsx?|.tsx?|.vue)$/ })
```


### translateType

转换模式。默认模式为“import”。

"import" 就是寻常的资源导入

"importMetaUrl" see https://vitejs.cn/guide/assets.html#new-url-url-import-meta-url 

``` js
vitePluginRequire({ translateType: "import" })
``` 

`translateType: "import"`

默认情况下，插件将所有 `require` 引用路径复制顶部，并使用 `import` 导入它们。


`translateType: "importMetaUrl"` 

在这种模式下, 插件使用 ` import.meta.url ` 去转换 `require` 。 

因此，该模式可以实现按需加载。例如:
```
let imgUrl = process.env.NODE_ENV !== "development" ? require("../imgs/logo.png") : null;

// some code...
```

ps： `translateType: "importMetaUrl"` 在这种模式下，代码不会被删除。

只能满足如下要求：  https://github.com/wangzongming/vite-plugin-require/issues/28

```
注意注意注意：imgUrl 存在才进行渲染 img ，一定需要是这个顺序。而不是在 src 中进行判断，如：src={xx ? require("../imgs/logo.png") : null}

let imgUrl = process.env.NODE_ENV !== "development" ? require("../imgs/logo.png") : null;

return <>
    { imgUrl ? <img src={imgUrl}/> : null }
</>

```

## 根目录在哪里?

整个项目目录是根目录。
对于资源你怎么引用并不重要。

---
## 案例

假设 src 目录下有 app.jsx 和 imgs 文件夹

```jsx 
// app.jsx
function App() {
    // 变量必须放置到最上面
    // 并且不可以使用字符串模板
    const img2 = "./img/1.png";
    const img3_1 = "./img/";
    const img3_2 = "./1/";

    return (
        <div>
            <!-- 转换后: "src/imgs/logo.png" -->
            <img src={require("./imgs/logo.png")} alt="logo1" />
            <!-- 可以使用变量 -->
            <img src={require(img2)} alt="logo1" />
            <!-- 可以使用字符串拼接 -->
            <img src={require(img3_1 + img3_2 + ".png")} alt="logo1" />
        </div>
    );
}
export default App;
```
---
## 升级日志

*保证每次的升级都不是破坏性的

https://github.com/wangzongming/vite-plugin-require/blob/master/version-log.md

---
## 复杂目录嵌套

图片1： src/imgs/logo.png

图片2：src/views/Page1/imgs/logo.png

```jsx
// src/views/Page1/index.jsx
function Page() {
    return (
        <div>
            <!-- 转换为: "src/imgs/logo.png" -->
            <img src={require("../../../imgs/logo.png")} alt="logo1" />

            <!-- 转换为: "/src/views/Page1/imgs/logo.png" -->
			<img src={require("./imgs/logo.png")} alt="logo1" />
        </div>
    );
}
export default Page;
```
---
 
 
## 别名设置

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
