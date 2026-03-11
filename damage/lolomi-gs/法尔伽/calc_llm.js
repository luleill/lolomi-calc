import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '法尔伽'

const team = ['珐露珊','杜林','班尼特']
const artifact_normal = ['千岩', '宗室']

const team_B = ['温迪','杜林','班尼特']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{sifeng: true, pyro_two: true})

export const details = applyStandardTeam([
{
  title: '触发满特效后攻击力',
  dmg: ({ attr, calc }) => {
    return { avg: Math.min(calc(attr.atk) * 1)}
  }
}, {
  // 一轮普攻出伤顺序
  // 第一段 火刀   第二段 风刀+扩散+火刀  
  // 第三段 风刀+火刀   第四段 火刀+风刀   第五段 火刀+风刀+扩散  
  // 特殊重击 火风扩火风   元素爆发 火风扩  
  // 扩散伤害忽略不计，不加入总伤害计算
  title: '「狂飙突进」普攻五段总伤害',
  dmg: ({ talent }, dmg) => {
    const segment1 = talent.e['狂飙突进·一段伤害'];
    const segment2 = talent.e['狂飙突进·二段伤害2'];
    const segment3 = talent.e['狂飙突进·三段伤害2'];
    const segment4 = talent.e['狂飙突进·四段伤害2'];
    const segment5 = talent.e['狂飙突进·五段伤害2'];

    const anemoDamage = segment1 + segment2[0] + segment3[0] + segment4[1] + segment5[1];
    const enchantDamage = segment2[1] + segment3[1] + segment4[0] + segment5[0];
    
    const totalAnemo = dmg(anemoDamage, 'a');
    const totalEnchant = dmg(enchantDamage, 'a', 'coloringDmg');
    return {
      dmg: totalAnemo.dmg + totalEnchant.dmg,
      avg: totalAnemo.avg + totalEnchant.avg
    };
  }
}, {
  title: '扩散反应伤害',
  dmg: ({}, { reaction }) => reaction('swirl')
}, {
  title: '「四风将起」总伤',
  params: { sifeng: true },
  dmg: ({ talent } , dmg) => {
  const enchant_e = dmg(talent.e['四风将起伤害2'][0], 'e', 'coloringDmg')
  const anemo_e = dmg(talent.e['四风将起伤害2'][1], 'e')
  return {
    dmg: enchant_e.dmg + anemo_e.dmg,
    avg: enchant_e.avg + anemo_e.avg
  }
}
}, {
  title: '特殊重击「苍噬」总伤',
  params: { sifeng: true },
  dmg: ({ talent }, dmg) => {
    const enchant_a2 = dmg(talent.e['苍噬伤害2'][0] * 2, 'e', 'coloringDmg');
    const anemo_a2 = dmg(talent.e['苍噬伤害2'][2] * 2, 'e');
    return {
      dmg: enchant_a2.dmg + anemo_a2.dmg,
      avg: enchant_a2.avg + anemo_a2.avg
    };
  }
}, {
  title: '「我即朔风」两段总伤',
  dmg: ({ talent }, dmg) => {
    const Q1 = dmg(talent.q['技能第一段伤害'], 'q', 'coloringDmg');
    const Q2 = dmg(talent.q['技能第二段伤害'], 'q');
    return {
      dmg: Q1.dmg + Q2.dmg,
      avg: Q1.avg + Q2.avg
    };
  }
}, {
  // 队伍伤害
  title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「四风将起」伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team_B, artifact_B).params,
    sifeng: true, pyro_two: true
  }),
    dmg: ({ talent }, dmg) => {
    const enchant_a2 = dmg(talent.e['苍噬伤害2'][0] * 2, 'e', 'coloringDmg');
    const anemo_a2 = dmg(talent.e['苍噬伤害2'][2] * 2, 'e');
    return {
      dmg: enchant_a2.dmg + anemo_a2.dmg,
      avg: enchant_a2.avg + anemo_a2.avg
    };
  }
} ,{
  title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「四风将起」伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team, artifact_normal).params,
    sifeng: true, pyro_two: true
  }),
    dmg: ({ talent }, dmg) => {
    const enchant_a2 = dmg(talent.e['苍噬伤害2'][0] * 2, 'e', 'coloringDmg');
    const anemo_a2 = dmg(talent.e['苍噬伤害2'][2] * 2, 'e');
    return {
      dmg: enchant_a2.dmg + anemo_a2.dmg,
      avg: enchant_a2.avg + anemo_a2.avg
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

export const defParams = { Hexenzirkel: true } // 魔女会成员
export const defDmgIdx = 2
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '法尔伽天赋：晓风的行军 满层增伤25%',
    data: {
      dmg: 25,
    }
  }, {
    title: '法尔伽天赋：晓风的行军 双风特殊战技造成原本220%的伤害',
    data: {
      aMulti: 120,
      a2Multi: 120,
      eMulti: 120,
    }
  }, {
    title: '法尔伽天赋：风帜的先引 ae造成的伤害提升30%',
    data: {
      admg: 30,
      a2dmg: 30,
      edmg: 30
    }
  }, {
    title: '法尔伽1命：四风将起或苍噬造成原本200%的伤害',
    check: ({ params }) => params.sifeng === true, 
    cons: 1,
    data: {
      eMulti: 100,
    }
  }, {
    title: '法尔伽4命：所有角色分别获得20%风元素伤害加成与对应元素伤害加成',
    cons: 4,
    data: {
      dmg: 20
    }
  }, {
    title: '法尔伽6命：每层「苍牙之誓」使法尔伽的暴击伤害提升20%。',
    cons: 6,
    data: {
      cdmg: 80,
    }
  }
]

    