import { baiduApi } from ".src/request/translate/baidu";
const source = ["This Bloomberg report provided a good summary."];
const transType = "auto2zh";
baiduApi({ source, transType })
  .then((res) => {
    console.log("j---", res);
  })
  .catch((err) => {
    console.log("j---", err);
  });
