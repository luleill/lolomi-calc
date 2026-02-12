import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '枫原万叶'

const team = ['闲云','班尼特','芙宁娜']
const artifact_normal = ['宗室']

const team_B = ['珐露珊','闲云','芙宁娜']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{q:true},-3)

export const details = applyStandardTeam([
  {
    title: '最高元素增伤',
    params: { isQ: true},
    dmg: ({ attr }) => {
      return {
        avg: Math.floor(attr.mastery * 0.04) + "%",
        type: 'text'
      }
    }
  }, {
    title: '「千早振」长按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['长按技能伤害'], 'e')
  }, {
    title: '乱岚拨止·下落伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: '乱岚拨止·染色下落附加伤害',
    params: { fwzsy:true},
    dmg: ({ attr, calc }, {basic} ) => basic(calc(attr.atk) * 2, 'a3')
  }, {
    title: '「万叶之一刀」斩击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['斩击伤害'], 'q')
  }, {
    title: '满命风附魔普攻五段总伤',
    cons: 6,
    dmg: ({ talent }, dmg) => {
    const baseDamage = ['一段伤害', '二段伤害', '三段伤害', '四段伤害', '五段伤害']
        .map(key => dmg(talent.a[key], 'a'));
      const totalBaseDmg = baseDamage.reduce((sum, d) => sum + d.dmg, 0);
      const totalBaseAvg = baseDamage.reduce((sum, d) => sum + d.avg, 0);
      return {
          dmg: totalBaseDmg,
          avg: totalBaseAvg
      };
    }
  }, {
    title: '满命风附魔重击伤害',
    cons: 6,
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '扩散反应伤害',
    dmg: ({}, { reaction }) => reaction('swirl')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}满命下落风伤`,
    cons: 6,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}下落蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3','vaporize')
  }, {
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
      title: '天赋：风物之诗咏，提供0.04%对应元素伤害加成',
      check: ({ params }) => params.fwzsy === true,
      sort: 9,
      data: {
        dmg: ({ calc, attr }) => calc(attr.mastery) * 0.04,
      }
    }, {
      title: '万叶2命：开Q后精通提高200',
      check: ({ params }) => params.isQ === true,
      cons: 2,
      data: {
        mastery: 200
      }
    }, {
      title: '万叶6命：普通攻击、重击与下落攻击造成的伤害提升[dmg]',
      sort: 9,
      data: {
        dmg: ({ calc, attr }) => calc(attr.mastery) * 0.2
      }
    }
  ]
  