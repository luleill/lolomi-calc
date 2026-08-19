import lodash from 'lodash'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Data, Meta } from '../../miao-plugin/components/index.js'
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
      artiSet: LlmMeta.getIds('gs', 'artiSet').length
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
    let missingAlias = {}
    lodash.forEach(data, (ds) => {
      if (!existingIds.has(ds.id + '')) {
        missingData[ds.id] = ds
        if (alias[ds.name]) {
          missingAlias[ds.name] = alias[ds.name]
        }
      }
    })
    if (!lodash.isEmpty(missingData)) {
      miaoChar.addData(missingData)
      miaoChar.addAlias(missingAlias)
    }
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

    let miaoArti = Meta.create('gs', 'arti')
    miaoArti.addMeta({
      usefulAttr: lodash.assign({}, miaoArti.getMeta('usefulAttr'), usefulAttr)
    })
  }
}

export default LlmDataIndex
