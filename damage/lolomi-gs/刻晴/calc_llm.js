import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '刻晴'

const team = ['九条裟罗','枫原万叶','纳西妲']
const artifact_normal = ['宗室','风套']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: '重击雷伤',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
  }, {
    title: '重击超激化伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'aggravate')
  }, {
    title: '「天街巡游」尾刀伤害',
    params: { q : true },
    dmg: ({ talent }, dmg) => dmg(talent.q['最后一击伤害'], 'q')
  }, {
    title: '「天街巡游」尾刀超激化',
    params: { q : true },
    dmg: ({ talent }, dmg) => dmg(talent.q['最后一击伤害'], 'q', 'aggravate')
  }, {
    title: '激化站场8秒总伤',
    params: { q : true },
    // 默认有草底，如雷采用ee + aq + az + ee + az 八秒站场
    // ee独立两次超激化(一命效果会抢附着) q首段和尾段超激化，连斩期间两段超激化，az重击超激化 + ee + az 双计刷新两段超激化
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const damages = [
        [dmg(talent.e['雷楔伤害'], 'e', 'aggravate'), 2],
        [dmg(talent.e['斩击伤害'], 'e', cons < 1 ? 'aggravate' : undefined), 2],
        [cons >= 1 ? dmg.basic(calc(attr.atk) * 50 / 100, '', 'aggravate') : { dmg: 0, avg: 0 }, 2],
        [dmg(talent.a['一段伤害'], 'a'), 1],
        [dmg(talent.a['一段伤害'], 'a', 'aggravate'), 1],
        [dmg(talent.q['技能伤害'], 'q', 'aggravate'), 1],
        [dmg(talent.q['连斩伤害2'][0], 'q'), 6],
        [dmg(talent.q['连斩伤害2'][0], 'q', 'aggravate'), 2],
        [dmg(talent.q['最后一击伤害'], 'q', 'aggravate'), 1],
        [dmg(talent.a['重击伤害'], 'a2', 'aggravate'), 2],
      ];
      return damages.reduce((sum, [d, n]) => ({
        dmg: sum.dmg + d.dmg * n,
        avg: sum.avg + d.avg * n
      }), { dmg: 0, avg: 0 });
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}重击超激化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'aggravate')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「天街巡游」尾刀超激化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q : true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['最后一击伤害'], 'q', 'aggravate')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

export const defDmgIdx = 3
export const consDmgKey = '激化站场8秒总伤'
export const mainAttr = 'atk,cpct,cdmg'


export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.q === true,
    title: '天赋「玉衡之贵」：施放天街巡游时，暴击率提升15%，持续8秒',
    data: {
      cpct: 15
    }
  }, {
    title: '4命「调律」：触发雷元素相关反应提升攻击力25%',
    cons: 4,
    data: {
      atkPct: 25
    }
  }, {
    title: '6命「廉贞」：普攻、重击、施放战技或元素爆发时，分别获得6%雷伤加成',
    cons: 6,
    data: {
      dmg: 24
    }
  }]