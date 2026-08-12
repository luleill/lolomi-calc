import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '奥黛塔'

const team = ['桑多涅', '七七', '阿罗夏']
const artifact_normal = ['千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { cryo_two: true })

// 天赋「赤忱者的悲歌」：基于超过攻击力1000的部分，每100点额外造成原本1.5%的星烁反应伤害
const calcStarDmgMulti = (calc, attr) => 1 + Math.min(Math.max(calc(attr.atk) - 1000, 0) / 100 * 1.5, 30) / 100

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「柔板·幻灵夜舞」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「破晓终奏」星超导伤害',
    params: { q: true },
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「拂羽舞步」星超导伤害',
    params: { q: true },
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['拂羽舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '「疾板·苍羽一梦」尾段伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['斩击最终段伤害'], 'q')
  }, {
    title: '一轮循环总伤',
    params: { q: true },
    dmg: ({ attr, calc, talent, cons }, calcApi) => {
      const dmg = calcApi
      const { basic } = calcApi
      const starMulti = calcStarDmgMulti(calc, attr)
      const applyStar = (r) => ({ dmg: r.dmg * starMulti, avg: r.avg * starMulti })
      const eSkill = dmg(talent.e['技能伤害'], 'e')
      const eStar = applyStar(basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][0] / 100, '', 'stellarConduct'))
      const fuyu   = dmg(talent.e['拂羽舞步伤害'], 'e')
      const xuanyi = dmg(talent.e['旋翼舞步伤害'], 'e')
      const fuyuStar = applyStar(basic(calc(attr.atk) * talent.e['拂羽舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct'))
      const xuanyiStar = applyStar(basic(calc(attr.atk) * talent.e['旋翼舞步星超导/星扩散伤害'][0] / 100, '', 'stellarConduct'))
      // 辉映状态下拂羽/旋翼两种舞步各额外一次星烁伤害
      const shadowDmg = fuyu.dmg * 2 + xuanyi.dmg * 2 + fuyuStar.dmg * 2 + xuanyiStar.dmg * 2
      const shadowAvg = fuyu.avg * 2 + xuanyi.avg * 2 + fuyuStar.avg * 2 + xuanyiStar.avg * 2
      const qSlash = dmg(talent.q['斩击伤害'], 'q')
      const qFinal = dmg(talent.q['斩击最终段伤害'], 'q')
      const c1Extra = cons >= 1
        ? applyStar(basic(calc(attr.atk) * 3, '', 'stellarConduct'))
        : { dmg: 0, avg: 0 }
      // 4命协同默认2次
      const c4Extra = cons >= 4
        ? applyStar(basic(calc(attr.atk) * 0.66, '', 'stellarConduct'))
        : { dmg: 0, avg: 0 }
      return {
        dmg: eSkill.dmg + eStar.dmg + shadowDmg + qSlash.dmg + qFinal.dmg + c1Extra.dmg + c4Extra.dmg * 2,
        avg: eSkill.avg + eStar.avg + shadowAvg + qSlash.avg + qFinal.avg + c1Extra.avg + c4Extra.avg * 2
      }
    }
  }, {
    // 队伍
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「破晓终奏」星超导`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true,
      q: true
    }),
    dmg: ({ attr, calc, talent }, { basic }) => {
      const multi = calcStarDmgMulti(calc, attr)
      const r = basic(calc(attr.atk) * talent.e['破晓终奏星超导/星扩散伤害'][0] / 100, '', 'stellarConduct')
      return { dmg: r.dmg * multi, avg: r.avg * multi }
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,mastery,atkcpct,cdmg'
export const defDmgIdx = 2
export const consDmgKey = '一轮循环总伤'
export const defParams = { huacai: 4 }

export const buffs = [
  ...TeamBuff,
  {
    title: '「星耀祝礼·银晓之舞」：基于攻击力提升星超导基础伤害[fypct]%',
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
      stellarConduct: ({ params, cons }) => ((params.huacai ?? 4) + (cons >= 1 ? 2 : 0)) * 15
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '「雪鹄之梦」：提升星烁反应伤害[stellarConduct]%',
    data: {
      stellarConduct: ({ talent }) => talent.q['雪鹄之梦星烁反应伤害提升']
    }
  }, {
    title: ({ params, cons }) => {
      const stacks = (params.huacai ?? 4) + (cons >= 1 ? 2 : 0)
      return `2命「她想，我要见证雪鹄未见之梦」：${stacks}层华彩提升攻击力[atkPct]%`
    },
    sort: 9,
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
    title: '4命「向上，坠往恍惚、燃烧的蓝空」：3.5秒频率额外一次协同攻击',
    cons: 4,
  }, {
    title: '6命「伸出手，触及苍穹永恒的面容」：自身星烁反应伤害擢升45%',
    cons: 6,
    data: {
      elevated: 45
    }
  }
]
