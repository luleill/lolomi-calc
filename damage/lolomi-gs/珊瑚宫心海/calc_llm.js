import lodash from 'lodash'
import { Config } from '#lolomi'
import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'

const mainCharName = '珊瑚宫心海'

const team = ['茜特菈莉','希诺宁','芙宁娜']
const artifact_normal = ['烬城']

const team_B = ['闲云','茜特菈莉','芙宁娜']
const artifact_B = ['烬城']

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
    title: '「化海月」每跳治疗',
    dmg: ({ attr, talent, calc, cons }, { heal }) => {
      let t = talent.e['治疗量2']
      let hp = calc(attr.hp)
      let baseHeal = hp * t[0] / 100 + t[1] * 1
      if (cons >= 2) {
        baseHeal += hp * 0.045
      }
      return heal(baseHeal)
    }
  }, {
    title: '「海人化羽」重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '「海人化羽」普攻三段总害',
    dmg: ({ attr, talent, cons, calc }, dmg) => {
      const ret = '一二三'.split('').reduce((acc, num) => {
        const dmgRet = dmg(talent.a[`${num}段伤害`], 'a');
        acc.dmg += dmgRet.dmg;
        acc.avg += dmgRet.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      
      if (cons > 0) {
        const dmgRet = dmg.basic(calc(attr.hp) * 0.3);
        ret.dmg += dmgRet.dmg;
        ret.avg += dmgRet.avg;
      }
      return ret;
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      cryo_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}下落伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }
  }
  ])
  
  export const mainAttr = 'hp'
  export const defDmgIdx = 2
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '心海被动：暴击率降低100%，治疗加成提高25%',
      isStatic: true,
      data: {
        cpct: -100,
        heal: 25
      }
    }, {
      title: '心海被动：开Q后重击伤害基于治疗加成提高[aPlus]',
      sort: 9,
      data: {
        aPlus: ({ attr, calc }) => calc(attr.hp) * calc(attr.heal) * 0.15 / 100,
        a2Plus: ({ attr, calc }) => calc(attr.hp) * calc(attr.heal) * 0.15 / 100
      }
    }, {
      title: '海人化羽：开Q后普攻伤害提高[aPlus]',
      sort: 9,
      data: {
        aPlus: ({ attr, talent, calc }) => calc(attr.hp) * talent.q['普通攻击伤害提升'] / 100
      }
    }, {
      title: '海人化羽：开Q后重击伤害提高[a2Plus]',
      sort: 9,
      data: {
        a2Plus: ({ attr, talent, calc }) => calc(attr.hp) * talent.q['重击伤害提升'] / 100
      }
    }, {
      title: '心海1命：开Q后第三段普攻额外释放一只游鱼，造成生命值上限30%的水元素伤害',
      cons: 1
    }, {
      title: '心海6命：开Q攻击获得治疗后，获得40%水伤加成',
      sort: 6,
      cons: 6,
      data: {
        dmg: 40
      }
    }
  ]
  