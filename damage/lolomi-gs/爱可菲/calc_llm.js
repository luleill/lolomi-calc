import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '爱可菲'
// 传统丝柯克队计算爱可菲后台伤害
const team = ['申鹤','丝柯克','芙宁娜']
const artifact_normal = ['宗室', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: `2 命提供增伤基础值`,
    cons: 2,
    dmg: ({ calc, attr }) => ({ avg: calc(attr.atk) * 240 / 100 })
  }, {
    title: `「花刀技法」释放治疗量`,
    dmg: ({ talent, attr, calc }, { heal }) => heal(talent.q['治疗量2'][0] / 100 * calc(attr. atk) + talent.q['治疗量2'][1])
  }, {
    title: `「康复食疗」单次持续治疗量`,
    dmg: ({ attr, calc }, { heal }) => heal(calc(attr.atk) * 138.24 / 100)
  }, {
    title: `「花刀技法」一轮单人总治疗`,
    // 「康复食疗」一秒治疗一次，基础持续9秒，4命加6秒，根据爱可菲暴击率提升100%治疗量，暴击治疗最多触发7次
    dmg: ({ talent, calc, attr, cons }, { heal }) => {
      const healCounts = cons >= 4 ? 15 : 9;
      const qbaseHeal = heal(talent.q['治疗量2'][0] / 100 * calc(attr.atk) + talent.q['治疗量2'][1]).avg;
      const nextHeal = heal(calc(attr.atk) * 138.24 / 100).avg;
      const healCpct = cons >= 4 ? (1 + Math.min(attr.cpct / 100, 0.7)) : 1;
      return {
        avg: qbaseHeal + nextHeal * healCounts * healCpct
      };
    }
  }, {
    title: `「冻霜芭菲」伤害`,
    dmg: ({ talent }, dmg) => dmg(talent.e['冻霜芭菲伤害'], 'e')
  }, {
    check: ({ cons }) => cons >= 6,
    title: `6 命额外伤害`,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 500 / 100, 'e')
  }, {
    title: `EQ切后台20秒总伤`,
    // 厨艺机关存在20秒，1秒攻击一次，加初次释放一共21次，考虑下buff覆盖率，还是只算20次伤害，持续期间加上六命6次协同
    dmg: ({ talent, calc, attr, cons }, { basic }) => {
      const ebaseDamage = basic(calc(attr.atk) * talent.e['技能伤害'] / 100, 'e');
      const qbaseDamage = basic(calc(attr.atk) * talent.q['技能伤害'] / 100, 'q');
      const parfait = basic(calc(attr.atk) * talent.e['冻霜芭菲伤害'] * 20 / 100, 'e');
      const c6Extra = basic((cons >= 6 ? (calc(attr.atk) * 500 * 6 / 100): 0), 'e');
      return {
        dmg: ebaseDamage.dmg + qbaseDamage.dmg + parfait.dmg + c6Extra.dmg,
        avg: ebaseDamage.avg + qbaseDamage.avg + parfait.avg + c6Extra.avg
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「冻霜芭菲」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['冻霜芭菲伤害'], 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

export const defDmgIdx = 5
export const consDmgKey = 'EQ切后台20秒总伤'
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「灵感浸入调味」：E或Q命中后，敌人水抗、冰抗降低55%',
    data: {
      kx: 55
    }
  }, {
    title: '1命「味蕾绽放的餐前旋舞」：冰元素爆伤提升60%',
    cons: 1,
    data: {
      cdmg: 60
    }
  }, {
    title: '4命「迷迭生香的配比秘方」：康复食疗触发治疗时，有几率使治疗量提升100%，几率相当于爱可菲自己的暴击率',
    cons: 4,
    data: {
    }
  }, {
    title: '6命「虹彩缤纷的甜点茶话」：额外发射一枚特级冻霜芭菲，造成500%攻击力的冰元素伤害',
    cons: 6,
    data: {
    }
  }
]

    