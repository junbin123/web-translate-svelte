import App from "./App.svelte";
import "./styles/common.scss";
import "./styles/normalize.scss";
import { baiduApi } from "./request/translate/baidu";

const app = new App({
  target: document.body,
  props: {},
});
export default app;

// const source = ["This Bloomberg report provided a good summary."];
// const transType = "auto2zh";
// baiduApi({ source, transType })
//   .then((res) => {
//     console.log("j---", res);
//   })
//   .catch((err) => {
//     console.log("t---", err);
//   });

chrome.runtime.sendMessage({ hello: "content 发出消息" }, (response) => {
  console.log("接收消息", { response });
});
