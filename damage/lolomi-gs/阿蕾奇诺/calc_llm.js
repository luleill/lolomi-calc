import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '阿蕾奇诺'
// miao里面关于谐律套层数的定义
// BondOfLifeGet: 命契提升次数，每次叠1层
// DecreasedBondOfLife: 命契降低的次数，每次叠1层
// HealNumber: 治疗次数，治疗时偿还命契会叠层，每次叠1层
// 不传层数miao默认按0层算，赤月之形/纯水流华/海渊终曲命契武器默认+1层
// 仆人计算默认谐律套全满层3层：专武自带1层BondOfLifeGet=2，非专武=3

// 生命之契逻辑说明：1点生命之契 = 1点绝对值，覆盖整个血条至多叠加到200% HP 的生命之契
// 仆人机制-计算默认对单的情况
// 仆人E技能，重击回收血偿勒令获得130%生命之契，专武重击时提供25%生命之契
// 以下的高契对于专武仆人来说默认为 155%，非专武仆人默认为 130%
// 低契统一默认为 40%

// 仆人配队和输出手法较为复杂，暂时只写融化和纯火队伍
// 融化队伍因为手法差异，测试结果波动较大，计算伤害仅作参考
const team = ['茜特菈莉', '希诺宁', '班尼特']
const artifact_normal = ['烬城', '宗室']

const team_A = ['茜特菈莉', '砂糖', '尼可']
const artifact_A = ['烬城', '风套', '天美']

const team_B = ['希诺宁', '杜林', '尼可']
const artifact_B = ['烬城', '千岩', '天美']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { Xilonen_pyro: true, pyro_two: true })

// 普攻aplus拆分生效次数
// 希诺宁4命效果仅生效6次，尼可4命8次，茜特菈莉1命13次
// 杜林20次效果默认全程生效
const naPlusSum = (ds, plusHit, bond, hits, decaySum) => {
  const { talent, attr, calc, cons } = ds
  const arleAPlus = calc(attr.atk) * bond / 100 *
    (cons >= 1 ? (talent.a['红死之宴提升'] + 100) : talent.a['红死之宴提升']) / 100
  const xiloPlus = LIMITED_PLUS.Xilonen.plus(ds)
  const citlaliPlus = LIMITED_PLUS.Citlali.plus(ds)
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  const durinPlus = LIMITED_PLUS.Durin.plus(ds)
  const caHits = cons >= 6 ? 2 : 1
  const naConsume = cons >= 6 ? 5 : 3
  const xiloHits = Math.min(LIMITED_PLUS.Xilonen.limit - caHits, hits)
  const citlaliHits = Math.min(LIMITED_PLUS.Citlali.limit - naConsume, hits)
  const nicoleHits = Math.min(LIMITED_PLUS.Nicole.limit - naConsume, hits)
  const factor = (arleAPlus * decaySum + xiloPlus * xiloHits + citlaliPlus * citlaliHits +
    nicolePlus * nicoleHits + durinPlus * hits) /
    (arleAPlus + xiloPlus + citlaliPlus + nicolePlus + durinPlus)
  return { dmg: plusHit.dmg * factor, avg: plusHit.avg * factor }
}

// 直伤站场总伤计算，站场15秒左右
// 6命以下: E + 重击 + 全程普攻 + Q低契收尾，默认18次普攻
// 6命: E + 重击 + 高契Q + E + 重击 + 普攻至结束，默认普攻12次
// 每次普攻消耗当前7.5%命契，命契×0.925几何衰减
const directRotationDmg = ({ talent, attr, calc, params, cons }, dmg) => {
  const q = dmg(talent.q['技能伤害'], 'q')
  const blade = dmg(talent.e['切斩伤害'], 'e')
  const ca = dmg(talent.a['重击伤害'], 'a2')
  const plusHit = dmg(0, 'a')
  const segKeys = ['一段伤害', '二段伤害', '三段伤害', '四段伤害', '五段伤害', '六段伤害']
  const pureRound = segKeys.reduce((s, k) => {
    const h = dmg(talent.a[k], 'a')
    return { dmg: s.dmg + h.dmg - plusHit.dmg, avg: s.avg + h.avg - plusHit.avg }
  }, { dmg: 0, avg: 0 })
  const bond = Math.min(params.CovenantOfLife ?? 130, 200)
  const bondHits = Math.max(1, Math.floor(Math.log(30 / bond) / Math.log(0.925)))
  const timeHits = cons >= 6 ? 12 : 18
  const hits = Math.min(bondHits, timeHits)
  const decaySum = (1 - Math.pow(0.925, hits)) / 0.075
  const naPlus = naPlusSum({ talent, attr, calc, params, cons }, plusHit, bond, hits, decaySum)
  const blade2 = cons >= 6 ? blade : { dmg: 0, avg: 0 }
  const ca2 = cons >= 6 ? ca : { dmg: 0, avg: 0 }
  const c2Blast = cons >= 2 ? dmg.basic(calc(attr.atk) * 900 / 100, false, false) : { dmg: 0, avg: 0 }
  return {
    dmg: q.dmg + blade.dmg + blade2.dmg + ca.dmg + ca2.dmg + c2Blast.dmg + pureRound.dmg / 6 * hits + naPlus.dmg,
    avg: q.avg + blade.avg + blade2.avg + ca.avg + ca2.avg + c2Blast.avg + pureRound.avg / 6 * hits + naPlus.avg
  }
}

// 直伤队伍
const directTeamDetail = (teamArr, artifactArr, extraParams = {}) => ({
  title: ({ cons }) => `${teamConfig(cons, teamArr, artifactArr, mainCharName).title} 站场总伤`,
  params: ({ cons }) => ({
    ...teamConfig(cons, teamArr, artifactArr).params,
    ...extraParams
  }),
  dmg: directRotationDmg
})

// 融化站场总伤计算
// 班尼特buff覆盖不全，且手法融化不稳定，计算结果与实际测试差异较大，仅作参考
// 非6命默认15次普攻，默认6次普攻融化，6命默认10次普攻默认5次普攻融化
// 重击回收和Q默认融化
const meltRotationDmg = ({ talent, attr, calc, params, cons }, dmg) => {
  const q = dmg(talent.q['技能伤害'], 'q', 'melt')
  const blade = dmg(talent.e['切斩伤害'], 'e')
  const ca = dmg(talent.a['重击伤害'], 'a2', 'melt')
  const plusHit = dmg(0, 'a')
  const segKeys = ['一段伤害', '二段伤害', '三段伤害', '四段伤害', '五段伤害', '六段伤害']
  const pureRound = segKeys.reduce((s, k) => {
    const h = dmg(talent.a[k], 'a')
    return { dmg: s.dmg + h.dmg - plusHit.dmg, avg: s.avg + h.avg - plusHit.avg }
  }, { dmg: 0, avg: 0 })
  const aNorm = dmg(talent.a['一段伤害'], 'a')
  const aMelt = dmg(talent.a['一段伤害'], 'a', 'melt')
  const meltRatio = { dmg: aMelt.dmg / aNorm.dmg, avg: aMelt.avg / aNorm.avg }
  const bond = Math.min(params.CovenantOfLife ?? 130, 200)
  const bondHits = Math.max(1, Math.floor(Math.log(30 / bond) / Math.log(0.925)))
  const timeHits = cons >= 6 ? 10 : 15
  const hits = Math.min(bondHits, timeHits)
  const meltCount = Math.min(cons >= 6 ? 5 : 6, hits)
  const decaySum = (1 - Math.pow(0.925, hits)) / 0.075
  const naPlus = naPlusSum({ talent, attr, calc, params, cons }, plusHit, bond, hits, decaySum)
  const naDirect = {
    dmg: pureRound.dmg / 6 * hits + naPlus.dmg,
    avg: pureRound.avg / 6 * hits + naPlus.avg
  }
  const na = {
    dmg: naDirect.dmg + naDirect.dmg / hits * meltCount * (meltRatio.dmg - 1),
    avg: naDirect.avg + naDirect.avg / hits * meltCount * (meltRatio.avg - 1)
  }
  const blade2 = cons >= 6 ? dmg(talent.e['切斩伤害'], 'e', 'melt') : { dmg: 0, avg: 0 }
  const ca2 = cons >= 6 ? ca : { dmg: 0, avg: 0 }
  const c2Blast = cons >= 2 ? dmg.basic(calc(attr.atk) * 900 / 100, false, 'melt') : { dmg: 0, avg: 0 }
  return {
    dmg: q.dmg + blade.dmg + blade2.dmg + ca.dmg + ca2.dmg + c2Blast.dmg + na.dmg,
    avg: q.avg + blade.avg + blade2.avg + ca.avg + ca2.avg + c2Blast.avg + na.avg
  }
}

// 组队融化
const meltTeamDetail = (teamArr, artifactArr, extraParams = {}) => ({
  title: ({ cons }) => `${teamConfig(cons, teamArr, artifactArr, mainCharName).title} 站场总伤`,
  params: ({ cons }) => ({
    ...teamConfig(cons, teamArr, artifactArr).params,
    ...extraParams
  }),
  dmg: meltRotationDmg
})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「万相化灰」切斩伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['切斩伤害'], 'e')
  }, {
    title: '高契普攻一段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['一段伤害'], 'a')
  }, {
    title: '低契普攻一段伤害',
    params: { CovenantOfLife: 40 },
    dmg: ({ talent }, dmg) => dmg(talent.a['一段伤害'], 'a')
  }, {
    title: '理论满契普攻一段伤害',
    params: { CovenantOfLife: 200 },
    dmg: ({ talent }, dmg) => dmg(talent.a['一段伤害'], 'a')
  }, {
    title: '重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '「厄月将升」高契伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「厄月将升」高契蒸发',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q', 'vaporize')
  }, {
    title: '「厄月将升」高契融化',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q', 'melt')
  }, {
    title: '「厄月将升」高契回复生命',
    dmg: ({ attr, calc, params }, { heal }) => {
      const bond = Math.min(params.CovenantOfLife ?? 130, 200)
      return heal(calc(attr.hp) * bond / 100 * 50 / 100 + calc(attr.atk) * 150 / 100)
    }
  }, {
    title: '单人15秒站场总伤',
    dmg: directRotationDmg
  }, {
    // 队伍
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「厄月将升」融化`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_pyro: true, pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q', 'melt')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title}「厄月将升」融化`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_A, artifact_A).params,
      pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q', 'melt')
  }, {
    ...meltTeamDetail(team_A, artifact_A, { pyro_two: true })
  }, {
    ...directTeamDetail(team_B, artifact_B, { Xilonen_pyro: true, pyro_two: true })
  }, {
    ...meltTeamDetail(team, artifact_normal, { Xilonen_pyro: true, pyro_two: true })
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery,dmg'
export const defParams = ({ weapon }) => weapon?.name === '赤月之形' ? { CovenantOfLife: 155, BondOfLifeGet: 2 } : { CovenantOfLife: 130, BondOfLifeGet: 3 }
export const defDmgIdx = 2
export const consDmgKey = '单人15秒站场总伤'

export const buffs = [
  ...TeamBuff,
  {
    title: '被动「红死之宴」：拥有[buffCount]%生命之契，普攻伤害提升[aPlus]',
    sort: 9,
    data: {
      buffCount: ({ params }) => Math.min(params.CovenantOfLife ?? 130, 200),
      aPlus: ({ talent, calc, attr, params, cons }) =>
        calc(attr.atk) * Math.min(params.CovenantOfLife ?? 130, 200) / 100 *
        (cons >= 1 ? (talent.a['红死之宴提升'] + 100) : talent.a['红死之宴提升']) / 100
    }
  }, {
    title: '天赋「唯厄月可知晓」：获得[dmg]%火伤加成',
    data: {
      dmg: 40
    }
  }, {
    title: '2命「所有的赏与罚皆自我出…」：血偿勒令回收时造成900%攻击力火伤',
    cons: 2
  }, {
    title: '6命「自此以后，我们将共飨新生。」：元素爆发伤害提高[qPlus]，普攻与元素爆发提升暴击率[aCpct]%，提升暴伤[aCdmg]%',
    cons: 6,
    data: {
      qPlus: ({ calc, attr, params }) => calc(attr.atk) * Math.min(params.CovenantOfLife ?? 130, 200) / 100 * 700 / 100,
      aCpct: 10,
      aCdmg: 70,
      qCpct: 10,
      qCdmg: 70
    }
  },
  'vaporize'
]
