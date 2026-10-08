import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamDetail, withStdTeam, bounded } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '艾梅莉埃'

const team = ['玛薇卡', '杜林', '尼可']
const artifact_normal = ['草套', '天美']

const team_A = ['基尼奇', '杜林', '尼可']
const artifact_A = ['草套', '天美']

const teamParams = { pyro_two: true }
const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, teamParams)

// 伤害段数计数累加
const count = (value, fallback, max = 100) => value !== '' && Number.isFinite(Number(value))
  && value !== undefined && value !== null ? Math.max(0, Math.min(max, Math.floor(Number(value)))) : fallback
const addDmg = (total, ret) => {
  total.dmg += ret.dmg ?? ret.avg
  total.avg += ret.avg
}

// 队友buff覆盖率
const supportBuff = name => TeamBuff.find(buff => buff.check?.({ params: { [`${name}_low`]: true }, artis: {} }))
const bennettBuff = supportBuff('Bennett')
const mavuikaBuff = supportBuff('Mavuika')
const nicoleBuff = supportBuff('Nicole')
const durinBuff = supportBuff('Durin')
const buffValue = (buff, key, ds) => {
  if (!buff?.check?.(ds)) return 0
  const value = buff.data?.[key]
  return typeof value === 'function' ? value(ds) : value ?? 0
}
// 是否站场
const onField = (ds, time) => time < (ds.params.front_end ?? (ds.cons >= 6 ? 3 : 0))

/**
 * 队友buff循环伤害构成
 */
const evaluateHits = (ds, dmg, hits, startup = false) => {
  const { attr, calc, cons, params } = ds
  const bennett = buffValue(bennettBuff, 'atkPlus', ds)
  const mavuika = buffValue(mavuikaBuff, 'dmg', ds)
  const durinDmg = buffValue(durinBuff, 'dmg', ds)
  const durin = LIMITED_PLUS.Durin.plus(ds)
  let durinRemain = LIMITED_PLUS.Durin.limit(ds)
  const nicole = LIMITED_PLUS.Nicole.plus(ds)
  let nicoleRemain = LIMITED_PLUS.Nicole.limit
  const nicoleAtk = buffValue(nicoleBuff, 'atkPlus', ds)
  const nicoleDmg = buffValue(nicoleBuff, 'dmg', ds)
  const nicoleKx = buffValue(nicoleBuff, 'kx', ds)
  // 首轮2命减抗需要命中后才触发
  let c2Until = startup ? -Infinity : 10
  const variants = new Map()
  const total = { dmg: 0, avg: 0 }
  for (const hit of hits) {
    const { time, slot, pct, type } = hit
    const front = hit.front ?? onField(ds, time)
    const isPhy = type === 'a' || type === 'a2'
    const removeBennett = !front || time >= (params.bennett_end ?? 10)
    const removeMavuika = !front || time >= (params.mavuika_end ?? 12)
    const eligible = ['a', 'a2', 'a3', 'e', 'q'].includes(slot)
    // 杜林1命加算不限前台，切后台后剩余次数继续消耗
    const covered = durin > 0 && eligible && time < 20 && durinRemain > 0
    if (covered) durinRemain--
    const removeDurin = durin > 0 && eligible && !covered
    const nicoleCovered = nicole > 0 && eligible && time < 20 && nicoleRemain > 0
    if (nicoleCovered) nicoleRemain--
    const removeNicole = nicole > 0 && eligible && !nicoleCovered
    const ownKx = cons >= 2 && time < c2Until ? 30 : 0
    // 基尼奇2命减抗默认4秒时开始触发
    const kinichStart = params.kinich_start ?? 4
    const kinichKx = (params.Kinich_mid || params.Kinich_best)
      && time >= kinichStart && time < kinichStart + 16 ? 30 : 0
    const upgraded = params.Nicole_best || (front && time >= 3)
    const removeNicoleAtk = time >= 20 ? nicoleAtk : nicoleAtk && !upgraded ? 300 : 0
    const grassLeader = (params.Kinich_low || params.Kinich_mid || params.Kinich_best)
      && time >= kinichStart + 3 && time < kinichStart + 10
    const removeNicoleKx = time >= 20 || !(upgraded || grassLeader) ? nicoleKx : 0
    const removeNicoleDmg = !front || time >= 20 ? nicoleDmg : 0
    const removeNicoleIgnore = params.Nicole_best && time >= 20 ? 40 : 0
    // 剧团套站场2秒后失效
    const troupeDelta = ds.artis?.['黄金剧团'] >= 4
      ? (front && time >= 2 ? 0 : 25) - (params.off_field === false ? 0 : 25) : 0
    const key = `${slot}:${isPhy}:${removeBennett}:${removeMavuika}:${removeDurin}:${removeNicole}:${ownKx}:${kinichKx}:${troupeDelta}:${removeNicoleAtk}:${removeNicoleKx}:${removeNicoleDmg}:${removeNicoleIgnore}`
    if (!variants.has(key)) {
      const atk = { ...attr.atk, plus: attr.atk.plus - (removeBennett ? bennett : 0) - removeNicoleAtk }
      const patch = {
        atk,
        dmg: { plus: attr.dmg.plus - (removeMavuika ? mavuika : 0) - removeNicoleDmg },
        kx: isPhy ? 0 : attr.kx + ownKx + kinichKx - removeNicoleKx,
        enemy: { ignore: attr.enemy.ignore - removeNicoleIgnore },
        e: { dmg: attr.e.dmg + troupeDelta }
      }
      if (removeDurin || removeNicole) {
        patch[slot] = { ...patch[slot], plus: attr[slot].plus - (removeDurin ? durin : 0) - (removeNicole ? nicole : 0) }
      }
      // 物理普攻加成
      if (isPhy) {
        patch.phy = {
          base: attr.phy.base,
          plus: (attr.phy.plus || 0) + (removeMavuika ? 0 : mavuika) + (removeNicoleDmg ? 0 : nicoleDmg) + durinDmg
        }
      }
      variants.set(key, { fn: dmg.withAttr(patch), atk: calc(atk) })
    }
    const variant = variants.get(key)
    const dynamicDmg = (params.burning === false ? 0 : Math.min(36, variant.atk * 0.015))
      + (type === 'a1' && cons >= 1 ? 20 : 0)
    addDmg(total, variant.fn.dynamic(pct, slot,
      isPhy ? { dynamicPhy: dynamicDmg } : { dynamicDmg },
      isPhy ? 'phy' : false, type === 'c6' ? variant.atk * 3 : 0))
    if (cons >= 2 && (slot === 'e' || slot === 'q' || type === 'a1')) c2Until = time + 10
  }
  return total
}

const level2Hits = (talent, time = 0) => {
  const [pct, n] = talent.e['柔灯之匣·二阶攻击伤害2']
  return Array.from({ length: n }, (_, i) => ({ time: time + i * 0.3, slot: 'e', pct, type: 'e2' }))
}

const qWindow = cons => cons >= 4 ? 48 : 28

/**
 * 元素爆发命中段数，默认对单，4命以下3次，4命以上8次
 * @param {number} q_hits q命中段数
 */
const burstHits = ds => {
  const duration = qWindow(ds.cons)
  const ticks = []
  let nextTarget = 0
  for (let t = 3; t < duration; t += 3) {
    if (t < nextTarget) continue
    ticks.push(t + 2)
    nextTarget = t + (ds.cons >= 4 ? 4 : 7)
  }
  const maxDrops = Math.floor((duration - 1) / 3)
  const n = count(ds.params.q_hits, ticks.length, maxDrops)
  const times = n === ticks.length ? ticks : Array.from({ length: n }, (_, i) =>
    Math.round(5 + (maxDrops * 3 - 3) * i / Math.max(n - 1, 1)))
  return times.map(t => ({ time: t / 10, slot: 'q', pct: ds.talent.q['柔灯之匣·三阶攻击伤害'], type: 'q' }))
}

/**
 *  站场总伤，默认15秒
 *  startup       是否首轮
 *  backfield     是否切后台
 *  q_hits        Q命中次数，默认4命以上8次、4命以下3次
 *  q_anim        Q动画耗时，默认2
 *  ac_cycle      一轮A重耗时，默认1.5秒
 *  c6_hits       6命A重次数，默认2次
 *  bennett_end   班尼特加攻失效时序秒数，默认10
 *  mavuika_end   玛薇卡增伤失效时序秒数，默认12
 *  kinich_start  基尼奇2命减抗开始时序秒数，默认4
 *  burning       是否燃烧环境
 */
const rotationHits = (ds, startup = false, backfield = false) => {
  const { talent, cons, params } = ds
  const end = startup ? 150 : 200
  const resume = startup ? 0 : qWindow(cons)
  const qAnim = startup ? bounded(params.q_anim, 2, 0, 5) : 0
  const qAnimF = Math.round(qAnim * 10)
  const qEnd = startup ? qAnimF + qWindow(cons) : 0
  const allFront = startup && !backfield
  const queue = new Map()
  const push = hit => {
    const tick = Math.round(hit.time * 10)
    if (tick < 0 || tick >= end) return
    if (!queue.has(tick)) queue.set(tick, [])
    const marked = { ...hit, time: tick / 10 }
    if (allFront && marked.front === undefined) marked.front = true
    queue.get(tick).push(marked)
  }
  if (startup) {
    push({ time: 0, slot: 'e', pct: talent.e['技能伤害'], type: 'start', front: true })
    push({ time: 0.1, slot: 'e', pct: talent.e['灵息之刺伤害'], type: 'arkhe', front: true })
    burstHits(ds).forEach(hit => push({ ...hit, time: hit.time + qAnim }))
    if (!backfield) {
      const cycleF = Math.round(bounded(params.ac_cycle, 1.5, 0.5, 6) * 10)
      const c6Sets = cons >= 6 ? count(params.c6_hits, 2, 2) : 0
      for (let t = qAnimF, set = 0; t + cycleF <= end; t += cycleF, set++) {
        const c6 = set < c6Sets && t < qAnimF + 50
        push({ time: (t + 4) / 10, slot: 'a', pct: talent.a['一段伤害'], type: c6 ? 'c6' : 'a' })
        push({ time: (t + Math.round(cycleF / 2)) / 10, slot: 'a2', pct: talent.a['重击伤害'], type: c6 ? 'c6' : 'a2' })
      }
    }
  } else {
    burstHits(ds).forEach(push)
  }
  let level = startup ? 3 : params.burning === false ? 1 : 2
  let scents = 0
  let lastScent = 0
  let resumed = startup
  let nextC1 = 0
  let nextNicole = 0
  const hits = []
  for (let t = 0; t < end; t++) {
    if (params.burning !== false && t >= 5 && (t - 5) % 20 === 0) {
      scents++
      if (t >= resume) lastScent = t
    }
    if (!resumed && t >= resume) {
      resumed = true
      lastScent = t
    }
    if (startup && level === 3 && t >= qEnd) level = 1
    if (t >= resume && level === 2 && t - lastScent >= 80) {
      level = 1
      scents = 0
    }
    if (t >= resume && t % 5 === 0 && scents >= 2 && level !== 3) {
      scents -= 2
      if (level === 1) level = 2
      else push({ time: (t + 3) / 10, slot: '', pct: 600, type: 'a1' })
    }
    if (t >= resume + 15 && (t - resume) % 15 === 0) {
      if (level === 2) level2Hits(talent, t / 10).forEach(push)
      else if (level === 1) push({ time: t / 10, slot: 'e', pct: talent.e['柔灯之匣·一阶攻击伤害'], type: 'e1' })
    }
    for (const hit of queue.get(t) ?? []) {
      hits.push(hit)
      if (hit.type === 'c6') {
        scents++
        if (t >= resume) lastScent = t
      }
      if (cons >= 1 && params.burning !== false && hit.type !== 'a' && hit.type !== 'a2' && t >= nextC1) {
        scents++
        if (t >= resume) lastScent = t
        nextC1 = t + 29
      }
      // 尼可1命协同，视为站场角色造成的伤害
      if ((params.Nicole_mid || params.Nicole_best) && (hit.front ?? onField(ds, hit.time))
        && hit.type !== 'nicole1' && t >= nextNicole) {
        push({ time: (t + 1) / 10, slot: '', pct: 600, type: 'nicole1' })
        nextNicole = t + 60
      }
    }
  }
  return hits
}
const startupDmg = (ds, dmg) => evaluateHits(ds, dmg, rotationHits(ds, true), true)
const backfieldDmg = (ds, dmg) => evaluateHits(ds, dmg, rotationHits(ds, true, true), true)
const singleHit = (ds, dmg, slot, key, type = slot) => evaluateHits(ds, dmg, [
  { time: 0, slot, pct: key === null ? 600 : ds.talent[slot][key], type }
])
const box2Dmg = (ds, dmg) => evaluateHits(ds, dmg, level2Hits(ds.talent).slice(0, 1))
const qOneDmg = (ds, dmg) => singleHit(ds, dmg, 'q', '柔灯之匣·三阶攻击伤害')
const dewDmg = (ds, dmg) => singleHit(ds, dmg, '', null, 'a1')

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「柔灯之匣·一阶」伤害',
    dmg: (ds, dmg) => singleHit(ds, dmg, 'e', '柔灯之匣·一阶攻击伤害')
  }, {
    title: '「柔灯之匣·二阶」伤害',
    dmg: box2Dmg
  }, {
    title: '「清露香氛」伤害',
    dmg: dewDmg
  }, {
    title: '「灵息之刺」伤害',
    dmg: (ds, dmg) => singleHit(ds, dmg, 'e', '灵息之刺伤害')
  }, {
    title: '「香氛演绎」单段伤害',
    dmg: qOneDmg
  }, {
    title: ds => `「香氛演绎」对单${burstHits(ds).length}次总伤`,
    dmg: (ds, dmg) => evaluateHits(ds, dmg, burstHits(ds))
  }, {
    title: '6命重击伤害',
    cons: 6,
    dmg: (ds, dmg) => evaluateHits(ds, dmg, rotationHits(ds, true).filter(hit => hit.type === 'c6' && hit.slot === 'a2'))
  }, {
    title: '站场15秒总伤',
    dmg: startupDmg
  }, {
    ...teamDetail(mainCharName, team_A, artifact_A, 'Q切后台15秒总伤', backfieldDmg, teamParams)
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, '「柔灯之匣·二阶」', box2Dmg, teamParams)
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, '「香氛演绎」单段', qOneDmg, teamParams)
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, '「清露香氛」', dewDmg, teamParams)
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, '站场15秒总伤', startupDmg, teamParams)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 2
export const consDmgKey = '站场15秒总伤'
export const defParams = { burning: true, off_field: true }
export const mainAttr = 'atk,cpct,cdmg,dmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「余薰」：每收集两枚香韵额外触发一次600%攻击力的草伤'
  }, {
    title: ({ attr, calc }) => {
      const bonus = Math.min(36, (attr?.atk ? calc(attr.atk) : 0) * 0.015)
      return `天赋「精馏」：基于攻击力对燃烧目标增伤${bonus.toFixed(1)}%`
    }
  }, {
    title: '1命「淡香浸析」：元素战技与清露香氛伤害增加[eDmg]%',
    cons: 1,
    data: {
      eDmg: 20
    }
  }, {
    title: '2命「湖光顶调」：降低敌人30%草元素抗性',
    cons: 2
  }, {
    title: '6命「茉洁香迹」：普攻和重击转为草伤并提供300%攻击力基础增伤',
    cons: 6
  }
]
