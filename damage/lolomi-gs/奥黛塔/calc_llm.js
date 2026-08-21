import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '奥黛塔'

const team = ['迪奥娜', '七七', '阿罗夏']
const artifact_normal = ['千岩', '炉火']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { cryo_two: true })

// 天赋「赤忱者的悲歌」：基于超过攻击力1000的部分，每100点额外造成原本1.5%的星烁反应伤害
const calcStarDmgMulti = (calc, attr) => 1 + Math.min(Math.max(calc(attr.atk) - 1000, 0) / 100 * 1.5, 30) / 100

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「破晓终奏」星超导伤害',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「破晓终奏」星扩散伤害',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const raw = talent.e['破晓终奏星超导/星扩散伤害']
      const mult = Array.isArray(raw) ? raw[1] : raw
      const r = basic(calc(attr.atk) * mult / 100, '', 'stellarVortex')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '反应星扩散(风)伤害',
    dmg: ({}, { reaction }) => reaction('starSwirlAnemo')
  }, {
    title: '反应星扩散(冰)伤害',
    dmg: ({}, { reaction }) => reaction('starSwirlCryo')
  }, {
    title: '反应星扩散(冰)低阶伤害',
    params: { starSwirlWindLV: 1 },
    dmg: ({}, { reaction }) => reaction('starSwirlCryo')
  }, {
    title: '「拂羽舞步」星超导伤害',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['拂羽舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「拂羽舞步」星扩散伤害',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const raw = talent.e['拂羽舞步星超导/星扩散伤害']
      const mult = Array.isArray(raw) ? raw[1] : raw
      const r = basic(calc(attr.atk) * mult / 100, '', 'stellarVortex')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「旋翼舞步」星超导伤害',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['旋翼舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「旋翼舞步」星扩散伤害',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const raw = talent.e['旋翼舞步星超导/星扩散伤害']
      const mult = Array.isArray(raw) ? raw[1] : raw
      const r = basic(calc(attr.atk) * mult / 100, '', 'stellarVortex')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「旋翼舞步」后台星扩散',
    // 六命切后台自身保留华彩效果，非六命切后台默认0层
    params: ({ cons }) => (cons >= 6 ? {} : { huacai: 0 }),
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const raw = talent.e['旋翼舞步星超导/星扩散伤害']
      const mult = Array.isArray(raw) ? raw[1] : raw
      const r = basic(calc(attr.atk) * mult / 100, '', 'stellarVortex')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「疾板·苍羽一梦」总伤',
    dmg: ({ talent }, dmg) => {
      const slash = dmg(talent.q['斩击伤害'], 'q')
      const final = dmg(talent.q['斩击最终段伤害'], 'q')
      return { dmg: slash.dmg + final.dmg, avg: slash.avg + final.avg }
    }
  }, {
    title: '15秒站场星扩散总伤',
    // 木桩自挂风元素
    // 默认手法：EQE + 站场等待拂羽舞步和旋翼舞步分别攻击3次，不考虑普攻，没伤害
    // 总计默认触发12次反应星扩散风，3次反应星扩散冰
    // 1命破晓终奏额外一次星烁伤害；4命协同默认触发4次
    dmg: ({ attr, calc, talent, cons }, calcApi) => {
      const dmg = calcApi
      const { basic, reaction } = calcApi
      const starMulti = calcStarDmgMulti(calc, attr)
      const applyStar = (r) => ({ dmg: r.dmg * starMulti, avg: r.avg * starMulti })
      const eSkill = dmg(talent.e['技能伤害'], 'e')
      const eCont = dmg(talent.e['破晓终奏持续伤害'], 'e')
      const eStar = applyStar(basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][1] / 100, '', 'stellarVortex'))
      const fuyu   = dmg(talent.e['拂羽舞步伤害'], 'e')
      const xuanyi = dmg(talent.e['旋翼舞步伤害'], 'e')
      const fuyuStar = applyStar(basic(calc(attr.atk) * talent.e['拂羽舞步星超导/星扩散伤害'][1] / 100, '', 'stellarVortex'))
      const xuanyiStar = applyStar(basic(calc(attr.atk) * talent.e['旋翼舞步星超导/星扩散伤害'][1] / 100, '', 'stellarVortex'))
      const qSlash = dmg(talent.q['斩击伤害'], 'q')
      const qFinal = dmg(talent.q['斩击最终段伤害'], 'q')
      const swirlAnemo = reaction('starSwirlAnemo')
      const swirlCryo = reaction('starSwirlCryo')
      const c1Extra = cons >= 1 ? applyStar(basic(calc(attr.atk) * 4.5, '', 'stellarVortex')) : { dmg: 0, avg: 0 }
      const c4Synergy = cons >= 4 ? applyStar(basic(calc(attr.atk) * 0.99 * 4, '', 'stellarVortex')) : { dmg: 0, avg: 0 }
      return {
        dmg: eSkill.dmg + swirlAnemo.dmg * 12 + qSlash.dmg + qFinal.dmg + eCont.dmg * 3 + swirlCryo.dmg * 3 + eStar.dmg + fuyu.dmg * 3 + fuyuStar.dmg * 3 + xuanyi.dmg * 3 + xuanyiStar.dmg * 3 + c1Extra.dmg + c4Synergy.dmg,
        avg: eSkill.avg + swirlAnemo.avg * 12 + qSlash.avg + qFinal.avg + eCont.avg * 3 + swirlCryo.avg * 3 + eStar.avg + fuyu.avg * 3 + fuyuStar.avg * 3 + xuanyi.avg * 3 + xuanyiStar.avg * 3 + c1Extra.avg + c4Synergy.avg
      }
    }
  }, {
    title: '15秒站场星超导总伤',
    dmg: ({ attr, calc, talent, cons }, calcApi) => {
      const dmg = calcApi
      const { basic } = calcApi
      const starMulti = calcStarDmgMulti(calc, attr)
      const applyStar = (r) => ({ dmg: r.dmg * starMulti, avg: r.avg * starMulti })
      const eSkill = dmg(talent.e['技能伤害'], 'e')
      const eCont = dmg(talent.e['破晓终奏持续伤害'], 'e')
      const eStar = applyStar(basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][0] / 100, '', 'stellarConduct'))
      const fuyu   = dmg(talent.e['拂羽舞步伤害'], 'e')
      const xuanyi = dmg(talent.e['旋翼舞步伤害'], 'e')
      const fuyuStar = applyStar(basic(calc(attr.atk) * talent.e['拂羽舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct'))
      const xuanyiStar = applyStar(basic(calc(attr.atk) * talent.e['旋翼舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct'))
      const qSlash = dmg(talent.q['斩击伤害'], 'q')
      const qFinal = dmg(talent.q['斩击最终段伤害'], 'q')
      const c1Extra = cons >= 1 ? applyStar(basic(calc(attr.atk) * 3, '', 'stellarConduct')) : { dmg: 0, avg: 0 }
      const c4Synergy = cons >= 4 ? applyStar(basic(calc(attr.atk) * 0.66 * 4, '', 'stellarConduct')) : { dmg: 0, avg: 0 }
      return {
        dmg: eSkill.dmg + qSlash.dmg + qFinal.dmg + eCont.dmg * 3 + eStar.dmg + fuyu.dmg * 3 + fuyuStar.dmg * 3 + xuanyi.dmg * 3 + xuanyiStar.dmg * 3 + c1Extra.dmg + c4Synergy.dmg,
        avg: eSkill.avg + qSlash.avg + qFinal.avg + eCont.avg * 3 + eStar.avg + fuyu.avg * 3 + fuyuStar.avg * 3 + xuanyi.avg * 3 + xuanyiStar.avg * 3 + c1Extra.avg + c4Synergy.avg
      }
    }
  }, {
    // 队伍
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「破晓终奏」星超导`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true,
    }),
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「破晓终奏」星扩散`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true,
    }),
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const raw = talent.e['破晓终奏星超导/星扩散伤害']
      const mult = Array.isArray(raw) ? raw[1] : raw
      const r = basic(calc(attr.atk) * mult / 100, '', 'stellarVortex')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,mastery,cpct,cdmg'
export const defDmgIdx = 2
export const consDmgKey = '15秒站场星扩散总伤'
export const defParams = { huacai: 4 }

export const buffs = [
  ...TeamBuff,
  {
    title: '「星耀祝礼·银晓之舞」：基于攻击力提升星烁反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    title: ({ params, cons }) => {
      const stacks = (params.huacai ?? 4) + (cons >= 1 ? 2 : 0)
      return `天赋「获选者的春祭」：${stacks}层华彩提升星烁反应伤害[stellarConduct]%`
    },
    sort: 9,
    data: {
      stellarConduct: ({ params, cons }) => ((params.huacai ?? 4) + (cons >= 1 ? 2 : 0)) * 15,
      stellarVortex: ({ params, cons }) => ((params.huacai ?? 4) + (cons >= 1 ? 2 : 0)) * 15,
      starSwirlAnemo: ({ params, cons }) => ((params.huacai ?? 4) + (cons >= 1 ? 2 : 0)) * 15,
      starSwirlCryo: ({ params, cons }) => ((params.huacai ?? 4) + (cons >= 1 ? 2 : 0)) * 15,
    }
  }, {
    title: ({ attr, calc }) => {
      const bonus = Math.min(Math.max(calc(attr.atk) - 1000, 0) / 100 * 1.5, 30)
      return `天赋「赤忱者的悲歌」：基于攻击力星烁反应造成原本${bonus.toFixed(1)}%的伤害`
    },
    sort: 9,
  }, {
    title: '「雪鹄之梦」：提升星烁反应伤害[stellarConduct]%',
    data: {
      stellarConduct: ({ talent }) => talent.q['雪鹄之梦星烁反应伤害提升'],
      stellarVortex: ({ talent }) => talent.q['雪鹄之梦星烁反应伤害提升'],
      starSwirlAnemo: ({ talent }) => talent.q['雪鹄之梦星烁反应伤害提升'],
      starSwirlCryo: ({ talent }) => talent.q['雪鹄之梦星烁反应伤害提升'],

    }
  }, {
    title: ({ params, cons }) => {
      const stacks = (params.huacai ?? 4) + (cons >= 1 ? 2 : 0)
      return `2命「她想，我要见证雪鹄未见之梦」：${stacks}层华彩提升攻击力[atkPct]%`
    },
    cons: 2,
    data: {
      atkPct: ({ params, cons }) => ((params.huacai ?? 4) + (cons >= 1 ? 2 : 0)) * 7
    }
  }, {
    title: '2命「她想，我要见证雪鹄未见之梦」：独舞倒影附近敌人冰/雷抗性降低20%',
    cons: 2,
    data: {
      kx: 20
    }
  }, {
    title: '4命「向上，坠往恍惚、燃烧的蓝空」：3.5秒间隔触发一次星烁协同攻击',
    cons: 4,
  }, {
    title: '6命「伸出手，触及苍穹永恒的面容」：自身星烁反应伤害擢升45%',
    cons: 6,
    data: {
      elevated: 45
    }
  }
]
