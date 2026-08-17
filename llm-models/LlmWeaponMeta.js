import lodash from 'lodash'
import { Data } from '../../miao-plugin/components/index.js'
import LlmMeta from './LlmMeta.js'

const pluginName = 'lolomi-calc'
const resPath = 'llm-data/meta-gs'

export class LlmWeapon {
  constructor (data, game = 'gs') {
    this.game = game
    this.id = data.id
    this.name = data.name
    this.type = data.type
    this.star = data.star
  }

  get detail () {
    return this.getDetail()
  }

  static get (name, game = 'gs', type = '') {
    let data = LlmMeta.getData(game, 'weapon', name)
    if (data) {
      return new LlmWeapon(data, game)
    }
    if (type && game === 'gs') {
      const { weaponType } = LlmMeta.getMeta(game, 'weapon')
      let name2 = name + (weaponType[type] || type)
      let data2 = LlmMeta.getData(game, 'weapon', name2)
      if (data2) {
        return new LlmWeapon(data2, game)
      }
    }
    return false
  }

  getDetail () {
    if (this._detail) {
      return this._detail
    }
    try {
      this._detail = Data.readJSON(`${resPath}/weapon/${this.type}/${this.name}/data.json`, pluginName)
    } catch (e) {
      return false
    }
    return this._detail
  }

  getWeaponBuffs () {
    let { game } = this
    let { weaponBuffs } = LlmMeta.getMeta(game, 'weapon')
    let buffs = weaponBuffs[this.id] || weaponBuffs[this.name]
    if (!buffs) {
      return false
    }
    if (lodash.isPlainObject(buffs) || lodash.isFunction(buffs)) {
      buffs = [buffs]
    }
    return buffs
  }

  getWeaponAffixBuffs (affix, isStatic = true) {
    let buffs = this.getWeaponBuffs()
    let ret = []
    let self = this
    let { detail } = this

    let tables = {}
    lodash.forEach(detail?.skill?.tables || {}, (ds, idx) => {
      tables[idx] = ds[affix - 1]
    })

    lodash.forEach(buffs, (ds) => {
      if (lodash.isFunction(ds)) {
        ds = ds(tables)
      }
      if (!!ds.isStatic !== !!isStatic) {
        return true
      }

      if (ds.isStatic) {
        let tmp = {}
        if (ds.idx && ds.key) {
          if (!tables[ds.idx]) return true
          tmp[ds.key] = tables[ds.idx]
        }
        if (ds.refine) {
          lodash.forEach(ds.refine, (r, key) => {
            tmp[key] = r[affix - 1] * (ds.buffCount || 1)
          })
        }
        if (!lodash.isEmpty(tmp)) {
          ret.push({
            isStatic: true,
            data: tmp
          })
        }
        return true
      }

      if (!/：/.test(ds.title)) {
        ds.title = `${self.name}：${ds.title}`
      }
      ds.data = ds.data || {}
      if (ds.idx && ds.key) {
        if (!tables[ds.idx]) return true
        ds.data[ds.key] = tables[ds.idx]
      } else if (ds.refine) {
        lodash.forEach(ds.refine, (r, key) => {
          ds.data[key] = ({ refine }) => r[refine] * (ds.buffCount || 1)
        })
      }

      ret.push(ds)
    })

    return ret
  }
}

let LlmWeaponMeta = {
  get (name, game = 'gs', type = '') {
    return LlmWeapon.get(name, game, type)
  },
  getId (name) {
    return LlmMeta.getId('gs', 'weapon', name)
  },
  has (name) {
    return !!LlmMeta.getId('gs', 'weapon', name)
  },
  getCount () {
    return LlmMeta.getIds('gs', 'weapon').length
  }
}

export default LlmWeaponMeta
