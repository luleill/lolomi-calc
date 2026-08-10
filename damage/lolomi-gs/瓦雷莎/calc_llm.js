import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '瓦雷莎'

const team = ['闲云', '芙宁娜', '尼可']
const artifact_normal = ['天美']

const team_A = ['闲云', '芙宁娜', '伊安珊']
const artifact_A = ['烬城']

const team_B = ['夏沃蕾', '尼可', '伊安珊']
const artifact_B = ['天美', '烬城']

const team_C = ['夏沃蕾', '尼可', '杜林']
const artifact_C = ['天美', '宗室']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,
  () => ({ hero_return: 1 }))

const plusOverflow = (ds, dmg) => {
  const { attr, cons } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  if (!nicolePlus) return { dmg: 0, avg: 0 }
  const seq = []
  if (cons >= 4) seq.push('q')
  for (let i = 0; i < 4; i++) {
    seq.push('e', 'a2', 'a3', 'a3')
    if (cons >= 2 || i % 2 === 1) seq.push('a3', 'a3')
  }
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
    const unit = dmg(0, `${key},nightsoul`)
    acc.dmg += unit.dmg * over
    acc.avg += unit.avg * over
    return acc
  }, { dmg: 0, avg: 0 })
}

// 一轮站场总伤
// 基础手法 EZP + EZP + 小Q
// 不考虑下落擦伤，组队总伤理论计算普遍偏高，算是一点补偿
// 命座机制变化
// 1命：虹色坠击常驻180%额外伤害
// 2命：任意下落后可接小Q，手法变动 EZP + 小Q + EZP + 小Q
// 4命：大Q起手附加buff「精进勇猛」使下一次下落基础值提升(攻击力*500%, 20000)
const rotationDmg = (ds, dmg) => {
  const { talent, attr, calc, cons } = ds
  const e = dmg(talent.e['突进伤害'], 'e,nightsoul')
  const eHot = dmg(talent.e['炽热激情状态突进伤害'], 'e,nightsoul')
  const z = dmg(talent.a['重击伤害'], 'a2,nightsoul')
  const zHot = dmg(talent.a['炽热激情状态重击伤害'], 'a2,nightsoul')
  const p = dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3,nightsoul')
  const pHot = dmg(talent.a['炽热激情状态低空/高空坠地冲击伤害'][1], 'a3,nightsoul')
  const fullQ = cons >= 4 ? dmg(talent.q['飞踢伤害'], 'q,nightsoul') : { dmg: 0, avg: 0 }
  const brave = cons >= 4 ? dmg.basic(Math.min(calc(attr.atk) * 500 / 100, 20000), 'a3,nightsoul') : { dmg: 0, avg: 0 }
  // 6命 下落全程炽热激情；否则仅第2/4次下落为炽热激情
  const pHotCount = cons >= 6 ? 4 : 2
  const zHotCount = cons >= 6 ? 4 : 2
  // 虹色坠击：1命常驻180%，否则普通下落50%、炽热下落180%
  const rainbowBase = calc(attr.atk) * (cons >= 1 ? 180 : 50) / 100
  const rainbowHotBase = calc(attr.atk) * 180 / 100
  const rainbow = dmg.basic(rainbowBase, 'a3,nightsoul')
  const rainbowHot = dmg.basic(rainbowHotBase, 'a3,nightsoul')
  // 虹色坠击下落额外附加伤害不重复吃闲云下落加成
  const xianyunPlus = LIMITED_PLUS.XianYun.plus(ds)
  const rb = dmg.basic(rainbowBase + xianyunPlus, 'a3,nightsoul')
  const rbHot = dmg.basic(rainbowHotBase + xianyunPlus, 'a3,nightsoul')
  const rainbowMarg = { dmg: rb.dmg - rainbow.dmg, avg: rb.avg - rainbow.avg }
  const rainbowHotMarg = { dmg: rbHot.dmg - rainbowHot.dmg, avg: rbHot.avg - rainbowHot.avg }
  const shortQ = dmg(talent.q['「大火山崩落」伤害'], 'a3,nightsoul')
  const shortQTimes = cons >= 2 ? 4 : 2
  const shortQFactor = cons >= 4 ? 2 : 1
  const shortQHotCount = Math.min(shortQTimes, pHotCount)
  const rainbowCount = (4 - pHotCount) + (shortQTimes - shortQHotCount)
  const rainbowHotCount = pHotCount + shortQHotCount
  const over = plusOverflow(ds, dmg)
  return {
    dmg: fullQ.dmg + brave.dmg + e.dmg * 2 + eHot.dmg * 2 +
      z.dmg * (4 - zHotCount) + zHot.dmg * zHotCount +
      p.dmg * (4 - pHotCount) + pHot.dmg * pHotCount +
      rainbow.dmg * (4 - pHotCount) + rainbowHot.dmg * pHotCount +
      shortQ.dmg * shortQFactor * shortQTimes +
      rainbow.dmg * (shortQTimes - shortQHotCount) + rainbowHot.dmg * shortQHotCount -
      rainbowMarg.dmg * rainbowCount - rainbowHotMarg.dmg * rainbowHotCount - over.dmg,
    avg: fullQ.avg + brave.avg + e.avg * 2 + eHot.avg * 2 +
      z.avg * (4 - zHotCount) + zHot.avg * zHotCount +
      p.avg * (4 - pHotCount) + pHot.avg * pHotCount +
      rainbow.avg * (4 - pHotCount) + rainbowHot.avg * pHotCount +
      shortQ.avg * shortQFactor * shortQTimes +
      rainbow.avg * (shortQTimes - shortQHotCount) + rainbowHot.avg * shortQHotCount -
      rainbowMarg.avg * rainbowCount - rainbowHotMarg.avg * rainbowHotCount - over.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「夜虹逐跃」突进伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['突进伤害'], 'e,nightsoul')
  }, {
    title: '常态下落伤害',
    params: { rainbow: true },
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3,nightsoul')
  }, {
    title: '「炽热激情」下落伤害',
    params: { rainbowHot: true },
    dmg: ({ talent }, dmg) => dmg(talent.a['炽热激情状态低空/高空坠地冲击伤害'][1], 'a3,nightsoul')
  }, {
    title: '「闪烈降临！」伤害',
    params: { q4: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['飞踢伤害'], 'q,nightsoul')
  }, {
    title: '炽热激情「闪烈降临！」伤害',
    params: { q4: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['炽热激情状态飞踢伤害'], 'q,nightsoul')
  }, {
    title: '小Q「大火山崩落」伤害',
    params: { rainbow: true, q4: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['「大火山崩落」伤害'], 'a3,nightsoul')
  }, {
    title: '一轮站场总伤',
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 小Q伤害`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_A, artifact_A).params, hero_return: 1, rainbow: true, q4: true }),
    dmg: ({ talent }, dmg) => dmg(talent.q['「大火山崩落」伤害'], 'a3,nightsoul')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_A, artifact_A).params, hero_return: 1 }),
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 小Q伤害`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_B, artifact_B).params, hero_return: 1, rainbow: true, q4: true, pyro_two: true }),
    dmg: ({ talent }, dmg) => dmg(talent.q['「大火山崩落」伤害'], 'a3,nightsoul')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_B, artifact_B).params, hero_return: 1, pyro_two: true }),
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 小Q伤害`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_C, artifact_C).params, hero_return: 1, rainbow: true, q4: true, pyro_two: true }),
    dmg: ({ talent }, dmg) => dmg(talent.q['「大火山崩落」伤害'], 'a3,nightsoul')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_C, artifact_C).params, hero_return: 1, pyro_two: true }),
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 小Q伤害`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, hero_return: 1, rainbow: true, q4: true }),
    dmg: ({ talent }, dmg) => dmg(talent.q['「大火山崩落」伤害'], 'a3,nightsoul')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, hero_return: 1 }),
    dmg: rotationDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 6
export const consDmgKey = '一轮站场总伤'
export const defParams = { Nightsoul: true }
export const mainAttr = 'atk,dmg,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    // 希诺宁天赋默认额外触发一次夜魂迸发，带希诺宁的队伍 hero_return = 2
    // 其他队伍存在3位纳塔角色 hero_return = 2，否则默认1
    title: '天赋「英雄，二度归来！」：[nightsoulLv]层夜魂迸发时攻击力提升[atkPct]%',
    data: {
      nightsoulLv: ({ params }) => params.hero_return ?? 1,
      atkPct: ({ params }) => 35 * (params.hero_return ?? 1)
    }
  }, {
    title: '天赋「连势，三重腾跃！」：夜虹逐跃后下落伤害提升[a3Plus]',
    data: {
      a3Plus: ({ attr, calc, params }) => !params.rainbow && !params.rainbowHot ? 0 :
        calc(attr.atk) * (params.rainbowHot ? 180 : 50) / 100
    }
  }, {
    title: '1命「终始不熄的热诚」：虹色坠击下落伤害提升[a3Plus]',
    cons: 1,
    data: {
      a3Plus: ({ attr, calc, params }) => params.rainbow ? calc(attr.atk) * 130 / 100 : 0
    }
  }, {
    title: '2命「逾越天光的极限」：任意下落攻击后进入极限驱动状态',
    cons: 2
  }, {
    title: '4命「直面前路的勇气」：处于炽热激情/极限驱动状态时，元素爆发造成的伤害提升[qDmg]%',
    cons: 4,
    check: ({ params }) => params.q4,
    data: {
      qDmg: 100,
      a3Dmg: 100
    }
  }, {
    title: '6命「正义英雄的凯旋」：下落攻击与闪烈降临暴击率提升[a3Cpct]%、暴伤提升[a3Cdmg]%',
    cons: 6,
    data: {
      a3Cpct: 10,
      a3Cdmg: 100,
      qCpct: 10,
      qCdmg: 100
    }
  }
]
