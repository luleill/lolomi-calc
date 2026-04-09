import { Config } from '#lolomi'
import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'

const mainCharName = '莉奈娅'

const team = ['哥伦比娅','叶洛亚', '希诺宁']
const artifact_normal = ['烬城', '夜歌']

const team_B = ['哥伦比娅','叶洛亚', '妮露']
const artifact_B = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{heavyHammer : true})

export const details = applyStandardTeam([
  {
    title: '触发特效后防御力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.def)) })
  }, {
    title: '「备忘·绝境生存指南」首次治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.q['首次治疗量2'][0] * calc(attr.def) / 100 + talent.q['首次治疗量2'][1])
  }, {
    title: '「备忘·绝境生存指南」持续治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.q['持续治疗量2'][0] * calc(attr.def) / 100 + talent.q['持续治疗量2'][1])
  }, {
    title: '「备忘·绝境生存指南」总治疗',
    dmg: ({ talent, calc, attr }, { heal }) => {
      const qbaseHeal = heal(talent.q['首次治疗量2'][0] * calc(attr.def) / 100 + talent.q['首次治疗量2'][1]).avg;
      const nextHeal = heal(talent.q['持续治疗量2'][0] * calc(attr.def) / 100 + talent.q['持续治疗量2'][1]).avg;
      return {
        avg: qbaseHeal + nextHeal * 12
      };
    }
  }, {
    check: ({ cons }) => cons >= 1,
    title: '1命「历览编录」基础伤害提升值',
    dmg: ({ calc, attr, cons }) => {
      return {
        avg: calc(attr.def) * (cons >= 6 ? 1.125 : 0.75) * (cons >= 6 ? 2 : 1)
      }
    }
  }, {
    title: '单人月结晶伤害',
    dmg: ({}, { reaction }) => reaction('lunarCrystallize')
  }, {
    title: '露米捶捶乱打伤害',
    params: { ordinary: true },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米捶捶乱打伤害2'][0] / 100, 'e')
  }, {
    title: '露米加力重锤月结晶伤害',
    params: { ordinary: true },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米加力重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '露米百万吨重锤伤害',
    params: { heavyHammer: true },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米百万吨重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '点按露米后台一轮总伤',
    // 默认场上已触发月笼，9轮共18次普通捶捶乱打，5次加力重锤月结晶，3轮月笼共9次
    params: { ordinary: true, isbackground: true },
    dmg: ({ talent, calc, attr }, { basic, reaction }) => {
      const ebase = basic(calc(attr.def) * talent.e['露米捶捶乱打伤害2'][0] / 100, 'e');
      const eluna = basic(calc(attr.def) * talent.e['露米加力重锤伤害'] / 100, '', 'lunarCrystallize')
      const moonCage = reaction('lunarCrystallize')
      return {
        dmg: ebase.dmg * 18 + eluna.dmg * 5 + moonCage.dmg * 9,
        avg: ebase.avg * 18 + eluna.avg * 5 + moonCage.avg * 9,
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 百万吨重锤伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      heavyHammer : true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米百万吨重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 百万吨重锤伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      heavyHammer : true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米百万吨重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  // 单人计算也默认满辉和双岩
  export const mainAttr = 'def,cpct,cdmg'
  export const defParams = { Moonsign: 2, geo_two: true }
  export const defDmgIdx = 8
  // export const defDmgKey = 'e'
  export const consDmgKey = '露米百万吨重锤伤害'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '「月兆祝赐·栖地考察」：基于莉奈娅防御力，提升月结晶基础伤害[fypct]%',
      sort: 9,
      data: {
        fypct: ({ attr, calc }) => Math.min((calc(attr.def) / 100 * 0.7), 14)
      }
    }, {
      title: '天赋「野外观察手记」：满辉降低敌人的岩元素抗性30%',
      data: {
        kx: 30
      }
    }, {
      title: '天赋「万类博物图鉴」：非月兆角色站场提升莉奈娅精通[mastery]',
      sort: 9,
      data: {
        mastery: ({ attr, calc }) => calc(attr.def) * 0.05
      }
    }, {
      check: ({ params }) => params.ordinary === true,
      title: '1命「未完成的分类」：基于防御力的75%，提升造成的月结晶伤害[fyplus]',
      sort: 9,
      cons: 1,
      data: {
        fyplus: ({ attr, calc, cons }) => calc(attr.def) * (cons >= 6 ? 1.125 : 0.75) * (cons >= 6 ? 2 : 1)
      }
    }, {
      check: ({ params }) => params.heavyHammer === true,
      title: '1命「未完成的分类」：基于防御力的150%，提升百万吨重锤伤害[fyplus]',
      sort: 9,
      cons: 1,
      data: {
        fyplus: ({ attr, calc, cons }) => calc(attr.def) * (cons >= 6 ? 2.25 : 1.5) * (cons >= 6 ? 10 : 5)
      }
    }, {
      check: ({ params }) => params.ordinary === true,
      title: '2命「喜或悲的谕告」：队伍水岩爆伤提升40%',
      cons: 2,
      data: {
        cdmg: 40
      }
    }, {
      check: ({ params }) => params.heavyHammer === true,
      title: '2命「喜或悲的谕告」：百万吨重锤的暴击伤害提升190%',
      cons: 2,
      data: {
        cdmg: 190
      }
    }, {
      title: '4命「专家的直感觉」：莉奈娅站场时自身防御力提升50%',
      cons: 4,
      data: {
        defPct: ({ params }) => (params.isbackground ? 25 : 50)
      }
    }, {
      title: '6命「黄金猎犬之梦」：满辉月结晶反应伤害擢升25%',
      cons: 6,
      data: {
        elevated: 25
      }
    }
  ]
  