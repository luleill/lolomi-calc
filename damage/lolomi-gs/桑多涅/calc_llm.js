import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '桑多涅'

const team = ['八重神子', '七七', '希诺宁']
const artifact_normal = ['千岩']

const team_B = ['七七', '北斗', '迪奥娜']
const artifact_B = ['千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{pyro_two: true, Xilonen_cryo: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '三段普攻总伤',
    dmg: ({ talent }, dmg) =>
      '一二三'.split('').reduce((acc, n) => {
        const r = dmg(talent.a[`${n}段伤害`], 'a')
        acc.dmg += r.dmg
        acc.avg += r.avg
        return acc
      }, { dmg: 0, avg: 0 })
  }, {
    title: '重击「冷凝射线」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击冷凝射线伤害'], 'a2')
  }, {
    title: '重击「冷凝射线」星超导伤害',
    params: { condense: 3 },
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, 'a2', 'stellarConduct')
  }, {
    title: '「棱晶弹」星超导伤害',
    params: { ispower: true },
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.e['棱晶弹星超导伤害'] / 100, '', 'stellarConduct')
  }, {
    title: '「聚能光束」单段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['聚能光束伤害'], 'q')
  }, {
    title: '「聚能光束」星超导伤害',
    // 默认满层改进战术
    params: { tactic: 10 },
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      const tacticMult = 1 + Math.min(params.tactic ?? 10, 10) * 0.10
      return basic(calc(attr.atk) * talent.q['聚能光束星超导伤害'] / 100 * tacticMult, '', 'stellarConduct')
    }
  }, {
    title: '一轮重击伤害',
    // 持续单轮重击直至功率过载条拉满
    dmg: ({ attr, calc, talent, cons }, { basic }) => {
      const loopCount = cons >= 1 ? 6 : 3
      const ray = basic(calc(attr.atk) * talent.a['重击冷凝射线伤害'] / 100, 'a2')
      const rayStar = basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, 'a2', 'stellarConduct')
      let totalDmg = (ray.dmg * 3 + rayStar.dmg) * loopCount
      let totalAvg = (ray.avg * 3 + rayStar.avg) * loopCount
      if (cons >= 4) {
        const c4 = basic(calc(attr.atk) * 1.25, '', 'stellarConduct')
        totalDmg += c4.dmg * 2
        totalAvg += c4.avg * 2
      }
      if (cons >= 6) {
        const cluster = basic(calc(attr.atk) * 0.80 * 4, 'a2', 'stellarConduct')
        totalDmg += cluster.dmg
        totalAvg += cluster.avg
      }
      return { dmg: totalDmg, avg: totalAvg }
    }
  }, {
    title: '站场一轮总伤',
    params: { tactic: 10, condense: 2, time: 15, ispower: true },
    dmg: ({ attr, calc, talent, cons, params }, { basic }) => {
      // 默认木桩挂雷，能触发极星辉域
      // 默认手法，重击起手，过载条满后放E清空继续重击循环，Q结尾
      // T      : 站场时长，默认15秒
      // tLoop  : 重击冷凝射线星超导间隔，默认1秒一次
      // tE     : E释放时间+重击重新起手，默认耗时2秒
      // loopsPerE : 过载条充满可触发的射线星超导次数
      //   0命      : 3 次充满
      //   1命及以上 : 6 次充满
      // 一个完整周期：
      //   cycleTime = loopsPerE * tLoop + tE
      // 站场时长内可打出的重击总次数：
      // loopCount = T / cycleTime * loopsPerE
      const T = params.time ?? 15
      const tLoop = 1, tE = 2
      const loopsPerE = cons >= 1 ? 6 : 3
      const cycleTime = loopsPerE * tLoop + tE
      const loopCount = T / cycleTime * loopsPerE
      const eCount = T / cycleTime
      const ray = basic(calc(attr.atk) * talent.a['重击冷凝射线伤害'] / 100, 'a2')
      const rayStar = basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, 'a2', 'stellarConduct')
      let totalDmg = (ray.dmg * 3 + rayStar.dmg) * loopCount
      let totalAvg = (ray.avg * 3 + rayStar.avg) * loopCount
      if (cons >= 6) {
        // 两轮触发8次额外伤害
        const cluster = basic(calc(attr.atk) * 0.80 * 8, 'a2', 'stellarConduct')
        totalDmg += cluster.dmg
        totalAvg += cluster.avg
      }
      const eBulletStar = basic(calc(attr.atk) * talent.e['棱晶弹星超导伤害'] / 100, '', 'stellarConduct')
      totalDmg += eBulletStar.dmg * eCount
      totalAvg += eBulletStar.avg * eCount
      const qBomb = basic(calc(attr.atk) * talent.q['轰炸伤害'] / 100, 'q')
      const qBeamMult = 1 + Math.min(params.tactic ?? 10, 10) * 0.10
      const qBeam = basic(calc(attr.atk) * talent.q['聚能光束星超导伤害'] / 100 * qBeamMult, '', 'stellarConduct')
      totalDmg += qBomb.dmg + qBeam.dmg
      totalAvg += qBomb.avg + qBeam.avg
      if (cons >= 4) {
        const c4 = basic(calc(attr.atk) * 1.25, '', 'stellarConduct')
        const c4Count = Math.floor(T / 4)
        totalDmg += c4.dmg * c4Count
        totalAvg += c4.avg * c4Count
      }
      return { dmg: totalDmg, avg: totalAvg }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「冷凝射线」星超导`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true
    }),
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, 'a2', 'stellarConduct')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「冷凝射线」星超导`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_cryo: true, cryo_two: true
    }),
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, 'a2', 'stellarConduct')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defDmgIdx = 3
export const consDmgKey = '站场一轮总伤'
export const defParams = { tactic: 10, condense: 2, time: 15, ispower: true }

export const buffs = [
  ...TeamBuff,
  {
    title: '「星耀祝礼·唯理为光」：星超导基础伤害提升[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
    }
  }, {
    title: '天赋「悠久的演算机关」：解算功率大于50时第二枚棱晶弹造成原本400%伤害',
    check: ({ params }) => params.ispower === true,
    data: {
      eMulti: 300
    }
  }, {
    title: '天赋「淑女的行事准则」：基于攻击力提升元素精通[mastery]',
    sort: 9,
    data: {
      mastery: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 8, 160)
    }
  }, {
    title: '1命「鎏金未凋，夕暮已远」：星超导反应伤害提升30%',
    cons: 1,
    data: {
      stellarConduct: 30
    }
  }, {
    // 增伤单次递增，默认平均吃到两层效果
    title: ({ params }) => {
      const stacks = Math.min(params.condense ?? 2, 3)
      return `2命「回望镜中，时岁翩然」：${stacks}层叠加时冷凝射线暴击伤害提升[a2Cdmg]%`
    },
    sort: 9,
    cons: 2,
    data: {
      a2Cdmg: ({ params }) => 40 + Math.min(params.condense ?? 2, 3) * 20
    }
  }, {
    title: '4命「世事皆数，昼来夜往」：每4秒触发一次125%攻击力的星超导协同伤害',
    cons: 4,
  }, {
    title: '6命「水仙梦醒，且望晨光」：集束型冷凝射线额外4段攻击力80%冰元素星超导，星超导反应擢升20%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
