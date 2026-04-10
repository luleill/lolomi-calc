import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '尼可'

const team = ['法尔伽', '温迪', '杜林']
const artifact_normal = ['宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{pyro_two: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: '「虚己之赐」基础攻击力提升',
    dmg: ({ talent, calc, attr, cons }) => {
      const ebase = Math.min(calc(attr.atk) * talent.e['虚己之赐攻击力加成比例'] / 100, talent.e['虚己之赐攻击力加成上限'])
      return {
        avg: ebase + 300 + (cons >= 2 ? 240 : 0),
      }
    }
  },{
    check: ({ cons }) => cons >= 4,
    title: '4命「先导之佑」基础伤害提升值',
    dmg: ({ calc, attr }) => {
      return {
        avg: calc(attr.atk) * 70 / 100
      }
    }
  }, {
    title: '「炽光护盾」吸收量',
    dmg: ({ talent, calc, attr }, { shield }) => shield(talent.e['护盾吸收量2'][0] * calc(attr.atk) / 100 + talent.e['护盾吸收量2'][1] * 1)
  }, {
    title: '「奥迹造影」协同伤害',
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.atk) * talent.q['奥迹造影伤害'] / 100)
  }, {
    title: '1命「奥迹造影·合一」协同伤害',
    dmg: ({} , dmg) => dmg(600)
  }, {
    title: '「圣言默示·天路历程」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「奥迹造影」协同伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      pyro_two: true
    }),
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.atk) * talent.q['奥迹造影伤害'] / 100)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg'
export const defParams = { Hexenzirkel: true }
export const consDmgKey = '「奥迹造影」协同伤害'
export const defDmgIdx = 4

export const buffs = [
  ...TeamBuff,
  {
    title: '被动「虚己之赐」：提升攻击力[atkPlus]',
    data: {
      atkPlus: ({ attr, calc, talent }) => Math.min(calc(attr.atk) * talent.e['虚己之赐攻击力加成比例'] / 100, talent.e['最大攻击力加成']),
    }
  },{
    title: '天赋「分有」：圣祝之引额外提升300点攻击力',
    data: {
      atkPlus: 300
    }
  },{
    title: '1命「不要惧怕，蒙眷爱的人之子呀」：基于攻击力的600%额外造成特殊的「奥迹造影·合一」伤害',
    cons: 1,
  },{
    title: '2命「我要教导你，指引你应走的路」：额外提升240点攻击力，附近敌人元素抗性降低20%',
    cons: 2,
    data: {
      atkPlus: 240,
      kx: 20
    }
  },{
    title: '4命「向左或向右，无论你行往何方」：普攻、重击、下落攻击、元素战技与元素爆发造成的伤害提升[aPlus]',
    sort: 9,
    cons: 4,
    data: {
      aPlus: ({ attr, calc }) => calc(attr.atk) * 70 / 100,
      a2Plus: ({ attr, calc }) => calc(attr.atk) * 70 / 100,
      a3Plus: ({ attr, calc }) => calc(attr.atk) * 70 / 100,
      ePlus: ({ attr, calc }) => calc(attr.atk) * 70 / 100,
      qPlus: ({ attr, calc }) => calc(attr.atk) * 70 / 100,
    }
  },{
    title: '6命「这便是正确的道路，莫要彷徨」：拥有圣祝之引的角色造成的伤害将无视敌人40%的防御力',
    cons: 6,
    data: {
      ignore: 40
    }
  }
]
