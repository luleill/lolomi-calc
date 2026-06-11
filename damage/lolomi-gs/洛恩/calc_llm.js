import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '洛恩'

const team = ['杜林', '尼可', '希诺宁']
const artifact_normal = ['宗室', '天美', '烬城']

const team_B = ['莫娜', '爱可菲', '芙宁娜']
const artifact_B = ['天美', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{c6: true, pyro_two: true, Xilonen_cryo: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「奇谋状态」普攻五段总伤',
    dmg: ({ talent, cons }, dmg) => {
      const totalPct = talent.e['一段伤害'] + talent.e['二段伤害'] + talent.e['三段伤害'] + talent.e['四段伤害'] + talent.e['五段伤害']
      const totala = dmg(totalPct, 'a')
      const c2Extra = cons >= 2 ? dmg(500, 'e') : { dmg: 0, avg: 0 }
      return {
        dmg: totala.dmg + c2Extra.dmg,
        avg: totala.avg + c2Extra.avg
      }
    }
  }, {
    title: '「奇谋状态」重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['重击伤害'], 'a2')
  }, {
    params: { c6: true },
    title: '满争胜「镂骨彻心」伤害',
    dmg: ({ talent, cons }, dmg) => dmg(talent.e['镂骨彻心伤害'] * (1 + 0.004 * (cons >= 1 ? 300 : 100)), 'e')
  }, {
    title: '满争胜「裁罚遂成」伤害',
    params: { c6: true },
    dmg: ({ talent, cons }, dmg) => dmg(talent.q['技能伤害'] * (1 + 0.004 * (cons >= 1 ? 300 : 100)), 'q')
  }, {
    title: '伪单人站场15秒总伤',
    // 默认有魔导队友挂件凑buff，叠争胜，不考虑产生的元素反应
    // 手法只打AZ 8次，6命额外放e占用时间只打6次AZ
    // 特殊战技镂骨彻心3次，6命5次，2命追加攻击3次
    params: { c6: true },
    dmg: ({ talent, attr, calc, cons }, calcApi) => {
      const { basic } = calcApi
      const dmg = calcApi
      const eCount = cons >= 6 ? 5 : 3
      const zhengsheng = cons >= 1 ? 300 : 100
      const a1 = dmg(talent.e['一段伤害'], 'a')
      const a2 = dmg(talent.e['重击伤害'], 'a2')
      const eHit = dmg(talent.e['镂骨彻心伤害'] * (1 + 0.004 * zhengsheng), 'e')
      const qHit = dmg(talent.q['技能伤害'] * (1 + 0.004 * zhengsheng), 'q')
      let c2Extra = { dmg: 0, avg: 0 }
      if (cons >= 2) {
        c2Extra = basic(calc(attr.atk) * 5, 'e')
      }
      return {
        dmg: (a1.dmg + a2.dmg) * (cons >= 6 ? 6 : 8) + eHit.dmg * eCount + qHit.dmg + c2Extra.dmg * 3,
        avg: (a1.avg + a2.avg) * (cons >= 6 ? 6 : 8) + eHit.avg * eCount + qHit.avg + c2Extra.avg * 3
      }
    }
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 满争胜「裁罚遂成」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      c6: true, cryo_two: true
    }),
    dmg: ({ talent, cons }, dmg) => dmg(talent.q['技能伤害'] * (1 + 0.004 * (cons >= 1 ? 300 : 100)), 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 满争胜「镂骨彻心」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      c6: true, pyro_two: true, Xilonen_cryo: true
    }),
    dmg: ({ talent, cons }, dmg) => dmg(talent.e['镂骨彻心伤害'] * (1 + 0.004 * (cons >= 1 ? 300 : 100)), 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg'
export const defParams = { Hexenzirkel: true }
export const consDmgKey = '伪单人站场15秒总伤'
export const defDmgIdx = 3

export const buffs = [
  ...TeamBuff,
  {
    title: '「魔女的前夜礼·不愈之刺」：施放镂骨彻心或裁罚遂成后，普攻与重击造成的伤害提升40%',
    data: {
      aDmg: 40,
      a2Dmg: 40,
    }
  },{
    title: '天赋「戏言的杰作」：其他角色对触发冰元素相关反应后，攻击力提升15%',
    data: {
      atkPct: 15
    }
  },{
    title: '1命「往昔微风，载满悲歌」：争胜上限提升至原来的300%',
    cons: 1,
  },{
    title: '2命「凡飞翔者，皆为靶标」：奇谋状态追加一次攻击力500%的冰伤',
    cons: 2,
  },{
    check: ({ params }) => params.c6 === true,
    title: '6命「身沦魂销，唯余欢悦」：镂骨彻心和元素爆发裁罚遂成的暴击伤害提升175%',
    cons: 6,
    data: {
      eCdmg: 175,
      qCdmg: 175
    }
  }
]
