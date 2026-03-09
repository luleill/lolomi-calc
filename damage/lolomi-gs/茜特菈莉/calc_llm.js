import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '茜特菈莉'

const team = ['玛薇卡','希诺宁', '班尼特']
const artifact_normal = ['千岩','烬城','宗室']

const team_B = ['玛薇卡','枫原万叶', '班尼特']
const artifact_B = ['烬城', '风套', '宗室']

const team_C = ['希诺宁','芙宁娜', '班尼特']
const artifact_C = ['烬城','千岩', '宗室']

const team_D = ['申鹤','爱可菲', '芙宁娜']
const artifact_D = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{izpapa: true, pyro_two: true, Xilonen_cryo: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后精通',
    dmg: ({ attr, calc }) => ({
      avg: Math.min(calc(attr.mastery) * 1)
    })
  }, {
    check: ({ cons }) => cons >= 1,
    title: '1命「星刃」基础伤害提升值',
    dmg: ({ calc, attr }) => {
      return {
        avg: calc(attr.mastery) * 200 / 100
      }
    }
  }, {
    title: '「白曜护盾」吸收量',
    dmg: ({ talent, calc, attr }, { shield }) => shield(talent.e['护盾吸收量2'][0] * calc(attr.mastery) / 100 + talent.e['护盾吸收量2'][1] * 1)
  }, {
    title: '「霜昼黑星」霜陨风暴伤害',
    params: { izpapa: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['霜陨风暴伤害'], 'e,nightsoul')
  }, {
    title: '「霜昼黑星」霜陨风暴融化伤害',
    params: { izpapa: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['霜陨风暴伤害'], 'e,nightsoul', 'melt')
  }, {
    title: '「诸曜饬令」伤害',
    params: { izpapa: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['冰风暴伤害'], 'q,nightsoul')
  }, {
    title: '「诸曜饬令」融化伤害',
    params: { izpapa: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['冰风暴伤害'], 'q,nightsoul', 'melt')
  }, {
    title: '「宿灵之髑」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['宿灵之髑伤害'], 'q,nightsoul')
  }, {
    // 爱可菲冰队
    title: ({ cons }) => `${teamConfig(cons, team_D, artifact_D, mainCharName).title}「诸曜饬令」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_D, artifact_D).params, 
      izpapa: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['冰风暴伤害'], 'q,nightsoul')
  }, {
    // 希诺宁 芙宁娜 班尼特
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}「诸曜饬令」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params, 
      izpapa: true, Xilonen_cryo: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['冰风暴伤害'], 'q,nightsoul', 'melt')
  }, {
    // 玛薇卡 万叶 班尼特
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「诸曜饬令」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      izpapa: true, pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['冰风暴伤害'], 'q,nightsoul', 'melt')
  }, {
    // 玛薇卡 希诺宁 班尼特
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「诸曜饬令」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      izpapa: true, pyro_two: true, Xilonen_cryo: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['冰风暴伤害'], 'q,nightsoul', 'melt')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({
      avg: artis,
      type: 'text'
    })
  }
])

export const mainAttr = 'atk,mastery,cpct,cdmg'
export const defParams = { Nightsoul: true }
export const defDmgIdx = 4

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.izpapa === true,
    title: '天赋「白燧蝶的星衣」：E造成伤害提升[ePlus],Q造成的伤害提升[qPlus]',
    data: {
      ePlus: ({ attr, calc }) => calc(attr.mastery) * 90 / 100,
      qPlus: ({ attr, calc }) => calc(attr.mastery) * 1200 / 100
    }
  },{
    title: '2命「吞心者的巡行」：E后元素精通提升125',
    cons: 2,
    data: {
      mastery: 125
    }
  },{
    title: '6命「原动天的密契」：E后自身最高增伤[dmg]%',
    cons: 6,
    data: {
      dmg: 2.5 * 40
    }
  }
]
