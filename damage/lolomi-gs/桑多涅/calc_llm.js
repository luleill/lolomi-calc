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
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, '', 'stellarConduct')
  }, {
    title: '「聚能光束」单段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['聚能光束伤害'], 'q')
  }, {
    title: '满层「聚能光束」星超导伤害',
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.q['聚能光束星超导伤害'] * 2 / 100, '', 'stellarConduct')
  }, {
    title: '解算模式一轮总伤',
    params: { tactic: 10, condense: 3, rays: 5 },
    dmg: ({ attr, calc, talent, cons, params }, calcApi) => {
      const { basic } = calcApi
      const dmg = calcApi
      // E：棱晶弹×2（第二枚原本400%伤害）+ 棱晶弹星超导
      const eBullet = dmg(talent.e['棱晶弹伤害'], 'e')
      const eBulletStar = basic(calc(attr.atk) * talent.e['棱晶弹星超导伤害'] / 100 * 4, '', 'stellarConduct')
      const eDmg = eBullet.dmg + eBulletStar.dmg
      const eAvg = eBullet.avg + eBulletStar.avg
      // Q：轰炸 + 聚能光束星超导（含改进战术加成）
      const qBomb = dmg(talent.q['轰炸伤害'], 'q')
      const qBeamMult = 1 + Math.min(params.tactic ?? 10, 10) * 0.10
      const qBeam = basic(calc(attr.atk) * talent.q['聚能光束星超导伤害'] / 100 * qBeamMult, '', 'stellarConduct')
      // 射线
      const ray = basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, 'a2', 'stellarConduct')
      const rayCount = 5
      // 4命额外星超导：默认2次
      const c4 = cons >= 4 ? basic(calc(attr.atk) * 1.25, '', 'stellarConduct') : { dmg: 0, avg: 0 }
      const c4Dmg = c4.dmg * 2
      const c4Avg = c4.avg * 2
      // 6命
      const c6 = cons >= 6 ? basic(calc(attr.atk) * 0.80 * 4, '', 'stellarConduct') : { dmg: 0, avg: 0 }
      return {
        dmg: eDmg + qBomb.dmg + qBeam.dmg + ray.dmg * rayCount + c4Dmg + c6.dmg,
        avg: eAvg + qBomb.avg + qBeam.avg + ray.avg * rayCount + c4Avg + c6.avg
      }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「冷凝射线」星超导`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true
    }),
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, '', 'stellarConduct')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「冷凝射线」星超导`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_cryo: true, cryo_two: true
    }),
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.atk) * talent.a['重击冷凝射线星超导伤害'] / 100, '', 'stellarConduct')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defDmgIdx = 3
export const consDmgKey = '解算模式一轮总伤'
export const defParams = { tactic: 5, condense: 3, starRecords: 10 }

export const buffs = [
  ...TeamBuff,
  {
    title: '「星耀祝礼·唯理为光」：星超导基础伤害提升[fypct]%',
    sort: 9,
    data: {
      fypct: ({ attr, calc }) => Math.min(calc(attr.atk) / 100 * 0.7, 14)
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
    title: ({ params }) => {
      const stacks = Math.min(params.condense ?? 3, 3)
      return `2命「回望镜中，时岁翩然」：${stacks}层叠加时冷凝射线暴击伤害提升[a2Cdmg]%`
    },
    sort: 9,
    cons: 2,
    data: {
      a2Cdmg: ({ params }) => 40 + Math.min(params.condense ?? 3, 3) * 20
    }
  }, {
    title: '4命「世事皆数，昼来夜往」：每4秒触发一次125%攻击力的星超导协同伤害',
    cons: 4,
  }, {
    title: '6命「水仙梦醒，且望晨光」：额外造成至多4段攻击力50%的伤害，星超导反应擢升20%',
    cons: 6,
    data: {
      elevated: 20
    }
  }
]
