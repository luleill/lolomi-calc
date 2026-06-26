import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '珊瑚宫心海'

const team = ['茜特菈莉', '希诺宁', '芙宁娜']
const artifact_normal = ['烬城']

const team_B = ['闲云', '茜特菈莉', '芙宁娜']
const artifact_B = ['烬城']

const config = Config.getConfig('user', 'config')
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { Xilonen_hydro: true, hydro_two: true })

/** 
 * 海染泡沫伤害：3.5秒频率默认化海月跳两次，开Q普攻4次，上限30000 
 * 砗磲 chē qú 一种大型贝类
*/
const calcFoamDmg = (hp, healBonus, talent) => {
  const eT = talent.e['治疗量2']
  const qT = talent.q['命中治疗量2']
  const eHeal = (hp * eT[0] / 100 + eT[1]) * (1 + healBonus / 100)
  const qHeal = (hp * qT[0] / 100 + qT[1]) * (1 + healBonus / 100)
  return Math.min(eHeal * 2 + qHeal * 4, 30000) * 0.9
}

export const details = applyStandardTeam([
  {
    title: '触发特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.hp) })
  }, {
    title: '触发特效后治疗加成',
    dmg: ({ attr }) => ({ avg: Math.floor(attr.heal) + '%', type: 'text' })
  }, {
    check: ({ attr }) => attr.cpct > 0,
    // 应该有神人把心海暴击率堆正
    title: '实际暴击率',
    dmg: ({ attr }) => ({ avg: attr.cpct + '%', type: 'text' })
  },
  // 治疗 
  ...(() => {
    const healEntry = (title, tKey, lowHpRate, cons) => ({
      title, ...(cons && { cons }),
      dmg: ({ attr, talent, calc }, { heal }) => {
        const hp = calc(attr.hp)
        const t = talent[tKey[0]][tKey[1]]
        return heal(hp * t[0] / 100 + t[1] + (lowHpRate ? hp * lowHpRate : 0))
      }
    })
    return [
      healEntry('「化海月」每跳治疗', ['e', '治疗量2']),
      healEntry('「化海月」半血以下治疗', ['e', '治疗量2'], 0.045, 2),
      healEntry('「海人化羽」命中治疗', ['q', '命中治疗量2']),
      healEntry('「海人化羽」半血以下治疗', ['q', '命中治疗量2'], 0.006, 2),
    ]
  })(),
  {
    title: '「海人化羽」释放伤害',
    dmg: ({ attr, talent, calc }, { basic }) => basic(calc(attr.hp) * talent.q['技能伤害'] / 100, 'q')
  }, {
    title: '「海人化羽」重击伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    check: ({ artis }) => artis?.['海染砗磲'] >= 4,
    title: '海染泡沫爆炸伤害',
    dmg: ({ attr, talent, calc }) => ({ avg: Math.floor(calcFoamDmg(calc(attr.hp), calc(attr.heal), talent)) })
  }, {
    title: '「海人化羽」普攻三段总伤',
    params: { q: true },
    dmg: ({ attr, talent, cons, calc }, calcApi) => {
      const { basic } = calcApi
      let totalDmg = 0, totalAvg = 0
      '一二三'.split('').forEach(n => {
        const hit = calcApi(talent.a[`${n}段伤害`], 'a')
        totalDmg += hit.dmg
        totalAvg += hit.avg
      })
      const c1Fish = cons >= 1 ? basic(calc(attr.hp) * 0.3) : { dmg: 0, avg: 0 }
      return { dmg: totalDmg + c1Fish.dmg, avg: totalAvg + c1Fish.avg }
    }
  }, {
    title: 'EQ站场一轮总伤',
    // EQ后站场11秒左右：化海月跳5次伤害，默认4轮3A
    // 4命+10%攻速，默认额外打2段普攻，应该不能多打一轮3A
    // 海染一轮默认炸3次
    params: { q: true },
    dmg: ({ attr, talent, cons, calc, artis }, calcApi) => {
      const { basic } = calcApi
      const hp = calc(attr.hp)
      const qHit = basic(hp * talent.q['技能伤害'] / 100, 'q')
      let n3Dmg = 0, n3Avg = 0
      '一二三'.split('').forEach(n => {
        const hit = calcApi(talent.a[`${n}段伤害`], 'a')
        n3Dmg += hit.dmg
        n3Avg += hit.avg
      })
      let c4Dmg = 0, c4Avg = 0
      if (cons >= 4) {
        '一二'.split('').forEach(() => {
          const hit = calcApi(talent.a['一段伤害'], 'a')
          c4Dmg += hit.dmg
          c4Avg += hit.avg
        })
      }
      const c1Fish = cons >= 1 ? basic(hp * 0.3) : { dmg: 0, avg: 0 }
      const waveAtk = calcApi(talent.e['波纹伤害'], 'e')
      const waveHp = basic(hp * talent.q['化海月伤害提升'] / 100, 'e')
      const foamDmg = artis?.['海染砗磲'] >= 4
        ? Math.floor(calcFoamDmg(hp, calc(attr.heal), talent)) * 3
        : 0
      return {
        dmg: qHit.dmg + n3Dmg * 4 + c4Dmg + c1Fish.dmg * 4 + (waveAtk.dmg + waveHp.dmg) * 5 + foamDmg,
        avg: qHit.avg + n3Avg * 4 + c4Avg + c1Fish.avg * 4 + (waveAtk.avg + waveHp.avg) * 5 + foamDmg
      }
    }
  }, {
    // 组队
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 下落伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 重击伤害`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      Xilonen_hydro: true, hydro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'hp,heal'
export const defDmgIdx = 3
export const consDmgKey = 'EQ站场一轮总伤'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「庙算无遗」：暴击率降低100%，治疗加成提高25%',
    sort: 9,
    data: {
      cpct: ({ attr }) => attr.cpct >= 100 ? 0 : -attr.cpct,
      heal: 25
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '「仪来羽衣」：普攻与重击基于生命值上限额外提升伤害[aPlus]',
    sort: 9,
    data: {
      aPlus: ({ attr, talent, calc }) => {
        const hp = calc(attr.hp)
        return hp * talent.q['普通攻击伤害提升'] / 100 + hp * calc(attr.heal) * 0.15 / 100
      },
      a2Plus: ({ attr, talent, calc }) => {
        const hp = calc(attr.hp)
        return hp * talent.q['重击伤害提升'] / 100 + hp * calc(attr.heal) * 0.15 / 100
      }
    }
  }, {
    title: '1命「决水于溪」：仪来羽衣状态尾段普攻额外释放一条鱼，造成生命值上限30%的水伤',
    cons: 1
  }, {
    title: '4命「月摄千川」：仪来羽衣状态下普通攻击的攻击速度提升10%',
    cons: 4
  }, {
    check: ({ params }) => params.q === true,
    title: '6命「珊瑚一心」：仪来羽衣状态治疗后获得40%水伤加成',
    cons: 6,
    data: { 
      dmg: 40 
    }
  }
]
