import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '宵宫'

const team = ['茜特菈莉', '夜兰', '芙宁娜']
const artifact_normal = ['烬城', '千岩']

const team_B = ['行秋', '钟离', '夜兰']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

// 「焰硝庭火舞」一轮普攻伤害
const calcCombo = (talent, cons, dmg) => {
    const damageResults = '一二三四五'.split('').map(num => 
        dmg(talent.a[`${num}段伤害`], 'a')
    );
    const totalBase = damageResults.reduce((acc, result) => ({
        dmg: acc.dmg + result.dmg,
        avg: acc.avg + result.avg
    }), { dmg: 0, avg: 0 });
    // 6命额外伤害,默认1,3,5段触发60%额外伤害
    if (cons >= 6) {
        const bonusTotal = [0, 2, 4].reduce((acc, idx) => ({
            dmg: acc.dmg + damageResults[idx].dmg * 0.6,
            avg: acc.avg + damageResults[idx].avg * 0.6
        }), { dmg: 0, avg: 0 });
        return {
            dmg: totalBase.dmg + bonusTotal.dmg,
            avg: totalBase.avg + bonusTotal.avg
        };
    }
    return totalBase;
};

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「焰硝庭火舞」五段总伤',
    dmg: ({ talent, cons }, dmg) => calcCombo(talent, cons, dmg)
  }, {
    title: '「焰硝庭火舞」尾箭伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a')
  }, {
    title: '「焰硝庭火舞」尾箭蒸发',
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a', 'vaporize')
  }, {
    title: '「焰硝庭火舞」尾箭融化',
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a', 'melt')
  }, {
    title: '「琉金云间草」释放伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '「琉金火光」爆炸伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['琉金火光爆炸伤害'], 'q')
  }, {
    title: '开E站场一轮总伤',
    // 开E刚好打3轮5A
    dmg: ({ talent, cons }, dmg) => {
        const single = calcCombo(talent, cons, dmg);
        return {
            dmg: single.dmg * 3,
            avg: single.avg * 3
        };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 尾箭蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 尾箭蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a', 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

  export const mainAttr = 'atk,cpct,cdmg'
  export const defDmgIdx = 3
  export const consDmgKey = '开E站场一轮总伤'

  export const buffs = [
  ...TeamBuff,
  {
    title: '「焰硝庭火舞」：提升普攻[aMulti]%伤害',
    data: {
      aMulti: ({ talent }) => talent.e['炽焰箭伤害'] - 100
    }
  }, {
    title: '天赋「袖火百景图」：普攻命中后，每层提供2%火元素伤害加成',
    // 默认平均吃10%增伤
    data: {
      dmg: 10
    }
  }, {
    title: '2命「万灯送火」：造成暴击后获得25%火伤加成',
    cons: 2,
    data: {
      dmg: 25
    }
  }, {
    title: '6命「长野原龙势流星群」：焰硝庭火舞50%几率额外发射炽焰箭，造成原本60%的伤害',
    cons: 6,
  }
  ]

    