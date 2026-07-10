import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '八重神子'

const team = ['九条裟罗', '枫原万叶', '纳西妲']
const artifact_normal = ['宗室', '风套']

const team_B = ['希诺宁', '芙宁娜', '纳西妲']
const artifact_B = ['烬城']
// 星超导
const team_C = ['桑多涅', '七七', '希诺宁']
const artifact_C = ['千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发满特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: ({ cons }) => `${cons < 2 ? '三' : '四'}阶「杀生樱」伤害`,
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      return dmg(talent.e[skillKey], 'e')
    }
  }, {
    title: ({ cons }) => `${cons < 2 ? '三' : '四'}阶「杀生樱」激化伤害`,
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      return dmg(talent.e[skillKey], 'e', 'aggravate')
    }
  }, {
    title: '星超导伤害',
    params: { isstellar: true },
    dmg: ({ attr, calc, cons }, { basic }) =>
      basic(calc(attr.atk) * 2, '', 'stellarConduct', {dynamicCdmg: cons < 6 ? 0 : 200})
  }, {
    title: '「大密法·天狐显真」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「天狐霆雷」额外三次总伤',
    dmg: ({ talent }, dmg) => dmg(talent.q['天狐霆雷伤害'] * 3, 'q')
  }, {
    title: '后台杀生樱激化总伤',
    // 默认有草底，一轮循环杀生樱攻击 5 * 3 次，有5次超激化
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      const e = dmg(talent.e[skillKey], 'e')
      const ecjh = dmg(talent.e[skillKey], 'e', 'aggravate')
      return {
        dmg: e.dmg * 10 + ecjh.dmg * 5,
        avg: e.avg * 10 + ecjh.avg * 5
      }
    }
  }, {
    title: '星超导15秒站场总伤',
    params: { isstellar: true },
    // 默认木桩自挂雷，放出杀生樱后站场持续普攻，打5轮3A，放3次E，Q收尾
    // -- 可调参数
    // eHits: 杀生樱攻击间隔3秒，默认普通落雷12次，强化落雷5次
    // enhancedHits: 杀生樱3次落雷里有1次强化落雷，且额外触发1段星超导
    // eShrineHits : 三株杀生樱在场时再次放E会有一段星超导伤害
    dmg: ({ attr, calc, talent, cons, params }, { basic }) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      const eHits = params.eHits ?? 12
      const enhancedHits = params.enhancedHits ?? 5
      const eShrineHits = params.eShrineHits ?? 3
      const aLoop = '一二三'.split('').reduce((acc, n) => {
        const r = basic(calc(attr.atk) * talent.a[`${n}段伤害`] / 100, 'a')
        acc.dmg += r.dmg
        acc.avg += r.avg
        return acc
      }, { dmg: 0, avg: 0 })
      // 强化落雷
      const ebase = basic(calc(attr.atk) * talent.e[skillKey] / 100, 'e')
      const ePlus = basic(calc(attr.atk) * 0.8, 'e')
      // 强化落雷后额外星超导
      const passive = basic(calc(attr.atk) * 2, '', 'stellarConduct', { dynamicCdmg: cons < 6 ? 0 : 200 })
      // 放E的额外星超导
      const eShrine = basic(calc(attr.atk) * 0.5, '', 'stellarConduct', { dynamicCdmg: cons < 6 ? 0 : 200 })
      const qHit = basic(calc(attr.atk) * talent.q['技能伤害'] / 100, 'q')
      const tHu = basic(calc(attr.atk) * talent.q['天狐霆雷伤害'] / 100 * 3, 'q')
      const eDmg = ebase.dmg * eHits + ePlus.dmg * enhancedHits
      const eAvg = ebase.avg * eHits + ePlus.avg * enhancedHits
      return {
        dmg: aLoop.dmg * 5 + eDmg + passive.dmg * enhancedHits + eShrine.dmg * eShrineHits + qHit.dmg + tHu.dmg,
        avg: aLoop.avg * 5 + eAvg + passive.avg * enhancedHits + eShrine.avg * eShrineHits + qHit.avg + tHu.avg
      }
    }
  }, {
    // 队伍伤害
    // 天狐霆雷独立附着，3次超激化
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「天狐显真」总激化`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => {
      let Q1 = dmg(talent.q['技能伤害'], 'q', 'aggravate')
      let Q2 = dmg(talent.q['天狐霆雷伤害'], 'q', 'aggravate')
      return {
        dmg: Q1.dmg + Q2.dmg * 3,
        avg: Q1.avg + Q2.avg * 3
      }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 星超导伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      isstellar: true
    }),
    dmg: ({ attr, calc, cons }, { basic }) =>
      basic(calc(attr.atk) * 2, '', 'stellarConduct', {dynamicCdmg: cons < 6 ? 0 : 200})
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}${cons < 2 ? '三' : '四'}阶「杀生樱」激化`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      return dmg(talent.e[skillKey], 'e', 'aggravate')
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '星超导15秒站场总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「启蜇之祝词」：基于元素精通使杀生樱造成的伤害提升[eDmg]%',
    sort: 9,
    data: {
      eDmg: ({ attr, calc }) => calc(attr.mastery) * 0.15
    }
  }, {
    title: '天赋「祓所之讬宣」：基于攻击力80%提升下次杀生樱伤害，额外一次200%攻击力星超导伤害',
  }, {
    check: ({ params }) => params.isstellar === true,
    title: '1命「野狐供真篇」：触发超导/星超导后获得50%雷伤和50%星超导增伤',
    cons: 1,
    data: {
      dmg: 50,
      stellarConduct: 50
    }
  }, {
    title: '2命「望月吼哕声」：肆阶杀生樱提升200精通',
    cons: 2,
    data: {
      mastery: 200
    }
  }, {
    title: '4命「绯樱引雷章」：获得20%雷伤加成，元素爆发伤害提升100%',
    cons: 4,
    data: {
      dmg: 20,
      qDmg: 100
    }
  }, {
    title: '6命「大杀生咒禁」：杀生樱无视敌人60%防御力，星超导暴击伤害提升200%',
    cons: 6,
    data: {
      eIgnore: 60
    }
  }
]
