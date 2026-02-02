import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '胡桃'

const team = ['茜特菈莉','夜兰','芙宁娜']
const artifact_normal = ['烬城', '千岩']

const team_B = ['行秋','钟离','夜兰']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => {
      return { avg: Math.min(calc(attr.hp) * 1)}
    }
  }, {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => {
      return { avg: Math.min(calc(attr.atk) * 1)}
    }
  }, {
    title: `「蝶引来生」半血重击蒸发伤害`,
    params: {half_blood: true},
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: `血梅香伤害`,
    dmgKey: 'e',
    dmg: ({ talent }, dmg) => dmg(talent.e['血梅香伤害'], 'e')
  }, {
    title: `「安神秘法」半血蒸发伤害`,
    params: {half_blood: true},
    dmg: ({ talent }, dmg) => dmg(talent.q['低血量时技能伤害'], 'q', 'vaporize')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「蝶引来生」半血重击蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「蝶引来生」半血重击蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
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
  title: '胡桃技能：[蝶引来生] 消耗一部分生命值,击退周围敌人,基于进入该状态时胡桃的生命值上限,提高胡桃[atkPlus]点攻击力',
  sort: 9,
  data: {
    atkPlus: ({ talent, attr, calc }) => {
      return Math.min(talent.e['攻击力提高'] * calc(attr.hp) / 100, attr.atk.base * 4)
    }
  }
}, {
  check: ({ params }) => params.half_blood === true,
  title: '胡桃天赋：[血之灶火] 胡桃的生命值低于或等于50%时,获得[dmg]%火元素伤害加成',
  data: {
    dmg: 33
  }
}, {
  title: '胡桃2命：[最不安神晴又复雨] 血梅香造成的伤害提高[ePlus]点,安神秘法会为命中的敌人施加血梅香效果',
  cons: 2,
  sort: 9,
  data: {
    ePlus: ({ attr, calc }) => calc(attr.hp) * 0.1
  }
}
]

    