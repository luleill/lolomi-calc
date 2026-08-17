/*
* 迁移 miao-plugin models/ArtifactSet.js
* */
import lodash from 'lodash'
import LlmMeta from './LlmMeta.js'

const setCache = {}

export class LlmArtifactSet {
  constructor (data, game = 'gs') {
    this.game = game
    this.name = data.name
    this.effect = data.effect
    this.idxs = data.idxs
  }

  static get (name, game = 'gs') {
    if (game === 'gs' && /^\d{5}$/.test(name)) {
      name = name.toString().slice(0, 2)
    }
    let key = `${game}:${name}`
    if (setCache[key]) {
      return setCache[key]
    }
    let matched = LlmMeta.matchGame(game, 'artiSet', name)
    if (matched) {
      setCache[key] = new LlmArtifactSet(matched.data, matched.game)
      return setCache[key]
    }
    return false
  }

  static getArtisSetBuff (name, num, game = 'gs') {
    let { artiBuffs } = LlmMeta.getMeta(game, 'arti')
    let ret = (artiBuffs[name] && artiBuffs[name][num]) || artiBuffs[name + num]
    if (!ret) return false
    if (lodash.isPlainObject(ret)) return [ret]
    return ret
  }

  // 循环圣遗物套装
  static eachSet (idxs, fn, game = 'gs') {
    lodash.forEach(idxs || [], (v, k) => {
      let artisSet = LlmArtifactSet.get(k, game)
      if (artisSet) {
        if (v >= 4) {
          fn(artisSet, 2)
        }
        fn(artisSet, v)
      }
    })
  }
}

let LlmArtiSetMeta = {
  get (name, game = 'gs') {
    return LlmArtifactSet.get(name, game)
  },
  getSetCount () {
    return LlmMeta.getIds('gs', 'artiSet').length
  }
}

export default LlmArtiSetMeta
