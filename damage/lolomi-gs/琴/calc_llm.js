import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '琴'

const team = ['珐露珊','班尼特','芙宁娜']
const artifact_normal = ['千岩', '宗室']

const team_B = ['闲云','班尼特','芙宁娜']
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
    title: '「风压剑」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「蒲公英之风」爆发伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['爆发伤害'], 'q')
  }, {
    title: '「蒲公英之风」爆发治疗',
    dmg: ({ talent, calc, attr }, { heal }) =>
      heal(talent.q['领域发动治疗量2'][0] * calc(attr.atk) / 100 + talent.q['领域发动治疗量2'][1] * 1)
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「风压剑」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['爆发伤害'], 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}下落蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3','vaporize')
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
  export const defDmgIdx = 2
  
  export const buffs = [
    ...TeamBuff,
    {
      cons: 1,
      title: '琴1命：长按1秒后风压剑伤害提升40%',
      data: {
        eDmg: 40
      }
    }, {
      cons: 4,
      title: '琴4命：蒲公英之风的领域内敌人风元素抗性降低40%',
      check: ({ params }) => params.q === true,
      data: {
        kx: 40,
      }
    }
  ]
  