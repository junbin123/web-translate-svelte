import { fullTrans } from "./utils/full_translate.js";
import TranslatePop from "./components/main/TranslatePop.svelte";
console.log("我是content.js");
const app = new TranslatePop({
  target: document.body,
  props: {
    boxStyle: {
      left: "0px",
      right: "0px",
      position: "absolute",
    },
    sourceText: "",
    isShow: false,
  },
});

export default app;

let isTrans = false;
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  let currentUrl = `${document.location.origin}${document.location.pathname}`;
  if (isTrans) {
    sendResponse({ canTrans: false, currentUrl, msg: "当前页面翻译中" });
    return;
  }
  fullTrans({ ...request });
  isTrans = true;
  sendResponse({ canTrans: true, currentUrl, msg: "开始翻译" });
});
