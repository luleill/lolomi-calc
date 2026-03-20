import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '胡桃'

const team = ['茜特菈莉','夜兰','芙宁娜']
const artifact_normal = ['烬城', '千岩']

const team_B = ['行秋','钟离','夜兰']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, {hydro_two: true, half_blood: true})

export const details = applyStandardTeam([
  {
    title: '触发满特效后生命值',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.hp))})
  }, {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: `「蝶引来生」半血重击蒸发`,
    params: { half_blood: true },
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: `「血梅香」蒸发`,
    dmg: ({ talent }, dmg) => dmg(talent.e['血梅香伤害'], 'e', 'vaporize')
  }, {
    title: `「安神秘法」半血蒸发`,
    params: { half_blood: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['低血量时技能伤害'], 'q', 'vaporize')
  }, {
    title: `10秒站场蒸发总伤`,
    // 默认有水底，默认正常手法都为 AZ 闪，10秒1命9戳加Q，0命7戳加Q
    // 重击独立附着，每次都能蒸发，血梅香独立附着蒸发2次
    // 普攻遵循 3hits/2.5s 规则：AZ手法第1、4、7 段普攻触发蒸发
    params: { half_blood: true },
    dmg: ({ talent, cons }, dmg) => {
      const aVaporize = dmg(talent.a['一段伤害'], 'a', 'vaporize');
      const aNormal = dmg(talent.a['一段伤害'], 'a');
      const a2 = dmg(talent.a['重击伤害'], 'a2', 'vaporize');
      const xmx = dmg(talent.e['血梅香伤害'], 'e', 'vaporize');
      const q = dmg(talent.q['低血量时技能伤害'], 'q', 'vaporize');
      const counts = cons >= 1 ? 9 : 7;
      const aVaporizeCount = Math.floor((counts + 2) / 3);
      const aNormalCount = counts - aVaporizeCount;
      return {
        dmg: aVaporize.dmg * aVaporizeCount + aNormal.dmg * aNormalCount + 
             a2.dmg * counts + xmx.dmg * 2 + q.dmg,
        avg: aVaporize.avg * aVaporizeCount + aNormal.avg * aNormalCount + 
             a2.avg * counts + xmx.avg * 2 + q.avg
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}半血重击蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      hydro_two: true, half_blood: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}半血重击蒸发`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      hydro_two: true, half_blood: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

  export const defDmgIdx = 2
  export const consDmgKey = '10秒站场蒸发总伤'
  export const mainAttr = 'hp,mastery,cpct,cdmg'

  export const buffs = [
    ...TeamBuff,
    {
      title: '天赋「蝶引来生」：「彼岸蝶舞」状态基于生命值上限提高攻击力[atkPlus]',
      sort: 9,
      data: {
        atkPlus: ({ talent, attr, calc }) => {
          return Math.min(talent.e['攻击力提高'] * calc(attr.hp) / 100, attr.atk.base * 4)
        }
      }
    }, {
      check: ({ params }) => params.half_blood === true,
      title: '天赋「血之灶火」：生命值低于或等于50%时，获得33%火伤加成',
      data: {
        dmg: 33
      }
    }, {
      title: '1命「赤团开时斜飞去」：「彼岸蝶舞」状态时，重击不会消耗体力',
      cons: 1
    }, {
      title: '2命「最不安神晴又复雨」： 血梅香造成的伤害提高[ePlus]点',
      cons: 2,
      sort: 9,
      data: {
        ePlus: ({ attr, calc }) => calc(attr.hp) * 10 / 100
      }
    }
    ]

    