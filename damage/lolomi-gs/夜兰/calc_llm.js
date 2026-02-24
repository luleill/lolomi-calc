import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '夜兰'

const team = ['茜特菈莉','希诺宁', '芙宁娜']
const artifact_normal = ['烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{Xilonen_hydro: true})

export const details = applyStandardTeam([
  {
    title: '单人触发特效后生命值',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.hp) * 1)
      }
    }
  }, {
    title: '「破局矢」伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.a['破局矢伤害'] / 100, 'a2')
  }, {
    title: '「络命丝」伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  }, {
    title: '「络命丝」蒸发伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e', 'vaporize')
  }, {
    title: `「渊图玲珑骰」协同伤害`,
    params: { q: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const baseDamage = calc(attr.hp) * (talent.q['玄掷玲珑伤害'] / 100);
      // 二命额外伤害
      const extraDamage = cons >= 2 ? calc(attr.hp) * 0.14 : 0;
      return basic(baseDamage + extraDamage, 'q');
    }
  }, {
    title: `「渊图玲珑骰」5次普攻+3次协同总伤`,
    params: { q: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      let normalAttackDamage = 0;
      if (cons >= 6) {
        normalAttackDamage = calc(attr.hp) * talent.a['破局矢伤害'] / 100 * 1.56 * 5;
      } else {
        const baseHitDamage = '一二三四'.split('').reduce((sum, num) => 
          sum + calc(attr.atk) * talent.a[`${num}段伤害`] / 100, 0);
        const extraFirstHit = calc(attr.atk) * talent.a['一段伤害'] / 100;
        normalAttackDamage = baseHitDamage * 5 + extraFirstHit;
      }
      
      const baseSynergy = calc(attr.hp) * (talent.q['玄掷玲珑伤害'] / 100);
      const extraSynergy = cons >= 2 ? calc(attr.hp) * 0.14 : 0;
      const totalSynergy = (baseSynergy + extraSynergy) * 3;
      
      const normalResult = basic(normalAttackDamage, cons >= 6 ? 'a2' : 'a');
      const synergyResult = basic(totalSynergy, 'q');
      
      return {
        dmg: normalResult.dmg + synergyResult.dmg,
        avg: normalResult.avg + synergyResult.avg
      };
    }
  }, {
  // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「络命丝」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_hydro: true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}Q后5普攻+协同总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_hydro: true
    }),
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      let normalAttackDamage = 0;
      if (cons >= 6) {
        normalAttackDamage = calc(attr.hp) * talent.a['破局矢伤害'] / 100 * 1.56 * 5;
      } else {
        const baseHitDamage = '一二三四'.split('').reduce((sum, num) => 
          sum + calc(attr.atk) * talent.a[`${num}段伤害`] / 100, 0);
        const extraFirstHit = calc(attr.atk) * talent.a['一段伤害'] / 100;
        normalAttackDamage = baseHitDamage * 5 + extraFirstHit;
      }
      
      const baseSynergy = calc(attr.hp) * (talent.q['玄掷玲珑伤害'] / 100);
      const extraSynergy = cons >= 2 ? calc(attr.hp) * 0.14 : 0;
      const totalSynergy = (baseSynergy + extraSynergy) * 3;
      
      const normalResult = basic(normalAttackDamage, cons >= 6 ? 'a2' : 'a');
      const synergyResult = basic(totalSynergy, 'q');
      
      return {
        dmg: normalResult.dmg + synergyResult.dmg,
        avg: normalResult.avg + synergyResult.avg
      };
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
  
export const defDmgIdx = 4
export const mainAttr = 'hp,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    title: '夜兰被动：3种元素类型角色，夜兰生命值上限提高18%',
    // 4元素提高30%，常规队伍默认只有3种元素类型
    data: {
      hpPct: 18
    }
  }, {
    title: '夜兰被动：Q持续期间增伤25%',
    // 最高增伤50，默认只吃25%
    data: {
      dmg: ({ params }) => params.q ? 25 : 0
    }
  }, {
    title: '夜兰2命：「玄掷玲珑」协同额外水箭，造成相当于夜兰生命值上限14%的水元素伤害。',
  }, {
    title: '夜兰4命：络命丝命中提高生命值40%',
    // 默认吃满4层
    cons: 4,
    data: {
      hpPct: 40
    }
  }
]