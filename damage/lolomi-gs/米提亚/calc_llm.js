import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '米提亚'

const team = ['奥黛塔', '希诺宁', '瓦列里']
const artifact_normal = ['炉火']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

// 元素爆发
const qDmg = ({ attr, calc, talent }, { basic }, over = 0) => {
  const [atkPct, emPct] = talent.q['技能伤害2']
  return basic(calc(attr.atk) * atkPct / 100 + calc(attr.mastery) * emPct / 100 - over, 'q')
}

// 过载炉心
const implosionStar = ({ attr, calc, talent }, { basic }) =>
  basic(calc(attr.mastery) * talent.a['递变聚爆星超导伤害'] / 100, 'a2', 'stellarConduct')

// 稳态炉心
const c6Steady = (cons) => cons >= 6 ? 1.15 : 1
const steadyCore = ({ attr, calc, talent, cons }, { basic }) => {
  const ret = basic(calc(attr.atk) * talent.e['稳态炉心伤害'] / 100, 'e')
  return { dmg: ret.dmg * c6Steady(cons), avg: ret.avg * c6Steady(cons) }
}
// 稳态炉心溢出信标
const steadyConsumeStar = ({ attr, calc, talent, cons }, { basic }) => {
  const ret = basic(calc(attr.mastery) * talent.e['稳态炉心消耗递变信标伤害'] / 100, 'e', 'stellarConduct')
  return { dmg: ret.dmg * c6Steady(cons), avg: ret.avg * c6Steady(cons) }
}
// 稳态炉心引爆
const steadyDetonate = ({ attr, calc, talent, cons, params }, { basic }) => {
  const hold = params.beaconHold ?? (cons >= 1 ? 5 : 4)
  const one = basic(calc(attr.mastery) * talent.e['稳态炉心引爆伤害'] / 100, 'e', 'stellarConduct')
  return { dmg: one.dmg * hold * c6Steady(cons), avg: one.avg * hold * c6Steady(cons) }
}

// 队友buff限次
const makeLimitedOver = (plus, limit, slots) => {
  let remain = limit
  return (slot) => {
    if (!plus || !slots.includes(slot)) return 0
    const covered = Math.min(1, Math.max(0, remain))
    remain -= covered
    return plus * (1 - covered)
  }
}

// 瓦列里「攻斥指令」：雷直伤与星超导共用15层
const makeDirectiveOver = (plus, limit) => {
  let remain = limit
  return () => {
    const covered = Math.min(1, Math.max(0, remain))
    remain -= covered
    return { starKeep: covered > 0, over: plus * (1 - covered) }
  }
}

// 过载站场一轮总伤
// 手法：长E → Q → 特殊重击递变聚爆持续消耗信标
// implosions : 递变聚爆施放次数，还不清楚是初始伤害还是持续伤害，先默认2
// beacons    : 消耗的信标总数，默认基础16
//   供给估算：站场15秒，天赋每1.5秒恢复两枚，还不清楚消耗速度
//   6命过载30%概率恢复一枚
const calcOverloadRotation = (ds, calcApi) => {
  const { attr, calc, talent, cons, params } = ds
  const { basic } = calcApi
  const implosions = params.implosions ?? 2
  const supply = (params.beacons ?? 16) + (cons >= 1 ? 2 : 0)
  const beacons = Math.round(supply / (cons >= 6 ? 0.7 : 1))
  const nicoleOver = makeLimitedOver(LIMITED_PLUS.Nicole.plus({ params }), LIMITED_PLUS.Nicole.limit, ['a', 'a2', 'a3', 'e', 'q'])
  const xiloOver = makeLimitedOver(LIMITED_PLUS.Xilonen.plus({ params }), LIMITED_PLUS.Xilonen.limit, ['a', 'a2', 'a3'])
  const valPlus = LIMITED_PLUS.Valeriy.plus({ params, element: '雷' })
  const valFy = LIMITED_PLUS.Valeriy.fyPlus({ params, element: '雷' })
  const valHit = makeDirectiveOver(valPlus, LIMITED_PLUS.Valeriy.limit)
  const valNoFy = valFy > 0 ? calcApi.withAttr({ fyplus: (attr.fyplus ?? 0) - valFy }) : calcApi
  const v1 = valHit()
  const eHold = basic(calc(attr.atk) * talent.e['长按技能伤害'] / 100 - nicoleOver('e') - v1.over, 'e')
  const v2 = valHit()
  const q = qDmg(ds, calcApi, nicoleOver('q') + v2.over)
  let totalDmg = eHold.dmg + q.dmg
  let totalAvg = eHold.avg + q.avg
  for (let i = 0; i < implosions; i++) {
    const nStar = Math.floor(beacons / implosions) + (i < beacons % implosions ? 1 : 0)
    const vi = valHit()
    const init = basic(calc(attr.atk) * talent.a['递变聚爆伤害'] / 100 - nicoleOver('a2') - xiloOver('a2') - vi.over, 'a2')
    totalDmg += init.dmg
    totalAvg += init.avg
    for (let j = 0; j < nStar; j++) {
      const vs = valHit()
      const star = (vs.starKeep ? basic : valNoFy.basic)(calc(attr.mastery) * talent.a['递变聚爆星超导伤害'] / 100 - nicoleOver('a2') - xiloOver('a2') - vs.over, 'a2', 'stellarConduct')
      totalDmg += star.dmg
      totalAvg += star.avg
    }
  }
  if (cons >= 4) {
    const c4 = basic(calc(attr.mastery) * 4, '', 'stellarConduct')
    const n = Math.floor(beacons / 5)
    totalDmg += c4.dmg * n
    totalAvg += c4.avg * n
  }
  return { dmg: totalDmg, avg: totalAvg }
}

// 稳态后台一轮总伤
// steadyTicks   : 稳态炉心间歇雷伤次数，默认6
// steadyConsume : 后台攻击次数，不清楚攻击间隔，默认和过载次数一致
// beaconHold    : 引爆结算的携带信标数
const calcSteadyRotation = (ds, calcApi) => {
  const { attr, calc, talent, cons, params } = ds
  const { basic } = calcApi
  const ticks = params.steadyTicks ?? 6
  const hold = params.beaconHold ?? (cons >= 1 ? 5 : 4)
  const consume = params.steadyConsume ?? (params.beacons ?? 16) + (cons >= 1 ? 2 : 0) - hold
  const eTap = basic(calc(attr.atk) * talent.e['短按技能伤害'] / 100, 'e')
  const q = qDmg(ds, calcApi)
  const core = steadyCore(ds, calcApi)
  const cStar = steadyConsumeStar(ds, calcApi)
  const deto = steadyDetonate(ds, calcApi)
  let totalDmg = eTap.dmg + q.dmg + core.dmg * ticks + cStar.dmg * consume + deto.dmg
  let totalAvg = eTap.avg + q.avg + core.avg * ticks + cStar.avg * consume + deto.avg
  if (cons >= 4) {
    const c4 = basic(calc(attr.mastery) * 4, '', 'stellarConduct')
    const n = Math.floor((consume + hold) / 5)
    totalDmg += c4.dmg * n
    totalAvg += c4.avg * n
  }
  return { dmg: totalDmg, avg: totalAvg }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后精通',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.mastery) })
  }, {
    title: '过载「递变聚爆」星超导',
    dmg: implosionStar
  }, {
    title: '稳态「侦测炉心」星超导',
    params: { steady: true },
    dmg: steadyConsumeStar
  }, {
    title: '稳态「侦测炉心」尾段引爆星超导',
    params: { steady: true },
    dmg: steadyDetonate
  }, {
    title: '「解析·递变之理」伤害',
    dmg: qDmg
  }, {
    title: '4命协同星超导伤害',
    cons: 4,
    dmg: ({ attr, calc }, { basic }) => basic(calc(attr.mastery) * 4, '', 'stellarConduct')
  }, {
    title: '过载站场15秒总伤',
    dmg: calcOverloadRotation
  }, {
    title: '稳态后台15秒总伤',
    params: { steady: true },
    dmg: calcSteadyRotation
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「递变聚爆」星超导`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: implosionStar
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 过载站场总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: calcOverloadRotation
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 1
export const consDmgKey = '过载站场15秒总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'
// steady: true 稳态炉心后台
// beacons: 消耗信标数
// stellarConductLV: 极星辉域层数
export const defParams = { steady: false, beacons: 16, stellarConductLV: 8 }

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「星耀祝礼·极密协议」：基于精通提升星超导基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.mastery) * 0.028, 14)
    }
  }, {
    title: '天赋「超限易爆试剂」：满层信标提升暴击率[cpct]%',
    data: {
      cpct: 20
    }
  }, {
    check: ({ params }) => params.steady === true,
    title: '天赋「基准承压测验」稳态：每携带一枚信标精通提升30点',
    data: {
      mastery: ({ params, cons }) => (params.beaconHold ?? (cons >= 1 ? 5 : 4)) * 30
    }
  }, {
    check: ({ params }) => params.steady !== true,
    title: '1命「缺位寻踪的观察者」：递变信标携带上限提升至5枚，暴击伤害提升50%',
    cons: 1,
    data: {
      cdmg: 50
    }
  }, {
    title: '2命「惰性之外的沉寂物」：炉心存在期间极星辉域内敌人冰/雷抗性降低20%',
    cons: 2,
    data: {
      kx: 20
    }
  }, {
    check: ({ params }) => params.steady === true,
    title: '2命「惰性之外的沉寂物」稳态：队伍中附近角色精通提升100点',
    cons: 2,
    data: {
      mastery: 100
    }
  }, {
    check: ({ params }) => params.steady !== true,
    title: '2命「惰性之外的沉寂物」过载：当前场上角色精通提升200点',
    cons: 2,
    data: {
      mastery: 200
    }
  }, {
    title: '6命「元素阶跃的理之门」：稳态炉心造成原本115%伤害，星超导反应伤害擢升20%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
