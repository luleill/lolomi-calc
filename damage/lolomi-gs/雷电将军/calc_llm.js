import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '雷电将军'

const team = ['九条裟罗','枫原万叶','班尼特']
const artifact_normal = ['宗室', '风套']

const team_B = ['九条裟罗','夏沃蕾','班尼特']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, { type: 0, q: true })

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「雷罚恶曜之眼」协同伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['协同攻击伤害'], 'e')
  }, {
    title: '「梦想一刀」满愿力拔刀伤害',
    params: { type: 0 , q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['梦想一刀基础伤害'], 'q')
  }, {
    title: '「梦想一心」重击伤害',
    params: { type: 1, q: true },
    dmg: ({ talent }, dmg) => {
      const a2_1 = dmg(talent.q['重击伤害2'][0], 'q')
      const a2_2 = dmg(talent.q['重击伤害2'][1], 'q')
      return { dmg: a2_1.dmg + a2_2.dmg, avg: a2_1.avg + a2_2.avg }
    }
  }, {
    title: '满愿力10秒站场总伤',
    // Q首段拔刀 + 3轮5A + e协同伤害8次
    params: { type: 1 , q: true },
    dmg: ({ talent }, dmg) => {
      const deltaPct = (talent.q['愿力加成'][0] - talent.q['愿力加成'][1]) * 60;
      const eExtra = dmg(talent.e['协同攻击伤害'], 'e');
      const qDamage = dmg(talent.q['梦想一刀基础伤害'] + deltaPct, 'q');
      const totala = ['一', '二', '三', '五'].reduce(
        (sum, num) => { const a = dmg(talent.q[`${num}段伤害`], 'q'); return { dmg: sum.dmg + a.dmg, avg: sum.avg + a.avg }; },
        { dmg: 0, avg: 0 }
      );
      const a4_1 = dmg(talent.q['四段伤害2'][0], 'q');
      const a4_2 = dmg(talent.q['四段伤害2'][1], 'q');
      const totalA = { dmg: totala.dmg + a4_1.dmg + a4_2.dmg, avg: totala.avg + a4_1.avg + a4_2.avg };
      return {
        dmg: totalA.dmg * 3 + qDamage.dmg + eExtra.dmg * 8,
        avg: totalA.avg * 3 + qDamage.avg + eExtra.avg * 8,
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 满愿力拔刀`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      type: 0, q: true, pyro_two: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['梦想一刀基础伤害'], 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 满愿力拔刀`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      type: 0, q: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['梦想一刀基础伤害'], 'q')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 3
export const consDmgKey = '满愿力10秒站场总伤'
export const mainAttr = 'atk,cpct,cdmg,recharge,dmg'
/**
 * params.type:
 * - 0: 梦想一刀拔刀伤害加成
 * - 1: 梦想一心状态下伤害加成
 */
export const buffs = [
  ...TeamBuff,
  {
    title: '被动「雷罚恶曜之眼」：基于元素能量提升元素爆发伤害[qDmg]%',
    data: {
      qDmg: ({ talent }) => talent.e['元素爆发伤害提高'] * 90
    }
  }, {
    title: '被动「梦想真说」：依据愿力层数，提高梦想一刀与梦想一心的攻击伤害[qPct]%',
    data: {
      qPct: ({ talent, params }) => {
        const type = params.type || 0
        return talent.q['愿力加成'][type] * 60
      }
    }
  }, {
    title: '天赋「殊胜之御体」：基于元素充能超过100%的部分获得雷伤加成[dmg]%',
    sort: 4,
    data: {
      dmg: ({ attr }) => Math.max(attr.recharge.base + attr.recharge.plus - 100, 0) * 0.4
    }
  }, {
    check: ({ params }) => params.q === true,
    title: '2命「斩铁断金」：梦想真说状态下的攻击无视敌人60%的防御力',
    cons: 2,
    data: {
      ignore: 60
    }
  }
]
