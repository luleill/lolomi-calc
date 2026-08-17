/*
* 迁移 miao-plugin components/Meta.js
* */
import lodash from 'lodash'

const MetaStore = {}

class MetaData {
  constructor (game = 'gs', type = '') {
    this.game = game
    this.type = type
    this.data = {}
    this.alias = {}
    this.alias2 = {}
    this.abbr = {}
    this.cfg = {}
  }

  // 添加数据
  addData (datas, pk = 'id') {
    let { data, alias } = this
    lodash.forEach(datas, (ds, id) => {
      id = ds[pk] || id
      data[id] = ds
      if (ds.name && ds.name !== id) {
        alias[ds.name] = id
      }
    })
  }

  addDataItem (id, ds) {
    let { data, alias } = this
    data[id] = ds
    alias[id] = id
    if (ds.name) {
      alias[ds.name] = id
    }
  }

  // 添加简写
  addAbbr (ds) {
    let { data, alias, alias2 } = this
    lodash.forEach(ds, (txt, id) => {
      id = alias[id] || alias2[id] || id
      alias[txt.toLowerCase()] = id
      if (data[id]) {
        data[id].abbr = txt
      }
    })
  }

  // 添加别名
  addAlias (ds, isPrivate = false) {
    let { alias, alias2 } = this
    lodash.forEach(ds, (txt, id) => {
      lodash.forEach((txt + '').split(','), (t) => {
        (isPrivate ? alias2 : alias)[lodash.trim(t + '').toLowerCase()] = alias[id] || alias2[id] || id
      })
    })
  }

  // 注册别名Fn
  addAliasFn (fn) {
    if (fn) {
      this.aliasFn = fn
    }
  }

  addMeta (cfgMap) {
    let { cfg } = this
    lodash.forEach(cfgMap, (v, k) => {
      cfg[k] = v
    })
  }

  getId (txt) {
    txt = lodash.trim(txt + '').toLowerCase()
    let { data, alias, alias2, aliasFn } = this
    if (data[txt]) {
      return txt
    }
    if (alias[txt] || alias2[txt]) {
      return alias[txt] || alias2[txt]
    }
    if (aliasFn) {
      let id = aliasFn(txt)
      if (alias[id] || alias2[id]) {
        return alias[id] || alias2[id]
      }
    }
    return false
  }

  getData (txt) {
    let id = this.getId(txt)
    let { data } = this
    return data[id] || null
  }

  getMeta (key = '') {
    if (!key) {
      return this.cfg
    }
    return this.cfg[key]
  }

  getIds () {
    return lodash.keys(this.data)
  }

  getAlias () {
    return lodash.keys(this.alias)
  }

  async forEach (fn) {
    for (let id in this.data) {
      let ds = this.data[id]
      let ret = fn(ds, id)
      ret = (ret && typeof ret.then === 'function') ? await ret : ret
      if (ret === false) {
        break
      }
    }
  }
}

const MetaFn = (fnKey) => {
  return (game, type, args = '') => {
    if (!game) {
      game = 'gs'
    }
    let meta = LlmMeta.create(game, type)
    return meta[fnKey](args)
  }
}

const LlmMeta = {
  addAliasFn (game, type, fn) {
    let meta = LlmMeta.create(game, type)
    meta.addAliasFn(fn)
  },

  create (game, type) {
    let key = `${game}.${type}`
    if (!MetaStore[key]) {
      MetaStore[key] = new MetaData(game, type)
    }
    return MetaStore[key]
  },
  getId: MetaFn('getId'),
  getIds: MetaFn('getIds'),
  getData: MetaFn('getData'),
  getMeta: MetaFn('getMeta'),
  getAlias: MetaFn('getAlias'),
  async forEach (game, type, fn) {
    let meta = LlmMeta.create(game, type)
    meta.forEach(fn)
  },
  matchGame (game = 'gs', type, txt) {
    txt = lodash.trim(txt + '').toLowerCase()
    let games = (!game || game === 'gs') ? ['gs', 'sr'] : ['sr', 'gs']
    for (let currGame of games) {
      let id = LlmMeta.getId(currGame, type, txt)
      if (id) {
        let data = LlmMeta.getData(currGame, type, id)
        return { game: currGame, id, data }
      }
    }
    return false
  }
}
export default LlmMeta
