import lodash from 'lodash'
import { MiaoError } from '../../miao-plugin/components/index.js'
import ProfileDmg from '../../miao-plugin/models/ProfileDmg.js'
import DmgBuffs from '../llm-engine/DmgBuffs.js'
import DmgAttr from '../llm-engine/DmgAttr.js'
import DmgCalc from '../llm-engine/DmgCalc.js'
import LlmMeta from './LlmMeta.js'
import LlmCharMeta from './LlmCharMeta.js'

const elemNameMap = {
  cryo: '冰', anemo: '风', geo: '岩', electro: '雷', dendro: '草', hydro: '水', pyro: '火'
}
const travelerIds = [10000005, 10000007, 20000000]

export default class ProfileDmgLite {
  constructor (profile = {}, game = 'gs') {
    this.profile = profile
    this.game = game
    this._update = profile._update
    if (profile && profile.id) {
      // 优先查角色ID，其次名字
      let char = LlmCharMeta.getData(profile.id) || LlmCharMeta.getData(profile.name)
      if (char) {
        this.char = {
          ...char,
          game,
          weaponTypeName: { sword: '单手剑', catalyst: '法器', claymore: '双手剑', polearm: '长柄武器', bow: '弓' }[char.weapon] || char.weapon,
          elemName: elemNameMap[char.elem] || char.elem
        }
      }
    }
  }

  get isGs () {
    return this.game !== 'sr'
  }

  get isSr () {
    return !this.isGs
  }

  get isTraveler () {
    return travelerIds.includes(this.char?.id * 1)
  }

  // 获取天赋数据
  talent () {
    let char = this.char
    let profile = this.profile
    let ret = {}
    let talentData = profile.talent || {}
    ret.talentLevel = talentData
    let detail = char.detail
    lodash.forEach('a,e,q'.split(','), (key) => {
      let level = lodash.isNumber(talentData[key]) ? talentData[key] : (talentData[key]?.level || 1)
      let map = {}
      if (detail.talentData) {
        lodash.forEach(detail.talentData[key], (ds, key) => {
          map[key] = ds[level - 1]
        })
      }
      ret[key] = map
    })
    return ret
  }

  trees () {
    let ret = {}
    let reg = /1?\d{4}(\d{3})/
    lodash.forEach(this.profile.trees, (t) => {
      let regRet = reg.exec(t)
      if (regRet && regRet[1]) {
        ret[regRet[1]] = true
      }
    })
    return ret
  }

  // 获取buff列表
  getBuffs (buffs) {
    return DmgBuffs.getBuffs(this.profile, buffs, this.game)
  }

  async getCalcRule () {
    let ruleName = this.char?.name
    if (this.isTraveler) {
      ruleName = `旅行者/${this.profile.elem}`
    }
    // 复用已被 Start.js 接管的三级路由（lolomi > 梁氏 > miao）
    const cfgPath = ProfileDmg.dmgRulePath(ruleName, this.char?.game)
    let cfg = {}
    if (cfgPath) {
      cfg = await import(`file://${cfgPath.path}`)
      let createdBy = cfg.createdBy || cfgPath.createdBy || '喵喵'
      createdBy = createdBy.slice(0, 15)
      return {
        createdBy,
        details: cfg.details || false, // 计算详情
        buffs: cfg.buffs || [], // 角色buff
        defParams: cfg.defParams || {}, // 默认参数，一般为空
        defDmgIdx: cfg.defDmgIdx || -1, // 默认详情index
        defDmgKey: cfg.defDmgKey || '',
        mainAttr: cfg.mainAttr || 'atk,cpct,cdmg', // 伤害属性
        enemyName: cfg.enemyName || this.isGs ? '小宝' : '弱点敌人' // 敌人名称
      }
    }
    return false
  }

  async calcData ({ enemyLv = 103, mode = 'profile', dmgIdx = 0, idxIsInput = false }) {
    if (!this.char || !this.profile) {
      return false
    }
    let { profile } = this
    let { game } = this.char
    let charCalcData = await this.getCalcRule()

    if (!charCalcData) {
      return false
    }
    let { createdBy, buffs, details, defParams, mainAttr, defDmgIdx, defDmgKey, enemyName } = charCalcData

    // 如果 lolomi 角色数据缺失则由 miao 兜底
    this.char.detail = LlmCharMeta.getDetail(this.char.name, this.isTraveler ? profile.elem : '')
    if (!this.char.detail) {
      return false
    }

    let talent = this.talent()

    let meta = {
      characterName: this.char?.name,
      uid: profile.uid,
      level: profile.level,
      cons: profile.cons * 1,
      talent,
      trees: this.trees(),
      weapon: profile.weapon
    }

    let { id, weapon, attr, artis } = profile

    defDmgKey = lodash.isFunction(defDmgKey) ? defDmgKey(meta) : defDmgKey
    defDmgIdx = lodash.isFunction(defDmgIdx) ? defDmgIdx(meta) : defDmgIdx
    defParams = lodash.isFunction(defParams) ? defParams(meta) : defParams || {}

    let originalAttr = DmgAttr.getAttr({ id, weapon, attr, char: this.char, game })

    buffs = this.getBuffs(buffs)

    let { msg } = DmgAttr.calcAttr({ originalAttr, buffs, artis, meta, params: defParams || {}, game })
    let msgList = []

    let ret = []
    let detailMap = []
    let dmgRet = []
    let dmgDetail = {}

    if (idxIsInput) {
      dmgIdx = --dmgIdx < 0 ? 0 : dmgIdx
    }

    if (mode === 'single') {
      dmgIdx = defDmgIdx > -1 ? defDmgIdx : 0
    }

    lodash.forEach(details, (detail, detailSysIdx) => {
      if (mode === 'single') {
        if (defDmgKey) {
          if (detail.dmgKey !== defDmgKey) {
            return true
          }
        } else if (detailSysIdx !== dmgIdx) {
          return true
        }
      }

      if (lodash.isFunction(detail)) {
        let { attr } = DmgAttr.calcAttr({ originalAttr, artis, buffs, meta })
        let ds = lodash.merge({ talent }, DmgAttr.getDs(attr, meta))
        detail = detail({ ...ds, attr, profile })
      }
      if (detail.isStatic) {
        return
      }
      if (detail.cons && meta.cons < detail.cons * 1) {
        return
      }

      let params = lodash.merge({}, defParams, lodash.isFunction(detail?.params) ? detail?.params(meta) : detail?.params || {})
      let { attr, msg } = DmgAttr.calcAttr({ originalAttr, buffs, artis, meta, params, talent: detail.talent || '', game })

      let ds = lodash.merge({ talent }, DmgAttr.getDs(attr, meta, params))
      ds.artis = artis
      if (detail.check && !detail.check(ds)) {
        return
      }

      let dmg = DmgCalc.getDmgFn({ ds, attr, level: profile.level, enemyLv, showDetail: detail.showDetail, game, params })
      let basicDmgRet

      if (detail.dmg) {
        basicDmgRet = detail.dmg(ds, dmg)
        detail.userIdx = detailMap.length
        detailMap.push(detail)
        ret.push({
          title: typeof detail.title === 'function' ? detail.title(ds) : detail.title,
          ...basicDmgRet
        })
      }
      msgList.push(msg)
    })

    if (mode === 'dmg') {
      let detail
      if (idxIsInput && detailMap[dmgIdx]) {
        detail = detailMap[dmgIdx]
      } else if (idxIsInput) {
        throw new MiaoError(`序号输入错误：${this.char.name}最多只支持${detailMap.length}种伤害计算哦`)
      } else if (!lodash.isUndefined(defDmgIdx) && details[defDmgIdx]) {
        detail = details[defDmgIdx]
      } else {
        detail = detailMap[0]
      }

      if (lodash.isFunction(detail)) {
        let { attr } = DmgAttr.calcAttr({ originalAttr, buffs, artis, meta })
        let ds = lodash.merge({ talent }, DmgAttr.getDs(attr, meta))
        detail = detail({ ...ds, attr, profile })
      }
      let basicRet = lodash.merge({}, ret[detail.userIdx] || ret[defDmgIdx])
      dmgDetail = {
        title: basicRet.title || detail.title,
        userIdx: detail.userIdx || defDmgIdx,
        basicRet,
        attr: []
      }

      let { attrMap } = LlmMeta.getMeta(game, 'arti')

      mainAttr = mainAttr.split(',')
      let params = lodash.merge({}, defParams, detail.params || {})
      let basicDmg = dmgDetail.basicRet
      lodash.forEach(mainAttr, (reduceAttr) => {
        dmgDetail.attr.push(attrMap[reduceAttr])
        let rowData = []
        lodash.forEach(mainAttr, (incAttr) => {
          if (incAttr === reduceAttr) {
            rowData.push({ type: 'na' })
            return
          }
          let { attr } = DmgAttr.calcAttr({
            originalAttr,
            buffs,
            artis,
            meta,
            params,
            incAttr,
            reduceAttr,
            talent: detail.talent || '',
            game
          })
          let ds = lodash.merge({ talent }, DmgAttr.getDs(attr, meta, params))
          let dmg = DmgCalc.getDmgFn({ ds, attr, level: profile.level, enemyLv, game, params })
          if (detail.dmg) {
            let dmgCalcRet = detail.dmg(ds, dmg)
            rowData.push({
              type: dmgCalcRet.avg === basicDmg.avg ? 'avg' : (dmgCalcRet.avg > basicDmg.avg ? 'gt' : 'lt'),
              ...dmgCalcRet
            })
          }
        })
        dmgRet.push(rowData)
      })
    }

    if (mode === 'single') {
      return ret[0]
    }
    return {
      ret,
      msg: msgList[idxIsInput ? dmgIdx : (defDmgIdx > -1 ? defDmgIdx : dmgIdx)] || msg,
      msgList,
      dmgRet,
      enemyName,
      dmgCfg: dmgDetail,
      enemyLv,
      createdBy
    }
  }
}
