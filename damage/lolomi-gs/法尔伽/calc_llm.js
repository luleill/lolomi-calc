import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '法尔伽'

const team = ['温迪','杜林','班尼特']
const artifact_normal = ['千岩', '宗室']

const team_B = ['珐露珊','杜林','班尼特']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{sifeng: true, pyro_two: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    // 一轮普攻出伤顺序 双风双火配队
    // 第一段 火刀   第二段 风刀+扩散+火刀  
    // 第三段 风刀+火刀   第四段 火刀+风刀   第五段 火刀+风刀+扩散  
    // 特殊重击 火风扩火风   元素爆发 火风扩  
    // 扩散伤害忽略不计，不加入总伤害计算
    title: '「狂飙突进」普攻五段总伤',
    dmg: ({ talent }, dmg) => {
      const segment1 = talent.e['狂飙突进·一段伤害'];
      const segment2 = talent.e['狂飙突进·二段伤害2'];
      const segment3 = talent.e['狂飙突进·三段伤害2'];
      const segment4 = talent.e['狂飙突进·四段伤害2'];
      const segment5 = talent.e['狂飙突进·五段伤害2'];

      const anemoDamage = segment2[0] + segment3[0] + segment4[1] + segment5[1];
      const enchantDamage = segment1 + segment2[1] + segment3[1] + segment4[0] + segment5[0];
      
      const totalAnemo = dmg(anemoDamage, 'a');
      const totalEnchant = dmg(enchantDamage, 'a', 'coloringDmg');
      return {
        dmg: totalAnemo.dmg + totalEnchant.dmg,
        avg: totalAnemo.avg + totalEnchant.avg
      };
    }
  }, {
    title: '「四风将起」总伤',
    params: { sifeng: true },
    dmg: ({ talent, cons } , dmg) => {
    const enchant_e = dmg(talent.e['四风将起伤害2'][0], 'e', 'coloringDmg')
    const anemo_e = dmg(talent.e['四风将起伤害2'][1], 'e')
    const c2 = cons >= 2 ? dmg(800) : { dmg: 0, avg: 0 }
    return {
      dmg: enchant_e.dmg + anemo_e.dmg + c2.dmg,
      avg: enchant_e.avg + anemo_e.avg + c2.avg
    }
  }
  }, {
    title: '特殊重击「苍噬」总伤',
    params: { sifeng: true },
    dmg: ({ talent, cons }, dmg) => {
      const enchant_a2 = dmg(talent.e['苍噬伤害2'][0] * 2, 'e', 'coloringDmg');
      const anemo_a2 = dmg(talent.e['苍噬伤害2'][2] * 2, 'e');
      const c2 = cons >= 2 ? dmg(800) : { dmg: 0, avg: 0 }
      return {
        dmg: enchant_a2.dmg + anemo_a2.dmg + c2.dmg,
        avg: enchant_a2.avg + anemo_a2.avg + c2.avg
      };
    }
  }, {
    title: '二命额外风伤',
    check: ({ cons }) => cons >= 2,
    dmg: ({}, dmg) => dmg(800)
  }, {
    title: '「我即朔风」总伤',
    dmg: ({ talent }, dmg) => {
      const Q1 = dmg(talent.q['技能第一段伤害'], 'q', 'coloringDmg');
      const Q2 = dmg(talent.q['技能第二段伤害'], 'q');
      return {
        dmg: Q1.dmg + Q2.dmg,
        avg: Q1.avg + Q2.avg
      };
    }
  }, {
    title: '伪单人一轮站场总伤',
    // 虽然是单人，也必须有后台挂件队友凑魔导和双火，默认提前叠满全部被动buff
    // 0命手法 开E + 5A + 强化E + 5A + 强化E + 5A + q
    // 1-5命手法 开E + 强化E + 5A + 强化E + 5A + 强化E + 5A + q
    // 6命手法 开E + 强化EE + 5A + 强化EE + 5A + 强化EE + q
    // 6命第三个EE时狂飙状态已经结束，实际站场时间更久，对比0命提升偏大，仅做参考
    // 1命的强化只生效1次，第三轮普攻5A应该打不满，方便计算默认还是5A
    // 开E时的伤害和扩散伤害不列入总伤，本身伤害低，对总伤影响不大
    params: { sifeng: true, pyro_two: true },
    dmg: ({ talent, cons, attr }, dmg) => {
      // 1命的效果只有首次强化E能吃到，后续的强化E减去这个倍率加成
      const eMultiWith = attr.e ? attr.e.multi : 0
      const baseMul = cons >= 1 ? eMultiWith - 100 : eMultiWith
      const ratioNoC1 = cons >= 1 ? (100 + baseMul) / (200 + baseMul) : 1
      const add = (a, b) => ({ dmg: a.dmg + b.dmg, avg: a.avg + b.avg })
      // 首次强化E吃1命加成
      const sifeng_c1_enchant = dmg(talent.e['四风将起伤害2'][0], 'e', 'coloringDmg')
      const sifeng_c1_anemo   = dmg(talent.e['四风将起伤害2'][1], 'e')
      const sifeng_c1 = add(sifeng_c1_enchant, sifeng_c1_anemo)
      // 后续强化E减去1命加成
      const sifeng_n = {
        dmg: (sifeng_c1_enchant.dmg + sifeng_c1_anemo.dmg) * ratioNoC1,
        avg: (sifeng_c1_enchant.avg + sifeng_c1_anemo.avg) * ratioNoC1
      }
      // 苍噬伤害
      const cangshi_enchant = dmg(talent.e['苍噬伤害2'][0] * 2, 'e', 'coloringDmg')
      const cangshi_anemo   = dmg(talent.e['苍噬伤害2'][2] * 2, 'e')
      const cangshi = {
        dmg: (cangshi_enchant.dmg + cangshi_anemo.dmg) * ratioNoC1,
        avg: (cangshi_enchant.avg + cangshi_anemo.avg) * ratioNoC1
      }
      // 普攻五段
      const a5 = (() => {
        const anemoDamage = talent.e['狂飙突进·二段伤害2'][0] + talent.e['狂飙突进·三段伤害2'][0] + talent.e['狂飙突进·四段伤害2'][1] + talent.e['狂飙突进·五段伤害2'][1]
        const enchantDamage = talent.e['狂飙突进·一段伤害'] + talent.e['狂飙突进·二段伤害2'][1] + talent.e['狂飙突进·三段伤害2'][1] + talent.e['狂飙突进·四段伤害2'][0] + talent.e['狂飙突进·五段伤害2'][0]
        const anemo = dmg(anemoDamage, 'a')
        const enchant = dmg(enchantDamage, 'a', 'coloringDmg')
        return { dmg: anemo.dmg + enchant.dmg, avg: anemo.avg + enchant.avg }
      })()
      // 元素爆发
      const Q1 = dmg(talent.q['技能第一段伤害'], 'q', 'coloringDmg')
      const Q2 = dmg(talent.q['技能第二段伤害'], 'q')
      const Q = { dmg: Q1.dmg + Q2.dmg, avg: Q1.avg + Q2.avg }
      // 2命额外风伤
      const c2Extra = cons >= 2 ? dmg(800) : { dmg: 0, avg: 0 }

      let total
      if (cons >= 6) {
        // 6命：触发6次2命额外风伤
        const round1 = add(sifeng_c1, cangshi)
        const roundN = add(sifeng_n, cangshi)
        const c2Total = { dmg: c2Extra.dmg * 6, avg: c2Extra.avg * 6 }
        total = add(add(add(add(round1, a5), add(roundN, a5)), add(roundN, Q)), c2Total)
      } else if (cons >= 2) {
        // 2命：触发3次2命额外风伤
        const c2Total = { dmg: c2Extra.dmg * 3, avg: c2Extra.avg * 3 }
        total = add(add(add(add(add(sifeng_c1, a5), add(sifeng_n, a5)), add(sifeng_n, a5)), Q), c2Total)
      } else if (cons >= 1) {
        // 1命
        total = add(add(add(add(sifeng_c1, a5), add(sifeng_n, a5)), add(sifeng_n, a5)), Q)
      } else {
        // 0命
        total = add(add(add(add(a5, sifeng_n), a5), add(sifeng_n, a5)), Q)
      }
      return total
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「四风将起」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      sifeng: true, pyro_two: true
    }),
      dmg: ({ talent, cons }, dmg) => {
      const enchant_e = dmg(talent.e['四风将起伤害2'][0], 'e', 'coloringDmg')
      const anemo_e = dmg(talent.e['四风将起伤害2'][1], 'e')
      const c2 = cons >= 2 ? dmg(800) : { dmg: 0, avg: 0 }
      return {
        dmg: enchant_e.dmg + anemo_e.dmg + c2.dmg,
        avg: enchant_e.avg + anemo_e.avg + c2.avg
      };
    }
  } ,{
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「四风将起」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      sifeng: true, pyro_two: true
    }),
      dmg: ({ talent, cons }, dmg) => {
      const enchant_e = dmg(talent.e['四风将起伤害2'][0], 'e', 'coloringDmg')
      const anemo_e = dmg(talent.e['四风将起伤害2'][1], 'e')
      const c2 = cons >= 2 ? dmg(800) : { dmg: 0, avg: 0 }
      return {
        dmg: enchant_e.dmg + anemo_e.dmg + c2.dmg,
        avg: enchant_e.avg + anemo_e.avg + c2.avg
      };
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

  export const defParams = { Hexenzirkel: true } // 魔女会成员
  export const defDmgIdx = 2
  export const consDmgKey = '伪单人一轮站场总伤'
  export const mainAttr = 'atk,cpct,cdmg'

  export const buffs = [
    ...TeamBuff,
    {
      title: '天赋「晓风的行军」：基于攻击力获得伤害加成[dmg]%',
      sort: 9,
      data: {
        dmg: ({ attr, calc }) => Math.min(calc(attr.atk) / 1000 * 10, 25)
      }
    }, {
      title: '天赋2「晓风的行军」：双风双色队狂飙突进、苍噬与四风将起将造成原本220%的伤害',
      data: {
        aMulti: 120,
        a2Multi: 120,
        eMulti: 120,
      }
    }, {
      title: '天赋「风帜的先引」：普攻、重击、苍噬与四风将起伤害提升30%',
      data: {
        aDmg: 30,
        a2Dmg: 30,
        eDmg: 30
      }
    }, {
      title: '法尔伽1命：狂飙突进模式的下一次四风将起时或苍噬造成原本200%的伤害',
      check: ({ params }) => params.sifeng === true, 
      cons: 1,
      data: {
        eMulti: 100,
      }
    }, {
      title: '法尔伽2命：释放四风将起或苍噬时，额外造成一次800%攻击力的风元素伤害',
      cons: 2,
    }, {
      title: '法尔伽4命：扩散后分别获得20%风伤与对应元素伤害加成',
      cons: 4,
      data: {
        dmg: 20
      }
    }, {
      title: '法尔伽6命：暴伤提升80%，四风将起和苍噬可以互相连续释放一次',
      cons: 6,
      data: {
        cdmg: 80,
      }
    }
  ]

    