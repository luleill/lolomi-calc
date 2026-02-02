import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '丽莎'

const team = ['九条裟罗','枫原万叶','纳西妲']
const artifact_normal = ['宗室','风套']

const team_B = ['九条裟罗','班尼特','夏沃蕾']
const artifact_B = ['宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '「苍雷」点按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
  }, {
    title: '「苍雷」3层引雷蓄力伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['三层引雷长按伤害'], 'e')
  }, {
    title: '「苍雷」3层引雷蓄力激化伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['三层引雷长按伤害'], 'e', 'aggravate')
  }, {
    title: '「蔷薇的雷光」每段伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['放电伤害'], 'q')
  }, {
    // 组队伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「苍雷」3层引雷激化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['三层引雷长按伤害'], 'e', 'aggravate')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「苍雷」3层引雷伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      q: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['三层引雷长按伤害'], 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }}
  ])

export const defDmgIdx = 3
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '丽莎被动：敌人受到蔷薇的雷光攻击后，降低15%防御力',
    data: {
      enemyDef: ({ params }) => params.q ? 15 : 0
    }
  }
]