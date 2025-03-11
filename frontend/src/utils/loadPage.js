const modules = require.context("../pages", true, /\.js$/);

const pages = {};
modules.keys().forEach((fileName) => {
  const componentName = fileName.replace("./", "").replace(".js", "");
  pages[componentName] = modules(fileName).default;
});

console.log("Loaded Pages:", pages); 

export default pages;
