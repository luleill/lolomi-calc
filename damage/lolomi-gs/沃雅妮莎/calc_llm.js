import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '沃雅妮莎'
// 星扩散自己也触发不了，弄个纯水伤配队
const team = ['茜特菈莉', '希诺宁', '芙宁娜']
const artifact_normal = ['烬城']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

const calcRotation = ({ talent, attr, calc }, { basic }) => {
  const eHit = basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  const micHit = basic(calc(attr.hp) * talent.e['唤春角笛伤害'] / 100, 'e')
  const micHits = Math.floor(15 / 3)
  const qHit = basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  return {
    dmg: eHit.dmg + micHit.dmg * micHits + qHit.dmg,
    avg: eHit.avg + micHit.avg * micHits + qHit.avg,
  }
}

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.hp)) })
  }, {
    title: '「遥久之歌」治疗量',
    dmg: ({ talent, attr, calc }, { heal }) => {
      const [flat, pct] = talent.e['遥久之歌治疗量2']
      return heal(flat + pct * calc(attr.hp) / 100)
    }
  }, {
    title: '提供基础攻击力增益',
    cons: 1,
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.hp) * 0.7 / 100), type: 'text' })
  }, {
    title: '提供水冰减抗增益',
    dmg: ({ talent }) => ({ avg: talent.e['水元素/冰元素抗性降低'] + '%', type: 'text' })
  }, {
    title: '2命提供水冰爆伤增益',
    cons: 2,
    dmg: () => ({ avg: '50%', type: 'text' })
  }, {
    title: ({ cons }) => cons >= 6 ? '6命提供星扩散增益' : '2命提供星扩散增益',
    cons: 2,
    dmg: ({ cons }) => ({ avg: cons >= 6 ? '爆伤60%、擢升25%' : '爆伤60%', type: 'text' })
  }, {
    title: '6命提供水冰增伤增益',
    cons: 6,
    dmg: () => ({ avg: '50%', type: 'text' })
  }, {
    title: '「宣叙·晨声纷流」释放伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['技能伤害'] / 100, 'e')
  }, {
    title: '「唤春角笛」协同伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.e['唤春角笛伤害'] / 100, 'e')
  }, {
    title: '「终奏·伴尔沉沦」伤害',
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: '15秒站场总伤',
    dmg: (ds, dmg) => calcRotation(ds, dmg)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 元素爆发`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ talent, attr, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 一轮总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: (ds, dmg) => calcRotation(ds, dmg)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 1
export const consDmgKey = '15秒站场总伤'
export const mainAttr = 'hp,cpct,cdmg,heal'

export const buffs = [
  ...TeamBuff,
  {
    title: '被动「遥久之歌」：元素爆发伤害提升[dmg]%，降低敌人水/冰抗性[kx]%',
    data: {
      kx: ({ talent }) => talent.e['水元素/冰元素抗性降低'],
      dmg: ({ talent }) => talent.q['遥久之歌伤害加成']
    }
  }, {
    title: '天赋「流荡风旋」：星扩散反应降低敌人风抗[kx]%',
    data: {
      kx: ({ params }) => params.isfeng ? 30 : 0
    }
  }, {
    title: '天赋「十二弦的泪歌」：基于生命值提升星扩散伤害{PARAM#P1402201|4S1}点，水冰元素伤害提升{PARAM#P1402201|5S1}点；至多使星扩散伤害提升{PARAM#P1402201|6S1}点，水冰元素伤害提升{PARAM#P1402201|7S1}点。',
    // 具体数值还没爆出来，先留着
    data: {
    }
  }, {
    title: '1命「聚光灯下的水华」：基于生命值提升攻击力[atkPlus]',
    sort: 9,
    cons: 1,
    data: {
      atkPlus: ({ attr, calc }) => calc(attr.hp) * 0.7 / 100
    }
  }, {
    title: '2命「穿彻风雪的余响」：水冰暴伤提升[cdmg]%，星扩散暴伤提升[stellarVortexCdmg]%',
    cons: 2,
    data: {
      cdmg: 50,
      stellarVortexCdmg: 60,
      starSwirlAnemoCdmg: 60,
      starSwirlCryoCdmg: 60,
    }
  }, {
    title: '4命「柔波摇漾的低诉」：治疗满层生命提升[hpPct]%，低于40%生命时额外提升治疗量50%',
    cons: 4,
    data: {
      hpPct: 60
    }
  }, {
    title: '6命「永不落幕的盛歌」：星扩散反应擢升[elevated]%、水冰伤害提升[dmg]%',
    cons: 6,
    data: {
      elevated: 25,
      dmg: 50
    }
  }
]
