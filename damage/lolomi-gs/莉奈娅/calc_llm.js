import { Config } from '#lolomi'
import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'

const mainCharName = '莉奈娅'

const team = ['哥伦比娅','叶洛亚', '希诺宁']
const artifact_normal = ['烬城', '夜歌']

const team_B = ['哥伦比娅','叶洛亚', '妮露']
const artifact_B = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_B, artifact_B, config,{heavyHammer : true})

export const details = applyStandardTeam([
  {
    title: '触发满特效后防御力',
    dmg: ({ attr, calc }) => {
      return { avg: Math.min(calc(attr.def) * 1)}
  }
  }, {
    title: '「备忘·绝境生存指南」首次治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.q['首次治疗量2'][0] * calc(attr.def) / 100 + talent.q['首次治疗量2'][1] * 1)
  }, {
    title: '「备忘·绝境生存指南」持续治疗',
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(talent.q['持续治疗量2'][0] * calc(attr.def) / 100 + talent.q['持续治疗量2'][1] * 1)
  }, {
    title: '露米捶捶乱打伤害',
    params: { ordinary: true },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米捶捶乱打伤害'] / 100, 'e')
  }, {
    title: '露米加力重锤月结晶伤害',
    params: { ordinary: true },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米加力重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '露米百万吨重锤伤害',
    params: { heavyHammer: true },
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米百万吨重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}露米百万吨重锤伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      heavyHammer : true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米百万吨重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}露米百万吨重锤伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      heavyHammer : true
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.def) * talent.e['露米百万吨重锤伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }
  }
  ])
  
  export const mainAttr = 'def,cpct,cdmg'
  export const defParams = { Moonsign: 2 }
  export const defDmgIdx = 5
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '莉奈娅天赋：月结晶反应基础伤害提升[fypct]%',
      sort: 9,
      data: {
        fypct: ({ attr, calc }) => Math.min((calc(attr.def) / 100 * 0.7), 14)
      }
    }, {
      title: '莉奈娅天赋：降低附近敌人的岩元素抗性30%',
      data: {
        kx: 30
      }
    }, {
      title: '莉奈娅天赋：当前场上月兆角色提升精通[mastery]',
      sort: 9,
      data: {
        mastery: ({ attr, calc }) => calc(attr.def) * 0.05
      }
    }, {
      check: ({ params }) => params.ordinary === true,
      title: '莉奈娅1命：提升造成的月结晶伤害，提升值相当于莉奈娅防御力的75%。',
      sort: 9,
      cons: 1,
      data: {
        fyplus: ({ attr, calc }) => calc(attr.def) * 0.75
      }
    }, {
      check: ({ params }) => params.heavyHammer === true,
      title: '莉奈娅1命：提升百万吨重锤伤害，每层提升值相当于莉奈娅防御力的150%。',
      sort: 9,
      cons: 1,
      data: {
        fyplus: ({ attr, calc, cons }) => calc(attr.def) * (cons >= 6 ? 3.75 : 1.5) * (cons >= 6 ? 10 : 5)
      }
    }, {
      check: ({ params }) => params.ordinary === true,
      title: '莉奈娅2命：队伍水岩爆伤提升40%',
      cons: 2,
      data: {
        cdmg: 40,
      }
    }, {
      check: ({ params }) => params.heavyHammer === true,
      title: '莉奈娅2命：百万吨重锤的暴击伤害效果额外提升150%。',
      cons: 2,
      data: {
        cdmg: 60,
      }
    }, {
      title: '莉奈娅4命：莉奈娅站场时自身防御力提升50%',
      cons: 4,
      data: {
        defPct: 50,
      }
    }, {
      title: '莉奈娅6命：月结晶反应伤害擢升25%',
      cons: 6,
      data: {
        elevated: 25
      }
    }
  ]
  