import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '奈芙尔'

const team = ['菈乌玛', '哥伦比娅', '妮露']
const artifact_normal = ['夜歌']

const team_B = ['菈乌玛', '哥伦比娅', '纳西妲']
const artifact_B = ['夜歌', '草套']

const team_C = ['菈乌玛', '哥伦比娅', '爱诺']
const artifact_C = ['夜歌']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, (
  { artis }) => ({ dendro_two: true, huanXi: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1 }
))
// 幻戏单轮重击总伤
const calcHuanXiDamage = ({ talent, attr, calc, cons }, { basic }) => {
  const hxpct = cons >= 2 ? 1.4 : 1.24
  const parts = [
    // 自身一段草伤
    () => basic((calc(attr.atk) * talent.e['幻戏自身一段伤害2'][0] + calc(attr.mastery) * talent.e['幻戏自身一段伤害2'][1]) / 100, 'e'),
    // 自身二段：6命转为基于元素精通85%的月绽放，否则为草伤
    cons >= 6
      ? () => basic(calc(attr.mastery) * 0.85, '', 'lunarBloom')
      : () => basic((calc(attr.atk) * talent.e['幻戏自身二段伤害2'][0] + calc(attr.mastery) * talent.e['幻戏自身二段伤害2'][1]) / 100, 'e'),
    // 虚影三段月绽放
    () => basic(calc(attr.mastery) * talent.e['幻戏虚影一段'] / 100 * hxpct, '', 'lunarBloom'),
    () => basic(calc(attr.mastery) * talent.e['幻戏虚影二段'] / 100 * hxpct, '', 'lunarBloom'),
    () => basic(calc(attr.mastery) * talent.e['幻戏虚影三段'] / 100 * hxpct, '', 'lunarBloom'),
    // 6命额外月绽放（120%精通）
    ...(cons >= 6 ? [
      () => basic(calc(attr.mastery) * 1.2, '', 'lunarBloom')
    ] : [])
  ]
  return parts.reduce((total, calcDmg) => {
    const dmg = calcDmg()
    return {
      dmg: total.dmg + dmg.dmg,
      avg: total.avg + dmg.avg
    }
  }, { dmg: 0, avg: 0 })
}

// 单人站场一轮总伤：(E释放伤害 + 幻戏*3) * 2 + Q总伤
const calcOneRoundTotal = ({ talent, attr, calc, cons }, { basic }) => {
  // E释放伤害
  const eRelease = basic((calc(attr.atk) * talent.e['技能伤害2'][0] + calc(attr.mastery) * talent.e['技能伤害2'][1]) / 100, 'e')
  // 幻戏*3
  const huanXiSingle = calcHuanXiDamage({ talent, attr, calc, cons }, { basic })
  const huanXiTriple = {
    dmg: huanXiSingle.dmg * 3,
    avg: huanXiSingle.avg * 3
  }
  // 两次E+幻戏总伤
  const oneRound = {
    dmg: (eRelease.dmg + huanXiTriple.dmg) * 2,
    avg: (eRelease.avg + huanXiTriple.avg) * 2
  }
  // Q总伤
  const qTotal = ['一段伤害2', '二段伤害2'].reduce((total, key) => {
    const dmg = basic((calc(attr.atk) * talent.q[key][0] + calc(attr.mastery) * talent.q[key][1]) / 100, 'q')
    return {
      dmg: total.dmg + dmg.dmg,
      avg: total.avg + dmg.avg
    }
  }, { dmg: 0, avg: 0 })
  return {
    dmg: oneRound.dmg + qTotal.dmg,
    avg: oneRound.avg + qTotal.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后元素精通',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.mastery) })
  }, {
    title: '「弈术·千夜一舞」释放伤害',
    dmg: ({ talent, attr, calc }, { basic }) => 
      basic((calc(attr.atk) * talent.e['技能伤害2'][0] + calc(attr.mastery) * talent.e['技能伤害2'][1]) / 100, 'e')
  }, {
    title: '「幻戏」虚影尾段月绽放',
    params: { huanXi: true },
    dmg: ({ talent, attr, calc, cons }, { basic, reaction }) => basic(calc(attr.mastery) * talent.e['幻戏虚影三段'] / 100 * (cons >= 2 ? 1.4 : 1.24), '', 'lunarBloom')
  }, {
    title: '「圣约·真眸幻戏」总伤',
    dmg: ({ talent, attr, calc }, { basic }) => 
      ['一段伤害2', '二段伤害2'].reduce((total, key) => {
        const dmg = basic((calc(attr.atk) * talent.q[key][0] + calc(attr.mastery) * talent.q[key][1]) / 100, 'q')
        return {
          dmg: total.dmg + dmg.dmg,
          avg: total.avg + dmg.avg
        }
      }, { dmg: 0, avg: 0 })
  }, {
    title: '「幻戏」单次重击总伤',
    params: { huanXi: true },
    dmg: calcHuanXiDamage
  }, {
    title: '单人站场一轮总伤',
    params: { huanXi: true },
    dmg: calcOneRoundTotal
  }, {
    // 菈乌玛 哥伦比娅 纳西妲
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「幻戏」单次总伤`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      huanXi: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: calcHuanXiDamage
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 站场一轮总伤`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      huanXi: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: calcOneRoundTotal
  }, {
    // 菈乌玛 哥伦比娅 爱诺
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}「幻戏」单次总伤`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      huanXi: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: calcHuanXiDamage
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 站场一轮总伤`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      huanXi: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: calcOneRoundTotal
  }, {
    // 菈乌玛 哥伦比娅 妮露
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「幻戏」单次总伤`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      huanXi: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: calcHuanXiDamage
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场一轮总伤`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      huanXi: true, dendro_two: true, '月辉明光': artis?.['穹境示现之夜'] >= 4 ? 2 : 1  
    }),
    dmg: calcOneRoundTotal
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defParams = { Moonsign: 2 }
export const defDmgIdx = 4
export const consDmgKey = '单人站场一轮总伤'
export const mainAttr = 'cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    title: '「月兆祝赐·廊下暮影」：基于精通提升月绽放反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ calc, attr }) => Math.min(calc(attr.mastery) * 0.0175, 14)
    }
  }, {
    title: '天赋「月下的豪赌」：满层「伪秘之帷」使元素精通提升[mastery]点',
    data: {
      mastery: ({ cons }) => cons >= 2 ? 200 : 100
    }
  }, {
    title: '「伪秘之帷」：满层使幻戏造成原本[huanxiPct]%的伤害，元素爆发伤害提升[qDmg]%',
    // 3层原本124%，2命5层最高140%
    data: {
      huanxiPct: ({ cons }) => (cons >= 2 ? 140 : 124),
      qDmg: ({ cons, talent }) => talent.q['伤害提升'] * (cons >= 2 ? 5 : 3)
    }
  }, {
    check: ({ params }) => params.huanXi === true,
    title: '1命「谋篇乃成败之始」：特殊重击「幻戏」基础伤害提升[fyplus]',
    sort: 9,
    cons: 1,
    data: {
      fyplus: ({ calc, attr }) => calc(attr.mastery) * 0.6
    }
  }, {
    title: '2命「明察为筹算之先」：满层「伪秘之帷」使元素精通提升至200点',
    cons: 2,
  }, {
    title: '4命「眩惑入谜局之网」：「影舞」状态下附近敌人草抗降低20%',
    cons: 4,
    data: {
      kx: 20
    }
  }, {
    title: '6命「决胜于逆转之时」：月绽放反应擢升15%，幻戏自身第二段转为基于元素精通85%的月绽放，额外一段基于元素精通120%的月绽放',
    cons: 6,
    data: {
      elevated: 15
    }
  }
]
