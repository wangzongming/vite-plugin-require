<script setup>
import { ref } from "vue";
import { logoUrl, bannerUrl, avatarUrl, staticAvatar } from "./scopeRequire.js";

const logo = logoUrl();
const banner = bannerUrl();
const avatarStatic = staticAvatar();

const dynMsg = ref("");
const dynSrc = ref("");

function loadDyn() {
  try {
    // #58: 参数遮蔽后应保留 require，浏览器无 require 会抛错 —— 证明未误替换成 default.png
    dynSrc.value = avatarUrl("user.png");
    dynMsg.value = "unexpected: require was rewritten";
  } catch (e) {
    dynMsg.value = String(e && e.message ? e.message : e);
  }
}
</script>

<template>
  <main class="wrap">
    <h1>vite-plugin-require vue playground</h1>
    <section>
      <h2>scope (#58) — logo 红 / banner 蓝</h2>
      <img :src="logo" alt="logo" data-case="logo" width="64" height="64" />
      <img :src="banner" alt="banner" data-case="banner" width="64" height="64" />
    </section>
    <section>
      <h2>static require</h2>
      <img :src="avatarStatic" alt="avatar-static" data-case="avatar-static" width="64" height="64" />
    </section>
    <section>
      <h2>dynamic require (参数遮蔽，应保留 require)</h2>
      <button type="button" @click="loadDyn">call avatarUrl</button>
      <p data-case="dyn-msg">{{ dynMsg }}</p>
      <img v-if="dynSrc" :src="dynSrc" alt="avatar-dyn" width="64" height="64" />
    </section>
  </main>
</template>

<style scoped>
.wrap { font-family: sans-serif; padding: 24px; }
img { margin-right: 12px; border: 1px solid #ccc; image-rendering: pixelated; }
</style>
