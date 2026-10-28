import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamDetail, withStdTeam, bounded } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '那维莱特'

const team = ['沃雅妮莎', '茜特菈莉', '尼可']
const artifact_normal = ['烬城', '天美']

const team_A = ['沃雅妮莎', '茜特菈莉', '芙宁娜']
const artifact_A = ['烬城']

const teamParams = { hydro_two: true, reaction_types: 2 }
const teamParams_A = { hydro_two: true, reaction_types: 1 }
const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, teamParams)

const stacks = ({ cons, params }) => Math.floor(bounded(params.a1_stacks,
  Math.min(3, Math.floor(bounded(params.reaction_types, 3, 0, 3)) + (cons >= 1 ? 1 : 0)), 0, 3))
const hydroBonus = ratio => Math.max(0, Math.min(30, (ratio - 0.3) * 60))
const initialRatio = params => bounded(params.hp_ratio, 100, 1, 100) / 100
const weaponName = ds => ds.weapon?.name || ds.attr.weapon?.name
const refinement = ds => Math.floor(bounded(ds.refine, 0, 0, 4))
const hpAt = (ds, jade = true) => ds.calc(ds.attr.hp) - (weaponName(ds) === '遗祀玉珑' && !jade
  ? ds.attr.hp.base * (32 + 8 * refinement(ds)) / 100 : 0)
const add = (total, ret) => {
  total.dmg += ret.dmg ?? ret.avg
  total.avg += ret.avg
}

const createHitCalc = (ds, dmg) => {
  const { attr, params, cons } = ds
  const xilonen = LIMITED_PLUS.Xilonen.plus(ds)
  const vodya = LIMITED_PLUS.Vodyanitsa.plus(ds)
  const nicole = LIMITED_PLUS.Nicole.plus(ds)
  const wname = weaponName(ds)
  const refine = refinement(ds)
  const baseRatio = initialRatio(params)
  const baseHydro = hydroBonus(baseRatio)
  const st = stacks(ds)
  let xilonenLeft = Math.floor(bounded(params.xilonen_hits, 6, 0, LIMITED_PLUS.Xilonen.limit))
  let vodyaLeft = Math.floor(bounded(params.vodyanitsa_hits, 25, 0, LIMITED_PLUS.Vodyanitsa.limit))
  let nicoleLeft = Math.floor(bounded(params.nicole_hits, LIMITED_PLUS.Nicole.limit, 0, LIMITED_PLUS.Nicole.limit))
  return (hit, state = {}) => {
    const front = state.front !== false
    const hp = hpAt(ds, state.jade)
    const slot = hit.slot
    const normalType = ['a', 'a2', 'a3'].includes(slot)
    const skillType = normalType || slot === 'e' || slot === 'q'
    const xCovered = xilonen > 0 && normalType && xilonenLeft > 0
      && (hit.time ?? 0) < bounded(params.xilonen_until, 15, 0, 60)
    const vCovered = vodya > 0 && !!slot && front && vodyaLeft > 0
    const nCovered = nicole > 0 && skillType && nicoleLeft > 0 && (hit.time ?? 0) < 20
    if (xCovered) xilonenLeft--
    if (vCovered) vodyaLeft--
    if (nCovered) nicoleLeft--
    const freedom = normalType ? 0 : params.Kazuha_best ? 32 : params.Kazuha_mid ? 16 : 0
    const patch = {
      dmg: { plus: attr.dmg.plus + hydroBonus(state.ratio ?? baseRatio) - baseHydro - freedom },
      cpct: { plus: attr.cpct.plus + (ds.artis?.['逐影猎人'] >= 4 ? ((state.hunter ?? 3) - 3) * 12 : 0) },
      cdmg: { plus: attr.cdmg.plus - (!front && params.Vodyanitsa_mid && !params.Vodyanitsa_best ? 50 : 0) },
      a2: { dmg: attr.a2.dmg + (wname === '万世流涌大典' ? ((state.tome ?? 3) - 3) * (14 + 4 * refine) : 0) }
    }
    if (wname === '遗祀玉珑' && state.jade === false) {
      patch.hp = { pct: attr.hp.pct - (32 + 8 * refine) }
      patch.mastery = { plus: attr.mastery.plus - (40 + 10 * refine) }
    }
    if (slot) patch[slot] = { ...patch[slot], plus: attr[slot].plus
      - (normalType && !xCovered ? xilonen : 0) - (!vCovered ? vodya : 0) - (skillType && !nCovered ? nicole : 0) }
    const fn = dmg.withAttr(patch)
    const ele = hit.vape ? 'vaporize' : false
    if (hit.equitable) return fn.basic(hp * hit.pct / 100 * [1, 1.1, 1.25, 1.6][st], 'a2', ele,
      { dynamicCdmg: cons >= 2 ? st * 14 : 0 })
    if (hit.hp) return fn.basic(hp * hit.pct / 100, slot, ele)
    return fn(hit.pct, slot, ele)
  }
}
const equitableHit = (ds, dmg, pct = ds.talent.a['重击·衡平推裁持续伤害'], vape = false) =>
  createHitCalc(ds, dmg)({ slot: 'a2', equitable: true, pct, vape })
const burstDmg = (ds, dmg) => {
  const hit = createHitCalc(ds, dmg)
  const total = { dmg: 0, avg: 0 }
  for (const key of ['技能伤害', '水瀑伤害', '水瀑伤害']) add(total, hit({ slot: 'q', hp: true, pct: ds.talent.q[key] }))
  return total
}

/**
 * 重击总伤时间轴
 * c6_extend:false 是否触发六命吸收水滴延长重击时间
 */
const simulate = (ds, dmg, mode = 'eq') => {
  const { params, cons, talent, attr, calc } = ds
  const weapon = weaponName(ds)
  const refine = refinement(ds)
  const extended = cons >= 6 && params.c6_extend !== false && mode !== 'beam'
  const hitCalc = dmg ? createHitCalc(ds, dmg) : null
  const total = { dmg: 0, avg: 0 }
  const counts = { e: 0, q: 0, arkhe: 0, beam: 0, current: 0, absorbed: 0, c4: 0 }
  const beams = []
  const queue = new Map()
  // 当前血量比例，效果叠层
  let ratio = initialRatio(params)
  // 场上源水之滴
  let droplets = []
  let beam = null
  // 收尾帧：默认3600即60秒硬上限
  let finish = 3600
  // 最后一次命中帧，除以60即站场秒数时长
  let lastHit = 0
  let front = true
  // 上次切人帧，遗祀玉珑前台计时用
  let fieldSince = 0
  let jade = true
  // 四命下次可再产水滴的帧（每4秒=240帧一枚）
  let c4Next = 0
  // 六命洪流下次可触发的帧（每2秒=120帧一道）
  let c6Next = 0
  let hunter = 0
  // 逐影猎人层数有效帧（5秒=300帧）
  let hunterUntil = -1
  let tome = 0
  // 万世流涌层数有效帧（4秒=240帧）
  let tomeUntil = -1
  // 万世流涌下次可叠层（0.3秒=18帧）
  let tomeNext = 0
  let effectiveHeal = 0
  const push = (t, fn) => {
    t = Math.round(t)
    if (t < 0 || t >= 3600) return
    if (!queue.has(t)) queue.set(t, [])
    queue.get(t).push(fn)
  }
  const spawn = (t, count) => {
    droplets = droplets.filter(expiry => expiry > t)
    for (let i = 0; i < count; i++) droplets.push(t + 900)
    droplets = droplets.slice(-12)
  }
  // 血量变动叠层，逐影和万世
  const change = (t, delta) => {
    const before = ratio
    ratio = Math.max(0, Math.min(1, ratio + delta))
    if (!front || Math.abs(ratio - before) < 1e-9) return
    hunter = Math.min(3, (t < hunterUntil ? hunter : 0) + 1)
    hunterUntil = t + 300
    if (t >= tomeNext) {
      tome = Math.min(3, (t < tomeUntil ? tome : 0) + 1)
      tomeUntil = t + 240
      tomeNext = t + 18
    }
  }
  const heal = (t, pct, flat = 0, bonus = calc(attr.heal)) => {
    const hp = hpAt(ds, jade)
    const amount = (hp * pct / 100 + flat) * Math.max(0, 1 + (bonus + attr.heal.inc) / 100)
    effectiveHeal += Math.min(1 - ratio, amount / hp) * hp
    change(t, amount / hp)
    if (cons >= 4 && front && amount > 0 && t >= c4Next) {
      c4Next = t + 240
      counts.c4++
      spawn(t, 1)
    }
  }
  const consume = t => {
    droplets = droplets.filter(expiry => expiry > t)
    if (!droplets.length) return false
    droplets.shift()
    counts.absorbed++
    // 吸收水滴延迟5帧结算治疗
    push(t + 5, () => heal(t + 5, 16))
    return true
  }
  const setFront = (t, value) => {
    front = value
    fieldSince = t
  }
  const emit = (t, kind, hit) => {
    counts[kind]++
    lastHit = Math.max(lastHit, t)
    if (hitCalc) add(total, hitCalc({ ...hit, time: t / 60 }, {
      ratio, front, jade, hunter: t < hunterUntil ? hunter : 0, tome: t < tomeUntil ? tome : 0
    }))
  }
  const skill = t => {
    // 元素战技，23帧结算，60帧后追加灵息之刺
    push(t, () => setFront(t, true))
    push(t + 23, () => {
      emit(t + 23, 'e', { slot: 'e', hp: true, pct: talent.e['技能伤害'] })
      spawn(t + 23, 3)
    })
    push(t + 60, () => emit(t + 60, 'arkhe', { slot: false, pct: talent.e['灵息之刺伤害'] }))
  }
  const charge = (t, index) => push(t + 3, () => {
    // 起手延迟3帧
    let absorbed = 0
    while (absorbed < 3 && consume(t + 3)) absorbed++
    // 吸0/1/2/3滴对应的起手前摇帧数
    const hold = 209 - [0, 57, 111, 209][absorbed]
    // 重击窗口约176帧，首段+9帧，扣血从+43帧起，吸水滴从+3帧起
    beam = { index, start: t + hold, end: t + hold + 176, next: t + hold + 9,
      drain: t + hold + 43, check: t + hold + 3, ticks: 0, extra: 0 }
  })
  if (mode === 'beam') {
    spawn(0, 3)
    charge(0, 0)
  } else {
    skill(0)
    // Q和后续两段水瀑命中帧位：125/165/184
    for (const [offset, key] of [[95, '技能伤害'], [135, '水瀑伤害'], [154, '水瀑伤害']]) {
      push(30 + offset, () => emit(30 + offset, 'q', { slot: 'q', hp: true, pct: talent.q[key] }))
    }
    // Q收尾在184帧产6枚水滴
    push(184, () => spawn(184, 6))
    if (weapon === '试作金珀') {
      // 试作金珀：150/270/390帧各回一口血
      for (const t of [150, 270, 390]) push(t, () => heal(t, 4 + refine * 0.5))
    }
    // 首次重击186帧开始，非六命在394和602帧继续两轮重击
    charge(186, 0)
    if (!extended) {
      charge(394, 1)
      charge(602, 2)
    }
  }
  for (let t = 0; t <= finish && t < 3600; t++) {
    if (weapon === '遗祀玉珑') {
      // 连续前台满600帧(10秒)失效，切后台后满300帧(5秒)重置
      if (front && t - fieldSince >= 600) jade = false
      if (!front && t - fieldSince >= 300) jade = true
    }
    for (const fn of queue.get(t) ?? []) fn()
    if (!beam) continue
    if (t === beam.check) {
      if (extended && beam.end - t <= 60 && consume(t)) {
        beam.end += 60
        beam.extra++
      }
      beam.check += 18
    }
    if (t === beam.drain) {
      // 重击每30帧扣一次血，且需要血线高于50%
      if (ratio > 0.5) change(t, -0.08)
      beam.drain += 30
    }
    if (t === beam.next || t === beam.end) {
      // 重击：首段伤害后间隔22帧，其后每25帧一段，大约0.4秒攻击间隔
      emit(t, 'beam', { slot: 'a2', equitable: true, pct: talent.a['重击·衡平推裁持续伤害'] })
      beam.ticks++
      beam.next = t + (beam.ticks === 1 ? 22 : 25)
      if (cons >= 6 && t >= c6Next) {
        // 六命洪流：每120帧(2秒)触发，延迟29帧命中
        c6Next = t + 120
        for (let i = 0; i < 2; i++) push(t + 29, () => emit(t + 29, 'current', { slot: 'a2', equitable: true, pct: 10 }))
      }
    }
    if (t === beam.end) {
      beams.push({ start: beam.start / 60, end: t / 60, ticks: beam.ticks, extra: beam.extra })
      const index = beam.index
      beam = null
      // 收尾时机：留30帧缓冲
      if (mode === 'beam' || (extended && mode === 'eq')
        || (!extended && index === 2)) finish = t + 30
    }
  }
  return { total, counts, beams, effectiveHeal, ratio, seconds: lastHit / 60 }
}
const eqDmg = (ds, dmg) => simulate(ds, dmg, 'eq').total
const beamOneDmg = (ds, dmg) => equitableHit(ds, dmg)

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '「衡平推裁」重击伤害',
    dmg: beamOneDmg
  }, {
    title: '「衡平推裁」重击蒸发',
    dmg: (ds, dmg) => equitableHit(ds, dmg, ds.talent.a['重击·衡平推裁持续伤害'], true)
  }, {
    title: '元素爆发伤害',
    dmg: burstDmg
  }, {
    title: '单枚源水之滴治疗',
    dmg: ({ attr, calc }, dmg) => dmg.heal(calc(attr.hp) * 0.16)
  }, {
    title: '6命额外洪流伤害',
    cons: 6,
    dmg: (ds, dmg) => equitableHit(ds, dmg, 10)
  }, {
    title: '6命EQ重击持续时长',
    cons: 6,
    dmg: ds => {
      const ret = simulate(ds, null, 'eq')
      return { avg: `${(ret.beams[0].end - ret.beams[0].start).toFixed(2)}秒`, type: 'text' }
    }
  }, {
    title: '单轮重击总伤',
    dmg: (ds, dmg) => simulate(ds, dmg, 'beam').total
  }, {
    title: 'EQ一轮总伤',
    dmg: eqDmg
  }, {
    ...teamDetail(mainCharName, team_A, artifact_A, '重击单段', beamOneDmg, teamParams_A)
  }, {
    ...teamDetail(mainCharName, team_A, artifact_A, 'EQ一轮总伤', eqDmg, teamParams_A)
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, '重击单段', beamOneDmg, teamParams)
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, 'EQ一轮总伤', eqDmg, teamParams)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 1
export const consDmgKey = 'EQ一轮总伤'
export const mainAttr = 'hp,cpct,cdmg,dmg'
// reaction_types 大权天赋叠层，默认2层，单人可以对比1命提升效果，1命会自动加一层，纯单人测试改为0
export const defParams = { hp_ratio: 100, reaction_types: 2 }

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「古海孑遗的权柄」：[_stacks]层遗龙之荣，重击造成原本[_power]%的伤害',
    data: {
      _stacks: ({ cons, params }) => Math.floor(Number.isFinite(Number(params.a1_stacks ?? NaN))
        ? Math.max(0, Math.min(3, Number(params.a1_stacks)))
        : Math.min(3, Math.floor(Number.isFinite(Number(params.reaction_types ?? NaN)) ? Math.max(0, Math.min(3, Number(params.reaction_types))) : 3) + (cons >= 1 ? 1 : 0))),
      _power: ({ cons, params }) => [100, 110, 125, 160][Math.floor(Number.isFinite(Number(params.a1_stacks ?? NaN))
        ? Math.max(0, Math.min(3, Number(params.a1_stacks)))
        : Math.min(3, Math.floor(Number.isFinite(Number(params.reaction_types ?? NaN)) ? Math.max(0, Math.min(3, Number(params.reaction_types))) : 3) + (cons >= 1 ? 1 : 0)))]
    }
  }, {
    title: '天赋「至高仲裁的纪律」：基于当前生命值超过30%的部分获得[dmg]%水伤',
    data: {
      dmg: ({ params }) => Math.max(0, Math.min(30, ((Number.isFinite(Number(params.hp_ratio ?? NaN))
        ? Math.max(1, Math.min(100, Number(params.hp_ratio))) : 100) - 30) * 0.6))
    }
  }, {
    title: '当前剧诗buff：增加20%生命',
    data: {
      hpPct: 20
    }
  }, {
    title: '1命「尊荣的创定」：登场时获得一层遗龙之荣，并提高抗打断能力',
    cons: 1
  }, {
    title: '2命「律法的命诫」：[_stacks]层遗龙之荣为重击增加[_cdmg]%暴伤',
    cons: 2,
    data: {
      _stacks: ({ cons, params }) => Math.floor(Number.isFinite(Number(params.a1_stacks ?? NaN))
        ? Math.max(0, Math.min(3, Number(params.a1_stacks)))
        : Math.min(3, Math.floor(Number.isFinite(Number(params.reaction_types ?? NaN)) ? Math.max(0, Math.min(3, Number(params.reaction_types))) : 3) + (cons >= 1 ? 1 : 0))),
      _cdmg: ({ cons, params }) => Math.floor(Number.isFinite(Number(params.a1_stacks ?? NaN))
        ? Math.max(0, Math.min(3, Number(params.a1_stacks)))
        : Math.min(3, Math.floor(Number.isFinite(Number(params.reaction_types ?? NaN)) ? Math.max(0, Math.min(3, Number(params.reaction_types))) : 3) + (cons >= 1 ? 1 : 0))) * 14
    }
  }, {
    title: '4命「悲悯的冠冕」：在场上受到治疗时每4秒产生一枚水滴',
    cons: 4
  }, {
    title: '6命「忿怒的报偿」：吸收一枚水滴重击时间延长1秒，重击额外触发两道洪流',
    cons: 6
  }
]
