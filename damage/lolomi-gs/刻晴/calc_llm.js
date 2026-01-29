import { TeamBuff } from '../teambuffs.js'
import { TeamConfig } from '../util.js'

const mainCharName = '刻晴'

const team = ['九条裟罗','枫原万叶','纳西妲']
const artifact_normal = ['宗室','风套']

export const details = [{
    title: '重击雷伤',
  dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '重击激化伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'aggravate')
  }, {
    title: '「天街巡游」尾刀伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['最后一击伤害'], 'q')
  }, {
    title: '「天街巡游」尾刀激化伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['最后一击伤害'], 'q', 'aggravate')
  }, {
    title: ({ cons }) => `${TeamConfig(cons, team, artifact_normal, mainCharName).title}重击激化伤害`,
    params: ({cons}) => ({
      ...TeamConfig(cons, team, artifact_normal).params, 
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'aggravate')
  }, {
    title: ({ cons }) => `${TeamConfig(cons, team, artifact_normal, mainCharName).title}「天街巡游」尾刀激化伤害`,
    params: ({cons}) => ({
      ...TeamConfig(cons, team, artifact_normal).params, 
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['最后一击伤害'], 'q', 'aggravate')
  },
  {
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
  ]

export const defDmgIdx = 3
export const mainAttr = 'atk,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
  title: '刻晴被动：释放Q获得15%暴击率',
  data: {
    qCpct: 15
  }
}, {
  title: '刻晴4命：触发雷元素相关反应提升攻击力25%',
  cons: 4,
  data: {
    atkPct: 25
  }
}, {
  title: '刻晴6命：4层获得24%雷伤加成',
  cons: 6,
  data: {
    dmg: 24
  }
}]

  