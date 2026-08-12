import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '蓝砚'

const team = ['珐露珊', '杜林', '尼可']
const artifact_normal = ['千岩', '天美']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { c4: true, pyro_two: true })

// 普攻一轮，倍率不高，带楼阁应该也打不了什么伤害，没什么实际意义
const aRound = (talent, dmg) => [
  dmg(talent.a['一段伤害'], 'a'),
  dmg(talent.a['二段伤害2'][0], 'a'),
  dmg(talent.a['二段伤害2'][1], 'a'),
  dmg(talent.a['三段伤害2'][0], 'a'),
  dmg(talent.a['三段伤害2'][1], 'a'),
  dmg(talent.a['四段伤害'], 'a')
].reduce((acc, r) => ({ dmg: acc.dmg + r.dmg, avg: acc.avg + r.avg }), { dmg: 0, avg: 0 })

// 一轮总伤
// 默认输出手法：Q + E翦月环 + 6命和祭礼判断E的期望循环次数
//   单枚翦月环命中后基础3次伤害，扩散转化对应3次染色伤害
//   1命额外抛一枚翦月环，伤害段数与基础翦月环一致
//   祭礼残章刷新cd，期望重置次数 = 1-(1-p)^E基础释放次数，p：精炼等级40%~80%
// 总伤构成：Q三段伤害 + (翦月环+染色附加)×3×环数×E期望次数 + 扩散×次数
const rotationDmg = (ds, dmg) => {
  const { talent, cons, params = {}, weapon, refine, attr } = ds
  const qOne = dmg(talent.q['技能伤害2'][0], 'q')
  const q = { dmg: qOne.dmg * 3, avg: qOne.avg * 3 }
  const ring = dmg(talent.e['翦月环伤害'], 'e')
  const conv = dmg(talent.e['翦月环伤害'] * 50 / 100, 'e', 'coloringDmg')
  // 翦月环基础 3 段伤害
  const hitsPerRing = 3
  const baseE = cons >= 6 ? 2 : 1
  // 祭礼残章重置概率
  const sacriP = weapon?.name === '祭礼残章' ? ([0.4, 0.5, 0.6, 0.7, 0.8][refine] ?? 0.4) : 0
  const eTimes = baseE + (sacriP > 0 ? 1 - Math.pow(1 - sacriP, baseE) : 0)
  const ringPerE = cons >= 1 ? 2 : 1
  const swirlUnit = dmg.reaction('swirl').avg
  // 扩散期望次数：Q触发1次 + 每枚翦月环触发1次； 可自定义扩散次数 swirl_times 
  const swirlTimes = params.swirl_times ?? Math.ceil(ringPerE * eTimes + 1)
  const c4Flat = cons >= 4 && params.c4 ? 60 * 774 / 100 : 0
  const qPlus = attr.q.plus || 0
  const qUnit = c4Flat && qPlus ? dmg(0, 'q') : { dmg: 0, avg: 0 }
  // 元素爆发伤害扣除4命加成比例，q本身吃不到4命加成
  const qOverRatio = qPlus ? c4Flat / qPlus * 3 : 0
  // 尼可、杜林，队友限次buff超次扣除
  // buff超次部分扣除 该来源加成贡献 × 未覆盖比例 
  const over = { dmg: 0, avg: 0 }
  // sources：当前队伍实际生效的限次来源（低配low不会触发杜林尼可命座效果）
  const sources = []
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  if (nicolePlus) sources.push({ plus: nicolePlus, limit: LIMITED_PLUS.Nicole.limit })
  const durinPlus = LIMITED_PLUS.Durin.plus(ds)
  if (durinPlus) sources.push({ plus: durinPlus, limit: LIMITED_PLUS.Durin.limit })
  if (sources.length) {
    // 翦月环和染色附加伤害都会消耗buff次数
    const ePerCycle = hitsPerRing * ringPerE * 2
    const groups = [{ key: 'q', n: 3 }]
    const full = Math.floor(eTimes)
    for (let i = 0; i < full; i++) groups.push({ key: 'e', n: ePerCycle })
    const frac = eTimes - full
    if (frac > 0) groups.push({ key: 'e', n: ePerCycle * frac })
    // 总攻击数
    const total = { q: 3, e: ePerCycle * eTimes }
    for (const src of sources) {
      const limit = typeof src.limit === 'function' ? src.limit(ds) : src.limit
      let remain = limit
      // 吃到buff的攻击数
      const covered = { e: 0, q: 0 }
      for (const g of groups) {
        if (remain <= 0) break
        const c = Math.min(remain, g.n)
        covered[g.key] += c
        remain -= c
      }
      // 限次buff未覆盖部分
      for (const key of ['e', 'q']) {
        const plus = attr[key].plus
        if (!plus) continue
        const ratio = src.plus * (total[key] - covered[key]) / plus
        over.dmg += dmg(0, key).dmg * ratio
        over.avg += dmg(0, key).avg * ratio
      }
    }
  }
  return {
    dmg: q.dmg + (ring.dmg + conv.dmg) * hitsPerRing * ringPerE * eTimes + swirlUnit * swirlTimes - qUnit.dmg * qOverRatio - over.dmg,
    avg: q.avg + (ring.avg + conv.avg) * hitsPerRing * ringPerE * eTimes + swirlUnit * swirlTimes - qUnit.avg * qOverRatio - over.avg
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「凤缕护盾」基础吸收量',
    dmg: ({ talent, calc, attr }, { shield }) => shield(talent.e['护盾吸收量2'][0] * calc(attr.atk) / 100 + talent.e['护盾吸收量2'][1])
  }, {
    title: '「翦月环」单段伤害',
    params: { c4: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['翦月环伤害'], 'e')
  }, {
    title: '「翦月环」染色单段伤害',
    params: { c4: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['翦月环伤害'] * 50 / 100, 'e', 'coloringDmg')
  }, {
    title: '染色环境「翦月环」总伤',
    params: { c4: true },
    dmg: (ds, dmg) => {
      const { talent, cons } = ds
      const ring = dmg(talent.e['翦月环伤害'], 'e')
      const conv = dmg(talent.e['翦月环伤害'] * 50 / 100, 'e', 'coloringDmg')
      const ringTimes = cons >= 1 ? 2 : 1
      const swirl = dmg.reaction('swirl').avg * ringTimes
      return {
        dmg: (ring.dmg + conv.dmg) * 3 * ringTimes + swirl,
        avg: (ring.avg + conv.avg) * 3 * ringTimes + swirl
      }
    }
  }, {
    title: '普攻一轮总伤',
    params: { c4: true },
    dmg: ({ talent }, dmg) => aRound(talent, dmg)
  }, {
    // kūn‌，鹍弦:用鹍鸡筋做的琵琶弦，后泛指琴弦
    title: '「鹍弦踏月出」总伤',
    dmg: ({ talent }, dmg) => {
      const one = dmg(talent.q['技能伤害2'][0], 'q')
      return { dmg: one.dmg * 3, avg: one.avg * 3 }
    }
  }, {
    title: '扩散反应伤害',
    params: { c4: true },
    dmg: ({}, { reaction }) => reaction('swirl')
  }, {
    title: '站场一轮总伤',
    params: { c4: true },
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} Q单段伤害`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, pyro_two: true }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害2'][0], 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 一轮总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, c4: true, pyro_two: true }),
    dmg: rotationDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 2
export const consDmgKey = '站场一轮总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「苍翎镇邪敕符」：基于元素精通，元素战技伤害值提升[ePlus]，元素爆发提升[qPlus]',
    sort: 9,
    data: {
      ePlus: ({ attr, calc }) => calc(attr.mastery) * 309 / 100,
      qPlus: ({ attr, calc }) => calc(attr.mastery) * 774 / 100
    }
  }, {
    title: '1命「若有人兮云之际」：元素战技发生元素转化后额外抛出一枚翦月环',
    cons: 1,
  }, {
    title: '4命「揽龙鹰兮结血珠」：施放元素爆发后元素精通提升[mastery]',
    cons: 4,
    check: ({ params }) => params.c4,
    data: {
      mastery: 60
    }
  }
]
