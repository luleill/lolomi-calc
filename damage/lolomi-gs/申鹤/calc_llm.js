import { TeamBuff } from '../teambuffs.js'
import { teamConfig } from '../util.js'

const mainCharName = '申鹤'

const team = ['重云','爱可菲','芙宁娜']
const artifact_normal = ['宗室', '千岩']

const team_B = ['希诺宁','枫原万叶','班尼特']
const artifact_reaction = ['烬城', '风套','宗室']

const team_C = ['闲云','芙宁娜','班尼特']
const artifact_C = ['宗室', '千岩']

export const details = [
  {
    title: '单人触发满特效后攻击力',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.atk) * 1)
      }
    }
  },{
    title: '「冰翎」基础伤害提升值',
    dmg: ({ talent, calc, attr }) => {
      return {
        avg: talent.e['伤害值提升'] * calc(attr.atk) / 100
      }
    }
  }, {
    title: 'E「仰灵威召将役咒」长按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['长按技能伤害'], 'e')
  }, {
    title: 'Q「神女遣灵真诀」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: 'Q「神女遣灵真诀」持续单段伤害',
    params: {q: true},
    dmg: ({ talent }, dmg) => dmg(talent.q['持续伤害'], 'q')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}长E+五段普攻总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      q: true,
    }),
    dmg: ({ talent }, dmg ) =>{
        let a_1 = dmg(talent.a['一段伤害'], 'a')
        let a_2 = dmg(talent.a['二段伤害'], 'a') 
        let a_3 = dmg(talent.a['三段伤害'], 'a')
        let a_4 = dmg(talent.a['四段伤害'], 'a')
        let a_5 = dmg(talent.a['五段伤害'], 'a')
        let e = dmg(talent.e['长按技能伤害'], 'e')
        return {
        dmg: a_1.dmg + a_2.dmg + a_3.dmg + a_4.dmg + a_5.dmg + e.dmg,
        avg: a_1.avg + a_2.avg + a_3.avg + a_4.avg + a_5.avg + e.avg,
        }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_reaction, mainCharName).title}长E融化伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_reaction).params,
      q: true,
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['长按技能伤害'], 'e', 'melt')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}下落坠地伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}下落坠地蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params
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
]

  export const mainAttr = 'atk,cpct,cdmg'
  export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.q === true,
    title: '天赋-大洞弥罗尊法：Q范围内冰伤提高15%',
    data: {
      dmg: 15
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '元素爆发-神女遣灵真诀：范围内敌人冰抗和物抗降低[kx]%',
    data: {
      kx: ({ talent }) => talent.q['抗性降低']
    }
  }, {
    title: '天赋-缚灵通真法印：点按E提高15%元素战技及元素爆发伤害，长按E提高15%普攻、重击和下落攻击伤害',
    data: {
      eDmg: 15,
      qDmg: 15,
      aDmg: 15,
      a2Dmg: 15,
      a3Dmg: 15
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '申鹤2命：Q范围内暴击伤害提高15%',
    cons: 2,
    data: {
      cdmg: 15
    }
  }, {
    title: '申鹤天赋：E提升冰伤害[ePlus]',
    sort: 9,
    data: {
      ePlus: ({ talent, calc, attr }) => talent.e['伤害值提升'] * calc(attr.atk) / 100,
      qPlus: ({ talent, calc, attr }) => talent.e['伤害值提升'] * calc(attr.atk) / 100
    }
  }]

    