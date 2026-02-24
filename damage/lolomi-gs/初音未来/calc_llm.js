import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '初音未来'

const team = ['珐露珊','班尼特','芙宁娜']
const artifact_normal = ['宗室', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.atk) * 1)
      }
    }
  }, {
    title: '普通攻击四段总伤',
    dmg: ({ talent }, dmg) => {
      return '一二三四'.split('').reduce((acc, num) => {
        const result = dmg(talent.a[`${num}段伤害`], 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
    }
  }, {
    title: '重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a')
  }, {
    title: '元素战技伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '音律共振状态普攻四段总伤',
    params: { resonance: true },
    dmg: ({ talent }, dmg) => {
      return '一二三四'.split('').reduce((acc, num) => {
        const result = dmg(talent.e[`音律共振·${num}段伤害`], 'e');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
    }
  }, {
    title: '元素爆发伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}音律共振重击`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      resonance: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['音律共振·重击伤害'], 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis,
        type: 'text'
      }
    }
  }
])

export const defDmgIdx = 5
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.resonance === true,
    title: '音律共振：普攻附带风元素伤害',
    data: {
      aPlus: ({ talent }) => talent.e['音律共振·一段伤害'] * 4
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '元素爆发：开启领域获得攻击力加成，元素精通提升',
    data: {
      atkPct: 20,
      mastery: 200,
    }
  }, {
    title: '初音1命：每层音律提升暴击伤害15%',
    cons: 1,
    data: {
      cdmg: ({ params }) => (params.music_layers || 0) * 15
    }
  }, {
    title: '初音4命：拥有音律时全队暴击率提升15%',
    cons: 4,
    data: {
      cpct: ({ params }) => params.has_music ? 15 : 0
    }
  }, {
    title: '初音6命：拥有音律时自身暴击伤害提升100%',
    cons: 6,
    data: {
      cdmg: ({ params }) => params.has_music ? 100 : 0
    }
  }
]