import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '伊安珊'

const team = ['闲云', '芙宁娜', '尼可']
const artifact_normal = ['天美']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { onfield: true })

const plusOverflow = (ds, dmg) => {
  const { attr } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  if (!nicolePlus) return { dmg: 0, avg: 0 }
  const seq = ['e', 'a2', 'q', 'a3', 'a3', 'a3', 'a3', 'a3', 'a3', 'a3', 'a3']
  const count = (len) => seq.slice(0, len).reduce((ret, key) => {
    ret[key]++
    return ret
  }, { e: 0, a2: 0, a3: 0, q: 0 })
  const limit = LIMITED_PLUS.Nicole.limit
  const nicole = count(typeof limit === 'function' ? limit(ds) : limit)
  const total = count(seq.length)
  return ['e', 'a2', 'a3', 'q'].reduce((acc, key) => {
    const plus = attr[key].plus
    if (!plus) return acc
    const over = nicolePlus * (total[key] - nicole[key]) / plus
    const unit = key === 'a3' ? dmg(0, 'a3', 'phy') : dmg(0, `${key},nightsoul`)
    acc.dmg += unit.dmg * over
    acc.avg += unit.avg * over
    return acc
  }, { dmg: 0, avg: 0 })
}

// 一轮站场总伤
// 手法 EAQ + 打8次下落消耗完闲云buff
const rotationDmg = (ds, dmg) => {
  const { talent } = ds
  const eDmg = dmg(talent.e['技能伤害'], 'e,nightsoul')
  const qDmg = dmg(talent.q['技能伤害'], 'q,nightsoul')
  const thunder = dmg(talent.a['雷霆飞缒伤害'], 'a2,nightsoul')
  const plunge = dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3', 'phy')
  const over = plusOverflow(ds, dmg)
  return {
    dmg: eDmg.dmg + thunder.dmg + qDmg.dmg + plunge.dmg * 8 - over.dmg,
    avg: eDmg.avg + thunder.avg + qDmg.avg + plunge.avg * 8 - over.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「动能标示」高夜魂基础攻击力提升',
    dmg: ({ talent, calc, attr }) => ({
      avg: Math.min(calc(attr.atk) * 27 / 100, talent.q['最大攻击力加成'])
    })
  }, {
    // 低夜魂值默认 nightsoul_lv = 20
    title: '「动能标示」低夜魂基础攻击力提升',
    dmg: ({ talent, calc, attr, params }) => ({
      avg: Math.min(calc(attr.atk) * (params?.nightsoul_lv ?? 20) * 0.5 / 100, talent.q['最大攻击力加成'])
    })
  }, {
    title: '「热身效应」治疗量',
    dmg: ({ calc, attr }, { heal }) => heal(calc(attr.atk) * 60 / 100)
  }, {
    title: '「雷霆飞缒」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['雷霆飞缒伤害'], 'a2,nightsoul')
  }, {
    title: '「电掣雷驰」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e,nightsoul')
  }, {
    title: '「力的三原理」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 高空下落`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, onfield: true }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3,nightsoul', 'phy')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, onfield: true }),
    dmg: rotationDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 6
export const consDmgKey = '「力的三原理」伤害'
export const defParams = { Nightsoul: true }
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「强化抗阻练习」：雷霆飞缒命中后攻击力提升[atkPct]%',
    data: {
      atkPct: 20
    }
  }, {
    title: '6命「极限发力」：夜魂值恢复量溢出时伤害提升[dmg]%',
    cons: 6,
    data: {
      dmg: 25
    }
  }, {
    // 伊安珊自己站场带闲云打下落，自己无法维持动能标示回复夜魂，站场总伤按平均10夜魂值计算
    check: ({ params }) => params.onfield,
    title: '「动能标示」站场自身攻击力平均提升[atkPlus]',
    data: {
      atkPlus: ({ talent, calc, attr, params }) => Math.min(calc(attr.atk) * (params?.nightsoul_lv ?? 10) * 0.5 / 100, talent.q['最大攻击力加成'])
    }
  }
]
