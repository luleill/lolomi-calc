import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '洛恩'

const team = ['申鹤', '爱可菲', '芙宁娜']
const artifact_normal = ['宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: '「奇谋状态」普攻五段总伤',
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const acounts = '一二三四五'.split('');
      const aDamage = acounts.reduce((sum, num) => sum + calc(attr.atk) * talent.e[`${num}段伤害`] / 100, 0);
      const totala = dmg.basic(aDamage, 'a');
      const c2Extra = cons >= 2 ? dmg(300) : { dmg: 0, avg: 0 }
      return {
        dmg: totala.dmg + c2Extra.dmg,
        avg: totala.avg + c2Extra.avg
      };
    }
  }, {
    params: { c6: true },
    title: '满争胜「镂骨彻心」伤害',
    dmg: ({ talent, cons }, dmg) => dmg(talent.e['镂骨彻心伤害'] * (1 + 0.004 * (cons >= 1 ? 250 : 100)), 'e')
  }, {
    title: '满争胜「裁罚遂成」伤害',
    params: { c6: true },
    dmg: ({ talent, cons }, dmg) => dmg(talent.q['技能伤害'] * (1 + 0.004 * (cons >= 1 ? 250 : 100)), 'q')
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 满争胜「镂骨彻心」伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      c6: true
    }),
    dmg: ({ talent, cons }, dmg) => dmg(talent.e['镂骨彻心伤害'] * (1 + 0.004 * (cons >= 1 ? 250 : 100)), 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,cpct,cdmg'
export const defParams = { Hexenzirkel: true }
export const consDmgKey = '满争胜「镂骨彻心」伤害'
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
    title: '天赋「戏言的杰作」：奇谋状态下攻击力提升15%',
    data: {
      atkPct: 15
    }
  },{
    title: '1命「往昔微风，载满悲歌」：争胜上限提升至原来的250%',
    cons: 1,
  },{
    title: '2命「凡飞翔者，皆为靶标」：追加一次攻击力300%的冰伤，并使其他角色元素精通提升125点',
    cons: 2,
    data: {
      mastery: 125
    }
  },{
    check: ({ params }) => params.c6 === true,
    title: '6命「身沦魂销，唯余欢悦」：镂骨彻心和元素爆发裁罚遂成的暴击伤害提升80%',
    cons: 6,
    data: {
      cdmg: 80
    }
  }
]
