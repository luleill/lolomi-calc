import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '雅珂达'

// 以菲林斯感电队计算后台伤害
const team = ['菲林斯', '伊涅芙', '哥伦比娅']
const artifact_normal = ['夜歌']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  },
  ...(() => {
    const healEntry = (title, extraKey) => ({
      title,
      dmg: ({ talent, attr, calc }, { heal }) => {
        const base = talent.q['猫型家用互助协调器治疗量2'][0] / 100 * calc(attr.atk) + talent.q['猫型家用互助协调器治疗量2'][1]
        const extra = extraKey
          ? talent.q[extraKey][0] / 100 * calc(attr.atk) + talent.q[extraKey][1]
          : 0
        return heal(base + extra)
      }
    })
    return [
      healEntry('「猫型协调器」单次治疗量'),
      healEntry('「猫型协调器」低血治疗量', '最低生命值角色额外治疗量2'),
    ]
  })(),
  {
    title: '「猫型协调器」一轮总治疗',
    // Q持续12s，默认治疗12次
    // 天赋「索酬的巧计」水元素治疗量增加1.2倍率，1命以上默认吃到这个加成
    dmg: ({ talent, attr, calc }, { heal }) => {
      const base = talent.q['猫型家用互助协调器治疗量2'][0] / 100 * calc(attr.atk) + talent.q['猫型家用互助协调器治疗量2'][1]
      const single = heal(base * 1.2).avg
      return { avg: single * 12 }
    }
  }, {
    title: '「秘藏瓶」装满释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['秘藏瓶装满伤害'], 'e')
  }, {
    title: '「秘藏瓶」猫猫球伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['猫猫球伤害'], 'e')
  }, {
    title: '「秘藏瓶」染色伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['猫猫球伤害'], 'e', 'coloringDmg')
  }, {
    title: '「秘器·猎人的七道具」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '扩散反应伤害',
    dmg: ({}, { reaction }) => reaction('swirl')
  }, {
    title: '染色触发月感电伤害',
    dmg: ({}, { reaction }) => reaction('lunarCharged')
  }, {
    title: '「猫型协调器」染色伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['猫型家用互助协调器伤害'], 'q', 'coloringDmg')
  }, {
    // 默认仅满辉，不触发额外月反应
    // E转满释放 + 猫猫球染色 + Q本体风伤 + 协调器染色 + 扩散
    // E猫猫球两秒攻击一次，默认基础7次，1命50%概率额外一次攻击，默认10次
    // Q两秒攻击一次，默认吃到天赋共14次，实际本身也没多少伤害
    // 两次重击维持风套减抗，共4次扩散
    title: 'EQ单人15秒总伤',
    dmg: ({ talent, cons }, dmg) => {
      const a2 = dmg(talent.a['重击伤害'], 'a2')
      const eHit = dmg(talent.e['秘藏瓶装满伤害'], 'e')
      const catBall = dmg(talent.e['猫猫球伤害'], 'e', 'coloringDmg')
      const catBallHits = cons >= 1 ? 10 : 7
      const qHit = dmg(talent.q['技能伤害'], 'q')
      const color = dmg(talent.q['猫型家用互助协调器伤害'], 'q', 'coloringDmg')
      const swirlUnit = dmg.reaction('swirl').avg
      return {
        dmg: a2.dmg * 2 + eHit.dmg + catBall.dmg * catBallHits + qHit.dmg + color.dmg * 14 + swirlUnit * 4,
        avg: a2.avg * 2 + eHit.avg + catBall.avg * catBallHits + qHit.avg + color.avg * 14 + swirlUnit * 4
      }
    }
  }, {
    // 月感电队：猫猫球染色元素触发月反应，不考虑月感电占比分配
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 反应月感电`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({}, { reaction }) => reaction('lunarCharged')
  }, {
    // 默认15秒，猫猫球本身染色伤害 + 雅珂达默认触发3次月感电
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 后台总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
    }),
    dmg: ({ talent, cons }, dmg) => {
      const { basic } = dmg
      const lunar = basic(0, '', 'lunarCharged')
      const lunarHits = 3
      const catBall = dmg(talent.e['猫猫球伤害'], 'e', 'coloringDmg')
      const catBallHits = cons >= 1 ? 10 : 7
      return {
        dmg: lunar.dmg * lunarHits + catBall.dmg * catBallHits,
        avg: lunar.avg * lunarHits + catBall.avg * catBallHits
      }
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 6
export const consDmgKey = 'EQ单人15秒总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defParams = { Moonsign: 2 }

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「蜜莓的嘉赏」：协调器治疗后，元素精通提升[mastery]点',
    data: { 
      mastery: 100 
    }
  }, {
    title: '天赋「索酬的巧计」：按对应元素数量强化协调器',
  }, {
    title: '1命「再来一瓶！」：呼噜噜秘藏瓶发射的软绒绒猫猫球有50%的概率进行一次弹跳',
    cons: 1,
  }, {
    title: '6命「最渺小的幸运」：月兆角色暴击率提升[cpct]%，暴击伤害提升[cdmg]%',
    cons: 6,
    data: {
      cpct: 5,
      cdmg: 40
    }
  }
]
