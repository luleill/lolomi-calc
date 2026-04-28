import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '菈乌玛'

const team = ['哥伦比娅', '纳西妲', '妮露']
const artifact_normal = ['草套', '夜歌']

const team_B = ['哥伦比娅', '纳西妲', '爱诺']
const artifact_B = ['草套', '夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, (
  { artis }) => ({ luna: true, q: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1 }
))

export const details = applyStandardTeam([
  {
    title: '触发特效后元素精通',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.mastery) })
  }, {
    title: '「苍色祷歌」提升月绽放基础值',
    dmg: ({ calc, attr, talent, cons }) => ({
      avg: calc(attr.mastery) * (talent.q['月绽放反应伤害提升'] / 100 + (cons >= 2 ? 4 : 0))
    })
  }, {
    title: '1命「生之纺线」单次治疗量',
    check: ({ cons }) => cons >= 1,
    dmg: ({ talent, attr, calc }, { heal }) =>
      heal(calc(attr.mastery) * 5)
  }, {
    title: '「圣言述咏·终宵永眠」点按伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.atk) * talent.e['点按伤害'] / 100, 'e')
  }, {
    title: '「终宵永眠」满buff长按月绽放',
    params: { luna: true, q: true },
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.mastery) * talent.e['长按二段伤害'] * 3 / 100, '', 'lunarBloom')
  }, {
    title: '「霜林圣域」单次伤害',
    dmg: ({ talent, attr, calc }, { basic }) => 
      basic((calc(attr.atk) * talent.e['霜林圣域攻击伤害2'][0] + calc(attr.mastery) * talent.e['霜林圣域攻击伤害2'][1]) / 100, 'e')
  }, {
    title: '6命「霜林圣域」额外月绽放',
    params: { luna: true, q: true },
    check: ({ cons }) => cons >= 6,
    dmg: ({ talent, attr, calc }, { basic }) => 
      basic(calc(attr.mastery) * 1.85, '', 'lunarBloom')
  }, {
    title: '「苍色祷歌」草种子绽放伤害',
    params: { bloom: true, q: true },
    dmg: ({}, { reaction }) => {
      let r1 = reaction('bloom')
      return {
        dmg: r1.avg,
        avg: r1.avg
      }
    }
  }, {
    title: '长按EQ15秒总伤',
    // 默认满辉，木桩自挂水，站场15秒，E攻击8次，6命额外8次月绽放，默认草种子炸10次
    // 普攻3A打7轮，六命转为21次月绽放
    // 普通草伤和普通绽放不吃月绽放的相关加成，利用公式手动扣除，计算可能存在误差
    params: { luna: true, q: true },
    dmg: ({ talent, attr, calc, cons }, { basic, reaction }) => {
      const lunaFypct = Math.min(calc(attr.mastery) * 0.0175, 14)
      const lunaFyplus = calc(attr.mastery) * talent.q['月绽放反应伤害提升'] / 100 + (cons >= 2 ? calc(attr.mastery) * 4 : 0)
      const bloomFyplus = calc(attr.mastery) * talent.q['绽放、超绽放、烈绽放反应伤害提升'] / 100
      const ordinaryBloom = { dynamicCpct: -10, dynamicCdmg: -20 }

      let aTotal
      if (cons >= 6) {
        aTotal = { dmg: 0, avg: 0 }
      } else {
        const aSingle = ['一段伤害', '二段伤害', '三段伤害'].reduce((s, k) => {
          const d = basic(calc(attr.atk) * talent.a[k] / 100, 'a', false, ordinaryBloom)
          return { dmg: s.dmg + d.dmg, avg: s.avg + d.avg }
        }, { dmg: 0, avg: 0 })
        aTotal = { dmg: aSingle.dmg * 7, avg: aSingle.avg * 7 }
      }
      const e1 = basic(calc(attr.atk) * talent.e['长按一段伤害'] / 100, 'e', false, ordinaryBloom)
      const sanc = basic((calc(attr.atk) * talent.e['霜林圣域攻击伤害2'][0] + calc(attr.mastery) * talent.e['霜林圣域攻击伤害2'][1]) / 100, 'e', false, ordinaryBloom)

      const bw = reaction('bloom')
      const kx = 10 - (attr.kx || 0)
      const kNum = kx >= 75 ? 1 / (1 + 3 * kx / 100) : kx >= 0 ? (100 - kx) / 100 : 1 - kx / 200
      const X = (bw.avg - attr.fyplus * kNum) / (1 + attr.fypct / 100)
      const bloomAvg = (X * (1 + (attr.fypct - lunaFypct) / 100) + (attr.fyplus - lunaFyplus + bloomFyplus) * kNum) * 10

      const e2 = basic(calc(attr.mastery) * talent.e['长按二段伤害'] / 100, '', 'lunarBloom')
      let c6 = { dmg: 0, avg: 0 }
      if (cons >= 6) {
        c6 = basic(calc(attr.mastery) * 1.85, '', 'lunarBloom')
        c6 = { dmg: c6.dmg * 8, avg: c6.avg * 8 }
        aTotal = basic(calc(attr.mastery) * 1.5, '', 'lunarBloom')
        aTotal = { dmg: aTotal.dmg * 21, avg: aTotal.avg * 21 }
      }

      return {
        dmg: aTotal.dmg + e1.dmg + e2.dmg * 3 + sanc.dmg * 8 + c6.dmg + bloomAvg,
        avg: aTotal.avg + e1.avg + e2.avg * 3 + sanc.avg * 8 + c6.avg + bloomAvg
      }
    }
  }, {
    // 纳西妲 哥伦比娅 爱诺
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 满buff长按E月绽放`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      luna: true, q: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1
    }),
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.mastery) * talent.e['长按二段伤害'] / 100, '', 'lunarBloom')
  }, {
    // 纳西妲 哥伦比娅 妮露
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 满buff长按E月绽放`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      luna: true, q: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1
    }),
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.mastery) * talent.e['长按二段伤害'] / 100, '', 'lunarBloom')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

// 计算均默认满辉状态
export const defParams = { Moonsign: 2 }
export const defDmgIdx = 4
export const consDmgKey = '长按EQ15秒总伤'
export const mainAttr = 'cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.luna === true,
    title: '「月兆祝赐·千籁恩宠」：基于精通提升月绽放反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ calc, attr }) => Math.min(calc(attr.mastery) * 0.0175, 14)
    }
  }, {
    title: '「圣言述咏·终宵永眠」：元素战技或霜林圣域命中后使敌人草抗与水抗降低[kx]%',
    data: {
      kx: ({ talent }) => talent.e['元素抗性降低']
    }
  }, {
    check: ({ params }) => params.q === true && params.luna === true,
    title: '「圣言述咏·众心为月」：苍色祷歌提升月绽放基础伤害[fyplus]',
    sort: 9,
    data: {
      fyplus: ({ attr, calc, talent }) => calc(attr.mastery) * talent.q['月绽放反应伤害提升'] / 100
    }
  }, {
    check: ({ params }) => params.q === true && params.bloom === true,
    title: '「圣言述咏·众心为月」：苍色祷歌提升绽放伤害[fyplus]',
    sort: 9,
    data: {
      fyplus: ({ attr, calc, talent }) => calc(attr.mastery) * talent.q['绽放、超绽放、烈绽放反应伤害提升'] / 100
    }
  }, {
    check: ({ params }) => params.luna === true,
    title: '天赋「奉向霜夜的明光」：满辉月绽放暴击率提高10%，暴击伤害提高20%',
    data: {
      cpct: 10,
      cdmg: 20
    }
  }, {
    title: '天赋「奉向甘泉的沐濯」：基于精通提升元素战技伤害[eDmg]%',
    sort: 9,
    data: {
      eDmg: ({ calc, attr }) => Math.min(calc(attr.mastery) * 0.04, 32)
    }
  }, {
    title: '1命「唇啊，为我纺出歌与吟哦」：触发月绽放后基于元素精通的500%恢复场上角色生命值',
    cons: 1,
  }, {
    check: ({ params }) => params.q === true && params.luna === true,
    title: '2命「纺出那终北的告诫与述说」：苍色祷歌基于精通的400%额外提升月绽放基础伤害，月绽放伤害提高40%',
    sort: 9,
    cons: 2,
    data: {
      fyplus: ({ calc, attr }) => calc(attr.mastery) * 4,
      lunarBloom: 40
    }
  }, {
    title: '6命「我愿将这血与泪奉予月明」：月绽放伤害擢升25%，霜林圣域额外造成精通185%月绽放伤害，普攻转为精通150%的月绽放',
    cons: 6,
    data: {
      elevated: 25
    }
  }
]
