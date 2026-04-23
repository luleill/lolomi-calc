import { TeamBuff } from '../teambuffs.js'
import { teamDefined , withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '哥伦比娅'

const team = ['莉奈娅', '妮露', '希诺宁']
const artifact_normal = ['夜歌']

const artifact_A = ['夜歌', '草套']
const definedconfig_A = {
  best: ['菈乌玛', '妮露', '纳西妲'],
  mid: ['菈乌玛', '妮露', '纳西妲'],
  low: ['菈乌玛', '爱诺', '纳西妲']
}
const artifact_B = ['夜歌', '风套']
const definedconfig_B = {
  best: ['伊涅芙', '妮露', '枫原万叶'],
  mid: ['伊涅芙', '妮露', '枫原万叶'],
  low: ['伊涅芙', '爱诺', '枫原万叶']
}
const artifact_C = ['夜歌']
const definedconfig_C = {
  best: ['莉奈娅', '妮露', '希诺宁'],
  mid: ['莉奈娅', '妮露', '希诺宁'],
  low: ['莉奈娅', '爱诺', '希诺宁']
}

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, {
  q: true, Crystallize_c2: true, lunaType: 'lunarCrystallize', hydro_two: true, geo_two: true
})

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '「她的乡愁」月曜伤害提升',
    dmg: ({ talent }) => ({ avg: Math.floor(talent.q['月曜反应伤害提升']) + "%", type: 'text' })
  }, {
    check: ({ cons }) => cons > 0,
    title: ({ cons }) => `${cons}命月曜伤害总擢升`,
    dmg: ({ cons }) => {
      const values = [0, 1.5, 8.5, 10, 11.5, 13, 20];
      return {
        avg: (cons > 0 ? values[Math.min(cons, 6)] : 0) + "%",
        type: 'text'
      };
    }
  }, {
    check: ({ cons }) => cons >= 1,
    title: '1命月结晶队雨海护盾量',
    dmg: ({ calc, attr }) => ({ avg: calc(attr.hp) * 12 / 100 })
  }, {
    check: ({ cons }) => cons >= 2,
    title: '2命提升 攻击力 | 精通 | 防御力',
    dmg: ({ calc, attr }) => {
      const atkValue = Math.floor(calc(attr.hp) * 1 / 100);
      const masteryValue = Math.floor(calc(attr.hp) * 0.35 / 100);
      const defValue = Math.floor(calc(attr.hp) * 1 / 100);
      return {
        avg: `${atkValue} | ${masteryValue} | ${defValue}`,
        type: 'text'
      };
    }
  }, {
    title: '「引力涟漪」持续水伤',
    params: { q: true },
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力涟漪·持续伤害'] / 100, 'e')
  }, {
    params: { q: true, Bloom_c2 : true},
    title: '「月露涤荡」重击伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.a['月露涤荡伤害'] / 100, '', 'lunarBloom')
  }, {
    title: '单人月感电伤害',
    params: { q: true, Charged_c2: true },
    dmg: ({}, { basic }) => basic(0, '', 'lunarCharged')
  }, {
    params: { q: true, Charged_c2: true, lunaType: 'lunarCharged' },
    title: '「引力干涉」月感电伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力干涉·月感电伤害'] / 100, '', 'lunarCharged')
  }, {
    params: { q: true, Bloom_c2 : true, lunaType: 'lunarBloom' },
    title: '「引力干涉」月绽放伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力干涉·月绽放伤害'] / 100, '', 'lunarBloom')
  }, {
    params: { q: true, Crystallize_c2: true, lunaType: 'lunarCrystallize' },
    title: '「引力干涉」月结晶伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力干涉·月结晶伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '月感电EQ切后台15秒总伤',
    params: ({ artis }) => ({ q: true, Charged_c2: true, qiongjing: !!(artis && artis['穹境示现之夜'] >= 4)}),
    // 默认木桩自挂雷，q释放水伤 + e释放水伤 + e持续水伤7次 + 月感电7次，天赋33%几率 + 2次 默认共9次月感电
    // 引力干涉4次(首次引力干涉应该有4命加成，先手e吃不到q的加成，省事平衡一下默认4次普通引力干涉)，1命3次，0命2次
    dmg: ({ talent, calc, attr, cons }, { basic }) => {
      const qDamage = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
      const eDamage = basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
      const e2Damage = basic(calc(attr.hp) * talent.e['引力涟漪·持续伤害'] / 100, 'e')
      const { dmg: lunaDmg, avg: lunaAvg } = basic(0, '', 'lunarCharged')
      const eExtra = basic(calc(attr.hp) * talent.e['引力干涉·月感电伤害'] / 100, '', 'lunarCharged')
      const ecounts = cons >= 2 ? 4 : cons >= 1 ? 3 : 2
      return {
        dmg: qDamage.dmg + eDamage.dmg + e2Damage.dmg * 7 + lunaDmg * 9 + eExtra.dmg * ecounts,
        avg: qDamage.avg + eDamage.avg + e2Damage.avg * 7 + lunaAvg * 9 + eExtra.avg * ecounts
      };
    }
  }, {
    title: '月绽放EQ站场15秒总伤',
    params: ({ artis }) => ({ q: true, Bloom_c2: true, chenxing: !!(artis && artis['晨星与月的晓歌'] >= 4)}),
    // 默认木桩自挂草，q释放水伤 + e释放水伤 + e持续水伤7次
    // 引力干涉4次，2命以下2次  + 10轮「月露涤荡」重击 + 6次草种子绽放伤害
    // 先手eq吃不到满buff加成导致计算伤害偏高，6命移除种子绽放伤害作为补偿
    dmg: ({ talent, calc, attr, cons }, { basic, reaction }) => {
      const qDamage = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
      const eDamage = basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
      const e2Damage = basic(calc(attr.hp) * talent.e['引力涟漪·持续伤害'] / 100, 'e')
      const bloomDamage = reaction('bloom').avg
      const eExtra = basic(calc(attr.hp) * talent.e['引力干涉·月绽放伤害'] / 100, '', 'lunarBloom')
      const a2Damage = basic(calc(attr.hp) * talent.a['月露涤荡伤害'] / 100, '', 'lunarBloom')
      const ecounts = cons >= 2 ? 4 : cons >= 1 ? 3 : 2
      return {
        dmg: qDamage.dmg + eDamage.dmg + e2Damage.dmg * 7 + bloomDamage * (cons >= 6 ? 0 : 6) + eExtra.dmg * ecounts + a2Damage.dmg * 10,
        avg: qDamage.avg + eDamage.avg + e2Damage.avg * 7 + bloomDamage * (cons >= 6 ? 0 : 6) + eExtra.avg * ecounts + a2Damage.avg * 10,
      };
    }
  }, {
    // 队伍伤害
    title: ({cons}) => `${teamDefined(cons, definedconfig_A, artifact_A, mainCharName).title}「月露涤荡」重击伤害`,
    params: ({cons}) => ({
      ...teamDefined(cons, definedconfig_A, artifact_A, mainCharName).params,
      q: true, Bloom_c2: true, hydro_two: true, dendro_two: true
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.a['月露涤荡伤害'] / 100, '', 'lunarBloom')
  }, {
    title: ({cons}) => `${teamDefined(cons, definedconfig_A, artifact_A, mainCharName).title}「引力干涉」月绽放伤害`,
    params: ({cons}) => ({
      ...teamDefined(cons, definedconfig_A, artifact_A, mainCharName).params,
      q: true, Bloom_c2: true, lunaType: 'lunarBloom', hydro_two: true, dendro_two: true
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力干涉·月绽放伤害'] / 100, '', 'lunarBloom')
  }, {
    title: ({cons}) => `${teamDefined(cons, definedconfig_B, artifact_B, mainCharName).title}「引力干涉」月感电伤害`,
    params: ({cons}) => ({
      ...teamDefined(cons, definedconfig_B, artifact_B, mainCharName).params,
      q: true, Charged_c2: true, lunaType: 'lunarCharged', hydro_two: true
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力干涉·月感电伤害'] / 100, '', 'lunarCharged')
  }, {
    title: ({cons}) => `${teamDefined(cons, definedconfig_C, artifact_C, mainCharName).title}「引力干涉」月结晶伤害`,
    params: ({cons}) => ({
      ...teamDefined(cons, definedconfig_C, artifact_C, mainCharName).params,
      q: true, Crystallize_c2: true, lunaType: 'lunarCrystallize', hydro_two: true, geo_two: true
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.hp) * talent.e['引力干涉·月结晶伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
]);

export const defParams = { Moonsign: 2 };
export const defDmgIdx = 8;
export const consDmgKey = '月感电EQ切后台15秒总伤'
export const mainAttr = 'hp,cpct,cdmg,mastery';

export const buffs = [
  ...TeamBuff,
  {
    // 圣遗物判断：根据装备的套装应用对应前后台buff补偿
    check: ({ params }) => params.qiongjing || params.chenxing,
    title:'圣遗物补偿：根据套装效果补偿前后台伤害',
    data: {
      cpct: ({ params }) => params.qiongjing ? -30 : (params.chenxing ? 0 : 0),
      lunarCharged: ({ params }) => params.qiongjing ? -10 : (params.chenxing ? -60 : 0),
      lunarBloom: ({ params }) => params.qiongjing ? -10 : (params.chenxing ? -60 : 0),
      lunarCrystallize: ({ params }) => params.qiongjing ? -10 : (params.chenxing ? -60 : 0)
    }
  },{
    check: ({ params }) => params.q === true,
    title: '「她的乡愁」：月之领域里月曜反应伤害提升[lunarBloom]%',
    data: {
      lunarBloom: ({ talent }) => talent.q['月曜反应伤害提升'],
      lunarCharged: ({ talent }) => talent.q['月曜反应伤害提升'],
      lunarCrystallize: ({ talent }) => talent.q['月曜反应伤害提升']
    }
  },{
    title: '天赋「月亮诱发的疯狂」：引力干涉三层「月诱」暴击提升[cpct]%',
    data: {
      cpct: 5 * 3
    }
  },{
    title: '「月兆祝赐·借汝月光」：基于生命值上限提升月曜反应[fypct]%基础伤害',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(Math.floor(calc(attr.hp) / 1000) * 0.2, 7)
    }
  },{
    title: '1命「遍照花海，隐入群山」：月曜反应擢升1.5%',
    cons: 1,
    data: {
      elevated: 1.5
    }
  },{
    title: '2命「为夜增辉，与君遥伴」：月曜反应擢升7%，触发引力干涉时，生命值上限提升40%',
    cons: 2,
    data: {
      elevated: 7,
      hpPct: 40
    }
  },{
    check: ({ params }) => params.Bloom_c2 === true,
    title: '2命「为夜增辉，与君遥伴」：满辉绽放队提升精通[mastery]',
    cons: 2,
    sort: 9,
    data: {
      mastery: ({ attr, calc }) => calc(attr.hp) * 0.35 / 100
    }
  },{
    check: ({ params }) => params.Charged_c2 === true,
    title: '2命「为夜增辉，与君遥伴」：满辉感电队提升基础攻击[atkPlus]',
    cons: 2,
    sort: 9,
    data: {
      atkPlus: ({ attr, calc }) => calc(attr.hp) * 1 / 100
    }
  },{
    check: ({ params }) => params.Crystallize_c2 === true,
    title: '2命「为夜增辉，与君遥伴」：满辉结晶队提升基础防御[defPlus]',
    cons: 2,
    sort: 9,
    data: {
      defPlus: ({ attr, calc }) => calc(attr.hp) * 1 / 100
    }
  },{
    title: '3命「柔光凝露，梦湖起波」：月曜反应擢升1.5%',
    cons: 3,
    data: {
      elevated: 1.5
    }
  },{
    title: '4命「花岚云翳，山岩树影」:月曜反应擢升1.5%',
    cons: 4,
    data: { 
      elevated: 1.5 
    }
  },{
    check: ({ params }) => params.lunaType != null,
    title: '4命「花岚云翳，山岩树影」：基于生命上限提升引力干涉月曜反应伤害[fyplus]',
    sort: 9,
    cons: 4,
    data: {
      fyplus: ({ attr, calc, params }) => calc(attr.hp) * ({ lunarBloom: 2.5, lunarCharged: 12.5, lunarCrystallize: 12.5 }[params.lunaType] || 0) / 100
    }
  },{
    title: '5命「万籁俱寂，唯闻君唱」：月曜反应擢升1.5%',
    cons: 5,
    data: {
      elevated: 1.5
    }
  },{
    check: ({ params }) => params.q === true,
    title: '6命「夜昏且暗，且随月光」：月曜反应擢升7%，月之领域里月曜反应暴击伤害提升80%',
    cons: 6,
    data: {
      elevated: 7,
      cdmg: 80
    }
  }
]