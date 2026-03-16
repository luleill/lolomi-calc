import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '菲林斯'

const team = ['伊涅芙','哥伦比娅','妮露']
const artifact_normal = ['夜歌']

const team_B = ['伊涅芙','哥伦比娅','希诺宁']
const artifact_B = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk) * 1) })
  }, {
    title: '单人月感电伤害',
    dmg: ({}, { reaction }) => reaction('lunarCharged')
  }, {
    title: '「北国枪阵」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['北国枪阵伤害'], 'e')
  }, {
    title: ({ cons }) => `「幽焰显迹模式」普攻五段${cons >= 2 ? '+2命' : ''}总伤`,
    dmg: ({ talent, calc, attr, cons }, { basic }) => {
      const acounts = '一二三四五'.split('');
      const aDamage = acounts.reduce((sum, num) => sum + calc(attr.atk) * talent.e[`${num}段伤害`] / 100, 0);
      const c2Damage = cons >= 2 ? calc(attr.atk) * 50 / 100 : 0;
      const totala = basic(aDamage, 'e');
      const totalc2 = basic(c2Damage, '', 'lunarCharged');
      return {
        dmg: totala.dmg + totalc2.dmg,
        avg: totala.avg + totalc2.avg
      };
    }
  }, {
    title: '「旧仪·夜客致访」满辉释放总伤',
    // 释放雷伤 + 触发月感电 + 中间段月感电*4 + 尾端月感电
    dmg: ({ talent, calc, attr }, { basic, reaction }) => {
      const qbaseDamage = basic(calc(attr.atk) * talent.q['技能初始伤害'] / 100, 'q');
      const reactionDamage = reaction('lunarCharged')
      const q1Damage = calc(attr.atk) * talent.q['中间段月感电伤害'] / 100 * 4;
      const q2Damage = calc(attr.atk) * talent.q['最终段月感电伤害'] / 100;
      const lunatotal = basic(q1Damage + q2Damage, '', 'lunarCharged');
      return {
        dmg: qbaseDamage.dmg + lunatotal.dmg + reactionDamage.dmg,
        avg: qbaseDamage.avg + lunatotal.avg + reactionDamage.avg,
      };
    }
  }, {
    title: '「雷霆交响」月感电总伤',
    dmg: ({ talent, calc, attr }, { basic }) => {
      const q1Damage = calc(attr.atk) * talent.q['雷霆交响伤害'] / 100;
      const q2Damage = calc(attr.atk) * talent.q['雷霆交响额外伤害'] / 100;
      const lunatotal = basic(q1Damage + q2Damage, '', 'lunarCharged');
      return {
        dmg: lunatotal.dmg,
        avg: lunatotal.avg
      };
    }
  }, {
    check: ({ cons }) => cons >= 2,
    title: '2 命额外月感电伤害',
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 50 / 100, '', 'lunarCharged')
  }, {
    title: '单人10秒站场总伤',
    // 默认单人伤害，满辉，有挂水，触发4次普通月感电
    // 0命 eeq+5a+eq+5a    
    // 1命以上 eeq+5a+eq+5a+eq
    dmg: ({ talent, calc, attr, cons }, { basic, reaction }) => {
      const ebaseDamage = basic(calc(attr.atk) * talent.e['北国枪阵伤害'] / 100 * (cons >= 1 ? 3 : 2), 'e');
      const { dmg: lunaDmg, avg: lunaAvg } = reaction('lunarCharged');
      const abaseDamage = '一二三四五'.split('').reduce((sum, num) => 
        sum + calc(attr.atk) * talent.e[`${num}段伤害`] / 100 * 2, 0);
      const qBase = calc(attr.atk) * talent.q['雷霆交响伤害'] / 100 * (cons >= 1 ? 3 : 2);
      const qExtra = calc(attr.atk) * talent.q['雷霆交响额外伤害'] / 100 * (cons >= 1 ? 3 : 2);
      return {
        dmg: ebaseDamage.dmg + lunaDmg * 4 + basic(abaseDamage, 'e').dmg + 
             basic(qBase + qExtra, '', 'lunarCharged').dmg + 
             basic((cons >= 2 ? calc(attr.atk) * 50 / 100 : 0), '', 'lunarCharged').dmg,
        avg: ebaseDamage.avg + lunaAvg * 4 + basic(abaseDamage, 'e').avg + 
             basic(qBase + qExtra, '', 'lunarCharged').avg + 
             basic((cons >= 2 ? calc(attr.atk) * 50 / 100 : 0), '', 'lunarCharged').avg
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「雷霆交响」月感电`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
    }),
    dmg: ({ talent, calc, attr }, { basic }) => {
      const q1Damage = calc(attr.atk) * talent.q['雷霆交响伤害'] / 100;
      const q2Damage = calc(attr.atk) * talent.q['雷霆交响额外伤害'] / 100;
      const lunatotal = basic(q1Damage + q2Damage, '', 'lunarCharged');
      return {
        dmg: lunatotal.dmg,
        avg: lunatotal.avg
      };
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「雷霆交响」月感电`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ talent, calc, attr }, { basic }) => {
      const q1Damage = calc(attr.atk) * talent.q['雷霆交响伤害'] / 100;
      const q2Damage = calc(attr.atk) * talent.q['雷霆交响额外伤害'] / 100;
      const lunatotal = basic(q1Damage + q2Damage, '', 'lunarCharged');
      return {
        dmg: lunatotal.dmg,
        avg: lunatotal.avg
      };
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 5
export const consDmgKey = '10秒站场总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defParams = { Moonsign: 2 };  // 满辉

export const buffs = [
  ...TeamBuff,
  {
    title: '「月兆祝赐·旧世潜藏」：月感电反应基础伤害提升[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min((calc(attr.atk) / 100 * 0.7), 14)
    }
  }, {
    title: '天赋「寒冬的交响」：满辉月感电伤害提升20%',
    data: {
      lunarCharged: 20
    }
  }, {
    title: '天赋「幽焰的呢喃」：基于菲林斯攻击力的8%，提升元素精通[mastery]',
    sort: 9,
    data: {
      mastery: ({ attr, calc, cons }) => Math.min((calc(attr.atk) / 100 * (cons >= 4 ? 10 : 8)), (cons >= 4 ? 220 : 160))
    }
  }, {
    title: '2命「渡越魍魉之墙」：满辉时，菲林斯雷元素攻击命中敌人后，该敌人的雷元素抗性降低25%',
    cons: 2,
    data: {
      kx: 25
    }
  }, {
    title: '4命「荒山嘶啭之夜」：菲林斯攻击力提升20%',
    cons: 4,
    data: {
      atkPct: 20
    }
  }, {
    title: '6命「歌与亡者之舞」：月感电反应伤害擢升45%',
    cons: 6,
    data: {
      elevated: 45
    }
  }
]
