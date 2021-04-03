import baiduOptions from './baidu.js'
import caiyunOptions from './caiyun.js'
import googleOptions from './google.js'
import deeplOptions from './deepl.js'
import youdaoOptions from './youdao.js'

export { baiduOptions, caiyunOptions, deeplOptions, googleOptions, youdaoOptions }

export const defaultOptions = [
  {
    name: '中文',
    value: 'zh'
  },
  {
    name: '英语',
    value: 'en' 
  },
  {
    name: '日语',
    value: 'ja'
  },
  {
    name: '韩语',
    value: 'ko'
  },
  {
    name: '法语',
    value: 'fr'
  },
  {
    name: '德语',
    value: 'de'
  },
  {
    name: '俄语',
    value: 'ru'
  },
  {
    name: '西班牙语',
    value: 'es'
  },
  {
    name: '葡萄牙语',
    value: 'pt'
  }
]
