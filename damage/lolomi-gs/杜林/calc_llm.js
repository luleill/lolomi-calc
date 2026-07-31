import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '杜林'

// 常规法尔伽魔导配队，计算杜林后台伤害
const team = ['法尔伽', '温迪', '尼可']
const artifact_normal = ['风套', '美赐']

// 茜特菈莉融化队
const team_B = ['茜特菈莉', '希诺宁', '尼可']
const artifact_B = ['烬城', '美赐']

// 莫娜蒸发队
const team_C = ['莫娜', '希诺宁', '芙宁娜']
const artifact_C = ['美赐', '烬城', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { blackErosion: true, pyro_two: true, pyroReaction: true })

// 切后台20秒总伤计算，仅计算元素爆发持续伤害20次
// isBlack: 黑龙或白龙状态 → 天赋和1命是否生效
// withMelt: 是否带融化反应
const calcDragonTotal = (isBlack, withMelt) => (ds, { basic }) => {
  const { talent, attr, calc, cons } = ds
  const atk = calc(attr.atk)
  const dragonKey = isBlack ? '黑蚀之龙伤害' : '白焰之龙伤害'
  // 天赋和1命效果只有前10次持续伤害生效
  const qMultiBonus = 1 + Math.min(atk / 100 * 3, 75) / 100
  const qPlusValue = isBlack && cons >= 1 ? atk * 150 / 100 : 0
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  const nicoleHits = Math.min(LIMITED_PLUS.Nicole.limit, 10)

  const dragonBase = atk * talent.q[dragonKey] / 100
  const dragonFire = basic(dragonBase, 'q')
  const frontFactor = (dragonBase + qPlusValue) / (dragonBase + qPlusValue + nicolePlus)
  const backFactor = dragonBase / (dragonBase + qPlusValue + nicolePlus) / qMultiBonus
  const ticks = nicoleHits + (10 - nicoleHits) * frontFactor + 10 * backFactor

  if (withMelt) {
    // 融化环境：默认10次融化 + 10次火伤
    const dragonMelt = basic(dragonBase, 'q', 'melt')
    return {
      dmg: (dragonMelt.dmg + dragonFire.dmg) * ticks / 2,
      avg: (dragonMelt.avg + dragonFire.avg) * ticks / 2,
    }
  }
  // 非融化/蒸发环境，默认20次火伤，不考虑聚变反应伤害
  return {
    dmg: dragonFire.dmg * ticks,
    avg: dragonFire.avg * ticks,
  }
}

const blackTotal = calcDragonTotal(true, true)
const whiteTotal = calcDragonTotal(false, true)
const blackTotalFire = calcDragonTotal(true, false)
const whiteTotalFire = calcDragonTotal(false, false)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '1命白龙「轮变启迪」伤害提升值',
    cons: 1,
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.atk) * 60 / 100) })
  }, {
    title: '「白焰之龙」持续伤害',
    params: { whiteFlame: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['白焰之龙伤害'], 'q')
  }, {
    title: '「黑蚀之龙」持续伤害',
    params: { blackErosion: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['黑蚀之龙伤害'], 'q')
  }, {
    title: '「白焰之龙」融化伤害',
    params: { whiteFlame: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['白焰之龙伤害'], 'q', 'melt')
  }, {
    title: '「黑蚀之龙」融化伤害',
    params: { blackErosion: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['黑蚀之龙伤害'], 'q', 'melt')
  }, {
    title: '白龙切后台融化环境总伤',
    params: { whiteFlame: true },
    dmg: whiteTotal
  }, {
    title: '黑龙切后台融化环境总伤',
    params: { blackErosion: true },
    dmg: blackTotal
  }, {
    title: '白龙切后台聚变环境总伤',
    params: { whiteFlame: true, pyroReaction: true },
    dmg: whiteTotalFire
  }, {
    title: '黑龙切后台聚变环境总伤',
    params: { blackErosion: true, pyroReaction: true },
    dmg: blackTotalFire
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 黑龙融化`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      blackErosion: true, pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['黑蚀之龙伤害'], 'q', 'melt')
  }, {
    // 队伍伤害 - 黑度蒸发
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 黑龙蒸发`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      blackErosion: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['黑蚀之龙伤害'], 'q', 'vaporize')
  }, {
    // 队伍伤害 - 白化魔导秘仪反应队
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 黑龙后台总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      blackErosion: true, pyro_two: true, pyroReaction: true
    }),
    dmg: blackTotalFire
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defParams = { Hexenzirkel: true }
export const defDmgIdx = 7
export const consDmgKey = '黑龙切后台融化环境总伤'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.pyroReaction === true,
    title: '天赋「光灵遵神数显现」：触发燃烧/超载/火扩散/火结晶后，敌人对应抗性降低[kx]%',
    data: {
      kx: ({ params }) => params.Hexenzirkel === false ? 20 : 35
    }
  }, {
    check: ({ params }) => params.blackErosion === true,
    title: '天赋「光灵遵神数显现·黑蚀之龙」：蒸发伤害提升[vaporize]%，融化伤害提升[melt]%',
    data: {
      vaporize: ({ params }) => params.Hexenzirkel === false ? 40 : 70,
      melt: ({ params }) => params.Hexenzirkel === false ? 40 : 70
    }
  }, {
    title: '天赋「混沌如黑夜构成」：元素爆发的持续伤害提升，基于攻击力额外造成原本[qMulti]%的伤害',
    sort: 9,
    data: {
      qMulti: ({ calc, attr }) => Math.min(calc(attr.atk) / 100 * 3, 75)
    }
  }, {
    check: ({ params }) => params.blackErosion === true,
    title: '1命「红土之逆」：黑龙状态下，元素爆发持续伤害基础值提升[qPlus]',
    sort: 9,
    cons: 1,
    data: {
      qPlus: ({ attr, calc }) => calc(attr.atk) * 150 / 100
    }
  }, {
    title: '2命「无底之想」：触发火元素相关反应后，火元素与对应反应元素伤害提升[dmg]%',
    cons: 2,
    data: {
      dmg: 50
    }
  }, {
    title: '4命「流溢之原」：元素爆发伤害提升[qDmg]%',
    cons: 4,
    data: {
      qDmg: 40
    }
  }, {
    title: '6命「双重诞生」：元素爆发伤害无视敌人[qIgnore]%防御',
    cons: 6,
    data: {
      qIgnore: 30
    }
  }, {
    check: ({ params }) => params.whiteFlame === true,
    title: '6命「双重诞生」：「白焰之龙」命中敌人时，该敌人防御力降低[enemyDef]%',
    cons: 6,
    data: {
      enemyDef: 30
    }
  }, {
    check: ({ params }) => params.blackErosion === true,
    title: '6命「双重诞生」：「黑蚀之龙」造成的伤害额外无视敌人[qIgnore]%防御',
    cons: 6,
    data: {
      qIgnore: 40
    }
  }
]
