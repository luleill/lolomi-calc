import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '八重神子'

const team = ['九条裟罗','枫原万叶','纳西妲']
const artifact_normal = ['宗室','风套']

const team_B = ['希诺宁','芙宁娜','纳西妲']
const artifact_B = ['烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
{
  title: ({ cons }) => `${cons < 2 ? '三' : '四'}阶「杀生樱」伤害`,
  dmg: ({ talent, cons }, dmg) => {
    const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
    return dmg(talent.e[skillKey], 'e')
  }
}, {
  title: ({ cons }) => `${cons < 2  ? '三' : '四'}阶「杀生樱」激化伤害`,
  dmg: ({ talent, cons }, dmg) => {
    const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
    return dmg(talent.e[skillKey], 'e', 'aggravate')
  }
}, {
  title: '「大密法·天狐显真」伤害',
  dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
}, {
  title: '「天狐霆雷」额外三次总伤',
  dmg: ({ talent }, dmg) => dmg(talent.q['天狐霆雷伤害'] * 3, 'q')
}, {
  title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「天狐显真」总激化`,
  params: ({cons}) => ({
    ...teamConfig(cons, team, artifact_normal).params, 
  }),
  dmg: ({ talent }, dmg) => {
    let Q1 = dmg(talent.q['技能伤害'], 'q', 'aggravate')
    let Q2 = dmg(talent.q['天狐霆雷伤害'], 'q', 'aggravate')
    return {
      dmg: Q1.dmg + Q2.dmg * 3,
      avg: Q1.avg + Q2.avg * 3
    }
  }
}, {
  title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}${cons < 2 ? '三' : '四'}阶「杀生樱」激化伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team_B, artifact_B).params, 
  }),
  dmg: ({ talent, cons }, dmg) => {
    const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
    return dmg(talent.e[skillKey], 'e', 'aggravate')
  }
}, {
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
])

export const mainAttr = 'atk,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
  title: '神子天赋：基于元素精通提高杀生樱伤害[eDmg]%',
  data: {
    eDmg: ({ attr, calc }) => calc(attr.mastery) * 0.15
  }
  }, {
    cons : 4,
    title: '神子4命：杀生樱命中敌人后提高雷伤[dmg]%',
    data: {
      dmg: 20
    }
  }, {
    cons: 6,
    title: '神子6命：杀生樱无视敌人[eDef]%防御',
    data: {
      eIgnore: 60
    }
  }]