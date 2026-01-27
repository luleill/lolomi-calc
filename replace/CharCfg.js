import { Data, Config } from '#lolomi'
import { miaoPath, rootPath } from '../../miao-plugin/tools/path.js'
import lodash from 'lodash'
import fs from 'node:fs'

const cfgL = Config.getConfig('user', 'config')
let calcmodel = cfgL.calcmodel

let cfgMap = {
  char: {},
  game: 'gs',
  async init (game = 'gs') {
    this.game = game
    let chars = fs.readdirSync(`${miaoPath}/resources/meta-${game}/character`)
    if (cfgL.lolomicalc || cfgL.lolomiartis) {
      if (!fs.existsSync(`${rootPath}/plugins/lolomi-calc/damage/${calcmodel}-${game}`)) {
       if (!fs.existsSync(`${rootPath}/plugins/lolomi-calc/damage/lolomi-${game}`)) {
        chars = fs.readdirSync(`${miaoPath}/resources/meta-${game}/character`)
       } else {
        chars = fs.readdirSync(`${rootPath}/plugins/lolomi-calc/damage/lolomi-${game}`)
       }
      } else {
       chars = fs.readdirSync(`${rootPath}/plugins/lolomi-calc/damage/${calcmodel}-${game}`)
      }
    }
    for (let char of chars) {
      cfgMap.char[char] = {}
      let curr = cfgMap.char[char]
      // 评分规则
      if (cfgMap.exists(char, 'artis_basic') && cfgL.lolomiartis) {
        curr.artis = await cfgMap.getCfg(char, 'artis_basic', 'default')
      } else if (cfgMap.exists(char, 'artis', 'miao')) {
        curr.artis = await cfgMap.getCfg(char, 'artis', 'default')
      }
      // 伤害计算
      if (cfgMap.exists(char, 'calc_llm') && cfgL.lolomicalc) {
        curr.calc = await cfgMap.getCfg(char, 'calc_llm')
      } else if (cfgMap.exists(char, 'calc', 'miao')) {
        curr.calc = await cfgMap.getCfg(char, 'calc')
      }
    }
  },
  exists(char, file, path = '') {
    if (path) return fs.existsSync(`${miaoPath}/resources/meta-${this.game}/character/${char}/${file}.js`)
    return fs.existsSync(`${rootPath}/plugins/lolomi-calc/damage/lolomi-${this.game}/${char}/${file}.js`)
  },
  async getCfg(char, file, module = '') {
    let cfg = await Data.importModule(`resources/meta-${this.game}/character/${char}/${file}.js`, 'miao');
    if (module && cfgL.lolomiartis) {
      if (!fs.existsSync(`${rootPath}/plugins/lolomi-calc/damage/${calcmodel}-${this.game}`)) {
       cfg = await Data.importModule(`damage/lolomi-${this.game}/${char}/${file}.js`)
      } else {
       cfg = await Data.importModule(`damage/${calcmodel}-${this.game}/${char}/${file}.js`)
      }
    }
    if (module) return cfg[module]
    return cfg
  }
}
await cfgMap.init('gs')
let cfgMapGs = { ...cfgMap }

/**
 * 角色相关配置
 */
let CharCfg = {
  // 获取角色伤害计算相关配置
  getCalcRule(char) {
    let cfg = cfgMap.char[char.isTraveler ? `旅行者/${char.elem}` : char.name]?.calc
    if (!cfg || lodash.isEmpty(cfg)) {
      return false
    }
    return {
      details: cfg.details || false, // 计算详情
      buffs: cfg.buffs || [], // 角色buff
      defParams: cfg.defParams || {}, // 默认参数，一般为空
      defDmgIdx: cfg.defDmgIdx || -1, // 默认详情index
      defDmgKey: cfg.defDmgKey || '',
      mainAttr: cfg.mainAttr || 'atk,cpct,cdmg', // 伤害属性
      enemyName: cfg.enemyName || '喵喵' // 敌人名称
    }
  },
  getArtisCfg(char) {
    if (char.game !== 'sr') {
      let charName = char.isTraveler ? "旅行者" : char.name
      return cfgMapGs.char[charName]?.artis || false
    } else {
      return cfgMapSr.char[char.name]?.artis || false
    }
  }
}
export default CharCfg