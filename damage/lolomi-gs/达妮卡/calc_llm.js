import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '达妮卡'

const team = ['奥黛塔', '米提亚', '瓦列里']
const artifact_normal = ['炉火', '千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { sweeper: true })

// sweeper true = 清扫者（站场），false = 护卫（后台）
const isSweeper = (ds) => ds.params.sweeper === true

// 2命「炽流砂的静心」祝歌：星超导反应附加基础值
// 持有祝歌的角色消耗1层提升80%攻击力；清扫者形态达妮卡至多消耗2层提升350%攻击力
const c2Flat = (ds) => {
  const { cons, attr, calc } = ds
  if (cons < 2) return 0
  return calc(attr.atk) * (isSweeper(ds) ? 3.5 : 0.8)
}

const starConduct = (ds, calcApi, rate, slot) => {
  const { attr, calc } = ds
  return calcApi.basic(calc(attr.atk) * rate / 100 + c2Flat(ds), slot, 'stellarConduct')
}

// 「净世卫仪」
const burstElectro = (ds, dmg) => {
  const { talent } = ds
  const s1 = dmg(talent.q['一段雷元素伤害/星超导伤害2'][0], 'q')
  const mid = dmg(talent.q['二段/三段/四段雷元素伤害'], 'q')
  const s5 = dmg(talent.q['五段雷元素伤害/星超导伤害2'][0], 'q')
  return { dmg: s1.dmg + mid.dmg * 3 + s5.dmg, avg: s1.avg + mid.avg * 3 + s5.avg }
}

// 「净世卫仪」辉映·星超导
const burstStar = (ds, calcApi) => {
  const { talent } = ds
  const r1 = starConduct(ds, calcApi, talent.q['一段雷元素伤害/星超导伤害2'][1], 'q')
  const r5 = starConduct(ds, calcApi, talent.q['五段雷元素伤害/星超导伤害2'][1], 'q')
  return { dmg: r1.dmg + r5.dmg, avg: r1.avg + r5.avg }
}

// 「准雷定锚」站场普攻四段
const anchorCombo = (ds, dmg) => {
  const { talent } = ds
  const s1 = dmg(talent.e['准雷定锚普通攻击一段雷元素伤害'], 'a')
  const s2 = dmg(talent.e['准雷定锚普通攻击二段雷元素伤害'], 'a')
  const [p3, n3] = talent.e['准雷定锚普通攻击三段雷元素伤害2']
  const s3 = dmg(p3 * n3, 'a')
  const s4 = dmg(talent.e['准雷定锚普通攻击四段雷元素伤害'], 'a')
  return { dmg: s1.dmg + s2.dmg + s3.dmg + s4.dmg, avg: s1.avg + s2.avg + s3.avg + s4.avg }
}

// 「荡除之志」清扫者特殊战技
const clearStrike = (ds, calcApi) => {
  const { attr, calc, talent, cons } = ds
  const dmg = calcApi
  const boost = talent.q['荡除之志伤害提升'] / 100 * (cons >= 1 ? 2.2 : 1)
  const rate = talent.e['荡除之志伤害'] * (1 + boost)
  if (cons >= 6) {
    const cpct = Math.min(calc(attr.atk) / 500 * 2.5, 10)
    const cdmg = Math.min(calc(attr.atk) / 500 * 25, 100)
    return dmg.withAttr({
      cpct: { plus: (attr.cpct?.plus ?? 0) + cpct },
      cdmg: { plus: (attr.cdmg?.plus ?? 0) + cdmg }
    })(rate, 'e')
  }
  return dmg(rate, 'e')
}

// 「御前护卫」后台15秒
const calcGuardianRotation = (ds, calcApi) => {
  const { talent, params } = ds
  const dmg = calcApi
  const hits = params.synergyHits ?? 10
  const synergy = dmg(talent.e['准雷定锚协同攻击伤害'], 'e')
  const hold = dmg(talent.e['护持之志伤害'], 'e')
  const be = burstElectro(ds, dmg)
  const bs = burstStar(ds, dmg)
  return {
    dmg: synergy.dmg * hits + hold.dmg + be.dmg + bs.dmg,
    avg: synergy.avg * hits + hold.avg + be.avg + bs.avg
  }
}

// 「清扫者」站场15秒
const calcSweeperRotation = (ds, calcApi) => {
  const { params } = ds
  const dmg = calcApi
  const rounds = params.sweeperRounds ?? 3
  const be = burstElectro(ds, dmg)
  const bs = burstStar(ds, dmg)
  const combo = anchorCombo(ds, dmg)
  const clear = clearStrike(ds, dmg)
  return {
    dmg: be.dmg + bs.dmg + combo.dmg * rounds + clear.dmg * (rounds + 1),
    avg: be.avg + bs.avg + combo.avg * rounds + clear.avg * (rounds + 1)
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「御前护卫」为队伍提供攻击力',
    params: { sweeper: false },
    dmg: ({ attr, calc, talent, cons }) => ({
      avg: `${Math.round(Math.min(calc(attr.atk) * talent.q['攻击力加成比例'] / 100, talent.q['攻击力加成上限']) * (cons >= 1 ? 2 : 1))}`,
      type: 'text'
    })
  }, {
    title: '「御卫护盾」吸收量',
    params: { sweeper: false },
    dmg: ({ talent, calc, attr }, { shield }) => shield(talent.e['护盾吸收量2'][0] * calc(attr.atk) / 100 + talent.e['护盾吸收量2'][1])
  }, {
    title: '2命「祝歌」提供星超导反应基础值',
    cons: 2,
    params: { sweeper: false },
    dmg: (ds) => ({ avg: `${Math.round(c2Flat(ds))}`, type: 'text' })
  }, {
    title: '6命「御前护卫」提供星超导增伤',
    cons: 6,
    params: { sweeper: false },
    dmg: ({ attr, calc }) => ({ avg: `${Math.round(Math.min(calc(attr.atk) / 1000 * 10, 40))}%`, type: 'text' })
  }, {
    title: '「护持之志」伤害',
    params: { sweeper: false },
    dmg: ({ talent }, dmg) => dmg(talent.e['护持之志伤害'], 'e')
  }, {
    title: '「荡除之志」伤害',
    params: { sweeper: true },
    dmg: (ds, calcApi) => clearStrike(ds, calcApi)
  }, {
    title: '「准雷定锚」协同伤害',
    params: { sweeper: false },
    dmg: ({ talent }, dmg) => dmg(talent.e['准雷定锚协同攻击伤害'], 'e')
  }, {
    title: '「准雷定锚」普攻四段总伤',
    params: { sweeper: true },
    dmg: (ds, calcApi) => anchorCombo(ds, calcApi)
  }, {
    title: '「净世卫仪」总伤',
    dmg: (ds, calcApi) => {
      const be = burstElectro(ds, calcApi)
      const bs = burstStar(ds, calcApi)
      return { dmg: be.dmg + bs.dmg, avg: be.avg + bs.avg }
    }
  }, {
    title: '御前护卫后台15秒总伤',
    params: { sweeper: false },
    dmg: (ds, calcApi) => calcGuardianRotation(ds, calcApi)
  }, {
    title: '清扫者站场15秒总伤',
    dmg: (ds, calcApi) => calcSweeperRotation(ds, calcApi)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 站场15秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      sweeper: true
    }),
    dmg: calcSweeperRotation
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defDmgIdx = 6
export const consDmgKey = '清扫者站场15秒总伤'
// sweeper      侍者形态分支：true = 清扫者(站场)，false = 御前护卫(后台)
// sweeperRounds: 清扫者站场普攻轮数，默认3轮
// synergyHits:   御前护卫后台协同攻击次数，默认15秒10次
export const defParams = {
  sweeper: true, sweeperRounds: 3, synergyHits: 10
}

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「星耀祝礼·纤毫不遗」：基于攻击力提升星超导反应基础伤害[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    title: '天赋「古海浪的咏歌」：辉映星超导降低附近敌人冰雷元素抗性[kx]%',
    data: {
      kx: 30
    }
  }, {
    check: ({ params }) => params.sweeper !== true,
    title: '天赋「应是扫除之日」：护持之志后达妮卡攻击力提升20%',
    data: {
      atkPct: 20
    }
  }, {
    check: ({ params }) => params.sweeper !== true,
    title: '元素爆发「净世卫仪」御前护卫：为队伍提供基础攻击力[atkPlus]',
    sort: 9,
    data: {
      atkPlus: ({ attr, calc, talent, cons }) => Math.min(calc(attr.atk) * talent.q['攻击力加成比例'] / 100, talent.q['攻击力加成上限']) * (cons >= 1 ? 2 : 1)
    }
  }, {
    title: '1命「冰宫殿的奉侍」：元素爆发提升清扫者效果120%，提升御前护卫效果100%',
    cons: 1
  }, {
    title: '2命「炽流砂的静心」：祝歌基于攻击力提升星超导反应基础伤害',
    cons: 2
  }, {
    title: '6命「醒于晨前之星」：准雷定锚期间队伍星超导反应伤害擢升[elevated]%',
    cons: 6,
    data: {
      elevated: 15
    }
  }, {
    check: ({ params }) => params.sweeper !== true,
    title: '6命「醒于晨前之星」御前护卫：基于攻击力使场上角色星超导伤害提升[stellarConduct]%',
    cons: 6,
    sort: 9,
    data: {
      stellarConduct: ({ attr, calc }) => Math.min(calc(attr.atk) / 1000 * 10, 40)
    }
  }
]
