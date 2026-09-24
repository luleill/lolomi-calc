import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '薇斯纳'

const team = ['奥黛塔', '沃雅妮莎', '尼可']
const artifact_normal = ['炉火', '千岩', '天美']

const team_A = ['奥黛塔', '沃雅妮莎', '珐露珊']
const artifact_A = ['炉火', '千岩']

const config = Config.getConfig('user', 'config')
const teamParams = { rotation: true }
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { ...teamParams })

// 整肃，2命以下默认4层，2命以上满层6层
const zhengsuStacks = (params, cons) => {
  const value = Number(params?.zhengsu ?? (cons >= 2 ? 6 : 4))
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 6)) : (cons >= 2 ? 6 : 4)
}
const hitCount = (value, fallback) => Number.isFinite(Number(value ?? fallback))
  ? Math.max(0, Math.floor(Number(value ?? fallback))) : fallback
const addDmg = (total, ret) => {
  total.dmg += ret.dmg ?? ret.avg
  total.avg += ret.avg
  return total
}

// 某个技能实际为多段的优先取 技能伤害2 进行计算
const talentHits = (talent, key) => {
  const pair = talent[`${key}2`]
  return Array.isArray(pair) ? pair : [talent[key], 1]
}

// 循环伤害构成
const createHitCalc = (ds, dmg) => {
  const { attr, cons, params = {} } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus({ params })
  let nicoleRemain = LIMITED_PLUS.Nicole.limit
  const qiQiPlus = LIMITED_PLUS.QiQi.plus({ params })
  const limit = LIMITED_PLUS.QiQi.limit
  let qiQiRemain = typeof limit === 'function' ? limit(ds) : limit
  const vodyaPlus = LIMITED_PLUS.Vodyanitsa.fyPlus({ params, element: '风' })
  let vodyaRemain = LIMITED_PLUS.Vodyanitsa.limit
  const baseC1 = cons >= 1 ? 20 : 0
  const variants = new Map()
  return (pct, slot, { sword = false, stacks = zhengsuStacks(params, cons), inStance = true, reaction = false } = {}) => {
    // 是否为星扩散伤害
    const ele = reaction || (sword && (params.Stellar ?? true) ? 'stellarVortex' : false)
    const nicoleSlot = ['a', 'a2', 'a3', 'e', 'q'].includes(slot)
    const nicoleCovered = nicolePlus > 0 && nicoleSlot && !reaction && nicoleRemain > 0
    if (nicoleCovered) nicoleRemain--
    const removeNicole = nicolePlus > 0 && nicoleSlot && !nicoleCovered
    const covered = qiQiPlus > 0 && ele === 'stellarVortex' && qiQiRemain > 0
    if (covered) qiQiRemain--
    const vodyaCovered = vodyaPlus > 0 && !!ele && vodyaRemain > 0
    if (vodyaCovered) vodyaRemain--
    const c1Delta = (cons >= 1 && inStance ? 20 : 0) - baseC1
    const removeQiQi = !!ele && qiQiPlus > 0 && !covered
    const removeVodya = !!ele && vodyaPlus > 0 && !vodyaCovered
    const key = `${slot}:${c1Delta}:${removeQiQi}:${removeVodya}:${removeNicole}`
    if (!variants.has(key)) {
      const patch = {}
      if (removeNicole) {
        patch[slot] = { plus: (attr[slot]?.plus ?? 0) - nicolePlus }
      }
      if (c1Delta) {
        for (const channel of ['stellarVortex', 'starSwirlAnemo', 'starSwirlCryo']) {
          patch[channel] = (attr[channel] ?? 0) + c1Delta
        }
      }
      if (removeQiQi || removeVodya) {
        patch.fyplus = (attr.fyplus ?? 0) - (removeQiQi ? qiQiPlus : 0) - (removeVodya ? vodyaPlus : 0)
      }
      variants.set(key, Object.keys(patch).length ? dmg.withAttr(patch) : dmg)
    }
    const fn = variants.get(key)
    const ret = reaction ? fn.reaction(reaction) : fn(pct, slot, ele)
    const mult = sword ? 1 + stacks / 10 : 1
    return { dmg: (ret.dmg ?? ret.avg) * mult, avg: ret.avg * mult }
  }
}

// 「翔风剑」伤害
const swordDamage = (ds, dmg, keys, slot = 'e') => {
  const hit = createHitCalc(ds, dmg)
  const total = { dmg: 0, avg: 0 }
  for (const key of keys) {
    const [pct, count] = talentHits(ds.talent[slot], key)
    for (let i = 0; i < count; i++) addDmg(total, hit(pct, slot, { sword: true }))
  }
  return total
}

// 6命「翔风剑·变移」伤害
const taDamage = (ds, dmg, swordOnly = false) => {
  const hit = createHitCalc(ds, dmg)
  const slot = ds.params?.ta_talent ?? 'e'
  const total = hit(200, slot, { sword: true })
  if (!swordOnly) {
    addDmg(total, hit(150, slot))
    addDmg(total, hit(ds.talent.e['风翎伤害'], 'e'))
  }
  return total
}


/**
 * 默认手法：开E → 一阶E → 二阶E → Q → 首次三阶E → 普攻与剩余三阶E穿插，6命每次三阶接1次变移
 * q_at_end = true                  ：可把Q调到最后收尾
 * normal_sets                      : 默认非满命2套普攻，满命1套普攻
 * wind_plume_hits                  : 默认触发12次风翎，没多少伤害，用于加剑气
 * anemoHits                        : 默认触发10次反应星扩散(风)
 * cryoHits                         : 默认触发3次反应星扩散(冰)
 * zhengsu_before_hit = false       ：2命以下从0层整肃叠起
 */
const calcRotation = (ds, dmg) => {
  const { talent, cons, params = {} } = ds
  const star = params.Stellar ?? true
  const cap = cons >= 1 ? 4 : 3
  const cfg = {
    normalSets: hitCount(params.normal_sets, cons >= 6 ? 1 : 2),
    windPlumeHits: hitCount(params.wind_plume_hits, 12),
    sanJieTimes: Math.min(hitCount(params.san_jie_times, cap), cap),
    anemoHits: star ? hitCount(params.swirl_anemo_hits, 10) : 0,
    cryoHits: star ? hitCount(params.swirl_cryo_hits, 3) : 0
  }
  const taHits = cons >= 6 ? Math.min(hitCount(params.ta_hits, cfg.sanJieTimes), cfg.sanJieTimes) : 0
  const actions = [{ type: 'start' }, { type: 'yi' }, { type: 'er' }]
  if (!(params.q_at_end ?? false)) actions.push({ type: 'q' })
  const openingSan = !(params.q_at_end ?? false) && cfg.sanJieTimes > 0
  if (openingSan) {
    actions.push({ type: 'san' })
    if (taHits > 0) actions.push({ type: 'ta' })
  }
  const groups = Math.max(cfg.sanJieTimes, 1)
  const portion = (count, i) => Math.ceil(count * (i + 1) / groups) - Math.ceil(count * i / groups)
  for (let i = 0; i < groups; i++) {
    actions.push({ type: 'normal', count: portion(cfg.normalSets, i) }, { type: 'plume', count: portion(cfg.windPlumeHits, i) })
    actions.push({ type: 'reaction', ele: 'starSwirlAnemo', count: portion(cfg.anemoHits, i) },
      { type: 'reaction', ele: 'starSwirlCryo', count: portion(cfg.cryoHits, i) })
    if (openingSan && i === 0) continue
    if (i < cfg.sanJieTimes) actions.push({ type: 'san' })
    if (i < taHits) actions.push({ type: 'ta' })
  }
  if (params.q_at_end ?? false) actions.push({ type: 'q' })

  const hit = createHitCalc(ds, dmg)
  const total = { dmg: 0, avg: 0 }
  let stacks = cons >= 2 ? 6 : 0
  let inStance = true
  let sanUsed = 0
  const gainBefore = params.zhengsu_before_hit ?? true
  for (const action of actions) {
    const gainsStack = ['yi', 'er', 'san', 'q'].includes(action.type)
    if (gainsStack && gainBefore) stacks = Math.min(stacks + 1, 6)
    const state = { stacks, inStance }
    const strike = (key, slot = 'e', sword = false) => {
      const [pct, count] = talentHits(talent[slot], sword && star ? key.replace(/伤害$/, '星扩散伤害') : key)
      for (let i = 0; i < count; i++) addDmg(total, hit(pct, slot, { ...state, sword }))
    }
    switch (action.type) {
      case 'start': strike('技能伤害'); break
      case 'yi': strike('翔风剑一阶伤害'); break
      case 'er':
        strike('翔风剑二阶伤害')
        strike('翔风剑二阶灵剑伤害', 'e', true)
        break
      case 'q': strike('灵剑伤害', 'q', true); break
      case 'normal':
        for (let i = 0; i < action.count; i++) {
          for (const stage of '一二三四五六') strike(`${stage}段伤害`, 'a')
        }
        break
      case 'plume':
        for (let i = 0; i < action.count; i++) strike('风翎伤害')
        break
      case 'san':
        strike('翔风剑三阶灵剑伤害', 'e', true)
        strike('翔风剑三阶灵剑最终段伤害', 'e', true)
        if (++sanUsed === cap) inStance = false
        break
      case 'ta': {
        state.inStance = inStance || (params.last_ta_in_stance ?? false)
        const slot = params.ta_talent ?? 'e'
        addDmg(total, hit(150, slot, state))
        addDmg(total, hit(200, slot, { ...state, sword: true }))
        if (state.inStance) strike('风翎伤害')
        break
      }
      case 'reaction':
        for (let i = 0; i < action.count; i++) addDmg(total, hit(0, 'fy', { ...state, reaction: action.ele }))
        break
    }
    if (gainsStack && !gainBefore) stacks = Math.min(stacks + 1, 6)
  }
  return total
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「巡风列装」普攻单段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['一段伤害'], 'a')
  }, {
    title: '风翎伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['风翎伤害'], 'e')
  }, {
    title: '「翔风剑·一阶」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['翔风剑一阶伤害'], 'e')
  }, {
    title: '「翔风剑·二阶」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['翔风剑二阶伤害'], 'e')
  }, {
    title: '「翔风剑·二阶」星扩散伤害',
    dmg: (ds, dmg) => swordDamage(ds, dmg, ['翔风剑二阶灵剑星扩散伤害'])
  }, {
    title: '「翔风剑·三阶」星扩散总伤',
    dmg: (ds, dmg) => swordDamage(ds, dmg, ['翔风剑三阶灵剑星扩散伤害', '翔风剑三阶灵剑最终段星扩散伤害'])
  }, {
    title: '「致礼·献予女皇陛下」星扩散伤害',
    dmg: (ds, dmg) => swordDamage(ds, dmg, ['灵剑星扩散伤害'], 'q')
  }, {
    title: '6命「翔风剑·变移」星扩散伤害',
    cons: 6,
    dmg: (ds, dmg) => taDamage(ds, dmg, true)
  }, {
    title: '反应星扩散(风)伤害',
    dmg: (ds, dmg) => createHitCalc(ds, dmg)(0, 'fy', { reaction: 'starSwirlAnemo' })
  }, {
    title: '反应星扩散(冰)伤害',
    dmg: (ds, dmg) => createHitCalc(ds, dmg)(0, 'fy', { reaction: 'starSwirlCryo' })
  }, {
    title: '「巡风列装」常规总伤',
    params: { Stellar: false, rotation: true, teamAtkLv: 1, teamMasteryLv: 0 },
    dmg: calcRotation
  }, {
    // 木桩自挂冰
    title: '「巡风列装」星扩散总伤',
    params: { Stellar: true, rotation: true, teamAtkLv: 1, teamMasteryLv: 0 },
    dmg: calcRotation
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 「翔风剑·三阶」`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_A, artifact_A).params, ...teamParams }),
    dmg: (ds, dmg) => swordDamage(ds, dmg, ['翔风剑三阶灵剑最终段星扩散伤害'])
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title} 「巡风列装」总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team_A, artifact_A).params, ...teamParams, rotation: true }),
    dmg: calcRotation
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「翔风剑·三阶」`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, ...teamParams }),
    dmg: (ds, dmg) => swordDamage(ds, dmg, ['翔风剑三阶灵剑最终段星扩散伤害'])
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「巡风列装」总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, ...teamParams, rotation: true }),
    dmg: calcRotation
  }, {

    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])
/**
 * Stellar : 辉映·星扩散状态
 * teamAtkLv : 根据队伍角色冰风元素类型加攻击力，默认3
 * teamMasteryLv : 根据队伍角色元素类型加攻击力，默认1
 * 默认三名冰风元素角色，薇斯纳自身算一名，测试木桩自行调整 teamAtkLv 和 teamMasteryLv
 */
export const defParams = { Stellar: true, teamAtkLv: 3, teamMasteryLv: 1 }
export const defDmgIdx = 6
export const consDmgKey = '「巡风列装」星扩散总伤'
export const mainAttr = 'atk,mastery,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: ({ params, cons }) => {
      if (params.rotation) return `天赋「仪典·春之行列」：${cons >= 2 ? '开E即满6层' : '从0层叠层'}`
      const stacks = zhengsuStacks(params, cons)
      return `天赋「仪典·春之行列」：${stacks}层整肃，翔风剑灵剑造成原本${100 + stacks * 10}%的伤害`
    },
  }, {
    title: '天赋「理典·冬之凯风」：攻击力提升[atkPct]%，精通提升[mastery]点',
    check: ({ params }) => params.Stellar ?? true,
    sort: 9,
    data: {
      atkPct: ({ params, cons }) => (params?.teamAtkLv ?? 3) * 6 * (cons >= 4 ? 3 : 1),
      mastery: ({ params, cons }) => (params?.teamMasteryLv ?? 1) * 25 * (cons >= 4 ? 3 : 1)
    }
  }, {
    title: '天赋「星耀祝礼·散华序饰」：基于攻击力提升星扩散反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    title: '1命「送冬的华宴」：可施放4次三阶翔风剑且首次三阶不耗剑气，星扩散反应伤害提升20%',
    cons: 1,
    data: {
      stellarVortex: 20,
      starSwirlAnemo: 20,
      starSwirlCryo: 20
    }
  }, {
    title: '2命「迎春的轮舞」：进入巡风列装模式直接获得满层整肃，满层时攻击力提升[atkPct]%',
    cons: 2,
    check: ({ params }) => params.rotation || !Number.isFinite(Number(params.zhengsu ?? 6)) || Number(params.zhengsu ?? 6) >= 6,
    data: {
      atkPct: 40
    }
  }, {
    title: '4命「先代的荣膺」：「理典·冬之凯风」的攻击力与精通提升效果变为三倍',
    cons: 4,
    check: ({ params }) => params.Stellar ?? true,
  }, {
    title: '6命「不移的赤忱」：三阶翔风剑后可施放「翔风剑·变移」，星扩散伤害擢升[elevated]%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
