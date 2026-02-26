import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '雷电将军'
// 没搞清元素爆发愿力加成机制，直接抄喵喵
const team = ['九条裟罗','枫原万叶','班尼特']
const artifact_normal = ['宗室', '风套']

const team_B = ['九条裟罗','夏沃蕾','班尼特']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发满特效后攻击力',
    dmg: ({ attr, calc }) => {return { avg: Math.min(calc(attr.recharge) * 1)}}
  }, {
    title: '「雷罚恶曜之眼」协同伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['协同攻击伤害'], 'e')
  }, {
    title: '「梦想一刀」满愿力拔刀伤害',
    params: { type: 0 },
    dmg: ({ talent }, dmg) => dmg(talent.q['梦想一刀基础伤害'], 'q')
  }, {
    title: '「梦想一心」3A重击总伤',
    params: { type: 1 },
    dmg: ({ talent }, dmg ) =>{
        let a_1 = dmg(talent.q['一段伤害'], 'q')
        let a_2 = dmg(talent.q['二段伤害'], 'q') 
        let a_3 = dmg(talent.q['三段伤害'], 'q')
        let a_z = dmg(talent.q['重击伤害'], 'q')
        return {
        dmg: a_1.dmg + a_2.dmg + a_3.dmg + a_z.dmg,
        avg: a_1.avg + a_2.avg + a_3.avg + a_z.avg,
        }
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「梦想一刀」满愿力拔刀`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      type: 0
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['梦想一刀基础伤害'], 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「梦想一刀」满愿力拔刀`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      type: 0
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['梦想一刀基础伤害'], 'q')
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
  export const mainAttr = 'atk,cpct,cdmg,recharge,dmg'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '恶曜开眼：元素爆发伤害提升[qDmg]%',
      data: {
        qDmg: ({ talent }) => talent.e['元素爆发伤害提高'] * 90
      }
    }, {
      title: '梦想真说：满愿力获得[qPct]%大招倍率加成',
      data: {
        qPct: ({ talent, params }) => talent.q['愿力加成'][params.type || 0] * 60
      }
    }, {
      check: ({ cons }) => cons >= 2,
      title: '雷神2命：大招无视敌人[qIgnore]%防御力',
      data: {
        qIgnore: 60
      }
    }, {
      title: '雷神被动：基于元素充能获得[dmg]%雷伤加成',
      sort: 4,
      data: {
        dmg: ({ attr }) => Math.max(attr.recharge.base + attr.recharge.plus - 100, 0) * 0.4
      }
    }
  ]
  