export const deeplApi = ({ source = [], transType = 'en2zh' }) => {
  console.log('请求接口', source)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(source.map(item => '翻译好的：' + item))
    }, 1000)
  })
}
