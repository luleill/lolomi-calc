import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '神里绫人'

const team = ['茜特菈莉', '爱可菲', '芙宁娜']
const artifact_normal = ['千岩', '烬城']

const team_B = ['云堇', '茜特菈莉', '希诺宁']
const artifact_B = ['宗室', '烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{q: true, hydro_two: true, cryo_two: true, waveflash: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
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
        // 6命协同两刀不吃浪闪buff，补偿aPlus
        const extrac6 = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        const bonusOnly = basic(calc(attr.hp) * talent.e['浪闪伤害值提高'] / 100 * 5 * 2, 'a');
        ebaseDamage.dmg += extrac6.dmg - bonusOnly.dmg;
        ebaseDamage.avg += extrac6.avg - bonusOnly.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: '「神里流·水囿」单段伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['水花剑伤害'], 'q')
  }, {
    title: 'QE单人站场10秒总伤',
    params: { q: true, waveflash: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      // 默认只砍5轮15刀，实际应该16刀
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
        // 4命放q加攻速，多砍两刀
        const extrac4_1 = basic(calc(attr.atk) * talent.e['一段瞬水剑伤害'] / 100, 'a');
        const extrac4_2 = basic(calc(attr.atk) * talent.e['二段瞬水剑伤害'] / 100, 'a');
        totalDamage.dmg += extrac4_1.dmg + extrac4_2.dmg;
        totalDamage.avg += extrac4_1.avg + extrac4_2.avg;
      }
      if (cons >= 6) {
        const extrac6 = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        const bonusOnly = basic(calc(attr.hp) * talent.e['浪闪伤害值提高'] / 100 * 5 * 2, 'a');
        totalDamage.dmg += extrac6.dmg - bonusOnly.dmg;
        totalDamage.avg += extrac6.avg - bonusOnly.avg;
      }
      // 元素爆发完全随机，默认命中10次
      const qDamage = basic(calc(attr.atk) * talent.q['水花剑伤害'] / 100, 'q');
      totalDamage.dmg += qDamage.dmg * 10;
      totalDamage.avg += qDamage.avg * 10;
      return totalDamage;
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 瞬水剑三段总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      q: true, waveflash: true, geo_two: true, Xilonen_hydro: true
    }),
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = '一二三'.split('').reduce((acc, num) => {
        const result = basic(calc(attr.atk) * talent.e[`${num}段瞬水剑伤害`] / 100, 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      if (cons >= 6) {
        const extrac6 = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        const bonusOnly = basic(calc(attr.hp) * talent.e['浪闪伤害值提高'] / 100 * 5 * 2, 'a');
        ebaseDamage.dmg += extrac6.dmg - bonusOnly.dmg;
        ebaseDamage.avg += extrac6.avg - bonusOnly.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 瞬水剑三段总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      q: true, waveflash: true, hydro_two: true, cryo_two: true
    }),
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = '一二三'.split('').reduce((acc, num) => {
        const result = basic(calc(attr.atk) * talent.e[`${num}段瞬水剑伤害`] / 100, 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
      if (cons >= 6) {
        const extrac6 = basic(calc(attr.atk) * 450 * 2 / 100, 'a');
        const bonusOnly = basic(calc(attr.hp) * talent.e['浪闪伤害值提高'] / 100 * 5 * 2, 'a');
        ebaseDamage.dmg += extrac6.dmg - bonusOnly.dmg;
        ebaseDamage.avg += extrac6.avg - bonusOnly.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 瞬水剑单段伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      q: true, waveflash: true, hydro_two: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['一段瞬水剑伤害'], 'a')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'hp,atk,cpct,cdmg'
export const defDmgIdx = 3
export const consDmgKey = 'QE单人站场10秒总伤'

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
    title: '2命「世有源泉」：3层浪闪以上时提高50%生命值，浪闪上限提升至5层',
    cons: 2,
    data: {
      hpPct: 50
    }
  }, {
    title: '4命「不厌细流」：施放神里流·水囿后普攻攻速提升15%',
    cons: 4,
  }, {
    title: '6命「滥觞无底」：瞬水剑造成额外2次攻击，各自造成绫人攻击力450%的伤害',
    cons: 6,
  }
]
