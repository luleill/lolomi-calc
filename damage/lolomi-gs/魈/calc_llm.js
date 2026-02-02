import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '魈'

const team = ['珐露珊','闲云','芙宁娜']
const artifact_normal = ['千岩', '宗室']

const team_B = ['珐露珊','闲云','伊安珊']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
{
  title: '触发满特效后攻击力',
  dmg: ({ attr, calc }) => {
    return { avg: Math.min(calc(attr.atk) * 1)}
  }
},
{
  title: '下落擦伤',
  dmg: ({ talent }, dmg) => dmg(talent.a['下坠期间伤害'], 'a')
}, {
  title: '「风轮两立」首次伤害',
  dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
}, {
  title: '满被动「风轮两立」伤害',
  params: {max_e: true},
  dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
}, {
  title: '「靖妖傩舞」首插伤害',
  dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
} ,{
  // 队伍伤害
  title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「靖妖傩舞」首插伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team_B, artifact_B).params
  }),
  dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
} ,{
  title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「靖妖傩舞」首插伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team, artifact_normal).params
  }),
  dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
}, {
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
])

export const defDmgIdx = 3
export const mainAttr = 'atk,cpct,cdmg'

export const defParams = {
  layer: 0
}

export const buffs = [
...TeamBuff,
{
  title: '靖妖傩舞：下落攻击伤害提升[a3Dmg]%',
  data: {
    a3Dmg: ({ talent }) => talent.q['普通攻击/重击/下落攻击伤害提升']
  }
}, {
  title: '魈天赋：开Q后每3秒伤害提升5%，默认首插吃10%',
  data: {
    dmg: 10
  }
}, {
  title: '魈被动：3层E使E的伤害提高45%',
  check: ({ params }) => params.max_e === true, 
  data: {
    eDmg: 45
  }
}
]

    