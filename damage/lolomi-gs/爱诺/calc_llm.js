import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '爱诺'
// 传统菲林斯配队计算爱诺后台伤害
const team = ['伊涅芙', '哥伦比娅', '菲林斯']
const artifact_normal = ['夜歌']
// 水元素直伤完全没什么倍率，带闲云试试下落伤害
const team_B = ['闲云', '芙宁娜', '尼可']
const artifact_B = ['宗室', '天美']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

// 月感电总伤：E + Q水弹 + 自身挂水触发的月感电
// 元素爆发水弹命中随机性，默认14秒约16发；2命每5秒一枚额外协同水弹
// 自身挂水触发的月感电：单人默认触发8次，组队附着默认触发4次
// 前台：2命额外水弹不生效，6命爱诺站场才吃到加成
// 后台：2命额外水弹生效，6命爱诺后台吃不到
const lunarRotationDmg = (onfield, lunaHits) => ({ talent, calc, attr, cons }, { basic, reaction }) => {
  const e1 = basic(calc(attr.atk) * talent.e['一段伤害'] / 100, 'e')
  const e2 = basic(calc(attr.atk) * talent.e['二段伤害'] / 100, 'e')
  const qHit = basic(calc(attr.atk) * talent.q['水弹伤害'] / 100, 'q')
  const c2Hit = (!onfield && cons >= 2) ? basic(calc(attr.atk) * 25 / 100 + calc(attr.mastery), 'q') : { dmg: 0, avg: 0 }
  const c2Hits = (!onfield && cons >= 2) ? 2 : 0
  const luna = reaction('lunarCharged')
  return {
    dmg: e1.dmg + e2.dmg + qHit.dmg * 16 + c2Hit.dmg * c2Hits + luna.dmg * lunaHits,
    avg: e1.avg + e2.avg + qHit.avg * 16 + c2Hit.avg * c2Hits + luna.avg * lunaHits
  }
}

// 队伍
const teamEntry = (teamNames, artifact) => [{
  title: ({ cons }) => `${teamConfig(cons, teamNames, artifact, mainCharName).title} 单段月感电`,
  params: ({ cons }) => teamConfig(cons, teamNames, artifact).params,
  dmg: ({}, { reaction }) => reaction('lunarCharged')
}, {
  title: ({ cons }) => `${teamConfig(cons, teamNames, artifact, mainCharName).title} 后台月感电总伤`,
  params: ({ cons }) => ({
    ...teamConfig(cons, teamNames, artifact).params,
    offField: true
  }),
  dmg: lunarRotationDmg(false, 4)
}, {
  title: ({ cons }) => `${teamConfig(cons, teamNames, artifact, mainCharName).title} 前台月感电总伤`,
  params: ({ cons }) => teamConfig(cons, teamNames, artifact).params,
  dmg: lunarRotationDmg(true, 4)
}]

export const details = applyStandardTeam([
  {
    title: '触发特效后精通',
    dmg: ({ attr, calc }) => ({ avg: Math.floor(calc(attr.mastery)) })
  }, {
    title: '「妙思捕手」一段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['一段伤害'], 'e')
  }, {
    title: '「妙思捕手」二段伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['二段伤害'], 'e')
  }, {
    title: '「冷静一下鸭」水弹伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['水弹伤害'], 'q')
  }, {
    title: '单人月感电伤害',
    dmg: ({}, { reaction }) => reaction('lunarCharged')
  }, {
    title: '前台月感电总伤',
    dmg: lunarRotationDmg(true, 8)
  }, {
    title: '后台月感电总伤',
    params: { offField: true },
    dmg: lunarRotationDmg(false, 8)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 单次下落`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      Moonsign: 1
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3', 'phy')
  },
  ...teamEntry(team, artifact_normal),
  {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '前台月感电总伤'
export const mainAttr = 'atk,cpct,cdmg,mastery'
export const defParams = { Moonsign: 2 }

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「结构化功率提升」：基于元素精通提升元素爆发造成的伤害[qPlus]',
    sort: 9,
    data: {
      qPlus: ({ attr, calc }) => calc(attr.mastery) * 50 / 100
    }
  }, {
    title: '1命「灰与力场的平衡理论」：施放E或Q后元素精通提升[mastery]点',
    cons: 1,
    data: {
      mastery: 80
    }
  }, {
    title: '2命「齿轮差分的进位原理」：基于攻击力的25%与元素精通的100%造成协同伤害',
    cons: 2,
  }, {
    title: '6命「天才之为构造之责任」：场上角色感电、绽放伤害提升[electroCharged]%，月反应伤害提升[lunarCharged]%',
    cons: 6,
    // 仅爱诺前台站场才生效
    check: ({ params }) => params.offField !== true,
    data: {
      electroCharged: ({ params }) => 15 + (params.Moonsign >= 2 ? 20 : 0),
      bloom: ({ params }) => 15 + (params.Moonsign >= 2 ? 20 : 0),
      lunarCharged: ({ params }) => 15 + (params.Moonsign >= 2 ? 20 : 0),
      lunarBloom: ({ params }) => 15 + (params.Moonsign >= 2 ? 20 : 0),
      lunarCrystallize: ({ params }) => 15 + (params.Moonsign >= 2 ? 20 : 0)
    }
  }
]
