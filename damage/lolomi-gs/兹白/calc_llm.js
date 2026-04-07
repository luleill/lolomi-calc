import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '兹白'

const team = ['叶洛亚','哥伦比娅', '妮露']
const artifact_normalTotal = ['夜歌']

const team_B = ['叶洛亚','哥伦比娅','希诺宁']
const artifact_B = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normalTotal, config, ({ artis }) => ({ spiritSteed: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1 }))

/** 
 * 单人总伤计算1命只生效1次，利用miao的公式拆分计算模拟补偿，和实际会有差异
*/
function lunarFyplusMults (attr) {
  const elevatedNum = ((attr.elevated ?? 0) / 100)
  let kx = 10 - (attr.kx || 0)
  const kNum = kx >= 75
    ? 1 / (1 + 3 * kx / 100)
    : kx >= 0
      ? (100 - kx) / 100
      : 1 - kx / 200
  const cpctB = attr.cpct?.base ?? 0
  const cpctP = attr.cpct?.plus ?? 0
  let cpctNum = Math.max(0, Math.min(1, cpctB / 100 + cpctP / 100))
  let cdmgNum = (attr.cdmg?.base ?? 0) / 100 + (attr.cdmg?.plus ?? 0) / 100
  if (cpctNum === 0) {
    cdmgNum = 0
  }
  return {
    multAvg: (1 + elevatedNum) * kNum * (1 + cpctNum * cdmgNum),
    multDmg: (1 + elevatedNum) * kNum * (1 + cdmgNum)
  }
}
/** 
 * 灵驹第二段 fyplus 总值
*/
function spiritFyplusFlat (attr, calc, cons) {
  return calc(attr.def) * 60 / 100 + (cons >= 2 ? calc(attr.def) * 550 / 100 : 0)
}

export const details = applyStandardTeam([
  {
    title: '触发特效后防御力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.def)) })
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
    title: '「月转时隙」尾段额外月结晶伤害',
    dmg: ({ attr, calc, talent, cons } , { basic }) => basic(calc(attr.def) * talent.e['月转时隙第四段额外伤害'] / 100 * (cons >= 4 ? 2.5 : 1), '', 'lunarCrystallize')
  }, {
    title: '单人「月笼谐奏」单段伤害',
    dmg: ({}, { reaction }) => reaction('lunarCrystallize')
  }, {
    title: '「灵驹飞踏」总伤',
    params: { spiritSteed: true },
    dmg: ({ attr, calc, talent }, { basic }) => {
      const e1 = basic(calc(attr.def) * talent.e['灵驹飞踏第一段伤害'] / 100, 'e')
      const e2 = basic(calc(attr.def) * talent.e['灵驹飞踏第二段伤害'] / 100, '', 'lunarCrystallize')
      return {
        dmg: e1.dmg + e2.dmg,
        avg: e1.avg + e2.avg
      }
    }
  }, {
    title: '「三垣威仪法」总伤',
    dmg: ({ attr, calc, talent }, { basic }) => {
      const q1 = basic(calc(attr.def) * talent.q['技能第一段伤害'] / 100, 'q')
      const q2 = basic(calc(attr.def) * talent.q['技能第二段伤害'] / 100, '', 'lunarCrystallize')
      return {
        dmg: q1.dmg + q2.dmg,
        avg: q1.avg + q2.avg
      }
    }
  }, {
    title: '伪单人13秒站场总伤',
    // 默认有水底，13秒站场，后台单水双岩满辉挂件队友
    // 0命：3轮4A + 3次尾段月结晶 + 2次「灵驹飞踏」 + Q + 9次「月笼谐奏」
    // 1-5 命：3轮4A + 3次尾段月结晶 + 3次「灵驹飞踏 + Q 总 + 9次「月笼谐奏」
    // 6命：3轮4A + 3次尾段月结晶 + 4次「灵驹飞踏」 + Q 总伤 + 9次「月笼谐奏」
    dmg: ({ talent, calc, attr, cons }, { basic, reaction }) => {
      const totalLuna = 100 + (attr.lunarCrystallize || 0)
      const c1FirstBoost = (cons >= 1 && totalLuna > 0) ? (totalLuna + 220) / totalLuna : 1
      // 普攻
      const normalTotal = { dmg: 0, avg: 0 }
      '一二三四'.split('').forEach(num => {
        const r = basic(calc(attr.def) * talent.e[`月转时隙${num}段伤害`] / 100, 'e')
        normalTotal.dmg += r.dmg * 3
        normalTotal.avg += r.avg * 3
      })
      // 尾段额外月结晶
      const A4lunaExtra = (() => {
        const r = basic(calc(attr.def) * talent.e['月转时隙第四段额外伤害'] / 100 * (cons >= 4 ? 2.5 : 1), '', 'lunarCrystallize')
        return { dmg: r.dmg * 3, avg: r.avg * 3 }
      })()
      // 灵驹飞踏
      const eCount = cons === 0 ? 2 : (cons < 6 ? 3 : 4)
      const eTotal = (() => {
        const lunaBase = calc(attr.def) * talent.e['灵驹飞踏第二段伤害'] / 100
        const e1 = basic(calc(attr.def) * talent.e['灵驹飞踏第一段伤害'] / 100, 'e')
        const e2Base = basic(lunaBase, '', 'lunarCrystallize')
        const { multAvg, multDmg } = lunarFyplusMults(attr)
        const fyplusExtra = spiritFyplusFlat(attr, calc, cons)
        const e2Rest = {
          dmg: e2Base.dmg + fyplusExtra * multDmg,
          avg: e2Base.avg + fyplusExtra * multAvg
        }
        const e2First = {
          dmg: e2Base.dmg * c1FirstBoost + fyplusExtra * multDmg,
          avg: e2Base.avg * c1FirstBoost + fyplusExtra * multAvg
        }
        if (cons >= 1 && eCount > 1) {
          return {
            dmg: e1.dmg + e2First.dmg + (e1.dmg + e2Rest.dmg) * (eCount - 1),
            avg: e1.avg + e2First.avg + (e1.avg + e2Rest.avg) * (eCount - 1)
          }
        }
        if (cons >= 1 && eCount === 1) {
          return {
            dmg: e1.dmg + e2First.dmg,
            avg: e1.avg + e2First.avg
          }
        }
        return {
          dmg: (e1.dmg + e2Rest.dmg) * eCount,
          avg: (e1.avg + e2Rest.avg) * eCount
        }
      })()
      // 元素爆发
      const qTotal = (() => {
        const q1 = basic(calc(attr.def) * talent.q['技能第一段伤害'] / 100, 'q')
        const q2 = basic(calc(attr.def) * talent.q['技能第二段伤害'] / 100, '', 'lunarCrystallize')
        return {
          dmg: q1.dmg + q2.dmg,
          avg: q1.avg + q2.avg
        }
      })()
      // 单人月笼谐奏月结晶，触发3次，每次3次攻击
      const moonCage = reaction('lunarCrystallize')
      const monoTotal = {
        dmg: moonCage.dmg * 9,
        avg: moonCage.avg * 9
      }
      return {
        dmg: normalTotal.dmg + A4lunaExtra.dmg + eTotal.dmg + qTotal.dmg + monoTotal.dmg,
        avg: normalTotal.avg + A4lunaExtra.avg + eTotal.avg + qTotal.avg + monoTotal.avg
      }
    }
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「灵驱飞踏」月结晶伤害`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      spiritSteed: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['灵驱飞踏第二段伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normalTotal, mainCharName).title}「灵驱飞踏」月结晶伤害`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team, artifact_normalTotal).params, 
      spiritSteed: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1 
    }),
    dmg: ({ attr, calc, talent } , { basic }) => basic(calc(attr.def) * talent.e['灵驱飞踏第二段伤害'] / 100, '', 'lunarCrystallize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

// 单人天赋需要后台挂件队友，单人计算也默认满辉和双岩
export const defParams = { Moonsign: 2, geo_two: true };
export const defDmgIdx = 4
export const consDmgKey = '伪单人13秒站场总伤'
export const mainAttr = 'def,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.spiritSteed === true,
    title: '天赋「月下素娥降仙」：基于防御力的60%，提升灵驹飞踏第二段伤害值[fyplus]', 
    sort: 9,
    data: {
      fyplus: ({ attr, calc }) => calc(attr.def) * 60 / 100
    }
  }, {
    title: '天赋「叠嶂峦岫出云」：水元素队友兹白精通提升60，岩元素队友兹白防御力提升15%',
    // 默认单水双岩队友
    data: {
      mastery: 60,
      defPct: 30
    }
  }, {
    title: '天赋「月兆祝赐·浮明若流」：月曜反应基础伤害提升[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.def) / 100 * 0.7, 14)
    }
  }, {
    check: ({ params }) => params.spiritSteed === true,
    title: '1命「出勃然而入寥然」：首次灵驹飞踏时的第二段月结晶反应伤害提升220%',
    cons: 1,
    data: {
      lunarCrystallize: 220
    }
  }, {
    title: '2命「化于生而死于尸」：月转时隙模式下全队月结晶反应伤害提升30%',
    cons: 2,
    data: {
      lunarCrystallize: 30
    }
  }, {
    check: ({ params }) => params.spiritSteed === true,
    title: '2命「化于生而死于尸」：满辉下基于防御力的550%，提升灵驹飞踏第二段伤害值[fyplus]',
    sort: 9,
    cons: 2,
    data: {
      fyplus: ({ attr, calc }) => (calc(attr.def) * 550 / 100)
    }
  }, {
    title: '4命「魂魄往而身从之」：第四段额外攻击造成相当于原本250%的月结晶反应伤害',
    cons: 4,

  }, {
    title: '6命「天地忽如一远行」：月结晶反应伤害擢升[elevated]%',
    cons: 6,
    data: {
      elevated: 1.6 * (100 - 70)
    }
  }]