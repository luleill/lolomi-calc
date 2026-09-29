import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '瓦列里'

const team = ['米提亚', '希诺宁', '奥黛塔']
const artifact_normal = ['炉火']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

// 六命只有特殊重击和q的后续伤害增伤100%
const c6Boost = (cons) => cons >= 6 ? 2 : 1

// 攻斥指令强化
// 默认势能消耗默认按E后直接接重击消耗40点，1命60点
// 如果要提前放Q获取势能时修改 params.potential 上限100点
const directivePct = ({ attr, calc, talent, cons, params }, key) => {
  const potential = params.potential ?? (cons >= 1 ? 60 : 40)
  // 默认辉映星超导状态0.9系数
  const perPoint = params.noHuiying ? 0.3 : 0.9
  return calc(attr.atk) * (talent.a[key] + perPoint * potential) / 100
}

// 攻斥指令普通雷伤加成
const directiveElectro = (ds) => ({ avg: directivePct(ds, '雷元素伤害增加') })

// 攻斥指令雷元素星超导加成
const directiveStar = (ds) => ({ avg: directivePct(ds, '星超导反应伤害增加') })

// 15秒总伤
// E + 特殊重击 + Q后切后台
// qBarrage: 雷霰重弹弹幕命中段数，不知道攻击间隔，先默认10次
const calcRotation = (ds, calcApi) => {
  const { attr, calc, talent, cons, params } = ds
  const { basic } = calcApi
  const qBarrage = params.qBarrage ?? 10
  const eDmg = basic(calc(attr.atk) * talent.e['技能伤害'] / 100, 'e')
  const qDmg = basic(calc(attr.atk) * talent.q['技能伤害'] / 100, 'q')
  const shell = basic(calc(attr.atk) * talent.q['雷霰重弹伤害'] / 100 * c6Boost(cons), 'q')
  const bombard = basic(calc(attr.atk) * talent.a['臼炮直射·抵近轰击伤害'] / 100 * c6Boost(cons), 'a2')
  let totalDmg = eDmg.dmg + qDmg.dmg + shell.dmg * qBarrage + bombard.dmg
  let totalAvg = eDmg.avg + qDmg.avg + shell.avg * qBarrage + bombard.avg
  return { dmg: totalDmg, avg: totalAvg }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「攻斥指令」提供雷伤增伤基础值',
    dmg: directiveElectro
  }, {
    title: '「攻斥指令」提供星超导增伤基础值',
    dmg: directiveStar
  }, {
    title: '「蓄雷护盾」吸收量',
    dmg: ({ talent, calc, attr, cons, params }, { shield }) => {
      // 2命：溢出势能转化为盾量，每点提升8%攻击力，至多20点
      const overflow = cons >= 2 ? Math.min(params.overflow ?? 20, 20) : 0
      return shield(talent.e['护盾吸收量2'][0] * calc(attr.atk) / 100 + talent.e['护盾吸收量2'][1] + overflow * 8 * calc(attr.atk) / 100)
    }
  }, {
    title: '特殊重击「抵近轰击」伤害',
    dmg: ({ attr, calc, talent, cons }, { basic }) => basic(calc(attr.atk) * talent.a['臼炮直射·抵近轰击伤害'] / 100 * c6Boost(cons), 'a2')
  }, {
    title: '「攻势防御·堡垒骤进」伤害',
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.e['技能伤害'] / 100, 'e')
  }, {
    title: '「火力焦点·雷霰急袭」伤害',
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: '「雷霰重弹」单段伤害',
    dmg: ({ attr, calc, talent, cons }, { basic }) => basic(calc(attr.atk) * talent.q['雷霰重弹伤害'] / 100 * c6Boost(cons), 'q')
  }, {
    title: 'EAQ切后台15秒总伤',
    dmg: calcRotation
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「抵近轰击」伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ attr, calc, talent, cons }, { basic }) => basic(calc(attr.atk) * talent.a['臼炮直射·抵近轰击伤害'] / 100 * c6Boost(cons), 'a2')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 4
export const consDmgKey = 'EAQ切后台15秒总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    title: '2命「伴随冲阵的队型」：施放元素战技后全队精通提升[mastery]点',
    cons: 2,
    data: {
      mastery: 100
    }
  }, {
    title: '6命「穿透敌阵的威能」：特殊重击和元素爆发伤害提升100%，雷伤暴击率提升[cpct]%，雷元素星超导暴伤提升[stellarConductCdmg]%',
    cons: 6,
    data: {
      cpct: 10,
      stellarConductCdmg: 40
    }
  }
]
