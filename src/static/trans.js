// 翻译服务字典
export const transServiceDict = {
  google: {
    name: '谷歌翻译',
    src: './images/logo/google-logo.png',
    url: 'https://translate.google.cn/',
    getTransUrl: ({ source = '', transType = 'en2zh-CN' }) => {
      const sl = transType.split('2')[0]
      const tl = transType.split('2')[1]
      return `https://translate.google.cn/?sl=${sl}&tl=${tl}&text=${source}&op=translate`
    }
  },
  youdao: {
    name: '有道翻译',
    src: './images/logo/youdao-logo.png',
    url: 'http://fanyi.youdao.com/',
    getTransUrl: () => 'http://fanyi.youdao.com/'
  },
  baidu: {
    name: '百度翻译',
    src: './images/logo/baidu-logo.png',
    url: 'https://fanyi.baidu.com/',
    getTransUrl: ({ source = '', transType = 'en2zh' }) => {
      const sl = transType.split('2')[0]
      const tl = transType.split('2')[1]
      return `https://fanyi.baidu.com/#${sl}/${tl}/${source}`
    }
  },
  caiyun: {
    name: '彩云小译',
    src: './images/logo/caiyun-logo.png',
    url: 'https://fanyi.caiyunapp.com/#/',
    getTransUrl: () => 'https://fanyi.caiyunapp.com/#/'
  },
  deepl: {
    name: 'DeepL 翻译',
    src: './images/logo/deepl-logo.png',
    url: 'https://www.deepl.com/translator',
    getTransUrl: ({ source = '', transType = 'en2zh' }) => {
      const sl = transType.split('2')[0]
      const tl = transType.split('2')[1]
      return `https://www.deepl.com/translator#${sl}/${tl}/${source}`
    }
  }
}
