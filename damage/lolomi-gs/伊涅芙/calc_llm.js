import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '伊涅芙'

const team = ['哥伦比娅','希诺宁','妮露']
const artifact_normal = ['夜歌']

const team_B = ['哥伦比娅','希诺宁','爱诺']
const artifact_B = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk) * 1) })
  }, {
    title: '触发特效后精通',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.mastery) * 1) })
  }, {
    title: `「光流屏障」护盾吸收量`,
    dmg: ({ talent, calc, attr }, { shield }) => shield(talent.e['护盾吸收量2'][0] * calc(attr.atk) / 100 + talent.e['护盾吸收量2'][1])
  }, {
    title: `「参数重构」提供全队精通`,
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) * 6 / 100 })
  }, {
    title: '单人月感电伤害',
    dmg: ({}, { reaction }) => reaction('lunarCharged')
  }, {
    title: `「涤净模式·稳态载频」释放伤害`,
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: `「薇尔琪塔」放电伤害`,
    dmg: ({ talent }, dmg) => dmg(talent.e['薇尔琪塔放电伤害'], 'e')
  }, {
    title: `「薇尔琪塔」月感电伤害`,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 65 / 100, '', 'lunarCharged')
  }, {
    title: `「至高律令·全域扫灭」释放伤害`,
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    check: ({ cons }) => cons >= 2,
    params: { q: true },
    title: `2命额外月感电伤害`,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 300 / 100, '', 'lunarCharged')
  }, {
    check: ({ cons }) => cons >= 6,
    title: `6命额外月感电伤害`,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 135 / 100, '', 'lunarCharged')
  }, {
    title: `EQ切后台20秒总伤`,
    params: { q: true },
    // 薇尔琪塔存在20秒，2秒放电一次，每次额外触发月感电，一共10次，6命3.5秒触发一次，一共触发6次
    dmg: ({ talent, calc, attr, cons }, { basic, reaction }) => {
      const ebaseDamage = basic(calc(attr.atk) * talent.e['技能伤害'] / 100, 'e');
      const { dmg: lunaDmg, avg: lunaAvg } = reaction('lunarCharged');
      const qBase = calc(attr.atk) * talent.q['技能伤害'] / 100;
      const qExtra = basic((cons >= 2 ? (calc(attr.atk) * 300 / 100): 0) , '', 'lunarCharged');
      const c6Extra = basic((cons >= 6 ? (calc(attr.atk) * 135 / 100 * 6): 0) , '', 'lunarCharged');
      const qDamage = basic(qBase, 'q');
      return {
        dmg: ebaseDamage.dmg + lunaDmg * 10 + qExtra.dmg + c6Extra.dmg + qDamage.dmg,
        avg: ebaseDamage.avg + lunaAvg * 10 + qExtra.avg + c6Extra.avg + qDamage.avg
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「薇尔琪塔」月感电`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
    }),
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 65 / 100, '', 'lunarCharged')
  } ,{
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「薇尔琪塔」月感电`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 65 / 100, '', 'lunarCharged')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

export const defDmgIdx = 8
export const consDmgKey = 'EQ切后台20秒总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defParams = { Moonsign: 2 };  // 月兆满辉

export const buffs = [
  ...TeamBuff,
  {
    title: '「月兆祝赐·象拟中继」：基于伊涅芙的攻击力，提升月感电反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min((calc(attr.atk) / 100 * 0.7), 14)
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '天赋「全相重构协议」：施放元素爆发时，基于伊涅芙攻击力的6%，提升元素精通[mastery]',
    sort: 9,
    data: {
      mastery: ({ attr, calc }) => calc(attr.atk) * 6 / 100
    }
  }, {
    title: '1命「循环整流引擎」：展开光流屏障护盾时，基于伊涅芙的攻击力，提升月感电伤害[lunarCharged]%',
    sort: 9,
    cons: 1,
    data: {
      lunarCharged: ({ attr, calc }) => Math.min((calc(attr.atk) / 100 * 2.5), 50)
    }
  }
]

    