import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '克洛琳德'
// 超载
const team = ['夏沃蕾', '杜林', '尼可']
const artifact_normal = ['千岩', '天美']
// 激化
// 满命附着：开E，「驰猎」2段低契 + 「驰猎」1段低契激化 + 1命一段 + 1命第二段激化 +
//              「贯夜」 2段普通伤害 + 1段激化   + 1命一段 + 1命第二段激化 + 6命协同
// 通用： 1命2段协同伤害，其中1段触发激化， 元素爆发5段伤害，其中2段触发激化
//        6命协同正常只会在「贯夜」后触发协同伤害，无附着不触发激化
// 0命附着：每组3AE施加2次附着，低契驰猎1次 + 贯夜1次
const team_A = ['纳西妲', '芙宁娜', '伊安珊']
const artifact_A = ['宗室', '烬城']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { pyro_two: true })

// 队友buff期望次数拆分
// 尼可4命生效8次，杜林1命生效20次
const plusOverflow = (ds, dmg) => {
  const { attr, cons } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  const durinPlus = LIMITED_PLUS.Durin.plus(ds)
  if (!nicolePlus && !durinPlus) return { dmg: 0, avg: 0 }
  const aSegs = 30 + (cons >= 1 ? 10 : 0) + (cons >= 6 ? 5 : 0)
  const plusA = dmg(0, 'a')
  const plusQ = dmg(0, 'q')
  const aOver = attr.a.plus
    ? (nicolePlus * Math.max(aSegs - LIMITED_PLUS.Nicole.limit, 0) + durinPlus * Math.max(aSegs - LIMITED_PLUS.Durin.limit, 0)) / attr.a.plus
    : 0
  const qOver = attr.q.plus ? (nicolePlus + durinPlus) * 5 / attr.q.plus : 0
  return {
    dmg: plusA.dmg * aOver + plusQ.dmg * qOver,
    avg: plusA.avg * aOver + plusQ.avg * qOver
  }
}

// 一轮站场总伤
// 统一默认手法：开E持续7.5秒，0契开始5轮3AE + Q收尾
// 不考虑极限6轮或者多打几次普攻等情况
const rotationDmg = (ds, dmg) => {
  const { talent, attr, calc, cons } = ds
  const q = dmg(talent.q['技能伤害2'][0], 'q')
  const pierceLow = dmg(talent.e['驰猎伤害2'][1], 'a')
  const decree = dmg(talent.e['贯夜伤害2'][2], 'a')
  const blade = dmg(talent.e['流涌之刃伤害'], 'e')
  const c1 = cons >= 1 ? dmg.basic(calc(attr.atk) * 30 / 100, 'a') : { dmg: 0, avg: 0 }
  const c6 = cons >= 6 ? dmg.basic(calc(attr.atk) * 200 / 100, 'a') : { dmg: 0, avg: 0 }
  const over = plusOverflow(ds, dmg)
  return {
    dmg: q.dmg * 5 + pierceLow.dmg * 15 + decree.dmg * 3 * 5 + blade.dmg + c1.dmg * 10 + c6.dmg * 5 - over.dmg,
    avg: q.avg * 5 + pierceLow.avg * 15 + decree.avg * 3 * 5 + blade.avg + c1.avg * 10 + c6.avg * 5 - over.avg
  }
}

// 3AE单轮激化
const rotationAggOne = ({ talent, attr, calc, cons }, dmg) => {
  const pierceLow = dmg(talent.e['驰猎伤害2'][1], 'a')
  const pierceLowAgg = dmg(talent.e['驰猎伤害2'][1], 'a', 'aggravate')
  const decree = dmg(talent.e['贯夜伤害2'][2], 'a')
  const decreeAgg = dmg(talent.e['贯夜伤害2'][2], 'a', 'aggravate')
  const c1 = cons >= 1 ? dmg.basic(calc(attr.atk) * 30 / 100, 'a') : { dmg: 0, avg: 0 }
  const c1Agg = cons >= 1 ? dmg.basic(calc(attr.atk) * 30 / 100, 'a', 'aggravate') : { dmg: 0, avg: 0 }
  const c6 = cons >= 6 ? dmg.basic(calc(attr.atk) * 200 / 100, 'a') : { dmg: 0, avg: 0 }
  return {
    dmg: pierceLow.dmg * 2 + pierceLowAgg.dmg + decree.dmg * 2 + decreeAgg.dmg + c1.dmg + c1Agg.dmg + c6.dmg,
    avg: pierceLow.avg * 2 + pierceLowAgg.avg + decree.avg * 2 + decreeAgg.avg + c1.avg + c1Agg.avg + c6.avg
  }
}

// 激化一轮站场总伤
const rotationAggDmg = (ds, dmg) => {
  const { talent } = ds
  const one = rotationAggOne(ds, dmg)
  const q = dmg(talent.q['技能伤害2'][0], 'q')
  const qAgg = dmg(talent.q['技能伤害2'][0], 'q', 'aggravate')
  const bladeAgg = dmg(talent.e['流涌之刃伤害'])
  const over = plusOverflow(ds, dmg)
  return {
    dmg: one.dmg * 5 + q.dmg * 3 + qAgg.dmg * 2 + bladeAgg.dmg - over.dmg,
    avg: one.avg * 5 + q.avg * 3 + qAgg.avg * 2 + bladeAgg.avg - over.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「驰猎」低契伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['驰猎伤害2'][1], 'a')
  }, {
    title: '「驰猎」高契伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['驰猎伤害2'][0], 'a')
  }, {
    title: '「贯夜」0契伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['贯夜伤害2'][0], 'a')
  }, {
    title: '「贯夜」低契伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['贯夜伤害2'][1], 'a')
  }, {
    title: '「贯夜·契令」伤害',
    dmg: ({ talent }, dmg) => {
      const hit = dmg(talent.e['贯夜伤害2'][2], 'a')
      return { dmg: hit.dmg * 3, avg: hit.avg * 3 }
    }
  }, {
    title: '「贯夜·契令」治疗量',
    // 治疗量 = 命契 × 110% × (1 + 治疗加成)，优先清除等量命契，溢出部分才算实际回血
    params: ({ weapon }) => ({ CovenantOfLife: weapon?.name === '海渊终曲' ? 130 : 105 }),
    dmg: ({ attr, calc, params }, { heal }) => {
      const bondValue = calc(attr.hp) * Math.min(params.CovenantOfLife, 200) / 100
      return { avg: heal(bondValue * 110 / 100).avg - bondValue }
    }
  }, {
    title: '流涌之刃伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['流涌之刃伤害'])
  }, {
    title: '「残光将终」总伤',
    dmg: ({ talent }, dmg) => {
      const q = dmg(talent.q['技能伤害2'][0], 'q')
      return { dmg: q.dmg * 5, avg: q.avg * 5 }
    }
  }, {
    // 木桩自挂元素触发自身天赋增伤，不考虑聚变反应
    title: '伪单人站场循环总伤',
    dmg: rotationDmg
  }, {
    title: '伪单人激化站场总伤',
    dmg: rotationAggDmg
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 「残光将终」总伤`,
    params: ({ cons }) => teamConfig(cons, team_A, artifact_A).params,
    dmg: ({ talent }, dmg) => {
      const q = dmg(talent.q['技能伤害2'][0], 'q')
      const qAgg = dmg(talent.q['技能伤害2'][0], 'q', 'aggravate')
      return { dmg: q.dmg * 3 + qAgg.dmg * 2, avg: q.avg * 3 + qAgg.avg * 2 }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 站场总伤`,
    params: ({ cons }) => teamConfig(cons, team_A, artifact_A).params,
    dmg: rotationAggDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「残光将终」总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      pyro_two: true
    }),
    dmg: ({ talent }, dmg) => {
      const q = dmg(talent.q['技能伤害2'][0], 'q')
      return { dmg: q.dmg * 5, avg: q.avg * 5 }
    }
  }, {
    // 不考虑超载伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      pyro_two: true
    }),
    dmg: rotationDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery,dmg'
// BondOfLifeGet: 谐律套命契提升次数+1层，克洛琳德计算默认满层3层，海渊终曲自带1层
export const defParams = ({ weapon }) => weapon?.name === '海渊终曲' ? { CovenantOfLife: 25, BondOfLifeGet: 2 } : { CovenantOfLife: 0, BondOfLifeGet: 3 }
export const defDmgIdx = 1
export const consDmgKey = '伪单人站场循环总伤'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「破夜的明焰」：提升普攻与残光将终伤害[aPlus]',
    sort: 9,
    data: {
      aPlus: ({ attr, calc, cons }) => Math.min(calc(attr.atk) * (cons >= 2 ? 30 : 20) / 100 * 3, cons >= 2 ? 2700 : 1800),
      qPlus: ({ attr, calc, cons }) => Math.min(calc(attr.atk) * (cons >= 2 ? 30 : 20) / 100 * 3, cons >= 2 ? 2700 : 1800)
    }
  }, {
    title: '天赋「契令的酬偿」：暴击率提升[cpct]%',
    data: {
      cpct: 10 * 2
    }
  }, {
    title: '1命「自此，行过烛影之帷」：夜巡之影进行2次30%攻击力的协同攻击',
    cons: 1
  }, {
    title: '2命「自此，直面长夜之危」：普攻与残光将终伤害加成上限提升至2700',
    cons: 2
  }, {
    title: '4命「铭记泪，生命与仁爱」：基于[buffCount]%生命之契，残光将终伤害提升[qDmg]%',
    cons: 4,
    data: {
      buffCount: ({ talent, params }) => Math.min(talent.q['赋予生命之契'] + params.CovenantOfLife, 200),
      qDmg: ({ talent, params }) => Math.min(Math.min(talent.q['赋予生命之契'] + params.CovenantOfLife, 200) * 2, 200)
    }
  }, {
    title: '6命「为此，勿将希望弃扬」：暴击率提升[cpct]%，暴伤提升[cdmg]%', 
    cons: 6,
    data: {
      cpct: 10,
      cdmg: 70
    }
  }
]
