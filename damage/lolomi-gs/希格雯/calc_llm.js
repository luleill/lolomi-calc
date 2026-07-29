import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '希格雯'

const team = ['茜特菈莉', '希诺宁', '芙宁娜']
const artifact_normal = ['烬城']

const team_B = ['茜特菈莉', '万叶', '芙宁娜']
const artifact_B = ['烬城', '风套']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { hydro_two: true, Xilonen_hydro: true })

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.hp)) })
  }, {
    title: '触发特效后治疗加成',
    dmg: ({ attr }) => ({ avg: Math.floor(attr.heal) + '%', type: 'text' })
  }, {
    title: '「半强制静养」伤害提升值',
    dmg: ({ attr, calc, cons }) => {
      const per = cons >= 1 ? 100 : 80
      const cap = cons >= 1 ? 3500 : 2800
      return { avg: Math.floor(Math.max(0, Math.min((calc(attr.hp) - 30000) / 1000 * per, cap))) }
    }
  }, {
    title: '「激愈水球」每跳治疗',
    dmg: ({ attr, talent, calc }, { heal }) => {
      return heal(calc(attr.hp) * talent.e['激愈水球治疗量2'][0] / 100 + talent.e['激愈水球治疗量2'][1])
    }
  }, {
    title: '「激愈水球」自身治疗',
    params: { chargeLv: 0 },
    dmg: ({ attr, calc }, { heal }) => heal(calc(attr.hp) * 0.5)
  }, {
    title: '「小小关心气泡」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['小小关心气泡伤害'], 'a')
  }, {
    title: '「激愈水球」小水球伤害',
    params: { chargeLv: 0 },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['激愈水球伤害'] / 100, 'e')
  }, {
    title: '「激愈水球」大水球伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['激愈水球伤害'] / 100, 'e')
  }, {
    title: '「激愈水球」小水球蒸发',
    params: { chargeLv: 0 },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['激愈水球伤害'] / 100, 'e', 'vaporize')
  }, {
    title: '「流涌之刃」伤害',
    params: { chargeLv: 0 },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['流涌之刃伤害'] / 100, 'e')
  }, {
    title: '「过饱和心意注射」单段伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: '「过饱和心意注射」蒸发',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q', 'vaporize')
  }, {
    title: 'EQ一轮总伤',
    params: { chargeLv: 0 },
    // 长按E + Q 持续到Q结束
    // 0命默认E跳5次，1-3命跳5次，1命4次大水球+中水球，4命以上跳8次
    dmg: (ctx, calcApi) => {
      const { basic } = calcApi
      const { talent, attr, calc, cons } = ctx
      // 长按E每级水球增伤：大+10 中+5 小+0
      const bounceDmg = cons >= 4
        ? [10, 10, 10, 10, 5, 0, 0, 0]  // 4命 8跳：前3跳不变小→4大→1中→3小
        : cons >= 1
          ? [10, 10, 10, 10, 5]          // 1-3命 5跳：前3跳不变小→4大→1中
          : [10, 5, 0, 0, 0]             // 0命 5跳：1大→1中→3小
      const foamBase = calc(attr.hp) * talent.e['激愈水球伤害'] / 100
      const foamTotal = bounceDmg.reduce((sum, d) => {
        const r = basic(foamBase, 'e', false, d > 0 ? { dynamicDmg: d } : {})
        return { dmg: sum.dmg + r.dmg, avg: sum.avg + r.avg }
      }, { dmg: 0, avg: 0 })
      const blade = basic(calc(attr.hp) * talent.e['流涌之刃伤害'] / 100, 'e')
      const q = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
      const ticks = cons >= 4 ? 13 : 6
      return {
        dmg: foamTotal.dmg + blade.dmg + q.dmg * ticks,
        avg: foamTotal.avg + blade.avg + q.avg * ticks
      }
    }
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} Q单段伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      hydro_two: true, Xilonen_hydro: true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} Q单段伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      hydro_two: true, Xilonen_hydro: true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'hp,heal,cpct,cdmg'
export const defDmgIdx = 3
export const consDmgKey = 'EQ一轮总伤'
// 谐律套判定，正常情况希格雯只会靠自产的两枚水滴吃到两层增伤效果
// 希格雯主C，谐律套整体完全比不上绝缘套，曾有人跟我犟，所以把谐律套也加上作为对比
export const defParams = { BondOfLifeGet: 2 }

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「予众生的疗愈」：长按激愈水球伤害提升[eDmg]%，治疗量提升[heal]%',
    data: {
      eDmg: ({ params }) => 5 * (params?.chargeLv ?? 2),
      heal: ({ params }) => 5 * (params?.chargeLv ?? 2)
    }
  }, {
    title: '天赋「应有适当的休憩」：施放弹跳水疗法后获得[dmg]%水元素伤害加成',
    data: {
      dmg: 8
    }
  }, {
    title: '天赋「细致入微的诊疗」：基于生命之契总和，提升治疗量[heal]%',
    sort: 9,
    // 生命之契逻辑说明：1点生命之契 = 1点绝对值，覆盖整个血条至多叠加到200% HP 的生命之契
    // 举例说明：
    // 希格雯 50000 HP，拾取1枚源水之滴赋予自身生命值上限10%的生命之契，放E可以产生2枚
    // 希格雯生命之契点数 = 50000 * 10% * 2 = 10000
    // 每1000点生命之契提升希格雯 3% 治疗量
    // 所以希格雯单人 50000 生命拾取2枚源水之滴即可吃满天赋30%治疗量加成
    data: {
      heal: ({ attr, calc }) => 
        Math.min(30, Math.floor(calc(attr.hp) * 0.2 / 1000 * 3))
    }
  }, {
    title: '2命「最仁慈的精灵」：EQ命中的敌人水元素抗性降低[kx]%',
    cons: 2,
    data: {
      kx: 35
    }
  }, {
    title: '6命「最光辉的精灵」：提升元素爆发暴击[qCpct]%、暴伤[qCdmg]%',
    sort: 9,
    cons: 6,
    data: {
      qCpct: ({ attr, calc }) => Math.min(20, calc(attr.hp) / 1000 * 0.4),
      qCdmg: ({ attr, calc }) => Math.min(110, calc(attr.hp) / 1000 * 2.2)
    }
  }
]
