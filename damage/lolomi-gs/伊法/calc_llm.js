import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam, artifactConfig } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '伊法'
// 月感电队伊法自身触发月感电次数不稳定，计算结果仅供参考
const team = ['希诺宁', '哥伦比娅', '伊涅芙']
const artifact_normal = ['夜歌']

const team_B = ['珐露珊', '芙宁娜', '尼可']
const artifact_B = ['千岩', '天美']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,
  { nightsoul_self: 40, nightsoul_team: 45, luna_times: 2 })

// 尼可4命基础提升生效8次
const plusOverflow = (ds, dmg) => {
  const { attr, cons } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  if (!nicolePlus) return { dmg: 0, avg: 0 }
  const overE = attr.e.plus ? nicolePlus * 4 / attr.e.plus : 0
  const overA = attr.a.plus && cons >= 6 ? nicolePlus * 5 / attr.a.plus : 0
  const unitE = dmg(0, 'e,nightsoul')
  const unitA = dmg(0, 'a,nightsoul')
  return {
    dmg: unitE.dmg * overE + unitA.dmg * overA,
    avg: unitE.avg * overE + unitA.avg * overA
  }
}

// 一轮总伤：Q + 镇静标记染色 + 夜魂加持期间秘药弹 + 扩散
// 秘药弹次数：默认10发；6命每发50%几率协同1次，期望触发5次协同
const rotationDmg = (ds, dmg) => {
  const { talent, cons, params = {} } = ds
  const qHit = dmg(talent.q['技能伤害'], 'q,nightsoul')
  const mark = dmg(talent.q['镇静标记伤害'], 'q,nightsoul', 'coloringDmg')
  const bullet = dmg(talent.e['秘药弹伤害'], 'e,nightsoul')
  const c6Bullet = cons >= 6 ? dmg(120, 'a,nightsoul') : { dmg: 0, avg: 0 }
  const bullets = 10
  const swirlTimes = 5 + (cons >= 6 ? 2 : 0)
  const swirlAvg = dmg.reaction('swirl').avg * swirlTimes
  const luna = dmg.reaction('lunarCharged')
  const lunaTimes = params.luna_times || 0
  const over = plusOverflow(ds, dmg)
  return {
    dmg: qHit.dmg + mark.dmg + bullet.dmg * bullets + c6Bullet.dmg * 5 + swirlAvg + luna.dmg * lunaTimes - over.dmg,
    avg: qHit.avg + mark.avg + bullet.avg * bullets + c6Bullet.avg * 5 + swirlAvg + luna.avg * lunaTimes - over.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '「援护射击」秘药弹伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['秘药弹伤害'], 'e,nightsoul')
  }, {
    title: '「援护射击」秘药弹治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['秘药弹命中治疗量2'][0] * calc(attr.mastery) / 100 + talent.e['秘药弹命中治疗量2'][1])
  }, {
    title: '「复合镇静域」技能伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul')
  }, {
    title: '「镇静标记」爆发伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['镇静标记伤害'], 'q,nightsoul', 'coloringDmg')
  }, {
    title: '扩散反应伤害',
    dmg: ({}, { reaction }) => reaction('swirl')
  }, {
    title: 'EQ站场总伤',
    params: { nightsoul_self: 40 },
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_B, artifact_B).params, nightsoul_self: 40, nightsoul_team: 0 }),
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场总伤`,
    // 希诺宁夜魂上限90，不清楚救援要义队友层数判定具体逻辑，默认希诺宁提供45夜魂
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, nightsoul_self: 40, nightsoul_team: 45, luna_times: 2 }),
    dmg: rotationDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 2
export const consDmgKey = 'EQ站场总伤'
export const defParams = { Nightsoul: true }
export const mainAttr = 'atk,mastery,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「互助救援协议」：触发夜魂迸发时，元素精通提升[mastery]',
    data: {
      mastery: 80
    }
  }, {
    // 救援要义层数 = 队伍夜魂值总和
    // 自身基础夜魂点数 nightsoul_self，队友夜魂点数 nightsoul_team
    // 2命：夜魂值总和超过60的部分每1点额外获得4点救援要义，上限150 → 200
    // 救援要义不锁面板，实时跟随队伍当前夜魂值衰减
    // 队伍总伤取平均值 nightsoul_self: 40，单段伤害默认满层
    title: ({ params, cons }) => {
      const t = (params.nightsoul_self ?? 80) + (params.nightsoul_team || 0)
      const s = cons >= 2 ? Math.min(t + Math.max(t - 60, 0) * 4, 200) : Math.min(t, 150)
      return `天赋「场中医者视野」：${s}点救援要义，扩散/感电伤害提升[swirl]%、月感电伤害提升[lunarCharged]%`
    },
    data: {
      swirl: ({ params, cons }) => {
        const t = (params.nightsoul_self ?? 80) + (params.nightsoul_team || 0)
        return (cons >= 2 ? Math.min(t + Math.max(t - 60, 0) * 4, 200) : Math.min(t, 150)) * 1.5
      },
      electroCharged: ({ params, cons }) => {
        const t = (params.nightsoul_self ?? 80) + (params.nightsoul_team || 0)
        return (cons >= 2 ? Math.min(t + Math.max(t - 60, 0) * 4, 200) : Math.min(t, 150)) * 1.5
      },
      lunarCharged: ({ params, cons }) => {
        const t = (params.nightsoul_self ?? 80) + (params.nightsoul_team || 0)
        return (cons >= 2 ? Math.min(t + Math.max(t - 60, 0) * 4, 200) : Math.min(t, 150)) * 0.2
      }
    }
  }, {
    title: '4命「糜烂应体的置换」：施放元素爆发后，元素精通提升[mastery]点',
    cons: 4,
    data: {
      mastery: 100
    }
  }, {
    title: '6命「羽结所庇的诺言」：援护射击50%几率发射额外秘药弹，造成攻击力120%的风伤',
    cons: 6
  }
]
