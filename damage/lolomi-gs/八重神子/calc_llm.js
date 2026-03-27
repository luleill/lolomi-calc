import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '八重神子'

const team = ['九条裟罗','枫原万叶','纳西妲']
const artifact_normal = ['宗室','风套']

const team_B = ['希诺宁','芙宁娜','纳西妲']
const artifact_B = ['烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发满特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: ({ cons }) => `${cons < 2 ? '三' : '四'}阶「杀生樱」伤害`,
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      return dmg(talent.e[skillKey], 'e')
    }
  }, {
    title: ({ cons }) => `${cons < 2  ? '三' : '四'}阶「杀生樱」激化伤害`,
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      return dmg(talent.e[skillKey], 'e', 'aggravate')
    }
  }, {
    title: '「大密法·天狐显真」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「天狐霆雷」额外三次总伤',
    dmg: ({ talent }, dmg) => dmg(talent.q['天狐霆雷伤害'] * 3, 'q')
  }, {
    title: '杀生樱后台激化总伤',
    // 默认有草底，一轮循环杀生樱攻击 5 * 3 次，有5次超激化
    dmg: ({ talent, cons }, dmg) => {
      const skillKey = cons < 2 ? '杀生樱伤害·叁阶' : '杀生樱伤害·肆阶'
      const e = dmg(talent.e[skillKey], 'e')
      const ecjh = dmg(talent.e[skillKey], 'e', 'aggravate')
      return {
        dmg: e.dmg * 10 + ecjh.dmg * 5,
        avg: e.avg * 10 + ecjh.avg * 5
      };
    }
  }, {
    // 队伍伤害
    // 天狐霆雷独立附着，3次超激化
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「天狐显真」总激化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
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
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}${cons < 2 ? '三' : '四'}阶「杀生樱」激化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
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

  export const defDmgIdx = 4
  export const consDmgKey = '杀生樱后台激化总伤'
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
      cons : 2,
      title: '2命「望月吼哕声」：杀生樱初始位阶提升至贰阶，位阶上限提升至肆阶',
    }, {
      cons : 4,
      title: '4命「绯樱引雷章」：杀生樱命中敌人后，所有角色获得20%雷伤加成',
      data: {
        dmg: 20
      }
    }, {
      cons: 6,
      title: '6命「大杀生咒禁」：杀生樱攻击无视敌人60%的防御力',
      data: {
        eIgnore: 60
      }
    }]