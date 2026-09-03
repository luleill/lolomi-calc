import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '莱欧斯利'
// 现版本7.0正常只能走星超导队伍，其他融化队伍，带芙宁娜的传统增伤队伍不考虑
// 0命莱欧斯利需要频繁压血线触发强化重击，所以队友不能带奶，七七、迪奥娜和阿罗夏不考虑
const team = ['奥黛塔', '八重神子', '尼可']
const artifact_normal = ['炉火', '天美']

const team_B = ['奥黛塔', '八重神子', '希诺宁']
const artifact_B = ['炉火', '烬城']

/**
 * 留一点融化的说明，据说正常附着情况下普攻第一段和第四段可融化，通过3A闪A接A可触发在第五段融化
 * 太麻烦了我不考虑写融化，看到这有想加融化队伍的自己加
 */

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { isStar: true, cryo_two: true })

/** 
 * 攻速影响站场时间内的输出段数
 * HIT_T ：    常态五段普攻每段动作大约耗时，默认一轮5A共耗时3秒
 * ROUND_T ：  一轮5AZ耗时，默认重击耗时1秒
 */ 
const HIT_T = [0.55, 0.55, 0.6, 0.6, 0.7]
const ROUND_T = HIT_T.reduce((a, b) => a + b, 0) + 1.0

/**
 * 专武根据精炼等级有不同攻速加成，再加上4命的20%攻速
 */
const spdAuto = (weapon, refine, cons) =>
  (weapon?.name === '金流监督' ? ([8, 10, 12, 14, 16][refine] ?? 0) : 0) + (cons >= 4 ? 20 : 0)

/**
 * 星超导循环伤害构成
 * @returns {{ set, sz, s5x, szx, c6, star, boost, p3, p5 }} 
 * 五段合计/星超导重击/6命额外冰锥/6命判断/星超导伤害构成/1命额外系数/星超导普攻第三段和第五段系数
 */
const stellarRoundParts = ({ talent, cons, attr, calc }, dmg) => {
  const { basic } = dmg
  const atk = calc(attr.atk)
  const c6 = cons >= 6 ? 1 : 0
  const p3 = cons < 2 ? 60 : 90
  const p5 = cons < 2 ? 80 : 120
  const pZ = cons < 2 ? 100 : 150
  const star = (mult, pct, slot = '') => basic(atk * mult * pct / 10000, slot, 'stellarConduct')
  const boost = (r) => cons >= 1 ? { dmg: r.dmg * 1.5, avg: r.avg * 1.5 } : r
  const s5 = boost(star(talent.a['五段伤害'], p5, 'a'))
  const set = '一二三四五'.split('').reduce((acc, num) => {
    const pct = num === '三' ? p3 : 0
    const r = num === '五' ? s5
      : !pct ? dmg(talent.a[`${num}段伤害`], 'a')
      : star(talent.a[`${num}段伤害`], pct, 'a')
    return { dmg: acc.dmg + r.dmg, avg: acc.avg + r.avg }
  }, { dmg: 0, avg: 0 })
  const sz = boost(star(talent.a['重击伤害'], pZ, 'a2'))
  const s5x = { dmg: s5.dmg * 0.2, avg: s5.avg * 0.2 }
  const szx = { dmg: sz.dmg * 0.2, avg: sz.avg * 0.2 }
  return { set, sz, s5x, szx, c6, star, boost, p3, p5 }
}

/**
 * 单轮5AZ星超导
 */
const calcStellarRotation = (ds, dmg) => {
  const { set, sz, s5x, szx, c6 } = stellarRoundParts(ds, dmg)
  return {
    dmg: set.dmg + sz.dmg + (s5x.dmg + szx.dmg) * c6,
    avg: set.avg + sz.avg + (s5x.avg + szx.avg) * c6
  }
}

/**
 * 0命Q收尾时E持续时间已经结束，吃不到天赋的30%攻击加成
 */
const qNoFullBuff = (q, u, atk, base) => {
  const r = (atk - base * 0.3) / atk
  return { dmg: u.dmg + (q.dmg - u.dmg) * r, avg: u.avg + (q.avg - u.avg) * r }
}

/**
 * 纯单人15秒站场总伤，只有纯冰伤
 */
const calcSoloRotation = ({ talent, cons, attr, params, weapon, refine, calc }, dmg) => {
  const zCount = (cons >= 1 ? 3 : 2) * (cons >= 6 ? 2 : 1)
  const c2a = cons >= 2 ? 1.25 : 1
  const c2a2 = cons >= 2 ? 1.3 : 1
  const set = '一二三四五'.split('')
    .reduce((acc, num) => {
      const hit = dmg(talent.a[`${num}段伤害`], 'a')
      return { dmg: acc.dmg + hit.dmg * c2a, avg: acc.avg + hit.avg * c2a }
    }, { dmg: 0, avg: 0 })
  const azRaw = dmg(talent.a['重击伤害'], 'a2')
  const az = { dmg: azRaw.dmg * c2a2, avg: azRaw.avg * c2a2 }
  const q = dmg(talent.q['技能伤害'], 'q')
  const qFin = cons === 0 ? qNoFullBuff(q, dmg(0, 'q'), calc(attr.atk), attr.atk.base) : q
  const total = {
    dmg: set.dmg * 3 + az.dmg * zCount + qFin.dmg,
    avg: set.avg * 3 + az.avg * zCount + qFin.avg
  }
  const spd = params.spd ?? spdAuto(weapon, refine, cons)
  if (spd) {
    const k = 1 + spd / 100
    let free = 12 * spd / (100 + spd)
    if (free >= ROUND_T / k) {
      total.dmg += set.dmg + az.dmg
      total.avg += set.avg + az.avg
      free -= ROUND_T / k
    }
    for (let i = 0; i < 5 && free >= HIT_T[i] / k; i++) {
      const hit = dmg(talent.a[`${'一二三四五'[i]}段伤害`], 'a')
      total.dmg += hit.dmg * c2a
      total.avg += hit.avg * c2a
      free -= HIT_T[i] / k
    }
  }
  return total
}

/**
 * 星超导15秒站场总伤
 * 0命默认手法：开E + 5A5A + Z + 5AZ + Q收尾
 * 1命及以上默认手法：开E + 5AZ循环 + Q收尾
 * Q默认耗时3秒，实际普攻时间12秒，实战打桩一般不用Q，要对比Q的命座提升所以在总伤里加入Q的伤害
 * 0命实战手法实际为 5A + 3A 即可接Z，省点事就默认基础3轮5A + 2Z
 * 天赋「罪业终有报偿之时」的加攻击只有在E持续时间内能吃到，0命q收尾吃不到这个加攻击buff
 * E基础持续10秒，1命加4秒，Q收尾也能吃到攻击加成
 */
const calcSoloStellarRotation = (ds, dmg) => {
  const { talent, cons, attr, params, weapon, refine, calc } = ds
  const { basic } = dmg
  const { set, sz, s5x, szx, c6, star, boost, p3, p5 } = stellarRoundParts(ds, dmg)
  const zCount = cons >= 1 ? 3 : 2
  const q = dmg(talent.q['技能伤害'], 'q')
  const qFin = cons === 0 ? qNoFullBuff(q, dmg(0, 'q'), calc(attr.atk), attr.atk.base) : q
  const total = {
    dmg: set.dmg * 3 + sz.dmg * zCount + (s5x.dmg * 3 + szx.dmg * zCount) * c6 + qFin.dmg,
    avg: set.avg * 3 + sz.avg * zCount + (s5x.avg * 3 + szx.avg * zCount) * c6 + qFin.avg
  }
  const spd = params.spd ?? spdAuto(weapon, refine, cons)
  const extraGroups = []
  if (spd) {
    const k = 1 + spd / 100
    let free = 12 * spd / (100 + spd)
    if (free >= ROUND_T / k) {
      total.dmg += set.dmg + sz.dmg + (s5x.dmg + szx.dmg) * c6
      total.avg += set.avg + sz.avg + (s5x.avg + szx.avg) * c6
      free -= ROUND_T / k
      extraGroups.push({ key: 'a', n: 2 }, { key: 'as', n: 1 }, { key: 'a', n: 1 }, { key: 'as', n: 1 }, { key: 'sz', n: 1 })
    }
    for (let i = 0; i < 5; i++) {
      const t = HIT_T[i] / k
      if (free < t) break
      const num = '一二三四五'[i]
      const pct = num === '三' ? p3 : num === '五' ? p5 : 0
      const r = !pct ? dmg(talent.a[`${num}段伤害`], 'a')
        : num === '五' ? boost(star(talent.a[`${num}段伤害`], pct, 'a'))
        : star(talent.a[`${num}段伤害`], pct, 'a')
      total.dmg += r.dmg
      total.avg += r.avg
      if (num === '五' && c6) {
        total.dmg += s5x.dmg
        total.avg += s5x.avg
      }
      free -= t
      extraGroups.push({ key: pct ? 'as' : 'a', n: 1 })
    }
  }
  for (const [lim, qHit] of [[LIMITED_PLUS.Nicole, true], [LIMITED_PLUS.Xilonen, false]]) {
    const limPlus = lim.plus({ params })
    if (!limPlus) continue
    const groups = []
    for (let i = 0; i < 3; i++) {
      groups.push({ key: 'a', n: 2 }, { key: 'as', n: 1 }, { key: 'a', n: 1 }, { key: 'as', n: 1 })
      if (cons >= 1 || i > 0) groups.push({ key: 'sz', n: 1 })
    }
    groups.push(...extraGroups)
    if (qHit) groups.push({ key: 'q', n: 1 })
    let remain = lim.limit
    const over = { a: 0, as: 0, sz: 0, q: 0 }
    for (const g of groups) {
      const c = Math.min(remain, g.n)
      remain -= c
      over[g.key] += g.n - c
    }
    const slotPlus = (k) => attr[k] ? attr[k].plus : 0
    const sub = (u, plus, n) => {
      if (!plus || !n) return
      const k = limPlus / plus * n
      total.dmg -= u.dmg * k
      total.avg -= u.avg * k
    }
    sub(dmg(0, 'a'), slotPlus('a'), over.a)
    sub(basic(0, 'a', 'stellarConduct'), slotPlus('a'), over.as * 1.2)
    sub(basic(0, 'a2', 'stellarConduct'), slotPlus('a2'), over.sz * 1.2)
    if (qHit) sub(dmg(0, 'q'), slotPlus('q'), over.q)
  }
  return total
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「斥逐拳」常态单段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['一段伤害'], 'a')
  }, {
    title: '「斥逐拳」第三段星超导伤害',
    params: { isStar: true },
    dmg: ({ attr, calc, talent, cons }, { basic }) => basic(calc(attr.atk) * talent.a['三段伤害'] * (cons < 2 ? 60 : 90) / 10000, 'a', 'stellarConduct')
  }, {
    title: '「斥逐拳」第五段星超导伤害',
    params: { isStar: true },
    dmg: ({ attr, calc, talent, cons }, { basic }) => {
      const r = basic(calc(attr.atk) * talent.a['五段伤害'] * (cons < 2 ? 80 : 120) / 10000, 'a', 'stellarConduct')
      const m = cons >= 1 ? 1.5 : 1
      return { dmg: r.dmg * m, avg: r.avg * m }
    }
  }, {
    title: '「惩戒·凌跃拳」伤害',
    dmg: ({ talent, cons }, dmg) => {
      const r = dmg(talent.a['重击伤害'], 'a2')
      const m = cons >= 2 ? 1.3 : 1
      return { dmg: r.dmg * m, avg: r.avg * m }
    }
  }, {
    title: '「天辉·凌跃拳」星超导伤害',
    params: { isStar: true },
    dmg: ({ attr, calc, talent, cons }, { basic }) => {
      const pZ = cons < 2 ? 100 : 150
      const r = basic(calc(attr.atk) * talent.a['重击伤害'] * pZ / 10000, 'a2', 'stellarConduct')
      const m = cons >= 1 ? 1.5 : 1
      return { dmg: r.dmg * m, avg: r.avg * m }
    }
  }, {
    title: '「黑金狼噬」总伤',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「5AZ」一轮普攻加重击总伤',
    dmg: ({ talent, cons }, dmg) => {
      const c2a = cons >= 2 ? 1.25 : 1
      const c2a2 = cons >= 2 ? 1.3 : 1
      const set = '一二三四五'.split('').reduce((acc, num) => {
        const hit = dmg(talent.a[`${num}段伤害`], 'a')
        return { dmg: acc.dmg + hit.dmg * c2a, avg: acc.avg + hit.avg * c2a }
      }, { dmg: 0, avg: 0 })
      const az = dmg(talent.a['重击伤害'], 'a2')
      const azCount = cons < 6 ? 1 : 2
      return { dmg: set.dmg + az.dmg * azCount * c2a2, avg: set.avg + az.avg * azCount * c2a2 }
    }
  }, {
    title: '一轮普攻加重击星超导总伤',
    params: { isStar: true },
    dmg: (ds, dmg) => calcStellarRotation(ds, dmg)
  }, {
    title: '纯单人站场15秒总伤',
    dmg: (ds, dmg) => calcSoloRotation(ds, dmg)
  }, {
    title: '伪单人站场15秒星超导总伤',
    // 伪单人星超导叠层默认2层
    params: { isStar: true, stellarConductLV: 2 },
    dmg: (ds, dmg) => calcSoloStellarRotation(ds, dmg)
  }, {
    // 尼可和希诺宁的四命效果有次数限制，正常情况下不会留给强化重击，队伍的强化重击默认不吃四命基础值加成
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 「天辉·凌跃拳」`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      isStar: true, cryo_two: true
    }),
    dmg: ({ attr, calc, talent, cons }, { basic }) => {
      const pZ = cons < 2 ? 100 : 150
      const r = basic(calc(attr.atk) * talent.a['重击伤害'] * pZ / 10000, 'a2', 'stellarConduct')
      const unit = basic(0, 'a2', 'stellarConduct')
      const m = cons >= 1 ? 1.5 : 1
      return { dmg: (r.dmg - unit.dmg) * m, avg: (r.avg - unit.avg) * m }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 站场15秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      isStar: true, cryo_two: true
    }),
    dmg: (ds, dmg) => calcSoloStellarRotation(ds, dmg)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「天辉·凌跃拳」`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      isStar: true, cryo_two: true
    }),
    dmg: ({ attr, calc, talent, cons }, { basic }) => {
      const pZ = cons < 2 ? 100 : 150
      const r = basic(calc(attr.atk) * talent.a['重击伤害'] * pZ / 10000, 'a2', 'stellarConduct')
      const unit = basic(0, 'a2', 'stellarConduct')
      const m = cons >= 1 ? 1.5 : 1
      return { dmg: (r.dmg - unit.dmg) * m, avg: (r.avg - unit.avg) * m }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场15秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      isStar: true, cryo_two: true
    }),
    dmg: (ds, dmg) => calcSoloStellarRotation(ds, dmg)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 5
export const consDmgKey = '伪单人站场15秒星超导总伤'
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '元素战技「冰牙突驰」：斥逐拳普攻造成的伤害提升[_aMulti]%',
    data: {
      _aMulti: ({ talent }) => talent.e['强化斥逐拳伤害'],
      aMulti: ({ talent }) => talent.e['强化斥逐拳伤害'] - 100
    }
  }, {
    title: '天赋「公理终有辩诉之日」：下次惩戒·凌跃拳造成的伤害提升[a2Dmg]%',
    data: {
      a2Dmg: ({ cons }) => cons >= 1 ? 200 : 50
    }
  }, {
    title: '天赋「罪业终有报偿之时」：E持续时间内满层时攻击力提升[atkPct]%',
    data: {
      atkPct: 30
    }
  }, {
    check: ({ params }) => params.isStar === true,
    title: '天赋「冤苦终有显明之期」：星超导伤害提升[stellarConduct]%',
    data: {
      stellarConduct: 30
    }
  }, {
    title: '1命「予行恶者以惩惧」：惩戒·凌跃拳伤害提升至200%，辉映星超导状态普攻第五段和天辉·凌跃拳伤害提升50%',
    cons: 1,
  }, {
    title: '2命「予骄暴者以镣锁」：元素爆发伤害提升[qDmg]%',
    cons: 2,
    data: {
      qDmg: 200
    }
  }, {  
    title: '4命「予贞苦者以拯赎」：凌跃拳回血提升至50%，治疗溢出时攻速提升20%',
    cons: 4,
  }, {
    title: '6命「予无罪者以念抚」：强化重击凌跃拳暴击率提升10%，暴击伤害提升80%',
    cons: 6,
    data: {
      a2Cpct: 10,
      a2Cdmg: 80
    }
  }, {
    check: ({ params }) => params.isStar === true,
    cons: 6,
    title: '6命「予无罪者以念抚」：辉映星超导状态下强化斥逐拳暴击率提升10%，暴击伤害提升80%',
    data: {
      aCpct: 10,
      aCdmg: 80
    }
  }
]