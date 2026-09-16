import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '希诺宁'
// 希诺宁如果自己要作为主C的话，默认只带一个水火雷冰队友，也不考虑六命效果
// 队友没什么合适的圣遗物，暂时留空，暂时不考虑月结晶队伍
const team = ['五郎', '叶洛亚', '芙宁娜']
const artifact_normal = ['']

const team_A = ['五郎', '闲云', '芙宁娜']
const artifact_A = ['']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { geo_two: true })

// 「刃轮巡猎」四段总伤
const bladeHuntDmg = (talent, attr, calc, basic) =>
  '一二三四'.split('').reduce((acc, num) => {
    const hit = basic(calc(attr.def) * talent.a[`刃轮巡猎${num}段伤害`] / 100, 'a,nightsoul')
    return { dmg: acc.dmg + hit.dmg, avg: acc.avg + hit.avg }
  }, { dmg: 0, avg: 0 })

// 一轮总伤 默认 E + 「刃轮巡猎」四段总伤 + Q收尾
const rotationDmg = (ds, { basic }) => {
  const { talent, attr, calc } = ds
  const e = basic(calc(attr.def) * talent.e['突进伤害'] / 100, 'e,nightsoul')
  const q = basic(calc(attr.def) * talent.q['技能伤害'] / 100, 'q,nightsoul')
  const beat = basic(calc(attr.def) * talent.q['追加节拍伤害'] / 100, 'q,nightsoul')
  const bladeHunt = bladeHuntDmg(talent, attr, calc, basic)
  return {
    dmg: e.dmg + q.dmg + beat.dmg * 2 + bladeHunt.dmg,
    avg: e.avg + q.avg + beat.avg * 2 + bladeHunt.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后防御力',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.def)) })
  }, {
    title: '「源音采样」减抗',
    dmg: ({ talent }) => ({ avg: talent.e['元素抗性降低'] + '%', type: 'text' })
  }, {
    title: '「豹烈律动-欢兴」治疗量',
    dmg: ({ talent, attr, calc }, { heal }) => heal(talent.q['持续治疗量2'][0] * calc(attr.def) / 100 + talent.q['持续治疗量2'][1])
  }, {
    title: '4命基础值增伤',
    cons: 4,
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.def) * 65 / 100), type: 'text' })
  }, {
    title: '6命「永夜的祝福」治疗量',
    cons: 6,
    dmg: ({ attr, calc }, { heal }) => heal(1.2 * calc(attr.def))
  }, {
    title: '「音火锻淬」突进伤害',
    // E后才进入夜魂加持，E的释放伤害自己穿烬城时吃不到额外的28增伤效果
    params: { Nightsoul: false },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['突进伤害'] / 100, 'e,nightsoul')
  }, {
    title: '「刃轮巡猎」一段伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.a['刃轮巡猎一段伤害'] / 100, 'a,nightsoul')
  }, {
    title: '「刃轮巡猎」四段总伤',
    dmg: ({ talent, attr, calc }, { basic }) => bladeHuntDmg(talent, attr, calc, basic)
  }, {
    title: '「豹烈律动 - 燥烈」总伤',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.q['技能伤害'] * 3 / 100, 'q,nightsoul')
  }, {
    title: '5秒站场总伤',
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 下落伤害`,
    params: ({ cons }) => teamConfig(cons, team_A, artifact_A).params,
    geo_two: true,
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.a['低空/高空坠地冲击伤害2'][1] / 100, 'a3,nightsoul')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 4A总伤`,
    params: ({ cons }) => teamConfig(cons, team, artifact_normal).params,
    geo_two: true,
    dmg: ({ talent, attr, calc }, { basic }) => bladeHuntDmg(talent, attr, calc, basic)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 6
export const consDmgKey = '5秒站场总伤'
export const defParams = { Nightsoul: true }
export const mainAttr = 'def,cpct,cdmg,dmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '「源音采样」：降低敌人对应元素抗性[kx]%',
    data: {
      kx: ({ talent }) => talent.e['元素抗性降低']
    }
  }, {
    title: '天赋「四境四象回声」：元素转化低于两枚时，普攻与下落提升[aDmg]%',
    data: {
      aDmg: 30,
      a3Dmg: 30
    }
  }, {
    title: '天赋「便携铠装护层」：触发夜魂迸发时防御力提升[defPct]%',
    data: {
      defPct: 20
    }
  }, {
    title: '2命「献予灼原的五重奏」：岩属性伤害提升[dmg]%',
    cons: 2,
    data: {
      dmg: 50
    }
  }, {
    title: '4命「献予午后的花之梦」：基于防御力的65%提升普攻、重击与下落伤害[aPlus]',
    cons: 4,
    sort: 9,
    data: {
      aPlus: ({ attr, calc }) => calc(attr.def) * 65 / 100,
      a2Plus: ({ attr, calc }) => calc(attr.def) * 65 / 100,
      a3Plus: ({ attr, calc }) => calc(attr.def) * 65 / 100
    }
  }, {
    title: '6命「献予永夜的狂欢舞」：基于防御力的300%提升普攻与下落伤害[aPlus]',
    cons: 6,
    sort: 9,
    data: {
      aPlus: ({ attr, calc }) => calc(attr.def) * 300 / 100,
      a3Plus: ({ attr, calc }) => calc(attr.def) * 300 / 100
    }
  }
]
