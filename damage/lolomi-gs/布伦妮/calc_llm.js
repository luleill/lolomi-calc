import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '布伦妮'

const team = ['法尔伽', '杜林', '班尼特']
const artifact_normal = ['宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{pyro_two: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: '「振铃同心」增伤',
    dmg: ({ attr }) => ({ avg: Math.max(0, Math.min((attr.atk - 1000) * 0.01, 35)).toFixed(2) + "%", type: 'text' })
  }, {
    title: '「狩灾誓锤」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能一段伤害'], 'e')
  }, {
    title: '「狩灾誓锤」二段染色伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能二段伤害'], 'e', 'coloringDmg')
  }, {
    title: '「铃鸣·狩魔之刻」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「诱巫饵铃」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['诱巫饵铃伤害'], 'q')
  }, {
    title: '「诱巫饵铃」染色伤害',
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 1.5, 'q', 'coloringDmg')
  }, {
    title: '染色单人站场总伤',
    // 基础E+二段染色E + Q + 5轮3A，默认共13次扩散，q持续5次，每次包含持续伤害和染色
    // 4命E后额外一次80%攻击力伤害，6命延长4秒，q持续+1次，普攻+1轮，扩散+3次
    dmg: ({ talent, attr, calc, cons }, { basic, reaction }) => {
      const atk = calc(attr.atk)
      const eRelease = basic(atk * talent.e['技能一段伤害'] / 100, 'e')
      const eColoring = basic(atk * talent.e['技能二段伤害'] / 100, 'e', 'coloringDmg')
      const c4Extra = cons >= 4 ? basic(atk * 0.8, 'e', 'coloringDmg') : { dmg: 0, avg: 0 }
      const qRelease = basic(atk * talent.q['技能伤害'] / 100, 'q')
      const qDot = basic(atk * talent.q['诱巫饵铃伤害'] / 100, 'q')
      const qColoring = basic(atk * 1.5, 'q', 'coloringDmg')
      const aRound = ['一段伤害', '二段伤害', '三段伤害'].reduce((total, key) => {
        const d = basic(atk * talent.a[key] / 100, 'a')
        return { dmg: total.dmg + d.dmg, avg: total.avg + d.avg }
      }, { dmg: 0, avg: 0 })
      const swirl = reaction('swirl').avg
      const aRoundCount = cons >= 6 ? 6 : 5
      const qDotCount = cons >= 6 ? 6 : 5
      return {
        dmg: eRelease.dmg + eColoring.dmg + c4Extra.dmg + qRelease.dmg + aRound.dmg * aRoundCount + (qDot.dmg + qColoring.dmg) * qDotCount + swirl * (cons >= 6 ? 16 : 13),
        avg: eRelease.avg + eColoring.avg + c4Extra.avg + qRelease.avg + aRound.avg * aRoundCount + (qDot.avg + qColoring.avg) * qDotCount + swirl * (cons >= 6 ? 16 : 13),
      }
    }
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「诱巫饵铃」染色伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      pyro_two: true
    }),
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 1.5, 'q', 'coloringDmg')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg'
export const defParams = { Hexenzirkel: true }
export const consDmgKey = '染色单人站场总伤'
export const defDmgIdx = 3

export const buffs = [
  ...TeamBuff,
  {
    title: '「魔女的前夜礼·寻魔之誓」：触发扩散后布伦妮攻击力提高65%',
    data: {
      atkPct: 65
    }
  },{
  //   自己好像吃不到天赋增伤
  //   title: '天赋「振铃同心」：基于布伦妮攻击力超过1000的部分，提升伤害[dmg]%',
  //   sort: 9,
  //   data: {
  //     dmg: ({ attr }) => Math.min((attr.atk - 1000) * 0.01, 35)
  //   }
  // },{
    title: '2命「整理杂乱的包袱，元素妙力果然」：攻击力至多提升40%',
    cons: 2,
    data: {
      atkPct: 40
    }
  },{
    title: '4命「循风同行回头看，影子还缺一半」：「狩灾誓锤」命中后额外造成一次80%攻击力的对应元素伤害',
    cons: 4,
  },{
    title: '6命「故事结尾在这儿，念给伙伴听完」：元素爆发「寻猎」模式延长4秒，攻击力提升350点',
    cons: 6,
    data: {
      atkPlus: 350
    }
  }
]
