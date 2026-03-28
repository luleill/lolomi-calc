import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '达达利亚'
/**
 * 达茜万班吃满buff可行的一套蒸发手法
 * 达达利亚重击挂水，茜特菈莉普攻触发烬城，切达达利亚开e继续挂水
 * 切万叶e扩水风套减抗，切茜特菈莉开e冻结减水抗，切班尼特开q，万叶退到班尼特圈边位置开q
 * 切达达利亚eq正好近战状态蒸发
 */
const team = ['茜特菈莉', '枫原万叶', '班尼特']
const artifact_normal = ['烬城', '宗室', '风套']

const team_B = ['香菱', '枫原万叶', '班尼特']
const artifact_B = ['风套', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: '「断流·闪」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['断流·闪 伤害'], 'a')
  }, {
    title: '「断流·破」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['断流·破 伤害'], 'a')
  }, {
    title: '「断流·斩」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['断流·斩 伤害'], 'e')
  }, {
    title: '「断流·爆」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['断流·爆 伤害'], 'q')
  }, {
    title: '「魔王武装·狂澜」重击蒸发',
    dmg: ({ talent }, dmg) => dmg(talent.e['重击伤害'], 'a2' , 'vaporize')
  }, {
    title: '「极恶技·魔弹一闪」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·远程'], 'q')
  }, {
    title: '「极恶技·尽灭水光」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q')
  }, {
    title: '「极恶技·尽灭水光」蒸发伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q' , 'vaporize')
  }, {
    title: '10秒站场总伤',
    //  开e + 3轮3A重 + q + 3次断流斩（四命6次） + 1次断流爆
    dmg: ({ talent, cons }, dmg ) =>{
      const attacks = [
        { key: '状态激发伤害', type: 'e' },
        { key: '一段伤害', type: 'a', count: 3 },
        { key: '二段伤害', type: 'a', count: 3 },
        { key: '三段伤害', type: 'a', count: 3 },
        { key: '重击伤害', type: 'a2', count: 3 },
        { key: '断流·斩 伤害', type: 'e', count: cons >= 4 ? 6 : 3 },
        { key: '技能伤害·近战', type: 'q' },
        { key: '断流·爆 伤害', type: 'q' }
      ]
      return attacks.reduce((acc, { key, type, count = 1 }) => {
        const result = dmg(talent.e[key] || talent.q[key], type)
        return {
          dmg: acc.dmg + result.dmg * count,
          avg: acc.avg + result.avg * count
        }
      }, { dmg: 0, avg: 0 })
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「尽灭水光」蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q' , 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「尽灭水光」蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害·近战'], 'q' , 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  
  export const defDmgIdx = 5
  export const consDmgKey = '10秒站场总伤'
  export const mainAttr = 'atk,cpct,cdmg,mastery'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '4命「深渊之灾·凝水盛放」：魔王武装近战触发断流·斩；远程触发断流·闪',
      cons: 4
    }
  ]
  