import App from './App.svelte'
import './styles/common.scss'
import './styles/normalize.scss'

const app = new App({
  target: document.body,
  props: {},
})
export default app

// const source = ["This Bloomberg report provided a good summary."];
// const transType = "auto2zh";
// baiduApi({ source, transType })
//   .then((res) => {
//     console.log("j---", res);
//   })
//   .catch((err) => {
//     console.log("t---", err);
//   });
