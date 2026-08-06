import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '塔利雅'
// 基本只能带闲云打下落
const team = ['闲云', '芙宁娜', '尼可']
const artifact_normal = ['天美']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '「圣浸的礼典」技能伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「纯耀的祷咏」技能伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「圣眷护盾」吸收量',
    dmg: ({ talent, attr, calc }, { shield }) =>
      shield(talent.q['圣眷护盾吸收量2'][0] * calc(attr.hp) / 100 + talent.q['圣眷护盾吸收量2'][1])
  }, {
    title: '提供攻速增益',
    dmg: ({ attr, calc, cons }) => {
      const aspd = Math.min(calc(attr.hp) / 1000 * 0.5, 20) + (cons >= 6 ? 10 : 0)
      return { avg: aspd.toFixed(1) + '%', type: 'text' }
    }
  }, {
    // 默认手法：EQ后持续普攻，西风之眷12秒 + 4命3秒
    // 默认2.5秒一轮4A，由buff持续时间和攻速加成决定普攻轮数
    title: 'EQ一轮站场总伤',
    dmg: ({ attr, talent, cons, calc }, dmg) => {
      const e = dmg(talent.e['技能伤害'], 'e')
      const q = dmg(talent.q['技能伤害'], 'q')
      const aspd = 100 + Math.min(calc(attr.hp) / 1000 * 0.5, 20) + (cons >= 6 ? 10 : 0)
      const combos = Math.floor((cons >= 4 ? 15 : 12) * aspd / 100 / 2.5)
      let comboDmg = 0, comboAvg = 0
      ;['一段伤害', '二段伤害', '三段伤害', '三段伤害2', '四段伤害'].forEach(k => {
        const seg = Array.isArray(talent.a[k]) ? talent.a[k] : [talent.a[k]]
        seg.forEach(v => {
          const hit = dmg(v, 'a')
          comboDmg += hit.dmg
          comboAvg += hit.avg
        })
      })
      return { dmg: e.dmg + q.dmg + comboDmg * combos, avg: e.avg + q.avg + comboAvg * combos }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 单次下落`,
    params: ({ cons }) => teamConfig(cons, team, artifact_normal).params,
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3', 'phy')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 2
export const consDmgKey = 'EQ一轮站场总伤'
export const mainAttr = 'atk,hp,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '2命「眷怜启应」：圣眷护盾的护盾强效提升[shield]%',
    cons: 2,
    data: {
      shield: 25
    }
  }
]
