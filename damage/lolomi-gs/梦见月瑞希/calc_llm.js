import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '梦见月瑞希'
// 星扩散作为主流玩法，瑞希自身不能直接触发星扩散，必须带奥黛塔
const team = ['奥黛塔', '迪奥娜', '七七']
const artifact_normal = ['炉火', '千岩']
// 沃雅妮莎主要还是水冰传统增伤，加入瑞希队伍的星扩散提升貌似不算大
const team_B = ['奥黛塔', '迪奥娜', '沃雅妮莎']
const artifact_B = ['炉火']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { cryo_two: true })

// 6命：常规扩散可暴击，暴击率固定30%、暴击伤害固定100%
const withSwirlCrit = (r, cons) => cons >= 6
  ? { dmg: r.avg * 2, avg: r.avg * 1.3 }
  : r

// 反应扩散走的 fykx 抗性区，与普通抗性 kx 区分
const kNumOf = (kx) => {
  const r = 10 - (kx || 0)
  return r >= 75 ? 1 / (1 + 3 * r / 100) : (r >= 0 ? (100 - r) / 100 : 1 - r / 200)
}

/**
 * 梦浮一轮总伤 - 常规扩散
 * EQ后持续10秒，默认木桩挂可扩散元素
 * E释放 + 扩散*8 + 被动额外风*3 + 1命额外风*3 + 1命特殊扩散*3 + E持续伤害*10 + Q释放 + Q梦念冲击波*5
 */
const calcNormalRotation = ({ talent, cons, attr, calc }, dmg) => {
  const eHit = dmg(talent.e['技能伤害'], 'e')
  const eDot = dmg(talent.e['持续攻击伤害'], 'e')
  const qHit = dmg(talent.q['技能伤害'], 'q')
  const qSnack = dmg(talent.q['梦念冲击波伤害'], 'q')
  const swirlUnit = dmg.reaction('swirl').avg
  // 1命触发3次
  const c1Triggers = cons >= 1 ? 3 : 0
  // 1命额外扩散伤害走fykx，能吃到风套加成
  const c1SwirlUnit = cons >= 1 ? dmg.reaction('swirl').avg : swirlUnit
  const kNum = kNumOf(attr.fykx)
  // 1命扩散额外伤害
  const c1BonusUnit = cons >= 1 ? calc(attr.mastery) * 11 * kNum : 0
  // 常规扩散伤害
  const swirlNormalUnit = c1SwirlUnit - c1BonusUnit
  // 1命额外风伤
  const c1Extra = cons >= 1
    ? dmg.basic(calc(attr.mastery) * 1000 / 100)
    : { dmg: 0, avg: 0 }
  // 被动额外风伤3次
  const passiveBoost = dmg.basic(calc(attr.mastery) * 1000 / 100, 'e')
  // 6命常规扩散可暴击
  const swirlCritAvg = cons >= 6 ? 1.3 : 1
  const swirlCritDmg = cons >= 6 ? 2 : 1
  return {
    dmg: eHit.dmg + eDot.dmg * 10 + qHit.dmg + qSnack.dmg * 5              
         + swirlNormalUnit * 8 * swirlCritDmg  
         + c1SwirlUnit * c1Triggers * swirlCritDmg      
         + c1Extra.dmg * c1Triggers               
         + passiveBoost.dmg * 3,                   
    avg: eHit.avg + eDot.avg * 10 + qHit.avg + qSnack.avg * 5
         + swirlNormalUnit * 8 * swirlCritAvg  
         + c1SwirlUnit * c1Triggers * swirlCritAvg      
         + c1Extra.avg * c1Triggers
         + passiveBoost.avg * 3,
  }
}

/**
 * 梦浮一轮总伤 - 星扩散
 * 伤害构成
 * E + 星扩散风*8 + 被动额外风*3 + 1命额外星扩散*3 + 1命反应星扩散*3 + 被动星扩散*3 + E持续*10 + Q + Q梦念冲击波*5 + 星扩散冰*3
 */
const calcStarRotation = ({ talent, cons, attr, calc }, dmg) => {
  const eHit = dmg(talent.e['技能伤害'], 'e')
  const eDot = dmg(talent.e['持续攻击伤害'], 'e')
  const qHit = dmg(talent.q['技能伤害'], 'q')
  const qSnack = dmg(talent.q['梦念冲击波伤害'], 'q')
  // 反应星扩散(风)
  const starSwirlUnit = dmg.reaction('starSwirlAnemo')
  // 1命触发3次
  const c1Triggers = cons >= 1 ? 3 : 0
  // 1命反应星扩散(风)
  const kNumStar = kNumOf(attr.kx)
  const cpctStar = (attr.cpct.base + attr.cpct.plus + (attr.starSwirlAnemoAttr?.cpct || 0)) / 100
  const cdmgStar = (attr.cdmg.base + attr.cdmg.plus + (attr.starSwirlAnemoAttr?.cdmg || 0)) / 100
  const boostBase = cons >= 1 ? calc(attr.mastery) * 5.5 * kNumStar * 0.6 : 0
  const c1StarUnit = {
    dmg: starSwirlUnit.dmg + boostBase * (1 + cdmgStar),
    avg: starSwirlUnit.avg + boostBase * (1 + cpctStar * cdmgStar)
  }
  // 1命额外星扩散
  const c1ExtraStar = cons >= 1
    ? dmg.basic(calc(attr.mastery) * 400 / 100, '', 'stellarVortex')
    : { dmg: 0, avg: 0 }
  // 被动额外风伤
  const passiveExtra = dmg.basic(calc(attr.mastery) * 1000 / 100, 'e')
  // 被动星扩散
  const passiveStar = dmg.basic(calc(attr.mastery) * 1000 / 100, '', 'stellarVortex')
  // 反应星扩散(冰)
  const cryoKx = (attr.kx || 0) + (attr.fykx || 0)
  const cryoScale = cons >= 2 ? kNumOf(cryoKx - 20) / kNumOf(cryoKx) : 1
  const cryoSwirlUnit = {
    dmg: dmg.reaction('starSwirlCryo').dmg * cryoScale,
    avg: dmg.reaction('starSwirlCryo').avg * cryoScale
  }
  return {
    dmg: eHit.dmg + starSwirlUnit.dmg * 8 + passiveExtra.dmg * 3
         + c1ExtraStar.dmg * c1Triggers + c1StarUnit.dmg * c1Triggers
         + passiveStar.dmg * 3 + eDot.dmg * 10 + qHit.dmg + qSnack.dmg * 5
         + cryoSwirlUnit.dmg * 3,
    avg: eHit.avg + starSwirlUnit.avg * 8 + passiveExtra.avg * 3
         + c1ExtraStar.avg * c1Triggers + c1StarUnit.avg * c1Triggers
         + passiveStar.avg * 3 + eDot.avg * 10 + qHit.avg + qSnack.avg * 5
         + cryoSwirlUnit.avg * 3,
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后元素精通',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.mastery) })
  }, {
    title: '「梦浮」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['持续攻击伤害'], 'e')
  }, {
    title: '「梦浮」强化单次风伤',
    params: { krms: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['持续攻击伤害'], 'e')
  }, {
    title: '「梦浮」强化单次星扩散',
    dmg: ({ attr, calc }, dmg) => dmg.basic(calc(attr.mastery) * 1000 / 100, '', 'stellarVortex')
  }, {
    title: '扩散反应伤害',
    dmg: ({ cons }, { reaction }) => withSwirlCrit(reaction('swirl'), cons)
  }, {
    title: '1命 额外风伤',
    cons: 1,
    dmg: ({ attr, calc }, dmg) => dmg.basic(calc(attr.mastery) * 10)
  }, {
    title: '1命 强化扩散伤害',
    cons: 1,
    params: { swrsy: true },
    dmg: ({ cons }, { reaction }) => withSwirlCrit(reaction('swirl'), cons)
  }, {
    title: '1命 反应星扩散',
    cons: 1,
    params: { swrsyStar: true },
    dmg: ({}, { reaction }) => reaction('starSwirlAnemo')
  }, {
    title: '1命 额外直伤星扩散',
    cons: 1,
    dmg: ({ attr, calc }, dmg) => dmg.basic(calc(attr.mastery) * 400 / 100, '', 'stellarVortex')
  }, {
    title: '「梦念冲击波」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['梦念冲击波伤害'], 'q')
  },
  ...(() => {
    const healEntry = (title, mult) => ({
      title,
      dmg: ({ attr, calc, talent }, { heal }) => {
        const [pct, flat] = talent.q['拾取点心回复生命值2']
        return heal((pct * calc(attr.mastery) / 100 + flat) * mult)
      }
    })
    return [
      healEntry('「梦见风名物点心」自身治疗量', 2),
      healEntry('「梦见风名物点心」队友治疗量', 1),
    ]
  })(), {
    title: '4命「泉轻流花暖」额外治疗量',
    cons: 4,
    dmg: ({ attr, calc }, { heal }) => heal(calc(attr.mastery) * 266 / 100)
  }, {
    title: '反应星扩散(风)伤害',
    dmg: ({}, { reaction }) => reaction('starSwirlAnemo')
  }, {
    title: '反应星扩散(冰)伤害',
    params: { noKx: 1 },
    dmg: ({}, { reaction }) => reaction('starSwirlCryo')
  }, {
    title: '站场10秒常规扩散总伤',
    params: { swrsy: true },
    dmg: (ds, dmg) => calcNormalRotation(ds, dmg)
  }, {
    title: '站场10秒星扩散总伤',
    dmg: (ds, dmg) => calcStarRotation(ds, dmg)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 强化星扩散`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true
    }),
    dmg: ({ attr, calc }, dmg) => dmg.basic(calc(attr.mastery) * 1000 / 100, '', 'stellarVortex')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 星扩散总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true
    }),
    dmg: (ds, dmg) => calcStarRotation(ds, dmg)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 强化星扩散`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true
    }),
    dmg: ({ attr, calc }, dmg) => dmg.basic(calc(attr.mastery) * 1000 / 100, '', 'stellarVortex')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 星扩散总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true
    }),
    dmg: (ds, dmg) => calcStarRotation(ds, dmg)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '站场10秒星扩散总伤'
export const mainAttr = 'mastery,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '被动「廓然梦生」：梦浮期间精通提升[mastery]点',
    // 精通转化，自身也能吃到10%的精通提升，但是不能经过6命的二次转化
    sort: 8,
    data: {
      mastery: ({ attr, calc }) => calc(attr.mastery) * 0.1
    }
  }, {
    check: ({ params }) => params.krms === true,
    title: '被动「廓然梦生」：梦浮期间下一次伤害提升[ePlus]',
    sort: 8,
    data: {
      ePlus: ({ attr, calc }) => calc(attr.mastery) * 1000 / 100
    }
  }, {
    // 这个天赋是梦浮期间队友有后台伤害才会触发，默认全局生效，如果测试单人木桩伤害需要注释掉这100精通
    title: '天赋「昼想夜梦」：梦浮期间元素精通提升[mastery]点',
    data: {
      mastery: 100
    }
  }, {
    title: '「梦浮」：扩散伤害提升[swirl]，星扩散伤害提升[stellarVortex]',
    sort: 9,
    data: {
      swirl: ({ attr, calc, talent }) => calc(attr.mastery) * parseFloat(talent.e['每100点精通提升扩散伤害百分比']) / 100,
      stellarVortex: ({ attr, calc, talent }) => calc(attr.mastery) * parseFloat(talent.e['每100点精通提升星扩散伤害百分比']) / 100,
      starSwirlAnemo: ({ attr, calc, talent }) => calc(attr.mastery) * parseFloat(talent.e['每100点精通提升星扩散伤害百分比']) / 100,
      starSwirlCryo: ({ attr, calc, talent }) => calc(attr.mastery) * parseFloat(talent.e['每100点精通提升星扩散伤害百分比']) / 100
    }
  }, {
    check: ({ params }) => params.swrsyStar === 1,
    title: '1命「宿雾若水遥」：下次星扩散伤害基础值提升[fyplus]',
    cons: 1,
    sort: 8,
    data: {
      fyplus: ({ attr, calc }) => calc(attr.mastery) * 5.5
    }
  }, {
    check: ({ params }) => params.swrsy === true,
    title: '1 命「宿雾若水遥」：下次扩散伤害基础值提升[fyplus]',
    cons: 1,
    sort: 9,
    data: {
      fyplus: ({ attr, calc }) => calc(attr.mastery) * 11
    }
  }, {
    // 火水冰雷增伤瑞希自己的扩散伤害吃不到
    // 2命的减抗在反应扩散和常会扩散使用 fykx ，常态减风抗使用 kx
    title: '2命「缠忆君影梦相见」：梦浮期间降低敌人[fykx]火水雷冰抗性',
    cons: 2,
    data: {
      fykx: 20
    }
  }, {
    check: ({ params }) => params.noKx !== 1,
    title: '2命「缠忆君影梦相见」：梦浮期间降低敌人[kx]%风抗',
    cons: 2,
    data: {
      kx: 20
    }
  }, {
    title: '6命「慕念萦心间」：扩散可暴击，星扩散暴击提升10%，暴伤提升20%；基于精通提升暴击[cpct], 暴伤[cdmg]',
    cons: 6,
    data: {
      stellarVortexCpct: 10,
      stellarVortexCdmg: 20,
      starSwirlAnemoCpct: 10,
      starSwirlAnemoCdmg: 20,
      starSwirlCryoCpct: 10,
      starSwirlCryoCdmg: 20,
      cpct: ({ attr, calc }) => Math.min(20, Math.max(0, calc(attr.mastery) - 500) * 0.04),
      cdmg: ({ attr, calc }) => Math.min(80, Math.max(0, calc(attr.mastery) - 500) * 0.16)
    }
  }
]
