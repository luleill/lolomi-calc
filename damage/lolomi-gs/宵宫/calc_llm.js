import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '宵宫'

const team = ['茜特菈莉','夜兰','芙宁娜']
const artifact_normal = ['烬城', '千岩']

const team_B = ['行秋','钟离','夜兰']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => {
      return { avg: Math.min(calc(attr.atk) * 1)}
    }
  }, {
    title: '「焰硝庭火舞」五段总伤',
    dmg: ({ talent, cons }, dmg) => {
        const baseDamage = ['一段伤害', '二段伤害', '三段伤害', '四段伤害', '五段伤害']
            .map(key => dmg(talent.a[key], 'a'));
        
        const totalBaseDmg = baseDamage.reduce((sum, d) => sum + d.dmg, 0);
        const totalBaseAvg = baseDamage.reduce((sum, d) => sum + d.avg, 0);
        // 6命额外伤害，默认1,3,5段触发
        if (cons >= 6) {
            const bonusKeys = [0, 2, 4];
            const bonusDmg = bonusKeys.reduce((sum, idx) => sum + baseDamage[idx].dmg * 0.6, 0);
            const bonusAvg = bonusKeys.reduce((sum, idx) => sum + baseDamage[idx].avg * 0.6, 0);
            return {
                dmg: totalBaseDmg + bonusDmg,
                avg: totalBaseAvg + bonusAvg
            };
        }
        return {
            dmg: totalBaseDmg,
            avg: totalBaseAvg
        };
    }
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
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}尾箭蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}尾箭蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['五段伤害'], 'a', 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }}
  ])

  export const defDmgIdx = 3
  export const mainAttr = 'atk,cpct,cdmg'

  export const buffs = [
  ...TeamBuff,
  {
    title: '焰硝庭火舞：开启E后额外提升普通[aMulti]%伤害',
    data: {
      aMulti: ({ talent }) => talent.e['炽焰箭伤害'] - 100
    }
  }, {
    title: '宵宫被动：普通攻击命中后，每层将为宵宫提供2%火元素伤害加成',
    // 一轮普攻默认吃5%增伤
    data: {
      dmg: 5
    }
  }, {
    title: '宵宫2命：宵宫造成暴击后获得25%火伤加成',
    cons: 2,
    data: {
      dmg: 25
    }
  }
  ]

    