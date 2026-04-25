import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '夜兰'

const team = ['茜特菈莉', '希诺宁', '芙宁娜']
const artifact_normal = ['烬城']

const team_B = ['茜特菈莉', '爱可菲', '芙宁娜']
const artifact_B = ['烬城']

const team_C = ['茜特菈莉', '希诺宁', '莫娜']
const artifact_C = ['烬城', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{Xilonen_hydro: true, hydro_two: true, elementCount: 3})

export const details = applyStandardTeam([
  {
    title: '触发满特效后生命值',
    params: { elementCount: 4, layer: 4 },
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
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
    title: `「渊图玲珑骰」释放伤害`,
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: `「渊图玲珑骰」协同伤害`,
    params: { q: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const baseDamage = calc(attr.hp) * (talent.q['玄掷玲珑伤害'] / 100);
      // 二命额外伤害
      const extra_c2 = cons >= 2 ? calc(attr.hp) * 0.14 : 0;
      return basic(baseDamage + extra_c2, 'q');
    }
  }, {
    title: `满命EQE4A爆发总伤`,
    check: ({ cons }) => cons >= 6,
    // 默认触发5次q协同，2次2命协同
    params: { q: true, layer: 2 },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const QDamage = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
      const EDamage = basic(calc(attr.hp) * talent.e['技能伤害'] * 2 / 100, 'e')
      const extra_c2 = basic(calc(attr.hp) * 0.14 * 2, 'q');
      const c6Damage = basic(calc(attr.hp) * talent.a['破局矢伤害'] / 100 * 1.56 * 5, 'a2');
      const Qsynergy = basic(calc(attr.hp) * (talent.q['玄掷玲珑伤害'] * 5 / 100), 'q');
      return {
        dmg: c6Damage.dmg + Qsynergy.dmg + EDamage.dmg + QDamage.dmg + extra_c2.dmg,
        avg: c6Damage.avg + Qsynergy.avg + EDamage.avg + QDamage.avg + extra_c2.avg,
      };
    }
  }, {
    title: `单人站场一轮总伤`,
    // eq起手，q持续15秒，默认持续期间打5轮4A普攻，q每一秒协同一次，因为放e有损耗时间，默认14次协同
    // e冷却10秒，0命基础可以e两次，判断1命和祭礼弓精炼效果，添加对应次数
    // 判断6命效果，第一轮普攻走六命特殊伤害机制，剩下4轮普攻常态伤害
    // 判断2命效果，额外触发协同，1.8秒触发间隔，默认触发8次
    params: { q: true, layer: 3 },
    dmg: ({ talent, attr, calc, cons, artis, weapon, refine }, { basic }) => {
      // E总伤
      const eBaseCount = cons >= 1 ? 3 : 2;
      // 祭礼弓期望
      const lilacBowP = weapon?.name === '祭礼弓' ? ([0.4, 0.5, 0.6, 0.7, 0.8][refine] ?? 0.4) : 0;
      const eWeaponCount = lilacBowP > 0 ? 1 - Math.pow(1 - lilacBowP, eBaseCount) : 0;
      const eCount = eBaseCount + eWeaponCount;
      const eDamage = basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e');
      const E_Damage = {
        dmg: eDamage.dmg * eCount,
        avg: eDamage.avg * eCount
      };
      // Q释放伤害+协同
      const qbase = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q');
      const qSynergy = basic(calc(attr.hp) * (talent.q['玄掷玲珑伤害'] / 100), 'q');
      const Q_total = {
        dmg: qSynergy.dmg * 14 + qbase.dmg,
        avg: qSynergy.avg * 14 + qbase.avg
      };
      // 2命额外协同，1.8秒触发间隔，15秒默认触发8次
      const extra_c2 = basic(calc(attr.hp) * 0.14, 'q');
      const Extra_c2 = {
        dmg: extra_c2.dmg * (cons >= 2 ? 8 : 0),
        avg: extra_c2.avg * (cons >= 2 ? 8 : 0)
      };
      // 4A普攻伤害，6命第一轮E+4A触发完5次特殊破局矢，剩下4轮常态4A
      let normalAtk = { dmg: 0, avg: 0 };
      if (cons >= 6) {
        // 特殊破局矢
        const first_c6 = calc(attr.hp) * talent.a['破局矢伤害'] / 100 * 1.56 * 5;
        const firstDamage_c6 = basic(first_c6, 'a2');
        // 基础普攻
        const baseHitDamage = '一二三四'.split('').reduce((sum, num) => 
          sum + calc(attr.atk) * talent.a[`${num}段伤害`] / 100, 0);
        const normalDamage = basic(baseHitDamage, 'a');
        normalAtk = {
          dmg: firstDamage_c6.dmg + normalDamage.dmg * 4,
          avg: firstDamage_c6.avg + normalDamage.avg * 4
        };
      } else {
        // 非6命默认5轮4A
        const baseHitDamage = '一二三四'.split('').reduce((sum, num) => 
          sum + calc(attr.atk) * talent.a[`${num}段伤害`] / 100, 0);
        const normalDamage = basic(baseHitDamage, 'a');
        normalAtk = {
          dmg: normalDamage.dmg * 5,
          avg: normalDamage.avg * 5
        };
      }
      return {
        dmg: E_Damage.dmg + Q_total.dmg + Extra_c2.dmg + normalAtk.dmg,
        avg: E_Damage.avg + Q_total.avg + Extra_c2.avg + normalAtk.avg
      };
    }
  }, {
    // 满命夜兰 夜茜希芙
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}EQE4A爆发总伤`,
    check: ({ cons }) => cons >= 6,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_hydro: true, hydro_two: true, elementCount: 3, layer: 2
    }),
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const QDamage = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
      const EDamage = basic(calc(attr.hp) * talent.e['技能伤害'] * 2 / 100, 'e')
      const extra_c2 = basic(calc(attr.hp) * 0.14 * 2, 'q');
      const c6Damage = basic(calc(attr.hp) * talent.a['破局矢伤害'] / 100 * 1.56 * 5, 'a2');
      const Qsynergy = basic(calc(attr.hp) * (talent.q['玄掷玲珑伤害2'][0] * 3 * 5 / 100), 'q');
      return {
        dmg: c6Damage.dmg + Qsynergy.dmg + EDamage.dmg + QDamage.dmg + extra_c2.dmg,
        avg: c6Damage.avg + Qsynergy.avg + EDamage.avg + QDamage.avg + extra_c2.avg,
      };
    }
  }, {
    // 夜茜爱芙
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「络命丝」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      hydro_two: true, cryo_two: true, elementCount: 2
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  }, {
    // 夜茜希莫
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}「络命丝」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      Xilonen_hydro: true, hydro_two: true, elementCount: 3
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  }, {
    // 夜茜希芙
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「络命丝」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_hydro: true, hydro_two: true, elementCount: 3
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])
  
export const defDmgIdx = 3
export const mainAttr = 'hp,cpct,cdmg,mastery'
export const consDmgKey = '单人站场一轮总伤'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「猜先有方」：根据队伍角色元素数量提升生命值[hpPct]%',
    data: {
      hpPct: ({ params }) => {
        const num = { 1: 6, 2: 12, 3: 18, 4: 30 };
        return num[params.elementCount] ?? 6;
      }
    }
  }, {
    check: ({ params }) => params.q,
    title: '天赋「妙转随心」：「玄掷玲珑」存在期间平均增伤25%',
    // 最高增伤50，默认只吃25%
    data: {
      dmg: 25
    }
  }, {
    title: '1命「与谋者，以局入局」：萦络纵命索的可使用次数增加1次',
    cons: 1,
  }, {
    title: '2命「入彀者，多多益善」：「玄掷玲珑」协同额外水箭，造成相当于生命值上限14%的水元素伤害',
    cons: 2,
  }, {
    title: '4命「诓惑者，接树移花」：络命丝命中提高生命值[hpPct]%',
    cons: 4,
    data: {
      hpPct: ({ params }) => {
        const layer = Math.min(params.layer ?? 1, 4);
        return layer * 10;
      }
    }
  }, {
    title: '6命「取胜者，大小通吃」：「运筹帷幄」普攻转为特殊「破局矢」,造成破局矢156%视为重击的伤害',
    cons: 6,
  }
]