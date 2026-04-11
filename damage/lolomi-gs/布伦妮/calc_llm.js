import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '布伦妮'

const team = ['法尔伽', '杜林', '班尼特']
const artifact_normal = ['宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: '「振铃同心」增伤',
    dmg: ({ attr }) => ({ avg: Math.min((attr.atk - 1000) * 0.01, 35) + "%", type: 'text' })
  }, {
    title: '「狩灾誓锤」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能一段伤害'], 'e')
  }, {
    title: '「狩灾誓锤」二段染色伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能二段伤害'], 'e', 'coloringDmg')
  }, {
    title: '「铃鸣·狩魔之刻」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「诱巫饵铃」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['诱巫饵铃伤害'], 'q')
  }, {
    title: '「诱巫饵铃」染色伤害',
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 1.5, 'q', 'coloringDmg')
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「诱巫饵铃」染色伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 1.5, 'q', 'coloringDmg')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg'
export const defParams = { Hexenzirkel: true }
export const consDmgKey = '「诱巫饵铃」染色伤害'
export const defDmgIdx = 3

export const buffs = [
  ...TeamBuff,
  {
    title: '「魔女的前夜礼·寻魔之誓」：触发扩散后布伦妮攻击力提高65%',
    data: {
      atkPct: 65
    }
  },{
    title: '天赋「振铃同心」：基于布伦妮攻击力超过1000的部分，提升伤害[dmg]%',
    sort: 9,
    data: {
      dmg: ({ attr }) => Math.min((attr.atk - 1000) * 0.01, 35)
    }
  },{
    title: '2命「整理杂乱的包袱，元素妙力果然」：攻击力至多提升40%',
    cons: 2,
    data: {
      atkPct: 40
    }
  },{
    title: '6命「故事结尾在这儿，念给伙伴听完」：攻击力提升350点',
    cons: 6,
    data: {
      atkPlus: 350
    }
  }
]
