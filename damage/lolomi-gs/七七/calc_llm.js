import { Config } from '#lolomi'
import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'

const mainCharName = '七七'

const team = ['闲云', '班尼特', '芙宁娜']
const artifact_normal = ['千岩', '宗室']

const team_B = ['米卡', '丽莎', '芙宁娜']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「仙法·寒病鬼差」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「仙法·寒病鬼差」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['寒病鬼差伤害'], 'e')
  }, {
    title: '「仙法·寒病鬼差」命中治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['命中治疗量2'][0] * calc(attr.atk) / 100 + talent.e['命中治疗量2'][1])
  }, {
    title: '「仙法·寒病鬼差」每跳治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['持续治疗量2'][0] * calc(attr.atk) / 100 + talent.e['持续治疗量2'][1])
  }, {
    title: '「仙法·救苦度厄」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「度厄真符」每次治疗',
    dmg: ({ talent, attr, calc }, { heal }) => heal(talent.q['治疗量2'][0] * calc(attr.atk) / 100 + talent.q['治疗量2'][1])
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
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      superconductivity: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'phy')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 普攻五段总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
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
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 下落伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 下落蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3','vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  
  export const mainAttr = 'atk,cpct,cdmg,heal'
  export const defDmgIdx = 4
  export const consDmgKey = '普攻五段总伤'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '2命[冰寒蚀骨]：对受到冰元素影响的敌人，普攻与重击造成的伤害提升15%',
      cons: 2,
      data: {
        aDmg: 15,
        a2Dmg: 15
      }
    }, {
      title: '天赋「延命妙法」：仙法·寒病鬼差状态下触发元素反应时，受治疗加成提升20%',
      data: {
        healInc: 20
      }
    }
  ]
  