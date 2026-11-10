/** #58: 同名变量按作用域解析 */
export function logoUrl() {
  const icon = "./assets/imgs/logo.png";
  return require(icon);
}

export function bannerUrl() {
  const icon = "./assets/imgs/banner.png";
  return require(icon);
}

/** #58: 参数遮蔽文件级常量，应保持运行时拼接 */
const name = "default.png";
export function avatarUrl(name) {
  return require("./assets/avatars/" + name);
}

export function staticAvatar() {
  return require("./assets/avatars/user.png");
}

// 避免 unused 警告（name 用于验证遮蔽，不导出）
void name;
