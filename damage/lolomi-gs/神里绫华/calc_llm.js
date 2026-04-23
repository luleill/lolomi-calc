import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '神里绫华'

const team = ['申鹤', '爱可菲', '芙宁娜']
const artifact_normal = ['千岩', '宗室']

const team_B = ['申鹤', '枫原万叶', '珊瑚宫心海']
const artifact_B = ['宗室', '风套']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, {thinIce: true, cryo_two: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「神里流·冰华」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '重击伤害',
    params: { thinIce: true },
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '「神里流·霜灭」单段伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['切割伤害'], 'q')
  }, {
    title: '「神里流·霜灭」总伤',
    // 共19段切割加尾段爆炸，首段吃不到4命减防，影响不大
    params: { q: true },
    dmg: ({ talent }, dmg) => {
      const qDamage = dmg(talent.q['切割伤害'], 'q')
      const q2Damage = dmg(talent.q['绽放伤害'], 'q')
      return {
        dmg: qDamage.dmg * 19 + q2Damage.dmg,
        avg: qDamage.avg * 19 + q2Damage.avg
      };
    }
  }, {
    title: '单人站场9秒总伤',
    // 霰步附魔 + A + E + Q + 重击 + 霰步附魔 + 5A
    params: { q: true, thinIce: true },
    dmg: ({ talent }, dmg) => {
      const damages = {
        E: dmg(talent.e['技能伤害'], 'e'),
        A1: dmg(talent.a['一段伤害'], 'a'),
        Q: dmg(talent.q['切割伤害'], 'q'),
        Q2: dmg(talent.q['绽放伤害'], 'q'),
        A2: dmg(talent.a['重击伤害'], 'a2'),
        A5: dmg('一二三四五'.split('').reduce((sum, num) => sum + talent.a[`${num}段伤害`], 0), 'a')
      };
      const counts = { E: 1, A1: 2, Q: 19, Q2: 1, A2: 1, A5: 1 };
      return Object.entries(counts).reduce(
        (total, [key, count]) => ({
          dmg: total.dmg + damages[key].dmg * count,
          avg: total.avg + damages[key].avg * count
        }),
        { dmg: 0, avg: 0 }
      );
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}Q后重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      q: true, thinIce: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg ) =>{1
      let A2 = dmg(talent.a['重击伤害2'][0], 'a2')
      return {
      dmg: A2.dmg * 3,
      avg: A2.avg * 3,
    }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 重击伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      thinIce: true, cryo_two: true
    }),
    dmg: ({ talent }, dmg ) =>{
      let A2 = dmg(talent.a['重击伤害2'][0], 'a2')
      return {
      dmg: A2.dmg * 3,
      avg: A2.avg * 3,
    }
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  
  export const mainAttr = 'atk,cpct,cdmg'
  export const defDmgIdx = 2
  export const consDmgKey = '单人站场9秒总伤'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '天赋「天罪国罪镇词」：施放神里流·冰华后6秒内，普攻与重击伤害提升30%',
      data: {
        aDmg: 30,
        a2Dmg: 30
      }
    }, {
      title: '天赋「寒天宣命祝词」：神里流·霰步结束命中敌人时获得18%冰元素伤害加成',
      data: {
        dmg: 18
      }
    }, {
      title: '2命「三重雪关扉」：神里流·霜灭额外释放两股霜见雪关扉，各自造成原本20%的伤害',
      // 对单无作用，暂时不考虑2命效果
      cons: 2,
    }, {
      check: ({ params }) => params.q === true, 
      title: '4命「盈缺流返」：神里流·霜灭命中时敌人防御力降低30%',
      cons: 4,
      data: {
        enemyDef: 30
      }
    }, {
      check: ({ params }) => params.thinIce === true, 
      title: '6命「间水月」：「薄冰舞踏」使重击造成的伤害提高298%',
      cons: 6,
      data: {
        a2Dmg: 298
      }
    }
  ]
  