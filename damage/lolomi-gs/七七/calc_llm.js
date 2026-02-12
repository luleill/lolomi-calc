import { Config } from '#lolomi'
import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'

const mainCharName = '七七'

const team = ['米卡','丽莎','芙宁娜']
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
    title: '「仙法·寒病鬼差」每跳治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['持续治疗量2'][0] * calc(attr.atk) / 100 + talent.e['持续治疗量2'][1] * 1)
  }, {
    title: '「度厄真符」每次治疗',
    dmg: ({ talent, attr, calc }, { heal }) => heal(talent.q['治疗量2'][0] * calc(attr.atk) / 100 + talent.q['治疗量2'][1] * 1)
  }, {
    title: '普攻五段总伤',
    dmg: ({ talent }, dmg) => {
      return '一二三四五'.split('').reduce((acc, num) => {
        const result = dmg(talent.a[`${num}段伤害`], 'a', 'phy');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      superconductivity: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'phy')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}普攻五段总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      superconductivity: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg) => {
      return '一二三四五'.split('').reduce((acc, num) => {
        const result = dmg(talent.a[`${num}段伤害`], 'a', 'phy');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}下落伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
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
      title: '七七2命：[冰寒蚀骨] 对受到元素影响的敌人,普攻与重击造成的伤害提升[a2Dmg]%',
      cons: 2,
      data: {
        aDmg: 15,
        a2Dmg: 15
      }
    },
  ]
  