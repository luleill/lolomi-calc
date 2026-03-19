import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '丝柯克'

const team = ['申鹤', '爱可菲', '芙宁娜']
const artifact_normal = ['宗室', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发满特效后攻击力',
    params: { jin : true },
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    params: { jin : true },
    title: `「七相一闪」普攻五段总伤`,
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const acounts = '一二三四五'.split('');
      const aDamage = acounts.reduce((sum, num) => sum + calc(attr.atk) * talent.e[`${num}段伤害`] / 100, 0);
      const totala = dmg.basic(aDamage, 'a');
      const c6Extra = cons >= 6 ? dmg.basic(calc(attr.atk) * 180 * 3 * 3 / 100, 'q') : { dmg: 0, avg: 0 };
      const c1Extra = cons >= 1 ? dmg.basic(calc(attr.atk) * 500 * 3 / 100, 'a2') : { dmg: 0, avg: 0 };
      return {
        dmg: totala.dmg + c6Extra.dmg + c1Extra.dmg,
        avg: totala.avg + c6Extra.avg + c1Extra.avg
      };
    }
  }, {
    params: { jin : true },
    title: `「七相一闪」重击伤害`,
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.atk) * talent.e[`重击伤害`] / 100, 'a2')
  }, {
    params: { mie : true },
    title: `「极恶技·灭」总伤`,
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const q1 = dmg(talent.q[`斩击伤害2`][0], 'q');
      const q2 = dmg(talent.q[`斩击最终段伤害`], 'q');
      const c6Extra = cons >= 6 ? dmg.basic(calc(attr.atk) * 750 * 3 / 100, 'q') : { dmg: 0, avg: 0 };
      const c1Extra = cons >= 1 ? dmg.basic(calc(attr.atk) * 500 * 3 / 100, 'a2') : { dmg: 0, avg: 0 };
      return {
        dmg: q1.dmg * 5 + q2.dmg + c6Extra.dmg + c1Extra.dmg,
        avg: q1.avg * 5 + q2.avg + c6Extra.avg + c1Extra.avg
      };
    }
  }, {
    params: { jin : true },
    title: `「极恶技·尽」10秒站场总伤`,
    // eq 3轮普攻+重击收尾
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const acounts = '一二三四五'.split('');
      const aDamage = acounts.reduce((sum, num) => sum + calc(attr.atk) * talent.e[`${num}段伤害`] / 100, 0);
      const totala = dmg.basic(aDamage, 'a');
      const a2Damage = dmg.basic(calc(attr.atk) * talent.e[`重击伤害`] / 100,'a2');
      const c6Extra = cons >= 6 ? dmg.basic(calc(attr.atk) * 180 * 3 * 3 / 100, 'q') : { dmg: 0, avg: 0 };
      const c1Extra = cons >= 1 ? dmg.basic(calc(attr.atk) * 500 * 5 / 100, 'a2') : { dmg: 0, avg: 0 };
      return {
        dmg: totala.dmg * 3 + a2Damage.dmg + c6Extra.dmg + c1Extra.dmg,
        avg: totala.avg * 3 + a2Damage.avg + c6Extra.avg + c1Extra.avg
      };
    }
  }, {
    title: '1命晶刃额外伤害',
    cons: 1,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 500 / 100, 'a2')
  }, {
    params: { jin : true },
    title: '6命「七相一闪」额外协同伤害',
    cons: 6,
    dmg: ({ calc, attr }, dmg) => dmg.basic(calc(attr.atk) * 180 * 3 / 100, 'a')
  }, {
    params: { mie : true },
    title: '6命「极恶技·灭」额外协同伤害',
    cons: 6,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 750 * 3 / 100, 'q')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「极恶技·灭」总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      mie: true
    }),
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const q1 = dmg(talent.q[`斩击伤害2`][0], 'q');
      const q2 = dmg(talent.q[`斩击最终段伤害`], 'q');
      const c6Extra = cons >= 6 ? dmg.basic(calc(attr.atk) * 750 * 3 / 100, 'q') : { dmg: 0, avg: 0 };
      const c1Extra = cons >= 1 ? dmg.basic(calc(attr.atk) * 500 * 3 / 100, 'a2') : { dmg: 0, avg: 0 };
      return {
        dmg: q1.dmg * 5 + q2.dmg + c6Extra.dmg + c1Extra.dmg,
        avg: q1.avg * 5 + q2.avg + c6Extra.avg + c1Extra.avg
      };
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

export const defDmgIdx = 6
export const consDmgKey = '「极恶技·灭」总伤'
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「万流归寂」：三层死河渡断使七相一闪模式下的普通攻击造成原本170%的伤害，极恶技·灭造成原本160%的伤害',
    data: {
      aMulti: 70,
      qMulti: 60
    }
  }, {
    check: ({ params }) => params.mie === true,
    title: '「极恶技·灭」：每点蛇之狡谋提升本次元素爆发造成的伤害 [qPlus]',
    data: {
      qPct: ({ talent, cons }) => {
        return talent.q['蛇之狡谋加成'] * (cons > 1 ? 22 : 12)
      }
    }
  }, {
    check: ({ params }) => params.jin === true,
    title: '「极恶技·尽」：汲取3枚虚境裂隙时，使本次普通攻击造成的伤害提高[aDmg]%',
    data: {
      aDmg: ({ talent }) => talent.q['汲取0/1/2/3枚虚境裂隙伤害提升'][3]
    }
  }, {
    title: '1命「湮远」：每汲取一枚虚境裂隙，就造成500%攻击力视为重击的冰元素伤害',
    cons: 1
  }, {
    check: ({ params }) => params.jin === true,
    title: '2命「坠渊」：释放「极恶技·尽」后攻击力提升70%',
    cons: 2,
    data: {
      atkPct: 70
    }
  }, {
    title: '4命「流断」：三层死河渡时攻击力提升[atkPct]%',
    cons: 4,
    data: {
      atkPct: 40
    }
  }, {
    title: '6命「至源」：「极恶技·灭」造成至多3次750%攻击力视为元素爆发的冰元素伤害,「极恶技·尽」第三段攻击或第五段攻击命中敌人时，造成3次180%攻击力视为普通攻击的冰元素伤害',
    cons: 6
  }
]

    