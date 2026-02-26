import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '神里绫华'

const team = ['申鹤','枫原万叶','珊瑚宫心海']
const artifact_normal = ['宗室', '风套']

const team_B = ['申鹤','爱可菲','芙宁娜']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_B, artifact_B, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.atk) * 1)
      }
    }
  }, {
    title: '霰步+冰华后重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '「神里流·冰华」 伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「神里流·霜灭」 单段切割伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['切割伤害'], 'q')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}Q后重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg ) =>{
      let a_1 = dmg(talent.a['重击伤害2'][0], 'a2')
      return {
      dmg: a_1.dmg * 3,
      avg: a_1.avg * 3,
    }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true
    }),
    dmg: ({ talent }, dmg ) =>{
      let a_1 = dmg(talent.a['重击伤害2'][0], 'a2')
      return {
      dmg: a_1.dmg * 3,
      avg: a_1.avg * 3,
    }
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
  
  export const mainAttr = 'atk,cpct,cdmg'
  export const defDmgIdx = 3
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '绫华被动：释放E后普攻与重击伤害提高30%',
      data: {
        aDmg: 30,
        a2Dmg: 30
      }
    }, {
      title: '绫华被动：霰步命中敌人获得18%冰伤加成',
      data: {
        dmg: 18
      }
    }, {
      cons: 4,
      title: '绫华4命：元素爆发后敌人防御力降低30%',
      check: ({ params }) => params.q === true, 
      data: {
        enemyDef: 30
      }
    }, {
      cons: 6,
      title: '绫华6命：每10秒重击伤害提高[a2Dmg]%',
      data: {
        a2Dmg: 298
      }
    }
  ]
  