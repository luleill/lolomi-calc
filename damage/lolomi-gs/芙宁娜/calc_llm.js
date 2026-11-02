import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamDetail, withStdTeam, bounded } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '芙宁娜'

const team = ['丝柯克', '爱可菲', '沃雅妮莎']
const artifact_normal = ['千岩']

const team_c6 = ['闲云', '尼可', '杜林']
const artifact_c6 = ['千岩', '天美']

const teamParams = { hydro_two: true, cryo_two: true, fanfare: 600 }
const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, teamParams)

const fanCap = cons => cons >= 1 ? 400 : 300
const presetFan = ({ cons, params }) => bounded(params.fanfare, cons >= 2 ? 800 : fanCap(cons), 0, cons >= 2 ? 800 : fanCap(cons))
const hpBonus = (cons, fan) => cons >= 2 ? Math.min(140, Math.max(0, fan - 400) * 0.35) : 0
const currentHp = (ds, fan) => ds.calc(ds.attr.hp)
  + ds.attr.hp.base * (hpBonus(ds.cons, fan) - hpBonus(ds.cons, presetFan(ds))) / 100
const add = (total, ret) => {
  total.dmg += ret.dmg ?? ret.avg
  total.avg += ret.avg
}

// 召唤物攻击间隔
const members = [
  { key: '海薇玛夫人伤害', first: 72.3333, interval: 97.5858 },
  { key: '乌瑟勋爵伤害', first: 74.5, interval: 202.138 },
  { key: '谢贝蕾妲小姐伤害', first: 71.5926, interval: 313.859 }
]

const createHitCalc = (ds, dmg) => {
  const { attr, calc, cons, params } = ds
  const baseFan = presetFan(ds)
  const baseStacks = Math.min(baseFan, fanCap(cons))
  const vodyaPlus = LIMITED_PLUS.Vodyanitsa.plus(ds)
  let remain = Math.floor(bounded(params.vodyanitsa_hits, LIMITED_PLUS.Vodyanitsa.limit, 0, LIMITED_PLUS.Vodyanitsa.limit))
  const refineScale = 1 + bounded(ds.refine, 0, 0, 4) / 4
  const weapon = ds.weapon?.name || attr.weapon?.name
  return (hit, state = {}) => {
    const fan = state.fan ?? baseFan
    const front = state.front ?? false
    const time = hit.time ?? 0
    const stacksDelta = Math.min(fan, fanCap(cons)) - baseStacks
    const hp = currentHp(ds, fan)
    const hpDelta = hp - calc(attr.hp)
    const covered = vodyaPlus > 0 && front && remain > 0
    if (covered) remain--
    const troupeDelta = ds.artis?.['黄金剧团'] >= 4
      ? (!front || time < 2 ? 25 : 0) - (params.off_field === false ? 0 : 25) : 0
    const patch = {
      hp: { pct: attr.hp.pct + hpBonus(cons, fan) - hpBonus(cons, baseFan) },
      dmg: { plus: attr.dmg.plus + stacksDelta * ds.talent.q['气氛值转化提升伤害比例'] },
      phy: { plus: attr.phy.plus + stacksDelta * ds.talent.q['气氛值转化提升伤害比例'] },
      heal: { inc: attr.heal.inc + stacksDelta * ds.talent.q['气氛值转化受治疗加成比例'] },
      cdmg: { plus: attr.cdmg.plus - (!front && params.Vodyanitsa_mid && !params.Vodyanitsa_best ? 50 : 0) },
      cpct: { plus: attr.cpct.plus + (ds.artis?.['逐影猎人'] >= 4 ? (state.hunter ?? (front ? 3 : 0)) * 12 - 36 : 0) },
      e: { dmg: attr.e.dmg + troupeDelta }
    }
    if (hit.slot) patch[hit.slot] = { ...patch[hit.slot], plus: attr[hit.slot].plus - (covered ? 0 : vodyaPlus) }
    if (weapon === '圣显之钥') patch.mastery = { plus: attr.mastery.plus + hpDelta * 0.0056 * refineScale }
    if (weapon === '磐岩结绿') patch.atk = { plus: attr.atk.plus + hpDelta * 0.012 * refineScale }
    const fn = dmg.withAttr(patch)
    const ele = hit.vape ? 'vaporize' : false
    if (hit.member) {
      return fn.basic((hit.baseHp ?? hp) * hit.pct / 100 * (hit.power ?? 1.4), 'e', ele,
        { dynamicDmg: Math.min(28, hp * 0.0007) })
    }
    return fn.dynamic(hit.pct, hit.slot, {}, ele, hp * (hit.c6 || 0))
  }
}

const fanfareMemberHit = (ds, dmg, index, vape = false) => createHitCalc(ds, dmg)({
  slot: 'e', member: true, pct: ds.talent.e[members[index].key], vape,
  power: 1 + Math.floor(bounded(ds.params.drain_members, 4, 0, 4)) * 0.1
})
const c6Hit = (ds, dmg, pneuma = false) => createHitCalc(ds, dmg)({
  slot: 'a', pct: ds.talent.a['一段伤害'], c6: pneuma ? 0.43 : 0.18, time: 3
}, { front: true })
const c6PlungeHit = (ds, dmg) => createHitCalc(ds, dmg)({
  slot: 'a3', pct: ds.talent.a['低空/高空坠地冲击伤害'][1], c6: 0.43, vape: true, time: 3
}, { front: true })
const singerHeal = (ds, dmg) => {
  const [pct, flat] = ds.talent.e['众水的歌者治疗量2']
  return dmg.heal(ds.calc(ds.attr.hp) * pct / 100 + flat)
}

const summonTotal = (ds, dmg) => {
  const hit = createHitCalc(ds, dmg)
  const total = { dmg: 0, avg: 0 }
  const power = 1 + Math.floor(bounded(ds.params.drain_members, 4, 0, 4)) * 0.1
  for (const m of members) {
    for (let at = m.first; at < 900; at += m.interval) {
      add(total, hit({ slot: 'e', member: true, pct: ds.talent.e[m.key], power }))
    }
  }
  if (ds.cons >= 6) {
    // 6命默认黑芙打6刀直接切后台
    for (const n of '一二三四一二') {
      add(total, hit({ slot: 'a', pct: ds.talent.a[`${n}段伤害`], c6: 0.18, time: 3 }, { front: true }))
    }
  }
  return total
}

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '「万众狂欢」满气氛增伤',
    dmg: ({ cons, talent }) => ({ avg: `${(fanCap(cons) * talent.q['气氛值转化提升伤害比例']).toFixed(1)}%`, type: 'text' })
  }, {
    title: '满气氛「众水的歌者」治疗',
    dmg: singerHeal
  }, {
    title: '满气氛「谢贝蕾妲小姐」伤害',
    dmg: (ds, dmg) => fanfareMemberHit(ds, dmg, 2)
  }, {
    title: '满气氛「乌瑟勋爵」伤害',
    dmg: (ds, dmg) => fanfareMemberHit(ds, dmg, 1)
  }, {
    title: '满气氛「海薇玛夫人」伤害',
    dmg: (ds, dmg) => fanfareMemberHit(ds, dmg, 0)
  }, {
    title: '低气氛「谢贝蕾妲小姐」伤害',
    params: { fanfare: 400 },
    cons: 2,
    dmg: (ds, dmg) => fanfareMemberHit(ds, dmg, 2)
  }, {
    title: '低气氛「乌瑟勋爵」伤害',
    params: { fanfare: 400 },
    cons: 2,
    dmg: (ds, dmg) => fanfareMemberHit(ds, dmg, 1)
  }, {
    title: '低气氛「海薇玛夫人」伤害',
    params: { fanfare: 400 },
    cons: 2,
    dmg: (ds, dmg) => fanfareMemberHit(ds, dmg, 0)
  }, {
    title: '6命「黑芙」满气氛荒刀伤害',
    cons: 6,
    dmg: (ds, dmg) => c6Hit(ds, dmg)
  }, {
    title: '6命「白芙」满气氛芒刀伤害',
    cons: 6,
    dmg: (ds, dmg) => c6Hit(ds, dmg, true)
  }, {
    title: '纯单人15秒总伤',
    params: { fanfare: 200, drain_members: 1, off_field: false },
    dmg: summonTotal
  }, {
    title: '伪单人后台15秒总伤',
    params: { fanfare: 400 },
    dmg: summonTotal
  }, {
    ...teamDetail(mainCharName, team_c6, artifact_c6, '「白芙」下落蒸发', c6PlungeHit, {
      off_field: false, pyro_two: true
    }),
    cons: 6
  }, {
    ...teamDetail(mainCharName, team, artifact_normal, '后台15秒总伤', summonTotal, teamParams)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '伪单人后台15秒总伤'
export const mainAttr = 'hp,cpct,cdmg,dmg'
export const defParams = {
  // 气氛值默认800，2命溢出400转为额外生命上限，一般达不到全程800，计算条目里可传合适的气氛值
  off_field: true, fanfare: 800, drain_members: 4
}

export const buffs = [
  ...TeamBuff,
  {
    title: '「万众狂欢」：满气氛伤害提高[dmg]%，受治疗加成提高[healInc]%',
    data: {
      dmg: ({ cons, talent, params }) => Math.min(cons >= 1 ? 400 : 300,
        Number.isFinite(Number(params.fanfare ?? NaN)) ? Math.max(0, Number(params.fanfare)) : cons >= 1 ? 400 : 300) * talent.q['气氛值转化提升伤害比例'],
      phy: ({ cons, talent, params }) => Math.min(cons >= 1 ? 400 : 300,
        Number.isFinite(Number(params.fanfare ?? NaN)) ? Math.max(0, Number(params.fanfare)) : cons >= 1 ? 400 : 300) * talent.q['气氛值转化提升伤害比例'],
      healInc: ({ cons, talent, params }) => Math.min(cons >= 1 ? 400 : 300,
        Number.isFinite(Number(params.fanfare ?? NaN)) ? Math.max(0, Number(params.fanfare)) : cons >= 1 ? 400 : 300) * talent.q['气氛值转化受治疗加成比例']
    }
  }, {
    title: ({ attr, calc }) => `天赋「无人听的自白」：基于生命值提升元素战技伤害${Math.min(28, calc(attr.hp) * 0.0007).toFixed(1)}%`,
    sort: 9
  }, {
    title: '芙宁娜1命：开Q获得150点气氛值，气氛值上限提升至400',
    cons: 1
  }, {
    title: '芙宁娜2命：气氛获取效率提升250%，基于溢出气氛提升[hpPct]%生命上限',
    cons: 2,
    data: {
      hpPct: ({ params }) => Math.min(140, Math.max(0,
        (Number.isFinite(Number(params.fanfare ?? NaN)) ? Number(params.fanfare) : 800) - 400) * 0.35)
    }
  }, {
    title: '芙宁娜4命：战技命中或治疗时每5秒回复4点能量',
    cons: 4
  }, {
    title: '芙宁娜6命：E后获取6次水附魔加成',
    cons: 6
  }
]
