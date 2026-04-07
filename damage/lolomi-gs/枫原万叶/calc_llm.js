import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '枫原万叶'

const team = ['闲云', '班尼特', '茜特菈莉']
const artifact_normal = ['宗室', '烬城']

const team_B = ['闲云', '班尼特','芙宁娜']
const artifact_B = ['千岩', '宗室']
// 仅针对满命万叶，虽然一般也不打风伤
const team_C = ['珐露珊', '闲云', '芙宁娜']
const artifact_C = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, ({ artis }) => ({ fwzsy : true, fengtao: !!(artis?.['翠绿之影'] >= 4) }))

export const details = applyStandardTeam([
  {
    title: '最高元素增伤',
    params: { isQ: true},
    dmg: ({ attr }) => ({ avg: Math.floor(attr.mastery * 0.04) + "%", type: 'text' })
  }, {
    title: '扩散反应伤害',
    dmg: ({}, { reaction }) => reaction('swirl')
  }, {
    title: '「千早振」长按伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['长按技能伤害'], 'e')
  }, {
    title: '「乱岚拨止」下落伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: '「乱岚拨止」染色附加伤害',
    // 自身带风套减抗染色伤害应用不上，手动传进去
    params: ({ artis }) => ({ fwzsy: true, fengtao: !!(artis?.['翠绿之影'] >= 4) }),
    dmg: ({ attr, calc }, {basic} ) => basic(calc(attr.atk) * 200 / 100, 'a3', 'coloringDmg')
  }, {
    title: '「万叶之一刀」斩击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['斩击伤害'], 'q')
  }, {
    title: '「万叶之一刀」持续伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['持续伤害'], 'q')
  }, {
    title: '「万叶之一刀」染色附加伤害',
    params: ({ artis }) => ({ fwzsy: true, isQ: true, fengtao: !!(artis?.['翠绿之影'] >= 4) }),
    dmg: ({ talent }, dmg) => dmg(talent.q['附加元素伤害'], 'q', 'coloringDmg')
  }, {
    title: '染色站场13秒总伤',
    // 默认场上有个火元素：E + Q + 2轮5A + E
    // E次数：基础2次；1命直接默认+1次，祭礼剑根据精炼等级+期望次数
    // 扩散次数：首次E扩散2次，后续E在Q中默认只扩散1次，Q扩散5次
    // 普攻伤害：六命实际情况吃不满buff，也默认全附魔2轮5A，基础3次E
    params: ({ artis }) => ({ isQ: true, fengtao: !!(artis?.['翠绿之影'] >= 4) }),
    dmg: ({ talent, calc, attr, cons, weapon, refine }, dmg) => {
      // 针对2命开Q时加200精通做个区分，首次E不吃2命加成
      const masteryQ = calc(attr.mastery);
      const masteryE = cons >= 2 ? masteryQ - 200 : masteryQ;
      const multE = 1 + masteryE * 0.04 / 100;
      const multQ = 1 + masteryQ * 0.04 / 100;
      // 单次E总伤
      const eWind  = dmg(talent.e['长按技能伤害'], 'e');
      const eFall  = dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3');
      const eColor = dmg.basic(calc(attr.atk) * 200 / 100, 'a3', 'coloringDmg');
      const oneE = {
        dmg: eWind.dmg + eFall.dmg + eColor.dmg * multE,
        avg: eWind.avg + eFall.avg + eColor.avg * multE,
      };
      // 一轮循环E的期望次数
      const baseE    = cons >= 1 ? 3 : 2;
      const xifengP  = weapon?.name === '祭礼剑' ? ([0.5, 0.575, 0.65, 0.725, 0.8][refine] ?? 0.5) : 0;
      const totalE   = baseE + (xifengP > 0 ? 1 - Math.pow(1 - xifengP, baseE) : 0);
      // Q
      const qSlash   = dmg(talent.q['斩击伤害'], 'q');
      const qDot     = dmg(talent.q['持续伤害'], 'q');
      const qColor   = dmg(talent.q['附加元素伤害'], 'q', 'coloringDmg');
      // 扩散
      const swirlUnit = dmg.reaction('swirl').avg;
      const swirlAvg = swirlUnit * (totalE + 6);
      // 普攻
      const round5A = ['一段伤害', '二段伤害', '三段伤害', '四段伤害', '五段伤害'].reduce(
        (s, k) => { const a = dmg(talent.a[k], 'a'); return { dmg: s.dmg + a.dmg, avg: s.avg + a.avg }; },
        { dmg: 0, avg: 0 }
      );
      const normalDmg = { dmg: round5A.dmg * 2, avg: round5A.avg * 2 };
      return {
        dmg: oneE.dmg * totalE + qSlash.dmg + qDot.dmg * 5 + qColor.dmg * 5 * multQ + swirlAvg + normalDmg.dmg,
        avg: oneE.avg * totalE + qSlash.avg + qDot.avg * 5 + qColor.avg * 5 * multQ + swirlAvg + normalDmg.avg,
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title} 下落风伤`,
    cons: 6,
    params: ({cons }) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      isQ: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 下落蒸发`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      fwzsy : true, fengtao: !!(artis?.['翠绿之影'] >= 4)
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3', 'vaporize')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 下落融化`,
    params: ({cons, artis}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      fwzsy : true, fengtao: !!(artis?.['翠绿之影'] >= 4)
    }),
    // miao框架定义的融化限制了火和冰角色，是火元素角色才返回2.0系数
    // 万叶本身风元素，打的融化被判断为冰打火，返回的是1.5
    // 最终伤害手动加一个倍率补偿系数4/3
    dmg: ({ talent }, dmg) => {
      const meltDmg = dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3', 'melt')
      return { dmg: meltDmg.dmg * (4/3), avg: meltDmg.avg * (4/3) }
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  
  export const defDmgIdx = 4
  export const consDmgKey = '染色站场13秒总伤'
  export const mainAttr = 'atk,cpct,cdmg,mastery'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '天赋「风物之诗咏」：扩散后基于精通提供[dmg]%对应元素伤害加成',
      check: ({ params }) => params.fwzsy === true,
      sort: 9,
      data: {
        dmg: ({ calc, attr }) => calc(attr.mastery) * 0.04,
      }
    }, {
      title: '2命「山岚残芯」：元素爆发持续期间提高200精通',
      check: ({ params }) => params.isQ === true,
      cons: 2,
      data: {
        mastery: 200
      }
    }, {
      title: '6命「血赤叶红」：基于元素精通提高普攻、重击与下落攻击造成的伤害[aDmg]%',
      sort: 9,
      cons: 6,
      data: {
        aDmg: ({ calc, attr }) => calc(attr.mastery) * 0.2,
        a2Dmg: ({ calc, attr }) => calc(attr.mastery) * 0.2,
        a3Dmg: ({ calc, attr }) => calc(attr.mastery) * 0.2,
      }
    }
  ]
  