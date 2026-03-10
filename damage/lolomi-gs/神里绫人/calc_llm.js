import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '神里绫人'

const team = ['云堇','茜特菈莉', '希诺宁']
const artifact_normal = ['宗室', '烬城']

const team_B = ['茜特菈莉','爱可菲', '芙宁娜']
const artifact_B = ['千岩', '烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_B, artifact_B, config,{q: true, hydro_two: true, waveflash: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({
      avg: Math.min(calc(attr.hp) * 1)
    })
  }, {
    title: '「神里流·镜花」水影破裂伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['水影伤害'], 'e')
  }, {
    title: '「神里流·镜花」瞬水剑三段总伤',
    params: { waveflash: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = '一二三'.split('').reduce((acc, num) => {
        const result = basic(calc(attr.atk) * talent.e[`${num}段瞬水剑伤害`] / 100, 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      if (cons >= 6) {
        const extraDamage = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        ebaseDamage.dmg += extraDamage.dmg;
        ebaseDamage.avg += extraDamage.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: '「神里流·水囿」单段伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['水花剑伤害'], 'q')
  }, {
    title: ({ cons }) => `开Q开E单人站场${cons >= 4 ? 17 : 15}刀总伤`,
    params: { q: true, waveflash: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = '一二三'.split('').reduce((acc, num) => {
        const result = basic(calc(attr.atk) * talent.e[`${num}段瞬水剑伤害`] / 100, 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      let totalDamage = {
        dmg: ebaseDamage.dmg * 5,
        avg: ebaseDamage.avg * 5
      };
      if (cons >= 4) {
        const extrac4_1 = basic(calc(attr.atk) * talent.e['一段瞬水剑伤害'] / 100, 'a');
        const extrac4_2 = basic(calc(attr.atk) * talent.e['二段瞬水剑伤害'] / 100, 'a');
        totalDamage.dmg += extrac4_1.dmg + extrac4_2.dmg;
        totalDamage.avg += extrac4_1.avg + extrac4_2.avg;
      }
      if (cons >= 6) {
        const extrac6 = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        totalDamage.dmg += extrac6.dmg;
        totalDamage.avg += extrac6.avg;
      }
      const qDamage = basic(calc(attr.atk) * talent.q['水花剑伤害'] / 100, 'q');
      totalDamage.dmg += qDamage.dmg * 12;
      totalDamage.avg += qDamage.avg * 12;
   
      return totalDamage;
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}瞬水剑三段${cons >= 6 ? '+6命协同' : ''}总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true, hydro_two: true, waveflash: true
    }),
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = '一二三'.split('').reduce((acc, num) => {
        const result = basic(calc(attr.atk) * talent.e[`${num}段瞬水剑伤害`] / 100, 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      if (cons >= 6) {
        const extraDamage = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        ebaseDamage.dmg += extraDamage.dmg;
        ebaseDamage.avg += extraDamage.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}瞬水剑三段${cons >= 6 ? '+6命协同' : ''}总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      q: true, hydro_two: true, waveflash: true
    }),
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = '一二三'.split('').reduce((acc, num) => {
        const result = basic(calc(attr.atk) * talent.e[`${num}段瞬水剑伤害`] / 100, 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      if (cons >= 6) {
        const extraDamage = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        ebaseDamage.dmg += extraDamage.dmg;
        ebaseDamage.avg += extraDamage.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}瞬水剑单段伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      q: true, hydro_two: true, waveflash: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['一段瞬水剑伤害'], 'a')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({
      avg: artis,
      type: 'text'
    })
  }
])

export const mainAttr = 'hp,atk,cpct,cdmg,mastery'
export const defDmgIdx = 2

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.waveflash === true,
    title: '「神里流·镜花」：每层浪闪提升瞬水剑伤害[aPlus]',
    sort: 9,
    data: {
      aPlus: ({ attr, calc, talent, cons }) => calc(attr.hp) * talent.e['浪闪伤害值提高'] / 100 * (cons >= 2 ? 5 : 4)
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '「神里流·水囿」：持续期间提升普攻伤害[aDmg]',
    data: {
      aDmg: ({ talent }) => talent.q['普通攻击伤害提升']
    }
  }, {
    title: '1命「镜华风姿」：对半血敌人瞬水剑造成的伤害提升40%',
    // 默认只吃20增伤
    cons: 1,
    data: {
      aDmg: 20
    }
  }, {
    title: '2命「世有源泉」：3层浪闪以上时提高50%生命值',
    cons: 2,
    data: {
      hpPct: 50
    }
  }, {
    title: '6命「滥觞无底」：瞬水剑造成额外2次攻击，各自造成绫人攻击力450%的伤害',
    cons: 6,
    data: {
    }
  }
]
