import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '玛薇卡'

const team = ['茜特菈莉','枫原万叶', '班尼特']
const artifact_normal = ['烬城', '风套','宗室']

const team_B = ['茜特菈莉','希诺宁', '班尼特']
const artifact_B = ['千岩', '烬城', '宗室']

const team_C = ['茜特菈莉']
const artifact_C = ['烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team_B, artifact_B, config,{q: true, pyro_two: true, Xilonen_pyro: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({
      avg: Math.min(calc(attr.atk) * 1)
    })
  }, {
    title: ({ cons }) => `「焚曜之环」${cons >= 6 ? '+六命协同' : ''}伤害`,
    params: { ringSun: true },
    dmg: ({ talent, attr, calc, cons }, { basic }) => {
      const ebaseDamage = basic(calc(attr.atk) * talent.e['焚曜之环伤害'] / 100, 'e,nightsoul')
      if (cons >= 6) {
        const extraDamage = basic(calc(attr.atk) * 200 * 2 / 100, 'e,nightsoul');
        ebaseDamage.dmg += extraDamage.dmg;
        ebaseDamage.avg += extraDamage.avg;
      } 
      return ebaseDamage;
    }
  }, {
    title: '满战意「坠日斩」伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul')
  }, {
    title: '满战意「坠日斩」融化伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul', 'melt')
  }, {
    title: '满战意Q后驰轮车重击伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['驰轮车重击循环伤害'], 'a2,nightsoul')
  }, {
    title: '满战意Q后驰轮车重击融化伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['驰轮车重击循环伤害'], 'a2,nightsoul', 'melt')
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}「坠日斩」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params, 
      q: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul', 'melt')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「坠日斩」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true, pyro_two: true, Xilonen_pyro: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul', 'melt')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「坠日斩」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      q: true, pyro_two: true, Xilonen_pyro: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul', 'melt')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({
      avg: artis,
      type: 'text'
    })
  }
])

export const mainAttr = 'atk,mastery,cpct,cdmg'
export const defParams = { Nightsoul: true }
export const defDmgIdx = 2

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.q === true,
    title: 'Q被动「死生之炉」：坠日斩伤害提升[qPlus]，驰轮车普攻伤害提升[aPlus]，重击伤害提升[a2Plus]',
    data: {
      qPlus: ({ talent, calc, attr }) => 200 * talent.q['坠日斩伤害提升'] * calc(attr.atk) / 100 ,
      aPlus: ({ talent, calc, attr }) => 200 * talent.q['驰轮车普通攻击伤害提升'] * calc(attr.atk) / 100 ,
      a2Plus: ({ talent, calc, attr }) => 200 * talent.q['驰轮车重击伤害提升'] * calc(attr.atk) / 100 ,
    }
  },{
    title: '天赋「炎花献礼」：队伍角色触发「夜魂迸发」时，攻击力提升[atkPct]%',
    data: {
      atkPct: 30
    }
  },{
    check: ({ params }) => params.q === true,
    title: '天赋「基扬戈兹」：满战意释放元素爆发后，造成的伤害提升[dmg]%',
    data: {
      dmg: 40
    }
  },{
    title: '1命「夜主的授记」：获取战意后，玛薇卡的攻击力提升[atkPct]%',
    cons: 1,
    data: {
      atkPct: 40
    }
  },{
    title: '2命「灰烬的代价」：基础攻击力提升[atkBase]，焚曜之环附近的敌人的防御力降低[enemyDef]，夜魂加持状态下，普攻伤害提升[aPlus]，重击伤害提升[a2Plus]，元素爆发伤害提升[qPlus]',
    cons: 2,
    data: {
      atkBase: 200,
      enemyDef: 20,
      aPlus: ({ calc, attr }) => calc(attr.atk) * 60 / 100,
      a2Plus: ({ calc, attr }) => calc(attr.atk) * 90 / 100,
      qPlus: ({ calc, attr }) => calc(attr.atk) * 120 / 100
    }
  },{
    check: ({ params }) => params.q === true,
    title: '4命「领袖的觉悟」：额外获得[dmg]%伤害加成 ',
    cons: 4,
    data: {
      dmg: 10
    }
  },{
    title: '6命「人之名解放」：焚曜之环命中时，额外造成200%攻击力的火元素范围伤害',
    cons: 6,
    data: {
    }
  }
]
