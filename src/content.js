import ToolBar from "./components/ToolBar.svelte";
import "./styles/common.scss";
console.log("我是content.js2");

const app = new ToolBar({
  target: document.body,
  props: {},
});
export default app;
