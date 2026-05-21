import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '桑多涅'

const team = ['八重神子']
const artifact_normal = []

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '三段普攻总伤',
    dmg: ({ talent }, dmg) => {
      return '一二三'.split('').reduce((acc, num) => {
        const r = dmg(talent.a[`${num}段伤害`], 'a')
        acc.dmg += r.dmg
        acc.avg += r.avg
        return acc
      }, { dmg: 0, avg: 0 })
    }
  }, {
    title: '重击扫射伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击扫射伤害'], 'a2')
  }, {
    title: '重击「冷凝射线」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击冷凝射线伤害'], 'a2')
  }, {
    title: '重击「冷凝射线」星超导伤害',
    dmg: ({ talent }, { basic }) => basic(talent.a['重击冷凝射线星超导伤害'], '', 'starSuperConduct')
  }, {
    title: '功率过载时伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['功率过载时伤害'], 'a2')
  }, {
    title: '「棱晶弹」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['棱晶弹伤害'], 'e')
  }, {
    title: '「棱晶弹」星超导伤害',
    dmg: ({ talent }, { basic }) => basic(talent.e['棱晶弹星超导伤害'], '', 'starSuperConduct')
  }, {
    title: '棱晶谐振炮轰炸伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['轰炸伤害'], 'q')
  }, {
    title: '「聚能光束」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['聚能光束伤害'], 'q')
  }, {
    title: '「聚能光束」星超导伤害',
    dmg: ({ talent }, { basic }) => basic(talent.q['聚能光束星超导伤害'], '', 'starSuperConduct')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 冷凝射线星超导`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ talent }, { basic }) => basic(talent.a['重击冷凝射线星超导伤害'], '', 'starSuperConduct')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defDmgIdx = 4
export const consDmgKey = '「冷凝射线」星超导伤害'

export const buffs = [
  ...TeamBuff,
  {
    title: '「星耀祝礼·唯理为光」：星超导反应基础伤害提升[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    title: '天赋「淑女的行事准则」：基于攻击力提升元素精通[mastery]',
    sort: 9,
    data: {
      mastery: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 8, 160)
    }
  }, {
    title: `天赋「悠久的演算机关」：${Math.min(params.tactic ?? 5, 10)}层改进战术，聚能光束伤害提升${Math.min(params.tactic ?? 5, 10) * 5}%`,
    data: {
      qDmg: ({ params }) => Math.min(params.tactic ?? 5, 10) * 5
    }
  }, {
    title: '1命「鎏金未凋，夕暮已远」：星超导反应伤害提升30%',
    cons: 1,
    data: {
      starSuperConduct: 30
    }
  }, {
    title: '2命「回望镜中，时岁翩然」：辉映·重击冷凝射线伤害提升[a2Plus]',
    sort: 9,
    cons: 2,
    data: {
      a2Plus: ({ attr, calc, params }) => calc(attr.atk) * (100 + Math.min(params.condense ?? 3, 3) * 40) / 100
    }
  }, {
    title: '4命「世事皆数，昼来夜往」：触发星超导反应时，棱晶谐振炮额外造成一次攻击力125%的星超导伤害',
    cons: 4,
  }, {
    title: '6命「水仙梦醒，且望晨光」：星超导反应伤害擢升20%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
