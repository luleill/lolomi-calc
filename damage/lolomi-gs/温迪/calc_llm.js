import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '温迪'

const team = ['珐露珊','杜林','班尼特']
const artifact_normal = ['千岩', '宗室']

const team_B = ['珐露珊','莫娜','班尼特']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{cons_2: true})

export const details = applyStandardTeam([
{
  title: '触发满特效后攻击力',
  dmg: ({ attr, calc }) => {
    return { avg: Math.min(calc(attr.atk) * 1)}
  }
},
{
  title: '飓风箭六箭总伤',
  params: { WindsunderArrow : true },
  dmg: ({ talent }, dmg) => {
    return '一二三四五六'.split('').reduce((acc, num) => {
      const result = dmg(talent.a[`${num}段伤害`], 'a');
      acc.dmg += result.dmg;
      acc.avg += result.avg;
      return acc;
    }, { dmg: 0, avg: 0 });
  }
}, {
  title: '「高天之歌」点按伤害',
  dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
}, {
  title: '二命「高天之歌」强化伤害',
  params: { cons_2: true,},
  cons: 2,
  dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
}, {
  title: '「风神之诗」单段伤害',
  dmg: ({ talent }, dmg) => dmg(talent.q['持续伤害'], 'q')
} ,{
  // 队伍伤害
  title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}强化[E]伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team_B, artifact_B).params,
    cons_2: true
  }),
  dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
} ,{
  title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}强化[E]伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team, artifact_normal).params,
    cons_2: true,
  }),
  dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
}, {
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
])

export const defParams = { Hexenzirkel: true } // 魔导·秘仪队伍
export const defDmgIdx = 2
export const mainAttr = 'atk,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.WindsunderArrow === true,
    title: '温迪被动：飓风箭造成原本[_aMulti]%的普通攻击伤害',
    data: {
      aMulti: ({ talent }) => talent.a['飓风箭伤害'] - 100,
      _aMulti: ({ talent }) => talent.a['飓风箭伤害']
    }
  }, {
    title: '温迪2命：E降低24%风抗与物抗',
    cons: 2,
    data: {
      kx: 24
    }
  }, {
    check: ({ params }) => params.cons_2 === true,
    title: '温迪2命：施放元素爆发后，点按元素战技将造成原本300%的伤害',
    cons: 2,
    data: {
      eMulti: 200,
      _eMulti: 300
    }
  }, {
    title: '温迪4命：温迪获取元素晶球或元素微粒后，获得25%风元素伤害加成',
    cons: 4,
    data: {
      dmg: 25
    }
  }, {
    title: '温迪6命：受元素爆发伤害的敌人，风元素抗性降低[kx]%，温迪对这些敌人造成的伤害，还会获得[cdmg]%暴击伤害加成',
    cons: 6,
    data: {
      kx: 20,
      cdmg: 100,
    }
  }
]

    