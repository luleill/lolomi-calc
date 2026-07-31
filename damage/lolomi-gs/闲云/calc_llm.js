import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '闲云'

const team = ['珐露珊', '芙宁娜', '尼可']
const artifact_normal = ['千岩', '天美']

const team_B = ['珐露珊', '杜林', '尼可']
const artifact_B = ['千岩', '天美']

const team_C = ['珐露珊', '芙宁娜', '伊安珊']
const artifact_C = ['千岩', '烬城']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

// 仙力助推增伤基础值
const rushPlus = ({ attr, calc, cons }) => cons >= 2
  ? Math.min(calc(attr.atk) * 400 / 100, 18000)
  : Math.min(calc(attr.atk) * 200 / 100, 9000)

// 队友buff期望次数拆分
// 尼可4命效果8次、杜林1命效果20次
const plusOverflow = (ds, dmg, hits, eCount) => {
  const { attr } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  const durinPlus = LIMITED_PLUS.Durin.plus(ds)
  if (!nicolePlus && !durinPlus) return { dmg: 0, avg: 0 }
  const seq = ['e', 'a3', 'q']
  for (let i = 0; i < hits; i++) {
    seq.push(...(i < eCount ? ['e', 'a3'] : ['a3']), 'q')
  }
  const effCount = (limit) => {
    const ret = { a3: 0, e: 0, q: 0 }
    seq.slice(0, limit).forEach((key) => { ret[key]++ })
    return ret
  }
  const nicole = effCount(LIMITED_PLUS.Nicole.limit)
  const durin = effCount(LIMITED_PLUS.Durin.limit)
  const total = { a3: hits + 1, e: eCount + 1, q: hits + 1 }
  const over = (key) => attr[key].plus
    ? (nicolePlus * (total[key] - nicole[key]) + durinPlus * (total[key] - durin[key])) / attr[key].plus
    : 0
  const plusA3 = dmg(0, 'a3')
  const plusE = dmg(0, 'e')
  const plusQ = dmg(0, 'q')
  return {
    dmg: plusA3.dmg * over('a3') + plusE.dmg * over('e') + plusQ.dmg * over('q'),
    avg: plusA3.avg * over('a3') + plusE.avg * over('e') + plusQ.avg * over('q')
  }
}

// 站场循环总伤
// 统一默认手法：EQ起手，之后循环下落消耗竹星助推
// 起手E不吃Q加成，低命没有E次数时改为普通高空下落
// 单人总伤默认都打满8次助推buff
// 组队考虑队友buff覆盖率，默认15秒输出时长，满命不会打满8次闲云冲击波，时长不够
const rotationDmg = (hits6 = 8) => (ds, dmg) => {
  const { talent, attr, cons } = ds
  const hits = cons >= 6 ? hits6 : 8
  const eCount = cons >= 6 ? hits : cons >= 1 ? 2 : 1
  const q = dmg(talent.q['技能伤害'], 'q')
  const ladder = dmg(talent.e['技能伤害'], 'e')
  const wave = dmg(talent.e['闲云冲击波伤害'][2], 'a3')
  const fall = dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  const star = dmg(talent.q['竹星伤害'], 'q')
  const rushRate = rushPlus(ds) / attr.a3.plus
  const rush = dmg(0, 'a3')
  const over = plusOverflow(ds, dmg, hits, eCount)
  return {
    dmg: q.dmg + ladder.dmg * (eCount + 1) + wave.dmg * (eCount + 1) - rush.dmg * rushRate + fall.dmg * (hits - eCount) + star.dmg * hits - over.dmg,
    avg: q.avg + ladder.avg * (eCount + 1) + wave.avg * (eCount + 1) - rush.avg * rushRate + fall.avg * (hits - eCount) + star.avg * hits - over.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「仙力助推」伤害提升值',
    dmg: (ds) => ({ avg: rushPlus(ds) })
  }, {
    title: '「暮集竹星」释放治疗量',
    dmg: ({ attr, talent, calc }, { heal }) => {
      const t = talent.q['治疗量2']
      return heal(calc(attr.atk) * t[0] / 100 + t[1])
    }
  }, {
    title: '「竹星」持续治疗量',
    dmg: ({ attr, talent, calc }, { heal }) => {
      const t = talent.q['持续治疗量2']
      return heal(calc(attr.atk) * t[0] / 100 + t[1])
    }
  }, {
    title: '4命「闲云冲击波」3阶治疗量',
    cons: 4,
    dmg: ({ attr, calc }, { heal }) => heal(calc(attr.atk) * 150 / 100)
  }, {
    title: '「步天梯」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「闲云冲击波」1阶伤害',
    params: { stepLadder: 1 },
    dmg: ({ talent }, dmg) => dmg(talent.e['闲云冲击波伤害'][0], 'a3')
  }, {
    title: '「闲云冲击波」2阶伤害',
    params: { stepLadder: 2 },
    dmg: ({ talent }, dmg) => dmg(talent.e['闲云冲击波伤害'][1], 'a3')
  }, {
    title: '「闲云冲击波」3阶伤害',
    params: { stepLadder: 3 },
    dmg: ({ talent }, dmg) => dmg(talent.e['闲云冲击波伤害'][2], 'a3')
  }, {
    title: '高空下落伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: '「暮集竹星」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「竹星」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['竹星伤害'], 'q')
  }, {
    title: '单人站场循环总伤',
    dmg: rotationDmg()
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 「闲云冲击波」`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['闲云冲击波伤害'][2], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      pyro_two: true
    }),
    dmg: rotationDmg(7)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 「闲云冲击波」`,
    params: ({ cons }) => teamConfig(cons, team_C, artifact_C).params,
    dmg: ({ talent }, dmg) => dmg(talent.e['闲云冲击波伤害'][2], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 站场总伤`,
    params: ({ cons }) => teamConfig(cons, team_C, artifact_C).params,
    dmg: rotationDmg(6)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「闲云冲击波」`,
    params: ({ cons }) => teamConfig(cons, team, artifact_normal).params,
    dmg: ({ talent }, dmg) => dmg(talent.e['闲云冲击波伤害'][2], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场总伤`,
    params: ({ cons }) => teamConfig(cons, team, artifact_normal).params,
    dmg: rotationDmg(7)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg'
export const defParams = { stepLadder: 3 }
export const defDmgIdx = 8
export const consDmgKey = '单人站场循环总伤'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「细想应是洞中仙」：仙力助推使下落攻击坠地冲击伤害提升[a3Plus]',
    sort: 9,
    data: {
      a3Plus: (ds) => rushPlus(ds)
    }
  }, {
    title: '天赋「霜翎高逐祥风势」：4层「风翎」使下落攻击暴击率提升[a3Cpct]%',
    data: {
      a3Cpct: 10
    }
  }, {
    title: '1命「借风洗尘缘」：朝起鹤云的可用次数增加1次',
    cons: 1
  }, {
    title: '2命「鹤唳远人间」：施放步天梯后攻击力提升[atkPct]%',
    cons: 2,
    data: {
      atkPct: 20
    }
  }, {
    title: '4命「奥妙烹黍珠」：闲云冲击波命中后触发一次全队治疗',
    cons: 4
  }, {
    title: '6命「知是留云僊」：[buffCount]阶步天梯，闲云冲击波暴伤提升[a3Cdmg]%',
    cons: 6,
    data: {
      buffCount: ({ params }) => params.stepLadder,
      a3Cdmg: ({ params }) => [15, 35, 70][params.stepLadder - 1] || 0
    }
  }
]
