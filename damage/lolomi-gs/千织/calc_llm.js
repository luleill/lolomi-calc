import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '千织'

const team = ['希诺宁', '五郎', '芙宁娜']
const artifact_normal = ['千岩']

const team_A = ['希诺宁', '钟离', '芙宁娜']
const artifact_A = ['千岩']

const team_B = ['希诺宁', '夜兰', '芙宁娜']
const artifact_B = ['千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, {geo_two: true})

// 普攻一轮总伤，站场输出手法默认为3A闪/走/跳，不打第四段普攻
const segsRound = (calcApi, elem, talent, attr, calc, segs = '一二三') => {
  return segs.split('').reduce((acc, n) => {
    if (n === '三') {
      const atk = calc(attr.atk)
      const h1 = elem ? calcApi.basic(atk * talent.a['三段伤害2'][0] / 100, 'a', elem) : calcApi.basic(atk * talent.a['三段伤害2'][0] / 100, 'a')
      const h2 = elem ? calcApi.basic(atk * talent.a['三段伤害2'][1] / 100, 'a', elem) : calcApi.basic(atk * talent.a['三段伤害2'][1] / 100, 'a')
      acc.dmg += h1.dmg + h2.dmg
      acc.avg += h1.avg + h2.avg
    } else {
      const r = elem ? calcApi(talent.a[`${n}段伤害`], 'a', elem) : calcApi(talent.a[`${n}段伤害`], 'a')
      acc.dmg += r.dmg
      acc.avg += r.avg
    }
    return acc
  }, { dmg: 0, avg: 0 })
}

// 纯单人直接双E触发「织锦」打物理普攻站场总伤计算
// 针对六命千织单通，打物理普攻总伤会比岩附魔更高
const physicalStationaryDmg = (geoConstruct, synergyHits) => ({ talent, attr, calc, cons }, calcApi) => {
  const { basic } = calcApi
  const upper = basic(calc(attr.atk) * talent.e['上挑攻击伤害2'][0] / 100 + calc(attr.def) * talent.e['上挑攻击伤害2'][1] / 100, 'e')
  const sleeve = basic(calc(attr.atk) * talent.e['袖伤害2'][0] / 100 + calc(attr.def) * talent.e['袖伤害2'][1] / 100, 'e')
  const q = basic(calc(attr.atk) * talent.q['技能伤害2'][0] / 100 + calc(attr.def) * talent.q['技能伤害2'][1] / 100, 'q')
  const synergyDmg = upper.dmg * synergyHits
  const synergyAvg = upper.avg * synergyHits
  const sleeveHits = (geoConstruct && cons >= 1 ? 2 : 1) * 5
  const juanHits = cons >= 4 ? 6 : cons >= 2 ? 3 : 0
  const juanDmg = sleeve.dmg * 1.7 * juanHits
  const juanAvg = sleeve.avg * 1.7 * juanHits
  const phyA = segsRound(calcApi, 'phy', talent, attr, calc, '一二三')
  return {
    dmg: upper.dmg + sleeve.dmg * sleeveHits + phyA.dmg * 6 + q.dmg + synergyDmg + juanDmg,
    avg: upper.avg + sleeve.avg * sleeveHits + phyA.avg * 6 + q.avg + synergyAvg + juanAvg
  }
}

// 15s站场总伤计算
// 6命手法：EQ + 两轮3A闪 + E + 两轮3A闪 + E + 两轮3A闪 全程岩附魔
// 非6命手法：EQ + 两轮岩附魔3A闪  + 4轮物理伤害3A闪，应该还能多打几次普攻，忽略不计了
const stationaryDmg = (geoConstruct) => (ds, calcApi) => {
  const { talent, attr, calc, cons } = ds
  const { basic } = calcApi
  const upper = basic(calc(attr.atk) * talent.e['上挑攻击伤害2'][0] / 100 + calc(attr.def) * talent.e['上挑攻击伤害2'][1] / 100, 'e')
  const sleeve = basic(calc(attr.atk) * talent.e['袖伤害2'][0] / 100 + calc(attr.def) * talent.e['袖伤害2'][1] / 100, 'e')
  const q = basic(calc(attr.atk) * talent.q['技能伤害2'][0] / 100 + calc(attr.def) * talent.q['技能伤害2'][1] / 100, 'q')
  const aRound = (elem) => segsRound(calcApi, elem, talent, attr, calc, '一二三')
  const sleeveHits = (geoConstruct && cons >= 1 ? 2 : 1) * 5
  const juanHits = cons >= 4 ? 6 : cons >= 2 ? 3 : 0
  const juanDmg = sleeve.dmg * 1.7 * juanHits
  const juanAvg = sleeve.avg * 1.7 * juanHits
  const xiloPlus = LIMITED_PLUS.Xilonen.plus(ds)
  const plusA = calcApi(0, 'a')
  const xiloOver = xiloPlus && attr.a.plus
    ? xiloPlus * (24 - LIMITED_PLUS.Xilonen.limit) / attr.a.plus
    : 0
  if (cons >= 6) {
    const geoA = aRound()
    return {
      dmg: upper.dmg * 3 + sleeve.dmg * sleeveHits + geoA.dmg * 6 + q.dmg + juanDmg - plusA.dmg * xiloOver,
      avg: upper.avg * 3 + sleeve.avg * sleeveHits + geoA.avg * 6 + q.avg + juanAvg - plusA.avg * xiloOver
    }
  }
  const phyA = aRound('phy')
  const geoA = aRound()
  return {
    dmg: upper.dmg + sleeve.dmg * sleeveHits + geoA.dmg * 2 + q.dmg + phyA.dmg * 4 + juanDmg - plusA.dmg * xiloOver,
    avg: upper.avg + sleeve.avg * sleeveHits + geoA.avg * 2 + q.avg + phyA.avg * 4 + juanAvg - plusA.avg * xiloOver
  }
}

// 人偶「袖」单次伤害计算
const sleeveDmg = () => ({ talent, attr, calc }, { basic }) =>
  basic(calc(attr.atk) * talent.e['袖伤害2'][0] / 100 + calc(attr.def) * talent.e['袖伤害2'][1] / 100, 'e')

// 队伍伤害仅6命额外展示站场总伤，非6命只展示人偶「袖」单段伤害
const stationaryEntry = (team, artifact, geoConstruct, title, extraParams = {}) => {
  const entries = [{
    title: ({ cons }) => `${teamConfig(cons, team, artifact, mainCharName).title} 「袖」伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact).params,
      ...(geoConstruct !== undefined ? { geoConstruct } : {}),
      ...extraParams
    }),
    dmg: sleeveDmg()
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact, mainCharName).title} ${title || '站场15秒总伤'}`,
    check: ({ cons }) => cons >= 6,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact).params,
      ...(geoConstruct !== undefined ? { geoConstruct } : {}),
      ...extraParams
    }),
    dmg: stationaryDmg(geoConstruct)
  }]
  return entries
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.atk)) })
  }, {
    title: '触发特效后防御力',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.def)) })
  }, {
    title: '「羽袖一触」上挑伤害',
    dmg: ({ talent, attr, calc }, { basic }) =>
      basic(calc(attr.atk) * talent.e['上挑攻击伤害2'][0] / 100 + calc(attr.def) * talent.e['上挑攻击伤害2'][1] / 100, 'e')
  }, {
    title: '人偶「袖」伤害',
    dmg: ({ talent, attr, calc }, { basic }) =>
      basic(calc(attr.atk) * talent.e['袖伤害2'][0] / 100 + calc(attr.def) * talent.e['袖伤害2'][1] / 100, 'e')
  }, {
    title: '人偶「绢」伤害',
    cons: 2,
    dmg: ({ talent, attr, calc }, { basic }) =>
      basic((calc(attr.atk) * talent.e['袖伤害2'][0] / 100 + calc(attr.def) * talent.e['袖伤害2'][1] / 100) * 1.7, 'e')
  }, {
    title: '「当意即妙」协同伤害',
    dmg: ({ talent, attr, calc }, { basic }) =>
      basic(calc(attr.atk) * talent.e['上挑攻击伤害2'][0] / 100 + calc(attr.def) * talent.e['上挑攻击伤害2'][1] / 100, 'e')
  }, {
    title: '「二刀之形·比翼」伤害',
    dmg: ({ talent, attr, calc }, { basic }) =>
      basic(calc(attr.atk) * talent.q['技能伤害2'][0] / 100 + calc(attr.def) * talent.q['技能伤害2'][1] / 100, 'q')
  }, {
    title: '岩附魔普攻四段总伤',
    dmg: (ctx, calcApi) => segsRound(calcApi, null, ctx.talent, ctx.attr, ctx.calc, '一二三四')
  }, {
    title: '物理普攻四段总伤',
    cons: 6,
    dmg: (ctx, calcApi) => segsRound(calcApi, 'phy', ctx.talent, ctx.attr, ctx.calc, '一二三四')
  }, {
    title: '纯单人物理普攻15秒站场总伤',
    // 6命触发7次协同，非6命仅2次
    params: { geoConstruct: false },
    dmg: (ctx, calcApi) => physicalStationaryDmg(false, ctx.cons >= 6 ? 7 : 2)(ctx, calcApi)
  }, {
    title: '纯单人岩附魔15秒站场总伤',
    params: { geoConstruct: false },
    dmg: stationaryDmg(false)
  }, {
    title: '伪单人15秒站场总伤',
    params: ({ cons }) => ({ geoConstruct: cons >= 1 }),
    dmg: stationaryDmg(true)
  },
  ...stationaryEntry(team_A, artifact_A, true, '', { geo_two: true }),
  ...stationaryEntry(team_B, artifact_B, true, '', { geo_two: true }),
  ...stationaryEntry(team, artifact_normal, true, '', { geo_two: true }),
  {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '伪单人15秒站场总伤'
export const mainAttr = 'atk,def,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    // 纯单人时吃不到这个增伤天赋，其他条目默认有后台队友能吃到
    check: ({ params }) => params.geoConstruct !== false,
    title: '天赋「锦上添花」：队伍创造岩造物时，获得[dmg]%岩伤加成',
    data: {
      dmg: 20
    }
  }, {
    title: '1命「正绢六通」：存在岩队友时，羽袖一触额外召唤一只人偶「袖」',
    cons: 1,
  }, {
    title: '2命「落染五色」：Q后触发人偶「绢」协同',
    cons: 2,
  }, {
    title: '4命「衣裁三礼」：普攻可触发人偶「绢」协同',
    cons: 4,
  }, {
    title: '6命「万理一空」：基于防御力的235%提升普攻造成的伤害[aPlus]',
    sort: 9,
    cons: 6,
    data: {
      aPlus: ({ attr, calc }) => calc(attr.def) * 235 / 100
    }
  }
]
