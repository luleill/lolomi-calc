import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '芭芭拉'

const team = ['茜特菈莉','希诺宁','玛薇卡']
const artifact_normal = ['烬城','教官', '千岩']

const team_B = ['茜特菈莉','闲云','芙宁娜']
const artifact_B = ['烬城', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_B, artifact_B, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.hp) * 1)
      }
    }
  }, {
    title: '重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '重击蒸发伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: '「演唱，开始♪」治疗量',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['持续治疗量2'][0] * calc(attr.hp) / 100 + talent.e['持续治疗量2'][1] * 1)
  }, {
    title: '「闪耀奇迹♪」治疗量',
    dmgKey: 'qHeal',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.q['治疗量2'][0] * calc(attr.hp) / 100 + talent.q['治疗量2'][1] * 1)
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}重击蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}下落伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
  title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }}
  ])
  

  export const defDmgKey = 'qHeal'
  export const mainAttr = 'atk,hp,cpct,cdmg,mastery'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '芭芭拉2命：开E获得15%水伤加成',
      cons: 2,
      data: {
        dmg: 15
      }
    }
  ]
  