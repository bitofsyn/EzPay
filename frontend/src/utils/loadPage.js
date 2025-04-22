const modules = require.context("../pages", true, /\.js$/);

const pages = {};
modules.keys().forEach((fileName) => {
  const pureName = fileName.split("/").pop().replace(".js", "");  // 폴더 무시
  pages[pureName] = modules(fileName).default;
});

console.log("Loaded Pages:", pages);

export default pages;
