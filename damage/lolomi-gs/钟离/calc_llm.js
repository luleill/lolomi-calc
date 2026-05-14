import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '钟离'

const team = ['闲云', '芙宁娜', '班尼特']
const artifact_normal = ['宗室', '千岩']

const team_B = ['希诺宁', '莉奈娅', '哥伦比娅']
const artifact_B = ['夜歌']

const team_C = ['重云', '申鹤', '芙宁娜']
const artifact_C = ['宗室', '千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '「玉璋护盾」吸收量',
    dmg: ({ attr, calc, talent }, { shield }) => shield(talent.e['护盾基础吸收量'] + calc(attr.hp) * talent.e['护盾附加吸收量'] / 100)
  }, {
    title: '岩脊共鸣伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['岩脊伤害/共鸣伤害'][1], 'e')
  }, {
    title: '「月笼谐奏」单段伤害',
    dmg: ({}, { reaction }) => reaction('lunarCrystallize')
  }, {
    title: '岩脊月笼共鸣伤害',
    params: { geo_two: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['岩脊伤害/共鸣伤害'][1] * 4, 'e')
  }, {
    title: '「天星」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「天星」石化时长（秒）',
    dmg: ({ talent, cons }) => {
      const raw = talent.q['石化时间']
      const time = raw % 1 !== 0 ? raw : Math.round(raw)
      return {
        avg: time + (cons >= 4 ? 2 : 0),
      }
    }
  }, {
    title: '月结晶环境15秒站场总伤',
    // 默认满辉双岩，木桩自挂水，月笼协奏4次共12段伤害，月共鸣7次共28段，1命额外加7段
    // Q + 4轮5A + 月共鸣 + 月笼
    params: { geo_two: true },
    dmg: ({ talent, cons }, calcApi) => {
      const { reaction } = calcApi
      const dmg = calcApi
      const lunaCage = reaction('lunarCrystallize')
      const geoSeg = dmg(talent.e['岩脊伤害/共鸣伤害'][1], 'e')
      const geoCount = 28 + (cons >= 1 ? 7 : 0)
      const qHit = dmg(talent.q['技能伤害'], 'q')
      const aRound = '一二三四五'.split('').reduce((acc, num) => {
        const r = dmg(talent.a[`${num}段伤害`], 'a')
        acc.dmg += r.dmg
        acc.avg += r.avg
        return acc
      }, { dmg: 0, avg: 0 })
      return {
        dmg: lunaCage.dmg * 12 + geoSeg.dmg * geoCount + qHit.dmg + aRound.dmg * 4,
        avg: lunaCage.avg * 12 + geoSeg.avg * geoCount + qHit.avg + aRound.avg * 4
      }
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 六段普攻总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      cryo_two: true
    }),
    dmg: ({ talent }, dmg) => {
      return '一二三四五六'.split('').reduce((acc, num) => {
        const result = dmg(talent.a[`${num}段伤害`], 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        return acc;
      }, { dmg: 0, avg: 0 });
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 单段月结晶`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      geo_two: true
    }),
    dmg: ({}, { reaction }) => reaction('lunarCrystallize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 下落伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 下落蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3','vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

  export const mainAttr = 'hp,atk,cpct,cdmg'
  export const defDmgIdx = 2
  export const consDmgKey = '月结晶环境15秒站场总伤'
  
  export const buffs = [
  ...TeamBuff,
  {
    title: '「玉璋护盾」：护盾吸收效率提升150%，附近敌人降低20%抗性',
    data: {
      shieldInc: 50,
      kx: 20
    }
  }, {
    title: ({ params }) => `天赋「悬岩宸断」：${Math.min(params.layer ?? 1, 5)}层坚璧效果，提升[shield]%护盾强效`,
    // 默认只触发一层效果
    data: {
      shield: ({ params }) => {
        const layer = Math.min(params.layer ?? 1, 5);
        return layer * 5;
      }
    }
  }, {
    title: '天赋「炊金馔玉」：基于生命上限，普攻，重击，下落伤害提高[aPlus]，共鸣伤害提高[ePlus]，天星伤害提高[qPlus]',
    sort: 9,
    data: {
      aPlus: ({ attr, calc }) => calc(attr.hp) * 0.0139,
      a2Plus: ({ attr, calc }) => calc(attr.hp) * 0.0139,
      a3Plus: ({ attr, calc }) => calc(attr.hp) * 0.0139,
      ePlus: ({ attr, calc }) => calc(attr.hp) * 0.019,
      qPlus: ({ attr, calc }) => calc(attr.hp) * 0.33
    }
  }]

    