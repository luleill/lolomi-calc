import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '玛拉妮'

const team = ['茜特菈莉','希诺宁','玛薇卡']
const artifact_normal = ['烬城', '教官', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,        {Xilonen_hydro: true })

export const details = applyStandardTeam([
  {
    title: '单人触发特效后生命值',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.hp) * 1)
      }
    }
  }, {
    title: '双水二命希诺宁满特效后生命值',
    params: { hydro_two: true , Xilonen_hydro: true},
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.hp) * 1)
      }
    }
  }, {
    title: '鲨鲨撕咬基础伤害',
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.hp) * talent.e['鲨鲨撕咬基础伤害'] / 100, 'a')
  }, {
    title: '巨浪鲨鲨撕咬伤害',
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.hp) * ( talent.e['鲨鲨撕咬基础伤害'] + talent.e['巨浪鲨鲨撕咬伤害额外提升'] ) / 100, 'a')
  }, {
    title: '巨浪鲨鲨撕咬蒸发',
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.hp) * ( talent.e['鲨鲨撕咬基础伤害'] + talent.e['巨浪鲨鲨撕咬伤害额外提升'] ) / 100, 'a', 'vaporize')
  }, {
    title: `爆瀑飞弹伤害`,
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
  // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}巨浪鲨鲨撕咬蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true
    }),
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.hp) * ( talent.e['鲨鲨撕咬基础伤害'] + talent.e['巨浪鲨鲨撕咬伤害额外提升'] ) / 100, 'a', 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
  }}
])
  
export const defParams = { Nightsoul: true }
export const defDmgKey = 'e'
export const mainAttr = 'hp,cpct,cdmg,mastery'

export const buffs = [
  ...TeamBuff,
  {
  title: '踏鲨破浪：3层浪势充能使鲨鲨撕咬造成的伤害提升[aPlus]巨浪鲨鲨撕咬伤害额外提升[_aPlus]',
  sort: 9,
  data: {
    aPlus: ({ talent, calc, attr }) => calc(attr.hp) * talent.e['浪势充能伤害提升'] / 100 * 3 ,
    _aPlus: ({ talent, calc, attr }) => calc(attr.hp) * talent.e['巨浪鲨鲨撕咬伤害额外提升'] / 100
  }
}, {
  title: '玛拉妮天赋：3层逐浪心得使爆瀑飞弹伤害提升[qPlus]',
  sort: 9,
  data: {
    qPlus: ({ calc, attr }) => calc(attr.hp) * 45 / 100
  }
}, {
  title: '玛拉妮1命：第一次巨浪鲨鲨撕咬及它所触发的鲨鲨飞弹造成的伤害提升[aPlus]',
  cons: 1,
  sort: 9,
  data: {
    aPlus: ({ calc, attr }) => calc(attr.hp) * 66 / 100
  }
}, {
  title: '玛拉妮4命：爆瀑飞弹造成的伤害提升[qDmg]%',
  cons: 4,
  data: {
    qDmg: 75
  }
}]