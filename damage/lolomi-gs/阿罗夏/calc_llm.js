import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '阿罗夏'

const team = ['奥黛塔', '七七', '八重神子']
const artifact_normal = ['千岩']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: '「伏袭霆击」点按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
  }, {
    title: '「伏袭霆击」长按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['长按伤害'], 'e')
  }, {
    title: '「轰霆猎场」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['轰霆猎场伤害'], 'q')
  }, {
    title: '「图加林」撕咬伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['图加林伤害'], 'q')
  }, {
    title: '「图加林」治疗量',
    dmg: ({ attr, calc, cons }, { heal }) =>
      heal(calc(attr.atk) * (1.2 + (cons >= 4 ? 0.6 : 0)))
  }, {
    title: 'EQ后台一轮总伤',
    dmg: ({ talent, cons }, dmg) => {
      const eHit = dmg(talent.e['长按伤害'], 'e')
      const field = dmg(talent.q['轰霆猎场伤害'], 'q')
      const dog = dmg(talent.q['图加林伤害'], 'q')
      const hits = cons >= 2 ? 10 : 7
      return {
        dmg: eHit.dmg + (field.dmg + dog.dmg) * hits,
        avg: eHit.avg + (field.avg + dog.avg) * hits
      }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 星超导`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({}, { basic }) => basic(0, '', 'stellarConduct')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 4
export const consDmgKey = 'EQ后台一轮总伤'
export const mainAttr = 'atk,cpct,cdmg,recharge'

export const buffs = [
  ...TeamBuff,
  {
    title: '「星赴险域」：星超导反应伤害提升[stellarConduct]%',
    data: {
      stellarConduct: 20
    }
  }, {
    title: '被动「猎者之准」：攻击力提升[atkpct]%',
    data: {
      atkpct: ({ talent, cons }) => talent.e['猎者之准攻击力提升'] * (cons >= 6 ? 2 : 1),
    }
  }, {
    title: '天赋「告别冬麦与残叶」：基于充能提升EQ伤害[eDmg]%',
    sort: 9,
    data: {
      eDmg: ({ attr }) => Math.min(70, (attr.recharge || 0) * 0.35),
      qDmg: ({ attr }) => Math.min(70, (attr.recharge || 0) * 0.35)
    }
  }, {
    title: '4命「衔取猎品」：图加林攻击追加治疗最低血量角色60%攻击力',
    cons: 4
  }, {
    title: '6命「复夺旌幡」：2层猎者之准精通提升100',
    cons: 6,
    data: {
      mastery: 100
    }
  }
]
