import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '薇斯纳'

const team = ['奥黛塔', '七七', '沃雅妮莎']
const artifact_normal = ['炉火', '千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { teamAtkLv: 4 })

// 「从容」：每层使灵剑造成比原本高 10% 的伤害
// 默认层数：2命以下默认3层，2命以上进入灵剑武装即满层6层
const congrongStacks = (params, cons) => Math.min(params?.congrong ?? (cons >= 2 ? 6 : 3), 6)
const congrongMult = (params, cons) => 1 + congrongStacks(params, cons) * 10 / 100

// 「从容」乘区
const withCongrong = (ret, params, cons) => {
  const mult = congrongMult(params, cons)
  return { dmg: (ret.dmg ?? ret.avg) * mult, avg: ret.avg * mult }
}

// 七七6命生效4次
const QiQiFyplusOver = ({ params, sHits, swirlHits, mult }) => {
  const plus = LIMITED_PLUS.QiQi.plus({ params })
  if (!plus) return 0
  const limit = LIMITED_PLUS.QiQi.limit
  const num = typeof limit === 'function' ? limit({ params }) : limit
  const starShare = Number(params?.starShare)
  const share = Number.isFinite(starShare) ? starShare : 0.6
  return plus * (Math.max(sHits - num, 0) * mult + Math.max(swirlHits - Math.max(num - sHits, 0), 0) * share)
}

/**
 * 单人灵剑武装一轮总伤，普通风伤，无辉映环境
 * 基础手法：E + 3套6A + 特殊E 刺 + 落 + 舞*3 + Q + 灵羽*15
 */
const calcNormalRotation = ({ talent, cons, params }, dmg) => {
  const normalSets = 3
  const a1 = dmg(talent.a['一段伤害'], 'a')
  const a2 = dmg(talent.a['二段伤害'], 'a')
  const a3 = dmg(talent.a['三段伤害'], 'a')
  const a4 = dmg(talent.a['四段伤害'], 'a')
  const a5 = dmg(talent.a['五段伤害'], 'a')
  const a6 = dmg(talent.a['六段伤害'], 'a')
  const aSet = a1.avg + a2.avg + a3.avg + a4.avg + a5.avg + a6.avg
  const feather = dmg(talent.e['灵羽伤害'], 'e')
  const featherHits = 15
  const eStart = dmg(talent.e['技能伤害'], 'e')
  const ci = dmg(talent.e['灵剑·刺伤害'], 'e')
  const luo = dmg(talent.e['灵剑·落伤害'], 'e')
  const luoSword = dmg(talent.e['灵剑·落中灵剑/星灵剑伤害'][0], 'e')
  const wuHits = dmg(talent.e['灵剑·舞中灵剑/星灵剑伤害'][0], 'e')
  const wuEnd = dmg(talent.e['灵剑·舞中灵剑/星灵剑终结伤害'][0], 'e')
  const wuTimes = cons >= 1 ? 4 : 3
  const qHit = dmg(talent.q['元素爆发灵剑/星灵剑伤害'][0], 'q')
  const ta = cons >= 6 ? dmg(150, 'e') : { avg: 0 }
  const taHits = cons >= 6 ? 3 : 0
  const mult = congrongMult(params, cons)
  const total = eStart.avg + aSet * normalSets + feather.avg * featherHits
    + ci.avg * mult + luo.avg + luoSword.avg * mult + (wuHits.avg + wuEnd.avg) * mult * wuTimes
    + qHit.avg * mult + ta.avg * mult * taHits
  return { dmg: total, avg: total }
}

/**
 * 灵剑武装一轮总伤·星扩散
 */
const calcStarRotation = ({ talent, cons, params }, dmg) => {
  const normalSets = 3
  const aSet = dmg(talent.a['一段伤害'], 'a').avg + dmg(talent.a['二段伤害'], 'a').avg
    + dmg(talent.a['三段伤害'], 'a').avg + dmg(talent.a['四段伤害'], 'a').avg
    + dmg(talent.a['五段伤害'], 'a').avg + dmg(talent.a['六段伤害'], 'a').avg
  const feather = dmg(talent.e['灵羽伤害'], 'e')
  const featherHits = 15
  const eStart = dmg(talent.e['技能伤害'], 'e')
  const ci = dmg(talent.e['灵剑·刺伤害'], 'e')
  const luo = dmg(talent.e['灵剑·落伤害'], 'e')
  const luoStar = dmg(talent.e['灵剑·落中灵剑/星灵剑伤害'][1], 'e', 'stellarVortex')
  const wuStar = dmg(talent.e['灵剑·舞中灵剑/星灵剑伤害'][1], 'e', 'stellarVortex')
  const wuEndStar = dmg(talent.e['灵剑·舞中灵剑/星灵剑终结伤害'][1], 'e', 'stellarVortex')
  const wuTimes = cons >= 1 ? 4 : 3
  const qStar = dmg(talent.q['元素爆发灵剑/星灵剑伤害'][1], 'q', 'stellarVortex')
  const taStar = cons >= 6 ? dmg(200, 'e', 'stellarVortex') : { avg: 0 }
  const taHits = cons >= 6 ? 3 : 0
  // 反应星扩散，先默认风扩散5次，冰扩散2次，具体多少等正式服上线看了再调
  const swirlAnemoUnit = dmg.reaction('starSwirlAnemo').avg
  const swirlCryoUnit = dmg.reaction('starSwirlCryo').avg
  const swirlHits = 5 + 2
  const mult = congrongMult(params, cons)
  const qiQiOver = QiQiFyplusOver({ params, sHits: 1 + 2 * wuTimes + 1 + taHits, swirlHits, mult })
  const total = eStart.avg + aSet * normalSets + feather.avg * featherHits
    + ci.avg * mult + luo.avg + luoStar.avg * mult + (wuStar.avg + wuEndStar.avg) * mult * wuTimes
    + qStar.avg * mult + taStar.avg * mult * taHits
    + swirlAnemoUnit * 5 + swirlCryoUnit * 2 - qiQiOver
  return { dmg: total, avg: total }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「灵剑·起」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '灵剑武装普攻单段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['一段伤害'], 'a')
  }, {
    title: '灵羽伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['灵羽伤害'], 'e')
  }, {
    title: '「灵剑·刺」伤害',
    dmg: ({ talent, params, cons }, dmg) => withCongrong(dmg(talent.e['灵剑·刺伤害'], 'e'), params, cons)
  }, {
    title: '「灵剑·落」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['灵剑·落伤害'], 'e')
  }, {
    title: '「灵剑·落」星扩散伤害',
    dmg: ({ talent, params, cons }, dmg) => withCongrong(dmg(talent.e['灵剑·落中灵剑/星灵剑伤害'][1], 'e', 'stellarVortex'), params, cons)
  }, {
    title: '「灵剑·舞」星扩散伤害',
    dmg: ({ talent, params, cons }, dmg) => withCongrong(dmg(talent.e['灵剑·舞中灵剑/星灵剑终结伤害'][1], 'e', 'stellarVortex'), params, cons)
  }, {
    title: '「灵剑·爆」伤害',
    dmg: ({ talent, params, cons }, dmg) => withCongrong(dmg(talent.q['元素爆发灵剑/星灵剑伤害'][0], 'q'), params, cons)
  }, {
    title: '「灵剑·爆」星扩散伤害',
    dmg: ({ talent, params, cons }, dmg) => withCongrong(dmg(talent.q['元素爆发灵剑/星灵剑伤害'][1], 'q', 'stellarVortex'), params, cons)
  }, {
    title: '6命「灵剑·踏」星扩散伤害',
    cons: 6,
    dmg: ({ params, cons }, dmg) => withCongrong(dmg(200, 'e', 'stellarVortex'), params, cons)
  }, {
    title: '反应星扩散(风)伤害',
    dmg: ({}, { reaction }) => reaction('starSwirlAnemo')
  }, {
    title: '反应星扩散(冰)伤害',
    dmg: ({}, { reaction }) => reaction('starSwirlCryo')
  }, {
    title: '单人灵剑武装一轮总伤',
    dmg: (ds, dmg) => calcNormalRotation(ds, dmg)
  }, {
    title: '灵剑武装星扩散总伤',
    dmg: (ds, dmg) => calcStarRotation(ds, dmg)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「灵剑·舞」星扩散`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, teamAtkLv: 4 }),
    dmg: ({ talent, params, cons }, dmg) => withCongrong(dmg(talent.e['灵剑·舞中灵剑/星灵剑终结伤害'][1], 'e', 'stellarVortex'), params, cons)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 灵剑武装总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, teamAtkLv: 4 }),
    dmg: (ds, dmg) => calcStarRotation(ds, dmg)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 7
export const consDmgKey = '灵剑武装星扩散总伤'
export const mainAttr = 'atk,mastery,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: ({ params, cons }) => {
      const stacks = congrongStacks(params, cons)
      return `天赋「从容」：${stacks}层从容，灵剑与星灵剑造成原本${100 + stacks * 10}%的伤害`
    },
  }, {
    title: '天赋「游刃」：攻击力提升[atkPct]%，精通提升[mastery]',
    sort: 9,
    data: {
      atkPct: ({ params, cons }) => (params?.teamAtkLv ?? 2) * 6 * (cons >= 4 ? 3 : 1),
      mastery: ({ params, cons }) => (params?.teamMasteryLv ?? 0) * 25 * (cons >= 4 ? 3 : 1)
    }
  }, {
    title: '天赋「星耀祝礼」：基于攻击力提升星扩散反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    title: '1命：灵剑·舞可用次数加一，星扩散反应伤害提升20%',
    cons: 1,
    data: {
      stellarVortex: 20,
      starSwirlAnemo: 20,
      starSwirlCryo: 20
    }
  }, {
    title: '2命：「从容」满层时攻击力提升[atkPct]%',
    cons: 2,
    data: {
      atkPct: 60
    }
  }, {

    title: '6命：星扩散反应伤害擢升[elevated]%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
