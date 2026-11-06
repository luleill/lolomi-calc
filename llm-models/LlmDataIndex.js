import lodash from 'lodash'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Data, Meta } from '../../miao-plugin/components/index.js'
import Weapon from '../../miao-plugin/models/Weapon.js'
import Character from '../../miao-plugin/models/Character.js'
import CharImg from '../../miao-plugin/models/character/CharImg.js'
import Artifact from '../../miao-plugin/models/Artifact.js'
import ProfileChange from '../../miao-plugin/apps/profile/ProfileChange.js'
import LlmMeta from './LlmMeta.js'

const pluginName = 'lolomi-calc'
const resPath = 'llm-data/meta-gs'
const pluginRoot = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..')

let LlmDataIndex = {
  /**
   * 角色，武器，圣遗物 数据加载
   * @returns {Promise<{char: number, weapon: number, artiSet: number}>}
   */
  async init () {
    if (LlmDataIndex._initialized) {
      return LlmDataIndex._stat
    }
    await LlmDataIndex.regChar()
    await LlmDataIndex.regWeapon()
    await LlmDataIndex.regArti()
    LlmDataIndex._stat = {
      char: LlmMeta.getIds('gs', 'char').filter((id) => LlmDataIndex.hasCharDetail(id)).length,
      weapon: LlmMeta.getIds('gs', 'weapon').length,
      artiSet: LlmMeta.getIds('gs', 'artiSet').length,
      artiMerged: LlmDataIndex._artiMerged || 0,
      aliasMerged: LlmDataIndex._aliasMerged || 0
    }
    LlmDataIndex._initialized = true
    return LlmDataIndex._stat
  },

  hasCharDetail (nameOrId) {
    let data = LlmMeta.getData('gs', 'char', nameOrId)
    if (!data || !data.name) {
      return false
    }
    return fs.existsSync(`${pluginRoot}/${resPath}/character/${data.name}/data.json`)
  },

  async regChar () {
    let data = Data.readJSON(`${resPath}/character/data.json`, pluginName)
    let meta = LlmMeta.create('gs', 'char')

    meta.addData(data)
    let { alias } = await import('../llm-data/meta-gs/character/alias.js')
    meta.addAlias(alias)

    let { extraChars } = await import('../llm-data/meta-gs/character/extra.js')
    lodash.forEach(extraChars, (charAlias, char) => {
      meta.addDataItem(char, {
        id: char,
        name: char
      })
    })
    meta.addAlias(extraChars)

    let miaoChar = Meta.create('gs', 'char')
    let existingIds = new Set(miaoChar.getIds())
    let missingData = {}
    lodash.forEach(data, (ds) => {
      if (!existingIds.has(ds.id + '')) {
        missingData[ds.id] = ds
      } else {
        let miaoDs = miaoChar.getData(ds.id)
        if (miaoDs && miaoDs.eta && miaoDs.eta * 1 >= new Date() * 1) {
          miaoDs.eta = 1
        }
      }
    })
    if (!lodash.isEmpty(missingData)) {
      miaoChar.addData(missingData)
    }
    // 别名独立补缺
    LlmDataIndex._aliasMerged = LlmDataIndex.mergeCharAlias(miaoChar, alias)

    LlmDataIndex.patchCharFallback()
  },

  /**
   * 将 lolomi 角色别名补进 miao 注册表
   * 只补缺失别名，用于lolomi下版本新角色计算
   */
  mergeCharAlias (miaoChar, aliasCfg) {
    let used = (key) => !!(miaoChar.alias[key] || miaoChar.alias2[key])
    let added = 0
    lodash.forEach(aliasCfg, (txt, name) => {
      let id = miaoChar.getId(name)
      if (!id) {
        return true
      }
      lodash.forEach(String(txt).split(','), (t) => {
        let key = lodash.trim(t + '').toLowerCase()
        if (!key || used(key)) {
          return true
        }
        miaoChar.alias[key] = id
        added++
        return true
      })
      return true
    })
    return added
  },

  async regWeapon () {
    let { abbr, alias } = await import('../llm-data/meta-gs/weapon/alias.js')
    let { weaponType, weaponSet } = await import('../llm-data/meta-gs/weapon/extra.js')
    let { descFix } = await import('../llm-data/meta-gs/weapon/desc.js')

    let weaponBuffs = {}
    let data = {}

    const step = function (start, step = 0) {
      if (!step) {
        step = start / 4
      }
      let ret = []
      for (let idx = 0; idx <= 5; idx++) {
        ret.push(start + step * idx)
      }
      return ret
    }

    const attr = function (key, start, _step) {
      let refine = {}
      refine[key] = step(start, _step)
      return {
        title: `${key}提高[key]`,
        isStatic: true,
        refine
      }
    }

    for (let type in weaponType) {
      let typeCalc = await Data.importDefault(`${resPath}/weapon/${type}/calc.js`, pluginName)
      let typeRet = typeCalc(step, attr)
      weaponBuffs = lodash.extend(weaponBuffs, typeRet)

      let typeData = Data.readJSON(`${resPath}/weapon/${type}/data.json`, pluginName)
      lodash.forEach(typeData, (ds) => {
        data[ds.id] = {
          id: ds.id,
          name: ds.name,
          type,
          star: ds.star
        }
      })
    }

    let meta = LlmMeta.create('gs', 'weapon')
    meta.addData(data)
    meta.addAlias(alias)
    meta.addAbbr(abbr)
    meta.addMeta({
      weaponType, weaponSet, weaponBuffs, descFix
    })

    let miaoWeapon = Meta.create('gs', 'weapon')
    miaoWeapon.addData(data)
    miaoWeapon.addAlias(alias)
    miaoWeapon.addAbbr(abbr)
    let miaoWeaponCfg = miaoWeapon.getMeta()
    miaoWeapon.addMeta({
      weaponBuffs: lodash.assign({}, miaoWeaponCfg.weaponBuffs, weaponBuffs),
      descFix: lodash.assign({}, miaoWeaponCfg.descFix, descFix)
    })

    LlmDataIndex.patchWeaponFallback()
    LlmDataIndex.patchMatchMsg(alias)
  },

  /**
   * 面板变换功能的冲突处理，例如 7.1薇斯纳专武 蝶变
   */
  patchMatchMsg (alias) {
    if (LlmDataIndex._matchPatched) {
      return
    }
    LlmDataIndex._matchPatched = true

    let words = []
    lodash.forEach(alias, (v, k) => {
      lodash.forEach(`${k},${v}`.split(','), (s) => {
        s = lodash.trim(s)
        if (/[变改]/.test(s) && !words.includes(s)) {
          words.push(s)
        }
      })
    })
    words.sort((a, b) => b.length - a.length)
    if (!words.length) {
      return
    }

    const SAFE = '旅行剑'
    const orig = ProfileChange.matchMsg
    ProfileChange.matchMsg = function (msg) {
      let hit
      for (const w of words) {
        if (msg.includes(w)) {
          hit = w
          msg = msg.split(w).join(SAFE)
          break
        }
      }
      let ret = orig.call(this, msg)
      if (hit && ret && ret.change && ret.change.weapon && ret.change.weapon.weapon === SAFE) {
        ret.change.weapon.weapon = hit
      }
      return ret
    }
  },

  patchCharFallback () {
    if (LlmDataIndex._charPatched) {
      return
    }
    LlmDataIndex._charPatched = true

    const miaoRoot = Data.getRoot('miao')
    const llmChar = (name, f) => `${pluginRoot}/${resPath}/character/${name}/${f}`
    const relChar = (name, f) => `../../${pluginName}/${resPath}/character/${name}/${f}`

    const origGetDetail = Character.prototype.getDetail
    Character.prototype.getDetail = function () {
      let ret = origGetDetail.call(this)
      if ((!ret || !ret.attr) && this.isGs && !this.isTraveler && this.name && fs.existsSync(llmChar(this.name, 'data.json'))) {
        ret = Data.readJSON(`${resPath}/character/${this.name}/data.json`, pluginName)
        if (ret && ret.attr) {
          this.meta = this.meta || {}
          this.meta._detail = ret
        }
      }
      return ret
    }

    const origGetImgs = CharImg.getImgs
    CharImg.getImgs = function (name, ...args) {
      let imgs = origGetImgs.call(this, name, ...args)
      const prefix = `/meta-gs/character/${name}/`
      lodash.forEach(imgs, (v, k) => {
        if (lodash.isString(v) && v.startsWith(prefix)) {
          let sub = v.slice(prefix.length)
          if (!fs.existsSync(`${miaoRoot}resources${v}`) && fs.existsSync(llmChar(name, sub))) {
            imgs[k] = relChar(name, sub)
          }
        }
      })
      return imgs
    }
  },

  patchWeaponFallback () {
    if (LlmDataIndex._weaponPatched) {
      return
    }
    LlmDataIndex._weaponPatched = true

    const miaoRoot = Data.getRoot('miao')
    const miaoFile = (w, f) => `${miaoRoot}resources/meta-gs/weapon/${w.type}/${w.name}/${f}`
    const llmFile = (w, f) => `${pluginRoot}/${resPath}/weapon/${w.type}/${w.name}/${f}`
    const relFile = (w, f) => `../../${pluginName}/${resPath}/weapon/${w.type}/${w.name}/${f}`
    const iconCache = {}
    const useLlmIcon = (w) => {
      let key = `${w.type}/${w.name}`
      if (lodash.isUndefined(iconCache[key])) {
        iconCache[key] = !!(w.isGs && w.type && w.name &&
          !fs.existsSync(miaoFile(w, 'icon.webp')) && fs.existsSync(llmFile(w, 'icon.webp')))
      }
      return iconCache[key]
    }

    const origGetDetail = Weapon.prototype.getDetail
    Weapon.prototype.getDetail = function () {
      let ret = origGetDetail.call(this)
      if ((!ret || !ret.attr) && this.isGs && this.type && this.name && fs.existsSync(llmFile(this, 'data.json'))) {
        ret = Data.readJSON(`${resPath}/weapon/${this.type}/${this.name}/data.json`, pluginName)
        if (ret) {
          this._detail = ret
        }
      }
      return ret
    }

    const origImg = Object.getOwnPropertyDescriptor(Weapon.prototype, 'img').get
    Object.defineProperty(Weapon.prototype, 'img', {
      get () {
        return useLlmIcon(this) ? relFile(this, 'icon.webp') : origImg.call(this)
      }
    })
    const origImgs = Object.getOwnPropertyDescriptor(Weapon.prototype, 'imgs').get
    Object.defineProperty(Weapon.prototype, 'imgs', {
      get () {
        if (!useLlmIcon(this)) {
          return origImgs.call(this)
        }
        return {
          icon: relFile(this, 'icon.webp'),
          icon2: relFile(this, 'awaken.webp'),
          gacha: relFile(this, 'gacha.webp')
        }
      }
    })

    const origGet = Weapon.get
    Weapon.get = function (name, game = 'gs', type = '') {
      let ret = origGet.call(Weapon, name, game, type)
      if (!ret && (!game || game === 'gs')) {
        let data = LlmMeta.getData('gs', 'weapon', name)
        if (data && data.name) {
          ret = new Weapon(data, 'gs')
        }
      }
      return ret
    }
  },

  async regArti () {
    let calc = await Data.importDefault(`${resPath}/artifact/calc.js`, pluginName)
    let { mainAttr, subAttr, attrMap, attrNameMap, mainIdMap, attrIdMap } = await import('../llm-data/meta-gs/artifact/extra.js')
    let { setAlias, setAbbr } = await import('../llm-data/meta-gs/artifact/alias.js')
    let { usefulAttr } = await import('../llm-data/meta-gs/artifact/artis-mark.js')

    let setMeta = LlmMeta.create('gs', 'artiSet')
    let artiMeta = LlmMeta.create('gs', 'arti')

    let artis = Data.readJSON(`${resPath}/artifact/data.json`, pluginName)
    let setIds = {}

    lodash.forEach(artis, (ds) => {
      let artiSet = {
        name: ds.name,
        effect: ds.effect,
        idxs: {}
      }
      setMeta.addDataItem(ds.name, artiSet)

      lodash.forEach(ds.idxs, (as, idx) => {
        if (as.name) {
          let tmp = {
            set: ds.name,
            name: as.name,
            idx
          }
          artiSet.idxs[idx] = as.name
          artiMeta.addDataItem(as.name, tmp)

          setIds[artiSet.name] = setIds[artiSet.name] || as.id.toString().slice(0, 2)
        }
      })
    })

    setMeta.addAbbr(setAbbr)
    setMeta.addAlias(setAlias)
    setMeta.addAlias(setIds)
    artiMeta.addMeta({
      mainAttr, subAttr, attrMap, attrNameMap, mainIdMap, attrIdMap,
      artiBuffs: calc,
      usefulAttr
    })

    setMeta.addMeta({
      artiBuffs: calc
    })

    LlmDataIndex._artiMerged = LlmDataIndex.mergeArtiToMiao({
      artis, setIds, setAbbr, setAlias, calc, usefulAttr,
      attrMeta: { mainAttr, subAttr, attrMap, attrNameMap, mainIdMap, attrIdMap }
    })

    LlmDataIndex.patchArtiFallback()
  },

  /**
   * 将 lolomi 圣遗物数据写进 miao 表
   */
  mergeArtiToMiao (ctx) {
    let { artis, setIds, setAbbr, setAlias, calc, usefulAttr, attrMeta } = ctx
    let miaoSet = Meta.create('gs', 'artiSet')
    let miaoArti = Meta.create('gs', 'arti')
    let existSets = new Set(miaoSet.getIds())
    let added = 0

    lodash.forEach(artis, (ds) => {
      if (!existSets.has(ds.name)) {
        added++
      }
      let artiSet = {
        name: ds.name,
        effect: ds.effect,
        idxs: {}
      }
      miaoSet.addDataItem(ds.name, artiSet)
      lodash.forEach(ds.idxs, (as, idx) => {
        if (!as.name) {
          return true
        }
        miaoArti.addDataItem(as.name, {
          set: ds.name,
          name: as.name,
          idx
        })
        artiSet.idxs[idx] = as.name
        return true
      })
      return true
    })

    miaoSet.addAbbr(setAbbr)
    miaoSet.addAlias(setAlias)
    miaoSet.addAlias(setIds)

    let miaoSetCfg = miaoSet.getMeta()
    miaoSet.addMeta({
      artiBuffs: lodash.assign({}, miaoSetCfg.artiBuffs, calc)
    })

    let miaoArtiCfg = miaoArti.getMeta()
    let mergedCfg = lodash.assign({}, miaoArtiCfg, { subAttr: attrMeta.subAttr })
    lodash.forEach(['mainAttr', 'attrMap', 'attrNameMap', 'mainIdMap', 'attrIdMap'], (k) => {
      mergedCfg[k] = lodash.assign({}, miaoArtiCfg[k], attrMeta[k])
    })
    mergedCfg.artiBuffs = lodash.assign({}, miaoArtiCfg.artiBuffs, calc)
    mergedCfg.usefulAttr = lodash.assign({}, miaoArtiCfg.usefulAttr, usefulAttr)
    miaoArti.addMeta(mergedCfg)

    return added
  },

  /**
   * 圣遗物图标回退：miao 还没有添加新圣遗物套装时，指向 lolomi 侧
   */
  patchArtiFallback () {
    if (LlmDataIndex._artiPatched) {
      return
    }
    LlmDataIndex._artiPatched = true

    const miaoRoot = Data.getRoot('miao')
    const iconCache = {}
    const useLlmIcon = (arti) => {
      let key = `${arti.setName}/${arti.idx}`
      if (lodash.isUndefined(iconCache[key])) {
        iconCache[key] = !!(arti.isGs && arti.setName && arti.idx &&
          !fs.existsSync(`${miaoRoot}resources/meta-gs/artifact/imgs/${key}.webp`) &&
          fs.existsSync(`${pluginRoot}/${resPath}/artifact/imgs/${key}.webp`))
      }
      return iconCache[key]
    }

    const origImg = Object.getOwnPropertyDescriptor(Artifact.prototype, 'img').get
    Object.defineProperty(Artifact.prototype, 'img', {
      get () {
        return useLlmIcon(this)
          ? `../../${pluginName}/${resPath}/artifact/imgs/${this.setName}/${this.idx}.webp`
          : origImg.call(this)
      }
    })
  }
}

export default LlmDataIndex
