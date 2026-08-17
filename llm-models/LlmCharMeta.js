/*
* lolomi 自有角色索引
* 读 llm-data/meta-gs/character 自有数据
* */
import { Data } from '../../miao-plugin/components/index.js'
import LlmMeta from './LlmMeta.js'

const pluginName = 'lolomi-calc'
const resPath = 'llm-data/meta-gs'
const detailCache = {}
const travelers = ['荧', '空', '旅行者']

let LlmCharMeta = {
  getId (name) {
    return LlmMeta.getId('gs', 'char', name)
  },
  getData (name) {
    return LlmMeta.getData('gs', 'char', name)
  },
  has (name) {
    return !!LlmMeta.getId('gs', 'char', name)
  },
  isTraveler (name) {
    return travelers.includes(name)
  },
  getDetail (name, elem = '') {
    let id = LlmMeta.getId('gs', 'char', name)
    if (!id) {
      return false
    }
    let data = LlmMeta.getData('gs', 'char', id)
    let charName = data?.name || name
    let dirName = LlmCharMeta.isTraveler(charName) ? (elem ? `旅行者/${elem}` : '旅行者') : charName
    let cacheKey = `${dirName}`
    if (detailCache[cacheKey]) {
      return detailCache[cacheKey]
    }
    try {
      detailCache[cacheKey] = Data.readJSON(`${resPath}/character/${dirName}/data.json`, pluginName)
    } catch (e) {
      return false
    }
    return detailCache[cacheKey]
  },
  // lolomi 下已写角色总数
  getCount () {
    return LlmMeta.getIds('gs', 'char').length
  }
}

export default LlmCharMeta
