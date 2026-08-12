import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '温迪'

const team = ['珐露珊', '杜林', '尼可']
const artifact_normal = ['千岩', '宗室', '美赐']

const team_B = ['珐露珊', '莫娜', '尼可']
const artifact_B = ['千岩', '宗室', '美赐']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{ q: true, ssfr: true })

// 队友buff期望次数拆分
// 尼可4命8次效果、杜林1命20次效果
const plusOverflow = (ds, dmg, colorFactor, dotHits) => {
  const { attr, cons } = ds;
  const nicolePlus = LIMITED_PLUS.Nicole.plus(ds);
  const durinPlus = LIMITED_PLUS.Durin.plus(ds);
  if (!nicolePlus && !durinPlus) return { dmg: 0, avg: 0 };
  const aSeq = [];
  const c1Scale = cons >= 1 ? 1.4 : 1;
  for (let i = 0; i < (cons >= 2 ? 7 : 8); i++) {
    aSeq.push(['a', c1Scale], ['a', 1], ['a', c1Scale]);
  }
  const seq = [['e', 1]];
  if (cons >= 2) seq.push(['e', 3]);
  for (let i = 0; i < dotHits; i++) {
    seq.push(['q', 1], ['qColor', 1]);
    if (aSeq.length) seq.push(aSeq.shift());
    // 2命的第二次强化E穿插在半程
    if (cons >= 2 && i === Math.floor(dotHits / 2)) seq.push(['e', 3]);
  }
  if (cons < 2) seq.push(['e', 1]);
  seq.push(...aSeq);
  const effect = (limit) => seq.slice(0, limit).reduce((ret, [key, scale]) => {
    ret[key] += scale;
    return ret;
  }, { a: 0, e: 0, q: 0, qColor: 0 });
  const total = effect(seq.length), nicole = effect(LIMITED_PLUS.Nicole.limit), durin = effect(LIMITED_PLUS.Durin.limit(ds));
  const colorUnit = dmg(0, 'q', 'coloringDmg');
  const plusUnit = {
    a: dmg(0, 'a'),
    e: dmg(0, 'e'),
    q: dmg(0, 'q'),
    qColor: { dmg: colorUnit.dmg * colorFactor, avg: colorUnit.avg * colorFactor }
  };
  return Object.keys(plusUnit).reduce((acc, key) => {
    const plus = attr[key === 'qColor' ? 'q' : key].plus;
    const over = plus ? (nicolePlus * (total[key] - nicole[key]) + durinPlus * (total[key] - durin[key])) / plus : 0;
    acc.dmg += plusUnit[key].dmg * over;
    acc.avg += plusUnit[key].avg * over;
    return acc;
  }, { dmg: 0, avg: 0 });
};

// 一轮循环伤害计算
// 默认先触发满buff，木桩自挂火元素
// 2命以上 EQ + 强化E + 7轮3A普攻 穿插+ 一次强化E，2命以下EQ + 8轮3A + E
// 一命的分裂箭默认1段和3段普攻触发
// q和q的染色默认触发20次，实际应该21次，首段伤害吃不到部分buff，平衡一下，扩散约17次
const calcRotation = (ds, dmg) => {
  const { talent, cons, attr } = ds;
  const eNormal = dmg(talent.e['点按伤害'], 'e');
  const qDot = dmg(talent.q['持续伤害'], 'q');
  const qColorRaw = dmg(talent.q['附加元素伤害'], 'q', 'coloringDmg');
  // q染色附加伤害吃不到2命减抗和4命风属性增伤，移除对应buff补偿
  const dmgTotal = attr?.dmg || 0;
  const kxTotal = attr?.kx || 0;
  const dmgFactor = cons >= 4 ? (1 + (dmgTotal - 25) / 100) / (1 + dmgTotal / 100) : 1;
  let kxFactor = 1;
  if (cons >= 2) {
    const resMul = (r) => r >= 75 ? 1 / (1 + 3 * r / 100) : r >= 0 ? (100 - r) / 100 : 1 - r / 200;
    const enemyRes = 10 - kxTotal;
    kxFactor = resMul(enemyRes + 24) / resMul(enemyRes);
  }
  const colorFactor = dmgFactor * kxFactor;
  const qColor = { dmg: qColorRaw.dmg * colorFactor, avg: qColorRaw.avg * colorFactor };
  const swirlUnit = dmg.reaction('swirl').avg;
  const dotHits = 20, colorHits = 20, swirlHits = 17;
  const qTotal = {
    dmg: qDot.dmg * dotHits + qColor.dmg * colorHits + swirlUnit * swirlHits,
    avg: qDot.avg * dotHits + qColor.avg * colorHits + swirlUnit * swirlHits,
  };
  const over = plusOverflow(ds, dmg, colorFactor, dotHits);
  // 飓风箭单轮3A
  const c1Shots = ['一', '三'];
  const one3A = '一二三'.split('').reduce((acc, num) => {
    const r = dmg(talent.a[`${num}段伤害`], 'a');
    acc.dmg += r.dmg; acc.avg += r.avg;
    if (cons >= 1 && c1Shots.includes(num)) {
      acc.dmg += r.dmg * 0.4; acc.avg += r.avg * 0.4;
    }
    return acc;
  }, { dmg: 0, avg: 0 });
  if (cons >= 2) {
    // EQ + 强化E + 7轮3A + 强化E
    const eEnhanced = { dmg: eNormal.dmg * 3, avg: eNormal.avg * 3 };
    return {
      dmg: eNormal.dmg + qTotal.dmg + eEnhanced.dmg * 2 + one3A.dmg * 7 - over.dmg,
      avg: eNormal.avg + qTotal.avg + eEnhanced.avg * 2 + one3A.avg * 7 - over.avg,
    };
  } else {
    // EQ + 8轮3A + E
    return {
      dmg: eNormal.dmg * 2 + qTotal.dmg + one3A.dmg * 8 - over.dmg,
      avg: eNormal.avg * 2 + qTotal.avg + one3A.avg * 8 - over.avg,
    };
  }
};

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '扩散反应伤害',
    dmg: ({}, { reaction }) => reaction('swirl')
  }, {
    title: '飓风箭六箭总伤',
    params: { q: true },
    dmg: ({ talent, cons }, dmg) => {
      const c1Shots = ['一', '三', '五'];
      return '一二三四五六'.split('').reduce((acc, num) => {
        const result = dmg(talent.a[`${num}段伤害`], 'a');
        acc.dmg += result.dmg;
        acc.avg += result.avg;
        if (cons >= 1 && c1Shots.includes(num)) {
          acc.dmg += result.dmg * 0.4;
          acc.avg += result.avg * 0.4;
        }
        return acc;
      }, { dmg: 0, avg: 0 });
    }
  }, {
    title: '「高天之歌」点按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
  }, {
    title: '2命「高天之歌」强化伤害',
    params: { q: true, cons_2: true },
    cons: 2,
    dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
  }, {
    title: '「风神之诗」单段伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['持续伤害'], 'q')
  }, {
    title: '「风神之诗」扩散后单段伤害',
    params: { q: true, ssfr: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['持续伤害'], 'q')
  }, {
    title: '「风神之诗」染色附加伤害',
    params: { q: true, ssfr: true, iscoloring: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['附加元素伤害'], 'q', 'coloringDmg')
  }, {
    title: '后台「风神之诗」总伤',
    // 默认木桩自挂元素环境，魔导前台非火队友站场不动作，魔导队伍buff，无其他元素共鸣，伪单人
    // 「魔女的前夜礼·颂时风若」只持续4秒，默认前台队友木桩不主动触发，不加这个buff
    // q的染色伤害不吃2命和4命，平衡一下
    // q和染色附加20次，扩散7次
    params: { q: true },
    dmg: ({ talent }, dmg) => {
      const qDot = dmg(talent.q['持续伤害'], 'q');
      const qColor = dmg(talent.q['附加元素伤害'], 'q', 'coloringDmg');
      const swirlUnit = dmg.reaction('swirl').avg;
      const hits = 20, swirlHits = 7;
      return {
        dmg: qDot.dmg * hits + qColor.dmg * hits + swirlUnit * swirlHits,
        avg: qDot.avg * hits + qColor.avg * hits + swirlUnit * swirlHits,
      };
    }
  }, {
    title: '伪单人一轮站场总伤',
    params: { q: true, ssfr: true },
    dmg: (ds, dmg) => calcRotation(ds, dmg)
  }, {
    // 队伍伤害 队友buff覆盖率偏差，移除风套染色伤害补偿，计算应该还是会偏高不少
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 强化[E]伤害`,
    cons: 2,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cons_2: true, q: true, ssfr: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 单轮站场总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      q: true, ssfr: true
    }),
    dmg: (ds, dmg) => calcRotation(ds, dmg)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 强化[E]伤害`,
    cons: 2,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cons_2: true, q: true, ssfr: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['点按伤害'], 'e')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 单轮站场总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      q: true, ssfr: true
    }),
    dmg: (ds, dmg) => calcRotation(ds, dmg)
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

  export const defParams = { Hexenzirkel: true } // 魔导队伍
  export const defDmgIdx = 2
  export const consDmgKey = '伪单人一轮站场总伤'
  export const mainAttr = 'atk,cpct,cdmg,mastery'

  export const buffs = [
    ...TeamBuff,
    {
      check: ({ params }) => params.ssfr === true,
      title: '「魔女的前夜礼·颂时风若」：当前场上角色触发扩散反应后，增伤50%，温迪暴风之眼造成原本135%的伤害',
      data: {
        dmg: 50,
        qMulti: 35,
      }
    }, {
      title: '普攻被动「魔导·秘仪」：飓风箭造成原本[_aMulti]%的普通攻击伤害',
      data: {
        aMulti: ({ talent }) => talent.a['飓风箭伤害'] - 100,
        _aMulti: ({ talent }) => talent.a['飓风箭伤害']
      }
    }, {
      title: '1命「弦发的苍风」：飓风箭额外发射两枚箭矢，分别造成原本20%的伤害',
      cons: 1,
    }, {
      title: '2命「眷恋的泠风」：高天之歌降低敌人24%风抗与物抗',
      cons: 2,
      data: {
        kx: ({ params }) => params.iscoloring ? 0 : 24
      }
    }, {
      check: ({ params }) => params.cons_2 === true,
      title: '2命「眷恋的泠风」：施放元素爆发后获得风起之时，点按元素战技将造成原本300%的伤害',
      cons: 2,
      data: {
        eMulti: 200
      }
    }, {
      title: '4命「自由的凛风」：施放元素战技或元素爆发后获得25%风元素伤害加成',
      cons: 4,
      data: {
        dmg: ({ params }) => params.iscoloring ? 0 : 25
      }
    }, {
      check: ({ params }) => params.q === true,
      title: '6命「抗争的暴风」：受元素爆发影响的敌人，风抗降低20%，温迪获得100%暴伤加成',
      cons: 6,
      data: {
        kx: 20,
        cdmg: 100,
      }
    }
  ]

    