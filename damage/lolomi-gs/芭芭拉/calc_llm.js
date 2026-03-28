import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '芭芭拉'

const team = ['茜特菈莉', '闲云', '芙宁娜']
const artifact_normal = ['烬城', '宗室']

const team_B = ['茜特菈莉', '希诺宁', '玛薇卡']
const artifact_B = ['烬城', '教官', '千岩']

const team_C = ['茜特菈莉', '爱可菲', '芙宁娜']
const artifact_C = ['烬城', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { hydro_two: true })

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '「演唱，开始♪」单次治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['持续治疗量2'][0] * calc(attr.hp) / 100 + talent.e['持续治疗量2'][1])
  }, {
    title: '普攻单次治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.e['命中治疗量2'][0] * calc(attr.hp) / 100 + talent.e['命中治疗量2'][1])
  }, {
    title: '「闪耀奇迹♪」治疗量',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.q['治疗量2'][0] * calc(attr.hp) / 100 + talent.q['治疗量2'][1])
  }, {
    title: `EQ单人站场总治疗`,
    // E释放时1次 + 后续3次治疗 + q治疗 + 持续时间算30次普攻（不考虑天赋延长的5秒，意义也不大）
    dmg: ({ talent, calc, attr }, { heal }) => {
      const qHeal = heal(talent.q['治疗量2'][0] * calc(attr.hp) / 100 + talent.q['治疗量2'][1]).avg;
      const eHeal = heal(talent.e['持续治疗量2'][0] * calc(attr.hp) / 100 + talent.e['持续治疗量2'][1]).avg;
      const aHeal = heal(talent.e['命中治疗量2'][0] * calc(attr.hp) / 100 + talent.e['命中治疗量2'][1]).avg;
      return {
        avg: qHeal + eHeal * 4 + aHeal * 30,
      };
    }
  }, {
    title: '重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '重击蒸发伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 重击蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 下落伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  

  export const defDmgIdx = 3
  export const consDmgKey = '重击伤害'
  export const mainAttr = 'atk,hp,cpct,cdmg'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '2命「元气迸发」：水环持续期间获得15%水伤加成',
      cons: 2,
      data: {
        dmg: 15
      }
    }
  ]
  