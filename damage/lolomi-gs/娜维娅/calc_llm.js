import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '娜维娅'

const team = ['希诺宁', '尼可', '杜林']
const artifact_normal = ['烬城', '宗室', '美赐']

const team_A = ['希诺宁', '五郎', '尼可']
const artifact_A = ['烬城', '千岩']

const team_B = ['希诺宁', '尼可', '芙宁娜']
const artifact_B = ['烬城', '宗室']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,
  ({ cons }) => ({ geo_two: true, pyro_two: true, Xilonen_geo: true, shrapnel: cons >= 6 ? 6 : 3 }))

// 岩附魔普攻一轮4A总伤
const aRound = ({ talent }, dmg) => '一二三四'.split('').reduce((acc, num) => {
  if (num === '三') {
    const h = dmg(talent.a['三段伤害2'][0], 'a')
    acc.dmg += h.dmg * 3
    acc.avg += h.avg * 3
  } else {
    const h = dmg(talent.a[`${num}段伤害`], 'a')
    acc.dmg += h.dmg
    acc.avg += h.avg
  }
  return acc
}, { dmg: 0, avg: 0 })

// 队友buff期望次数拆分
// 尼可4命8次、杜林1命基础20次、希诺宁4命6次
const plusOverflow = (ds, dmg) => {
  const { attr, cons } = ds
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds)
  const durinPlus = LIMITED_PLUS.Durin.plus(ds)
  const xiloPlus = LIMITED_PLUS.Xilonen.plus(ds)
  if (!nicolePlus && !durinPlus && !xiloPlus) return { dmg: 0, avg: 0 }
  const seq = ['q', 'e', ...Array(6).fill('a'), 'e', ...Array(7).fill('q'),
    ...Array(cons >= 2 ? 2 : 0).fill('q')]
  const effect = (limit) => seq.slice(0, limit).reduce((ret, key) => {
    ret[key]++
    return ret
  }, { a: 0, e: 0, q: 0 })
  const total = effect(seq.length)
  const nicole = effect(LIMITED_PLUS.Nicole.limit)
  const durin = effect(LIMITED_PLUS.Durin.limit(ds))
  const xiloOverA = xiloPlus * Math.max(total.a - LIMITED_PLUS.Xilonen.limit, 0)
  return ['a', 'e', 'q'].reduce((acc, key) => {
    const plus = attr[key].plus
    if (!plus) return acc
    const over = (nicolePlus * (total[key] - nicole[key]) + durinPlus * (total[key] - durin[key]) +
      (key === 'a' ? xiloOverA : 0)) / plus
    const unit = dmg(0, key)
    acc.dmg += unit.dmg * over
    acc.avg += unit.avg * over
    return acc
  }, { dmg: 0, avg: 0 })
}

// 一轮站场总伤，约6秒
// 手法：默认已存满弹片，Q + E + 岩附魔4A + E
// 支援炮击默认命中7发，2命每次E额外降1发
const rotationDmg = (ds, dmg) => {
  const { talent, cons } = ds
  const q = dmg(talent.q['技能伤害'], 'q')
  const bombard = dmg(talent.q['支援炮击伤害'], 'q')
  const bombardHits = 7 + (cons >= 2 ? 2 : 0)
  const e = dmg(talent.e['玫瑰晶弹基础伤害'] * 2, 'e')
  const a4 = aRound(ds, dmg)
  const over = plusOverflow(ds, dmg)
  return {
    dmg: q.dmg + bombard.dmg * bombardHits + e.dmg * 2 + a4.dmg - over.dmg,
    avg: q.avg + bombard.avg * bombardHits + e.avg * 2 + a4.avg - over.avg
  }
}

// 队伍
const teamEntry = (teamNames, artifact, extraParams = {}) => [{
  title: ({ cons }) => `${teamConfig(cons, teamNames, artifact, mainCharName).title} 满晶片伤害`,
  params: ({ cons }) => ({
    ...teamConfig(cons, teamNames, artifact).params,
    geo_two: true, Xilonen_geo: true, shrapnel: cons >= 6 ? 6 : 3,
    ...extraParams
  }),
  dmg: ({ talent }, dmg) => dmg(talent.e['玫瑰晶弹基础伤害'] * 2, 'e')
}, {
  title: ({ cons }) => `${teamConfig(cons, teamNames, artifact, mainCharName).title} 6秒站场总伤`,
  params: ({ cons }) => ({
    ...teamConfig(cons, teamNames, artifact).params,
    geo_two: true, Xilonen_geo: true, shrapnel: cons >= 6 ? 6 : 3,
    ...extraParams
  }),
  dmg: rotationDmg
}]

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.atk)) })
  }, {
    title: '「典仪式晶火」0晶片伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['玫瑰晶弹基础伤害'], 'e')
  }, {
    title: '「典仪式晶火」3晶片伤害',
    params: { shrapnel: 3 },
    dmg: ({ talent }, dmg) => dmg(talent.e['玫瑰晶弹基础伤害'] * 2, 'e')
  }, {
    title: '「典仪式晶火」6晶片伤害',
    params: { shrapnel: 6 },
    dmg: ({ talent }, dmg) => dmg(talent.e['玫瑰晶弹基础伤害'] * 2, 'e')
  }, {
    title: '「流涌之刃」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['流涌之刃伤害'], 'e')
  }, {
    title: '岩附魔普攻一轮4A总伤',
    dmg: aRound
  }, {
    title: '「如霰澄天的鸣礼」首次伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「支援炮击」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['支援炮击伤害'], 'q')
  }, {
    title: '伪单人6秒站场总伤',
    // 有后台队友触发天赋加攻，不考虑双岩buff
    params: ({ cons }) => ({ shrapnel: cons >= 6 ? 6 : 3 }),
    dmg: rotationDmg
  },
  ...teamEntry(team_A, artifact_A, { mutual: 1 }),
  ...teamEntry(team_B, artifact_B),
  ...teamEntry(team, artifact_normal, { pyro_two: true }),
  {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '伪单人6秒站场总伤'
export const mainAttr = 'atk,dmg,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「不明流通渠道」：E后4秒普攻、重击与下落攻击转为岩伤且伤害提升[aDmg]%',
    data: {
      aDmg: 40,
      a2Dmg: 40,
      a3Dmg: 40
    }
  }, {
    // 计算条目默认都是吃满2层，队伍伤害根据具体队伍元素数量传入mutual
    title: '天赋「互助关系网」：队伍中[_mutual]位火/雷/冰/水角色，攻击力提升[atkPct]%',
    data: {
      _mutual: ({ params }) => params.mutual ?? 2,
      atkPct: ({ params }) => (params.mutual ?? 2) * 20
    }
  }, {
    title: '典仪式晶火：消耗3枚弹片，全部命中时造成原本200%的伤害'
  }, {
    check: ({ params }) => params.shrapnel > 3,
    title: '典仪式晶火：消耗弹片[_shrapnel]枚，典仪式晶火伤害提升[eDmg]%',
    data: {
      _shrapnel: ({ params }) => params.shrapnel,
      eDmg: ({ params }) => (params.shrapnel - 3) * 15
    }
  }, {
    check: ({ params }) => params.shrapnel !== undefined,
    title: '2命「总指挥的乘胜追击」：消耗弹片[_shrapnel]枚，提升典仪式晶火暴击率[eCpct]%',
    cons: 2,
    data: {
      _shrapnel: ({ params }) => params.shrapnel,
      eCpct: ({ params }) => Math.min(36, params.shrapnel * 12)
    }
  }, {
    title: '4命「铭誓者的绝不姑息」：如霰澄天的鸣礼命中降低敌人20%岩抗',
    cons: 4,
    data: {
      kx: 20
    }
  }, {
    check: ({ params }) => params.shrapnel > 3,
    title: '6命「刺玫会长的灵活手腕」：消耗弹片[_shrapnel]枚，典仪式晶火爆伤提升[eCdmg]%',
    cons: 6,
    data: {
      _shrapnel: ({ params }) => params.shrapnel,
      eCdmg: ({ params }) => Math.min(135, (params.shrapnel - 3) * 45)
    }
  }
]
