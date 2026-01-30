import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '甘雨'

const team = ['申鹤','枫原万叶','班尼特']
const artifact_normal = ['宗室', '风套']

const team_B = ['申鹤','爱可菲','芙宁娜']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{q:true},-3)

export const details = applyStandardTeam([
  {
    title: '单人触发满特效后攻击力',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.atk) * 1)
      }
    }
  },{
    title: '霜华矢两段总伤',
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢·霜华绽发伤害'] + talent.a['霜华矢命中伤害'], 'a2') 
  },{
    title: '6命2E三箭爆发总伤害',
    check: ({ cons }) => cons >= 6,
    dmg: ({ talent }, dmg) =>{
      let e = dmg(talent.e['技能伤害'], 'e')
      let a = dmg(talent.a['霜华矢·霜华绽发伤害'] + talent.a['霜华矢命中伤害'], 'a2') 
      return {
       dmg: e.dmg * 2 + (a.dmg * 3),
       avg: e.avg * 2 + (a.avg * 3)
      }
     }
  },{ 
    title: '霜华矢绽发融化伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢·霜华绽发伤害'], 'a2', 'melt')
  }, {
    title: '「山泽麟迹」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「山泽麟迹」融化伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e', 'melt')
  }, {
    params: {q: true },
    title: '「降众天华」冰凌伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['冰棱伤害'], 'q')
  },{
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}霜华矢一箭总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      q: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢·霜华绽发伤害'] + talent.a['霜华矢命中伤害'], 'a2'),
  },{
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}霜华矢绽发融化伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢·霜华绽发伤害'], 'a2', 'melt')
  },{
    params: { 
      zongshi: true, fengtao: true, legend_max: true,
      ShenHe_best: true, Kazuha_best: true, Bennett_best : true,
     },
    title: '双药地方传奇满配甘鹤万班绽放核爆',
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢·霜华绽发伤害'], 'a2', 'melt')
  },{
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
  ])
  
  export const defDmgIdx = 1
  export const mainAttr = 'atk,cpct,cdmg,mastery'
  
  export const buffs = [
    ...TeamBuff,
    {
      cons: 0,
      title: '甘雨天赋1：霜华矢发射后的5秒内霜华矢暴击率提高20%',
      data: {
        a2Cpct: 20
      }
    }, {
      title: '甘雨1命：霜华矢命中减少敌人15%冰抗',
      cons: 1,
      data: {
        kx: 15
      }
    }, {
      check: ({ params }) => params.cons >= 4 && params.q === true,
      title: '甘雨4命：大招领域内敌人受到的伤害提升[dmg]%',
      // 初始5增伤，每3秒提高5%，默认吃到10%增伤
      cons: 4,
      data: {
        dmg: 10
      }
    }
  ]
  