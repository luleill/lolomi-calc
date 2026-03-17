import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '甘雨'

const team = ['申鹤','枫原万叶','班尼特']
const artifact_normal = ['宗室', '风套']

const team_B = ['申鹤','爱可菲','芙宁娜']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{q:true},-3)

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: '「霜华矢」一箭总伤',
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢命中伤害'] + talent.a['霜华矢·霜华绽发伤害'], 'a2') 
  }, {
    title: '「霜华矢」一箭融化',
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢命中伤害'] + talent.a['霜华矢·霜华绽发伤害'], 'a2', 'melt') 
  }, {
    title: '6命2E三箭总伤',
    cons: 6,
    dmg: ({ talent }, dmg) =>{
      let e = dmg(talent.e['技能伤害'], 'e')
      let a = dmg(talent.a['霜华矢命中伤害'] + talent.a['霜华矢·霜华绽发伤害'], 'a2') 
      return {
       dmg: e.dmg * 2 + (a.dmg * 3),
       avg: e.avg * 2 + (a.avg * 3)
      }
     }
  }, { 
    title: '「山泽麟迹」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    params: { q: true },
    title: '「降众天华」冰凌伤害',
    dmg: ({ talent, calc, attr }, {basic}) => basic(calc(attr.atk) * talent.q['冰棱伤害'] / 100, 'q')
  }, {
    params: { q: true },
    title: 'Q后10秒站场总伤',
    // 10秒非满命默认2秒一箭，预计4箭，满命预存一箭一共射6箭
    // 大招具有随机性，默认单个敌人处于正中心，10秒命中15次
    dmg: ({ talent, cons }, dmg ) => {
      const ebaseDamage = dmg(talent.e['技能伤害'] * (cons >= 1 ? 2 : 1), 'e');
      const qbaseDamage = dmg(talent.q['冰棱伤害'] * 15, 'q');
      const a2Damage = dmg((talent.a['霜华矢命中伤害'] + talent.a['霜华矢·霜华绽发伤害']) * (cons >= 6 ? 6 : 4), 'a2') ;
      return {
        dmg: ebaseDamage.dmg + qbaseDamage.dmg + a2Damage.dmg,
        avg: ebaseDamage.avg + qbaseDamage.avg + a2Damage.avg
      };
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}霜华矢一箭总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params, 
      q: true
    }),
    dmg: ({ talent }, dmg ) =>{
      let a_1 = dmg(talent.a['霜华矢命中伤害'], 'a2')
      let a_2 = dmg(talent.a['霜华矢·霜华绽发伤害'], 'a2') 
      return {
      dmg: a_1.dmg + a_2.dmg,
      avg: a_1.avg + a_2.avg,
      }
    }
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}霜华矢一箭融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg ) =>{
    let a_1 = dmg(talent.a['霜华矢命中伤害'], 'a2','melt')
    let a_2 = dmg(talent.a['霜华矢·霜华绽发伤害'], 'a2', 'melt') 
    return {
    dmg: a_1.dmg + a_2.dmg,
    avg: a_1.avg + a_2.avg,
    }
    }
  }, {
    params: { 
      zongshi: true, fengtao: true, legend_max: true,
      ShenHe_best: true, Kazuha_best: true, Bennett_best : true,
     },
    title: '地方传奇甘鹤万班一箭融化',
    dmg: ({ talent }, dmg) => dmg(talent.a['霜华矢命中伤害'] + talent.a['霜华矢·霜华绽发伤害'], 'a2', 'melt') 
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])
  
  export const defDmgIdx = 3
  export const mainAttr = 'atk,cpct,cdmg,mastery'
  export const consDmgKey = 'Q后10秒站场总伤'
  
  export const buffs = [
    ...TeamBuff,
    {
      title: '天赋「唯此一心」：霜华矢发射后，接下来的霜华矢暴击率提高20%',
      data: {
        a2Cpct: 20
      }
    }, {
      check: ({ params }) => params.q === true,
      title: '天赋「天地交泰」：降众天华领域内获得20%冰元素伤害加成',
      data: {
        dmg: 20
      }
    }, {
      title: '1命「饮露」：霜华矢命中时，敌人冰元素抗性降低15%',
      cons: 1,
      data: {
        kx: 15
      }
    }, {
      check: ({ params }) => params.q === true,
      title: '4命「西狩」：降众天华领域内敌人受到的伤害提升[dmg]%',
      // 初始5增伤，每3秒提高5%，至多25%，计算默认吃到10%增伤
      cons: 4,
      data: {
        dmg: 10
      }
    }
  ]
  