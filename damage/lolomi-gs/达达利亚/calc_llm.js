import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '达达利亚'

const team = ['茜特菈莉','枫原万叶','班尼特']
const artifact_normal = ['烬城','宗室', '风套']

const team_B = ['香菱','枫原万叶','班尼特']
const artifact_B = ['风套', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{q:true},-3)

export const details = applyStandardTeam([
  {
    title: '单人触发特效后攻击力',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.atk) * 1)
      }
    }
  }, {
    title: '「断流·闪」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['断流·闪 伤害'], 'a')
  }, {
    title: '「断流·破」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['断流·破 伤害'], 'a')
  }, {
    title: '「魔王武装·狂澜」3A重击总伤',
    dmg: ({ talent }, dmg ) =>{
      let a_1 = dmg(talent.e['一段伤害'], 'a')
      let a_2 = dmg(talent.e['二段伤害'], 'a') 
      let a_3 = dmg(talent.e['三段伤害'], 'a')
      let a_z = dmg(talent.e['重击伤害'], 'a2')
      return {
      dmg: a_1.dmg + a_2.dmg + a_3.dmg + a_z.dmg,
      avg: a_1.avg + a_2.avg + a_3.avg + a_z.avg,
      }
    }
  }, {
    title: '「魔王武装·狂澜」重击蒸发',
    dmg: ({ talent }, dmg) => dmg(talent.e['重击伤害'], 'a2' , 'vaporize')
  }, {
    title: '「断流·斩」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['断流·斩 伤害'], 'e')
  }, {
    title: '「极恶技·魔弹一闪」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·远程'], 'q')
  }, {
    title: '「极恶技·尽灭水光」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q')
  }, {
    title: '「断流·爆」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['断流·爆 伤害'], 'q')
  }, {
    title: '「极恶技·尽灭水光」蒸发伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q' , 'vaporize')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「尽灭水光」蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q' , 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「尽灭水光」蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q' , 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }}
  ])
  
  export const defDmgIdx = 4
  export const mainAttr = 'atk,cpct,cdmg,mastery'
  
  export const buffs = [
    ...TeamBuff
  ]
  