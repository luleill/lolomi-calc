import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '兹白'

const team = ['叶洛亚','哥伦比娅', '妮露']
const artifact_normal = ['夜歌']

const team_B = ['叶洛亚','哥伦比娅','希诺宁']
const artifact_B = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_B, artifact_B, config,{taiyinDescent: true, cons_1: true, cons_2: true, cons_6: true})

export const details = applyStandardTeam([
{
    title: '触发满特效后防御力',
    dmg: ({ attr, calc }) => {
    return { avg: Math.min(calc(attr.def) * 1)}
}
}, {
    title: '「月转时隙」普攻四段总伤',
    dmg: ({ attr, calc, talent }, { basic }) => {
        return '一二三四'.split('').reduce((acc, num) => {
            const result = basic(calc(attr.def) * talent.e[`月转时隙${num}段伤害`] / 100, 'e');
            acc.dmg += result.dmg;
            acc.avg += result.avg;
            return acc;
        }, { dmg: 0, avg: 0 });
    }
}, {
    params: { cons_4: true, cons_6: true },
    title: '「月转时隙」第四段月结晶伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['月转时隙第四段额外伤害'] / 100, '', 'lunarCrystallize')
}, {
    title: '「灵驹飞踏」第一段伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['灵驹飞踏第一段伤害'] / 100, 'e')
}, {
    params: { taiyinDescent: true, cons_1: true, cons_2: true, cons_6: true },
    title: '「灵驹飞踏」第二段月结晶伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['灵驹飞踏第二段伤害'] / 100, '', 'lunarCrystallize')
}, {
    title: '「三垣威仪法」第一段岩伤',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.q['技能第一段伤害'] / 100, 'q')
}, {
    params: { cons_6: true },
    title: '「三垣威仪法」第二段月结晶伤害',
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.q['技能第二段伤害'] / 100, '', 'lunarCrystallize')
}, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「灵驹飞踏」月结晶伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      taiyinDescent: true, cons_1: true, cons_2: true, cons_6: true
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['灵驹飞踏第二段伤害'] / 100, '', 'lunarCrystallize')
}, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「灵驹飞踏」月结晶伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      taiyinDescent: true, cons_1: true, cons_2: true, cons_6: true
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['灵驹飞踏第二段伤害'] / 100, '', 'lunarCrystallize')
}, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({
      avg: artis,
      type: 'text'
    })
  }
])

export const mainAttr = 'def,cpct,cdmg,mastery'
export const defParams = { Moonsign: 2 }
export const defDmgIdx = 4

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.taiyinDescent === true,
    title: '天赋：「月下素娥降仙」灵驹飞踏第二段伤害提升兹白防御力的60%', 
    sort: 9,
    data: {
      fyplus: ({ attr, calc }) => calc(attr.def) * 60 / 100
    }
  }, {
    title: '天赋：「叠嶂峦岫出云」水元素队友兹白精通提升60，岩元素队友兹白防御力提升15%',
    // 默认单水双岩队友
    data: {
      mastery: 60,
      defPct: 30
    }
  }, {
    title: '天赋：月兆祝赐·浮明若流 队伍中角色造成的月曜反应提升[fypct]%基础伤害',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.def) / 100 * 0.7, 14)
    }
  }, {
    check: ({ params }) => params.cons_1 === true,
    title: '兹白1命：「月转时隙」初次施放灵驹飞踏时，第二段攻击造成的月结晶反应伤害提升220%',
    cons: 1,
    data: {
      fyinc: 220
    }
  }, {
    title: '兹白2命：月结晶反应伤害提升30%',
    cons: 2,
    data: {
      lunarCrystallize: 30
    }
  }, {
    check: ({ params }) => params.cons_2 === true,
    title: '兹白2命：灵驹飞踏第二段伤害进一步提升，提升值相当于兹白防御力的550%',
    sort: 9,
    cons: 2,
    data: {
      fyplus: ({ attr, calc }) => (calc(attr.def) * 550 / 100)
    }
  }, {
    check: ({ params }) => params.cons_4 === true,
    title: '兹白4命：「月转时隙」第四段额外攻击将造成相当于原本250%的月结晶反应伤害。',
    cons: 4,
    data: {
      multi: 150
    }
  }, {
    check: ({ params }) => params.cons_6 === true,
    title: '兹白6命：「月转时隙」下灵驹飞踏与接下来3秒内兹白造成的月结晶反应伤害最高擢升48%。',
    cons: 6,
    data: {
      elevated: 1.6 * (100 - 70)
    }
  }]