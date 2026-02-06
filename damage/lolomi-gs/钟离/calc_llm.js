import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '钟离'

const team = ['重云','爱可菲','芙宁娜']
const artifact_normal = ['宗室', '千岩']

const team_B = ['希诺宁','爱诺','哥伦比娅']
const artifact_B = ['夜歌']

const team_C = ['闲云','芙宁娜','班尼特']
const artifact_C = ['宗室', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_C, artifact_C, config)

export const details = applyStandardTeam([
  {
    title: '单人触发满特效后攻击力',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.atk) * 1)
      }
    }
  }, {
    title: '玉璋护盾量',
    dmg: ({ attr, calc, talent }, { shield }) => shield(talent.e['护盾基础吸收量'] + calc(attr.hp) * talent.e['护盾附加吸收量'] / 100)
  }, {
    title: '岩脊共鸣伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['岩脊伤害/共鸣伤害'][1], 'e')
  }, {
    title: '天星伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}六段普攻总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg ) =>{
        let a_1 = dmg(talent.a['一段伤害'], 'a')
        let a_2 = dmg(talent.a['二段伤害'], 'a') 
        let a_3 = dmg(talent.a['三段伤害'], 'a')
        let a_4 = dmg(talent.a['四段伤害'], 'a')
        let a_5 = dmg(talent.a['五段伤害'], 'a')
        let a_6 = dmg(talent.a['六段伤害'], 'a')
        return {
        dmg: a_1.dmg + a_2.dmg + a_3.dmg + a_4.dmg + a_5.dmg + a_6.dmg,
        avg: a_1.avg + a_2.avg + a_3.avg + a_4.avg + a_5.avg + a_6.avg,
        }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}岩脊共鸣月结晶伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['岩脊伤害/共鸣伤害'][1], '', 'lunarCrystallize')
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
  ])

  export const mainAttr = 'hp,atk,cpct,cdmg'
  export const buffs = [
  ...TeamBuff,
  {
    title: '钟离被动：满层Buff下护盾强效提高25%',
    data: {
      shield: 25
    }
  }, {
    title: '岩系护盾：岩系护盾吸收效率150%',
    data: {
      shieldInc: 50
    }
  }, {
    title: '钟离被动：基于生命值上限，共鸣伤害提高[ePlus]，天星伤害提高[qPlus]',
    sort: 9,
    data: {
      ePlus: ({ attr, calc }) => calc(attr.hp) * 0.019,
      qPlus: ({ attr, calc }) => calc(attr.hp) * 0.33
    }
  }, {
    title: '玉璋护盾：降低敌人全抗性20%',
    data: {
      kx: 20
    }
  }]

    