import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam, bounded } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '安娜丝塔夏'

const team = ['奥黛塔', '米提亚', '希诺宁']
const artifact_normal = ['炉火', '千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { glory: true, starSwirl: false })

const starRoute = (params) => params.starSwirl
  ? ['stellarVortex', 1]
  : ['stellarConduct', 0]

// 2命「荣耀」加成
const gloryMult = (ds) => ds.cons >= 2 && ds.params.glory === true ? 1.25 : 1

// 每次尾段攻击替换为星烁伤害
const splitTail = (ds, times) => ds.params.huiying === false ? [times, 0] : [Math.max(times - 1, 0), 1]

const xilonenQuota = (ds, calcApi) => {
  const { attr, params } = ds
  const plus = LIMITED_PLUS.Xilonen.plus(ds)
  let left = Math.floor(bounded(params.xilonen_hits, LIMITED_PLUS.Xilonen.limit, 0, LIMITED_PLUS.Xilonen.limit))
  const cache = new Map()
  return (slot) => {
    if (!plus || !['a', 'a2', 'a3'].includes(slot)) return calcApi
    if (left > 0) {
      left--
      return calcApi
    }
    if (!cache.has(slot)) cache.set(slot, calcApi.withAttr({ [slot]: { plus: attr[slot].plus - plus } }))
    return cache.get(slot)
  }
}

const tailHit = (ds, calcApi, source, name, slot, quota) => {
  const { attr, calc, talent, params } = ds
  const [ch, si] = starRoute(params)
  const pair = talent[source][`${name}2`]
  const per = pair ? pair[0] : talent[source][name]
  const times = pair ? pair[1] : 1
  const mult = gloryMult(ds)
  const [iceN, starN] = splitTail(ds, times)
  const take = quota || (() => calcApi)
  const ice = iceN ? take(slot)(per * iceN * mult, slot) : { dmg: 0, avg: 0 }
  const starRate = talent[source][`${name.replace('冰元素伤害', '')}星超导/星扩散伤害2`][si]
  const star = starN ? take(slot).basic(calc(attr.atk) * starRate / 100 * mult, slot, ch) : { dmg: 0, avg: 0 }
  return { dmg: ice.dmg + star.dmg, avg: ice.avg + star.avg }
}

// 慈爱「苍星圣冕」单次
const crownCycle = (ds, calcApi, withExtra = false) => {
  const { attr, calc, talent, params } = ds
  const { basic } = calcApi
  const dmg = calcApi
  const [ch, si] = starRoute(params)
  const [crownPer, crownTimes] = talent.e['苍星圣冕冰元素伤害2']
  const [crownIce, crownStar] = splitTail(ds, crownTimes)
  const ice = crownIce ? dmg(crownPer * crownIce, 'e') : { dmg: 0, avg: 0 }
  const star = crownStar ? basic(calc(attr.atk) * talent.e['苍星圣冕星超导/星扩散伤害2'][si] / 100, 'e', ch) : { dmg: 0, avg: 0 }
  const extra = withExtra
    ? basic(calc(attr.atk) * talent.q['苍星圣冕星超导/星扩散伤害2'][si] / 100, 'e', ch)
    : { dmg: 0, avg: 0 }
  return { dmg: ice.dmg + star.dmg + extra.dmg, avg: ice.avg + star.avg + extra.avg }
}

const addTriumph = (total, hit, times) => ({
  dmg: total.dmg + hit.dmg * times,
  avg: total.avg + hit.avg * times
})

// 「慈爱」：圣冕每2秒一轮，默认15秒时间打7轮
const calcLoveRotation = (ds, calcApi) => {
  const { attr, calc, talent, cons, params } = ds
  const { basic } = calcApi
  const dmg = calcApi
  const [ch, si] = starRoute(params)
  const ticks = params.crownTicks ?? 7
  const cycle = crownCycle(ds, calcApi, true)
  const tap = dmg(talent.e['点按瞬时伤害'], 'e')
  const q = dmg(talent.q['致新世界瞬时伤害'], 'q')
  const triumph = basic(calc(attr.atk) * talent.q['凯旋星超导/星扩散伤害2'][si] / 100, 'e', ch)
  let total = { dmg: tap.dmg + q.dmg, avg: tap.avg + q.avg }
  total.dmg += cycle.dmg * ticks
  total.avg += cycle.avg * ticks
  total = addTriumph(total, triumph, 1)
  if (cons >= 6) total = addTriumph(total, triumph, 2.5)
  return total
}

// 「荣耀」：15秒内普攻转圣佑之枪
// 还不知道具体攻击间隔和动画耗时
// spearRotations: 普攻轮数，默认15秒按每轮3.5秒打3轮，衔接特殊战技和Q收尾
const calcGloryRotation = (ds, calcApi) => {
  const { attr, calc, talent, cons, params } = ds
  const { basic } = calcApi
  const dmg = calcApi
  const [ch, si] = starRoute(params)
  const rounds = params.spearRotations ?? 3
  const quota = xilonenQuota(ds, calcApi)
  const hold = dmg(talent.e['长按瞬时伤害'], 'e')
  const night = basic(calc(attr.atk) * talent.q['永夜将明星超导/星扩散伤害2'][si] / 100 * gloryMult(ds), 'q', ch)
  const dec = calcDecimation(ds, calcApi)
  let total = { dmg: hold.dmg + night.dmg + dec.dmg, avg: hold.avg + night.avg + dec.avg }
  for (let i = 0; i < rounds; i++) {
    for (const n of ['一', '二', '三', '四', '五']) {
      const seg = tailHit(ds, calcApi, 'e', `${n}段冰元素伤害`, 'a', quota)
      total.dmg += seg.dmg
      total.avg += seg.avg
    }
  }
  if (cons >= 6) {
    const c6 = basic(calc(attr.atk) * talent.q['裁灭三段星超导/星扩散伤害2'][si] / 100 * 2 * gloryMult(ds), 'e', ch)
    total.dmg += c6.dmg
    total.avg += c6.avg
  }
  return total
}

// 「荣耀」解封战技「苍星圣敕·裁灭」
const calcDecimation = (ds, calcApi) => {
  const { attr, calc, talent, params } = ds
  const { basic } = calcApi
  const dmg = calcApi
  const [ch, si] = starRoute(params)
  const mult = gloryMult(ds)
  const [firstPer, firstTimes] = talent.q['裁灭一段冰元素伤害2']
  const ice = dmg(firstPer * firstTimes * mult, 'e')
  const star = (key) => basic(calc(attr.atk) * talent.q[key][si] / 100 * mult, 'e', ch)
  const s1 = star('裁灭一段星超导/星扩散伤害2')
  const s2 = star('裁灭二段星超导/星扩散伤害2')
  const s3 = star('裁灭三段星超导/星扩散伤害2')
  return {
    dmg: ice.dmg + s1.dmg + s2.dmg + s3.dmg,
    avg: ice.avg + s1.avg + s2.avg + s3.avg
  }
}

const starOne = (ds, calcApi, source, key, slot, mult = 1) => {
  const { attr, calc, talent, params } = ds
  const [ch, si] = starRoute(params)
  return calcApi.basic(calc(attr.atk) * talent[source][key][si] / 100 * mult, slot, ch)
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「慈爱」荣勋为队友提供爆伤',
    params: { glory: false },
    dmg: ({ cons }) => {
      const per = cons >= 4 ? 15.6 : 12;
      return { avg: `${cons >= 1 ? per * 3 : per}%`, type: 'text' }
    }
  }, {
    title: '「荣耀」荣勋自身爆伤至多提高',
    params: { glory: true },
    dmg: ({ cons, params }) => {
      const per = cons >= 4 ? 15.6 : 12;
      return { avg: `${per * (params.teamSize ?? 4)}%`, type: 'text' }
    }
  }, {
    title: '「慈爱」提供星烁反应增伤',
    dmg: ({ talent }) => ({ avg: `${talent.q['致新世界星烁反应伤害提升']}%`, type: 'text' })
  }, {
    title: '1命「慈爱」为冰元素队友提供攻击力',
    cons: 1,
    params: { glory: false },
    dmg: ({ cons }) => ({ avg: `${(cons >= 4 ? 19.5 : 15) * 3}%`, type: 'text' })
  }, {
    title: '1命「慈爱」为其他元素队友提供精通',
    cons: 1,
    params: { glory: false },
    dmg: ({ cons }) => ({ avg: `${(cons >= 4 ? 78 : 60) * 3}`, type: 'text' })
  }, {
    title: '2命「慈爱」提供星烁暴伤',
    cons: 2,
    dmg: () => ({ avg: '60%', type: 'text' })
  }, {
    title: '「苍星圣冕」星超导伤害',
    params: { starSwirl: false, huiying: true },
    dmg: (ds, calcApi) => starOne(ds, calcApi, 'e', '苍星圣冕星超导/星扩散伤害2', 'e')
  }, {
    title: '「苍星圣冕」星扩散伤害',
    params: { starSwirl: true, huiying: true },
    dmg: (ds, calcApi) => starOne(ds, calcApi, 'e', '苍星圣冕星超导/星扩散伤害2', 'e')
  }, {
    title: '圣佑之枪五段总伤',
    params: { glory: true },
    dmg: (ds, calcApi) => {
      const quota = xilonenQuota(ds, calcApi)
      return '一二三四五'.split('').reduce((acc, n) => {
        const r = tailHit(ds, calcApi, 'e', `${n}段冰元素伤害`, 'a', quota)
        acc.dmg += r.dmg
        acc.avg += r.avg
        return acc
      }, { dmg: 0, avg: 0 })
    }
  }, {
    title: '「永夜将明」星超导伤害',
    params: { starSwirl: false, glory: true },
    dmg: (ds, calcApi) => starOne(ds, calcApi, 'q', '永夜将明星超导/星扩散伤害2', 'q', gloryMult(ds))
  }, {
    title: '「永夜将明」星扩散伤害',
    params: { starSwirl: true, glory: true },
    dmg: (ds, calcApi) => starOne(ds, calcApi, 'q', '永夜将明星超导/星扩散伤害2', 'q', gloryMult(ds))
  }, {
    title: '「苍星圣敕·凯旋」星超导伤害',
    params: { starSwirl: false },
    dmg: (ds, calcApi) => starOne(ds, calcApi, 'q', '凯旋星超导/星扩散伤害2', 'e')
  }, {
    title: '「苍星圣敕·裁灭」总伤',
    params: { starSwirl: false, glory: true },
    dmg: (ds, calcApi) => calcDecimation(ds, calcApi)
  }, {
    title: '慈爱后台15秒总伤',
    params: { glory: false },
    dmg: (ds, calcApi) => calcLoveRotation(ds, calcApi)
  }, {
    title: '荣耀站场15秒总伤',
    params: { glory: true },
    dmg: (ds, calcApi) => calcGloryRotation(ds, calcApi)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场15秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      glory: true, starSwirl: false
    }),
    dmg: calcGloryRotation
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defDmgIdx = 10
export const consDmgKey = '荣耀站场15秒总伤'
// glory      加护分支：false = 慈爱，true = 荣耀
// starSwirl  辉映分支：false = 辉映·星超导，true = 辉映·星扩散
// huiying    是否处于辉映·星烁：默认 true
// stellarConductLV: 极星辉域层数
// starSwirlWindLV: 星辉风旋层数，被动创造即二级，传6取满层3.0倍率
// teamSize: 队伍人数，决定荣耀分支能均分到多少份荣勋
// iceSealed: 被封存的冰系队友数
export const defParams = {
  glory: false, starSwirl: false, huiying: true,
  stellarConductLV: 6, starSwirlWindLV: 2,
  teamSize: 4, iceSealed: 1
}

export const buffs = [
  ...TeamBuff,
  {
    title: ({ cons, params }) => params.glory === true
      ? '天赋「煌夜的明威」：荣耀封存队友，自身暴击伤害提升[cdmg]%'
      : cons >= 1
        ? '天赋「煌夜的明威」：慈爱封存自身，自身暴击伤害提升[cdmg]%'
        : '天赋「煌夜的明威」：慈爱封存自身，荣勋均分给队友，自身无加成',
    data: {
      cdmg: ({ cons, params }) => {
        const base = cons >= 4 ? 15.6 : 12;
        const shares = params.glory === true ? (params.teamSize ?? 4) : (cons >= 1 ? 1 : 0);
        return base * shares;
      }
    }
  }, {
    title: '天赋「星耀祝礼·无染复临」：基于攻击力提升星烁反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    // 星超导 只提到极辉星域效果进一步提升，但没说具体数值效果
    check: ({ params }) => params.starSwirl === true,
    title: '天赋「未挽的悼亡」：星扩散基础反应系数提升15%',
    sort: 9,
    data: {
      fypct: 15
    }
  }, {
    check: ({ params }) => params.glory !== true,
    title: '「致新世界」：队伍中附近角色星烁反应伤害提升[stellarConduct]%',
    data: {
      stellarConduct: ({ talent }) => talent.q['致新世界星烁反应伤害提升'],
      stellarVortex: ({ talent }) => talent.q['致新世界星烁反应伤害提升'],
      starSwirlAnemo: ({ talent }) => talent.q['致新世界星烁反应伤害提升'],
      starSwirlCryo: ({ talent }) => talent.q['致新世界星烁反应伤害提升']
    }
  }, {
    title: ({ cons, params }) => {
      if (params.glory !== true) {
        return '1命「致往年，致未曾止熄的心」：冰元素角色攻击力提升[atkPct]%'
      }
      const others = Math.max((params.teamSize ?? 4) - 1 - (params.iceSealed ?? 0), 0)
      return others > 0
        ? '1命「致往年，致未曾止熄的心」：荣耀站场独享队伍荣勋，攻击力提升[atkPct]%，元素精通提升[mastery]'
        : '1命「致往年，致未曾止熄的心」：荣耀站场独享队伍荣勋，攻击力提升[atkPct]%，无其他元素队友可分精通'
    },
    cons: 1,
    data: {
      atkPct: ({ cons, params }) => {
        const per = cons >= 4 ? 19.5 : 15;
        const ice = Math.min(params.iceSealed ?? 0, (params.teamSize ?? 4) - 1);
        const shares = params.glory === true ? 1 + ice : 1;
        return per * shares;
      },
      mastery: ({ cons, params }) => {
        if (params.glory !== true) return 0;
        const per = cons >= 4 ? 78 : 60;
        return per * Math.max((params.teamSize ?? 4) - 1 - (params.iceSealed ?? 0), 0);
      }
    }
  }, {
    check: ({ params }) => params.glory !== true,
    title: '2命「致严冬，致同饮苦寒的人」慈爱：全队星烁反应暴击伤害提升60%，星烁反应擢升[elevated]%',
    cons: 2,
    data: {
      elevated: 5,
      stellarConductCdmg: 60,
      stellarVortexCdmg: 60,
      starSwirlAnemoCdmg: 60,
      starSwirlCryoCdmg: 60
    }
  }, {
    check: ({ params }) => params.glory === true,
    title: '2命「致严冬，致同饮苦寒的人」荣耀：普攻/永夜将明/裁灭造成原本125%伤害，星烁反应擢升[elevated]%',
    cons: 2,
    data: {
      elevated: 5
    }
  }, {
    title: '4命「向暴君，把反抗的歌来唱」：荣勋效果强化，暴伤、攻击力与元素精通提升的效果改为原本的130%',
    cons: 4,
  }, {
    check: ({ params }) => params.glory !== true,
    title: '6命「仰望吧，无垢的黎明将升」慈爱：切人上场追加凯旋，星烁反应擢升10%',
    cons: 6,
    data: {
      elevated: 10
    }
  }, {
    check: ({ params }) => params.glory === true,
    title: '6命「仰望吧，无垢的黎明将升」荣耀：点按战技追加裁灭第三段，星烁反应擢升20%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
