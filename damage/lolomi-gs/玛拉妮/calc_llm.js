import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '玛拉妮'
/**
 * 基本手法
 * 玛拉妮普攻挂水，茜特菈莉E，希诺宁E，玛薇卡eq，满命茜特菈莉的话玛薇卡还得重击转一下消冰
 * 切玛拉妮输出，顺利的话前三次鲨鲨撕咬刚好能蒸发，满命伤害爆炸
 * 
 * 试了希诺宁换万叶，并不好用，至少二命万叶开大后伤害才能勉强追上希诺宁
 */
const team = ['茜特菈莉', '希诺宁', '玛薇卡']
const artifact_normal = ['烬城', '教官', '千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { Xilonen_hydro: true, isTeam: true })

// 巨浪鲨鲨撕咬基础伤害
const biteNum = ({ talent, calc, attr }) =>
  calc(attr.hp) * (talent.e['鲨鲨撕咬基础伤害'] + talent.e['巨浪鲨鲨撕咬伤害额外提升']) / 100
// 专武冲浪时光炽夏层数递减
const layerScale = (bite1, eachLayer, dmgNum, n) => {
  const scale = dmgNum > 0 ? Math.max(0, dmgNum - n * eachLayer) / dmgNum : 1
  return { dmg: bite1.dmg * scale, avg: bite1.avg * scale }
}
// 1-5命时后续的巨浪鲨鲨撕咬不再享受1命加成
const deductC1 = (items, c1Plus, dmgBase) => {
  const c1Deduct = c1Plus / dmgBase
  for (const item of items) {
    item.dmg *= (1 - c1Deduct)
    item.avg *= (1 - c1Deduct)
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.hp)) })
  }, {
    title: '巨浪鲨鲨撕咬伤害',
    dmg: (ctx, { basic }) => basic(biteNum(ctx), 'a')
  }, {
    title: '巨浪鲨鲨撕咬蒸发',
    dmg: (ctx, { basic }) => basic(biteNum(ctx), 'a', 'vaporize')
  }, {
    title: '巨浪鲨鲨撕咬对群伤害',
    params: { EnemyGroup: true },
    dmg: (ctx, { basic }) => basic(biteNum(ctx), 'a')
  }, {
    title: '鲨鲨飞弹对群单段伤害',
    // 「冲浪时光」：鲨鲨撕咬命中后层数减1，同时的飞弹伤害吃不到这一层的增益
    check: ({ attr }) => attr.weapon?.name === '冲浪时光',
    params: { EnemyGroup: true, SharkMissile: true },
    dmg: (ctx, { basic }) => basic(biteNum(ctx), 'a')
  }, {
    title: '爆瀑飞弹伤害',
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: '3咬1Q对单一轮总伤',
    // 3次 巨浪鲨鲨撕咬 + 爆瀑飞弹
    // 冲浪时光效果：增伤根据层数递减
    dmg: ({ talent, calc, attr, cons }, { basic }) => {
      const hp = calc(attr.hp)
      const bn = biteNum({ talent, calc, attr })
      const eachLayer = attr.weapon?.name === '冲浪时光' ? (12 + attr.refine * 3) / 100 : 0
      const dmgNum = 1 + (attr.dmg.base + attr.dmg.plus) / 100 + attr.a.dmg / 100
      const bite1 = basic(bn, 'a')
      const bite2 = layerScale(bite1, eachLayer, dmgNum, 1)
      const bite3 = layerScale(bite1, eachLayer, dmgNum, 2)
      if (cons >= 1 && cons < 6) {
        const dmgBase = bn * (1 + (attr.a.multi || 0) / 100) + (attr.a.plus || 0)
        deductC1([bite2, bite3], hp * 66 / 100, dmgBase)
      }
      const q = basic(hp * talent.q['技能伤害'] / 100, 'q')
      return {
        dmg: bite1.dmg + bite2.dmg + bite3.dmg + q.dmg,
        avg: bite1.avg + bite2.avg + bite3.avg + q.avg
      }
    }
  }, {
    title: '对群一轮总伤',
    // 3个敌人，3次 巨浪鲨鲨撕咬 + 爆瀑飞弹 * 3
    // 巨浪鲨鲨撕咬命中主目标，另外两个被挂印记的目标吃鲨鲨飞弹伤害
    // 冲浪时光效果：增伤根据层数递减，第一次的飞弹伤害就会开始递减
    // 所以带专武的情况下飞弹伤害始终比鲨鲨撕咬伤害少一些，就因为找这个差值问题浪费一下午时间
    params: { EnemyGroup: true },
    dmg: ({ talent, calc, attr, cons }, { basic }) => {
      const hp = calc(attr.hp)
      const bn = biteNum({ talent, calc, attr })
      const eachLayer = attr.weapon?.name === '冲浪时光' ? (12 + attr.refine * 3) / 100 : 0
      const dmgNum = 1 + (attr.dmg.base + attr.dmg.plus) / 100 + attr.a.dmg / 100
      const bite1 = basic(bn, 'a')
      const bite2    = layerScale(bite1, eachLayer, dmgNum, 1)
      const bite3    = layerScale(bite1, eachLayer, dmgNum, 2)
      const missile1 = layerScale(bite1, eachLayer, dmgNum, 1)
      const missile2 = layerScale(bite1, eachLayer, dmgNum, 2)
      const missile3 = layerScale(bite1, eachLayer, dmgNum, 3)
      if (cons >= 1 && cons < 6) {
        const dmgBase = bn * (1 + (attr.a.multi || 0) / 100) + (attr.a.plus || 0)
        deductC1([bite2, bite3, missile2, missile3], hp * 66 * 0.72 / 100, dmgBase)
      }
      const q = basic(hp * talent.q['技能伤害'] / 100, 'q')
      return {
        dmg: bite1.dmg + bite2.dmg + bite3.dmg + (missile1.dmg + missile2.dmg + missile3.dmg) * 2 + q.dmg * 3,
        avg: bite1.avg + bite2.avg + bite3.avg + (missile1.avg + missile2.avg + missile3.avg) * 2 + q.avg * 3
      }
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 巨浪鲨鲨撕咬蒸发`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, 
      Xilonen_hydro: true, isTeam: true }),
    dmg: (ctx, { basic }) => basic(biteNum(ctx), 'a', 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defParams = { Nightsoul: true }  // 夜魂
export const defDmgIdx = 2
export const consDmgKey = '3咬1Q对单一轮总伤'
export const mainAttr = 'hp,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    // 对群效果只有72%
    title: '被动「浪势充能」：浪势充能使鲨鲨撕咬造成的伤害提升[aPlus]',
    sort: 9,
    data: {
      aPlus: ({ talent, calc, attr, params }) =>
        calc(attr.hp) * talent.e['浪势充能伤害提升'] / 100 * 3 * (params.EnemyGroup ? 0.72 : 1)
    }
  }, {
    // 对群效果只有72%
    check: ({ params }) => params.EnemyGroup === true,
    title: '踏鲨破浪对群伤害递减至72%',
    data: { aMulti: 72 - 100 }
  }, {
    // 单人伤害默认只吃一层，组队才吃三层，实际组队没写q，先这样设计
    title: '天赋「纳塔最好的向导」：逐浪心得使爆瀑飞弹伤害提升[qPlus]',
    sort: 9,
    data: {
      qPlus: ({ calc, attr, params }) => calc(attr.hp) * 0.15 * (params.isTeam ? 3 : 1)
    }
  }, {
    // 1命对群效果也只有72%
    title: '1命「悠闲的「梅兹特利」…」：首次巨浪鲨鲨撕咬及触发的鲨鲨飞弹造成的伤害提升[aPlus]',
    cons: 1,
    sort: 9,
    data: {
      aPlus: ({ calc, attr, params }) => calc(attr.hp) * 66 * (params.EnemyGroup ? 0.72 : 1) / 100
    }
  }, {
    title: '4命「鲨鲨主食是豚豚。」：爆瀑飞弹造成的伤害提升75%',
    cons: 4,
    data: { 
      qDmg: 75 
    }
  }, {
    // 专武冲浪时光炽夏层数递减，飞弹少吃冲浪时光单层aDmg
    check: ({ params, attr }) => params.SharkMissile === true && attr.weapon?.name === '冲浪时光',
    title: '「冲浪时光」：鲨鲨撕咬命中后效果减少一层，鲨鲨飞弹伤害递减[aDmg]%',
    data: {
      aDmg: ({ attr }) => -(12 + attr.refine * 3)
    }
  }]
