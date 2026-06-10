import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '玛薇卡'

const team = ['茜特菈莉', '希诺宁', '尼可']
const artifact_normal = ['千岩', '烬城', '天美']

const team_B = ['茜特菈莉', '希诺宁', '班尼特']
const artifact_B = ['千岩', '烬城', '宗室']

const team_C = ['茜特菈莉']
const artifact_C = ['烬城']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{q: true, pyro_two: true, Xilonen_pyro: true})

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: ({ cons }) => `「焚曜之环」${cons >= 6 ? '+六命协同' : ''}伤害`,
    dmg: ({ talent, attr, calc, cons }, dmg) => {
      const ring = dmg(talent.e['焚曜之环伤害'], 'e,nightsoul')
      if (cons >= 6) {
        const extra = dmg(200, 'e,nightsoul')
        ring.dmg += extra.dmg
        ring.avg += extra.avg
      }
      return ring
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
    title: '满战意驰轮车重击循环伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['驰轮车重击循环伤害'], 'a2,nightsoul')
  }, {
    title: '满战意驰轮车重击融化伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['驰轮车重击循环伤害'], 'a2,nightsoul', 'melt')
  }, {
    title: '单人站场10秒总伤',
    // 满战意EQ起手 + 驰轮车重击循环×9 + 6命协同4次
    params: { q: true, jiyangezi: 30 },
    dmg: ({ talent, cons }, dmg) => {
      const eHit = dmg(talent.e['技能伤害'], 'e,nightsoul')
      const qHit = dmg(talent.q['技能伤害'], 'q,nightsoul')
      const a2Hit = dmg(talent.e['驰轮车重击循环伤害'], 'a2,nightsoul')
      let c6Blaze = { dmg: 0, avg: 0 }
      if (cons >= 6) {
        c6Blaze = dmg(500, 'e,nightsoul')
      }
      return {
        dmg: eHit.dmg + qHit.dmg + a2Hit.dmg * 9 + c6Blaze.dmg * 4,
        avg: eHit.avg + qHit.avg + a2Hit.avg * 9 + c6Blaze.avg * 4
      }
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_C, artifact_C, mainCharName).title}「坠日斩」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_C, artifact_C).params,
      q: true
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
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「坠日斩」融化`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      q: true, pyro_two: true, Xilonen_pyro: true
    }),
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul', 'melt')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

export const mainAttr = 'atk,mastery,cpct,cdmg'
export const defParams = { Nightsoul: true }
export const defDmgIdx = 2
export const consDmgKey = '单人站场10秒总伤'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.q === true,
    title: 'Q被动「死生之炉」：坠日斩伤害提升[qPlus]，驰轮车普攻伤害提升[aPlus]，重击伤害提升[a2Plus]',
    sort: 9,
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
    title: ({ params }) => `天赋「基扬戈兹」：满战意释放元素爆发后，伤害提升${params.jiyangezi ?? 40}%`,
    data: {
      dmg: ({ params }) => params.jiyangezi ?? 40
    }
  },{
    title: '1命「夜主的授记」：获取战意后，玛薇卡的攻击力提升[atkPct]%',
    cons: 1,
    data: {
      atkPct: 40
    }
  },{
    title: '2命「灰烬的代价」：基础攻击力提升200',
    sort: 2,
    cons: 2,
    data: {
      atkBase: 200
    }
  },{
    title: '2命「灰烬的代价」：焚曜之环附近的敌人的防御力降低20，夜魂加持状态下，普攻伤害提升[aPlus]，重击伤害提升[a2Plus]，元素爆发伤害提升[qPlus]',
    sort: 9,
    cons: 2,
    data: {
      enemyDef: 20,
      aPlus: ({ calc, attr }) => calc(attr.atk) * 60 / 100,
      a2Plus: ({ calc, attr }) => calc(attr.atk) * 90 / 100,
      qPlus: ({ calc, attr }) => calc(attr.atk) * 120 / 100
    }
  },{
    check: ({ params }) => params.q === true,
    title: '4命「领袖的觉悟」：额外获得10%伤害加成 ',
    cons: 4,
    data: {
      dmg: 10
    }
  },{
    title: '6命「人之名解放」：焚曜之环额外造成200%攻击力的火伤，驰轮车额外造成500%攻击力的火伤',
    cons: 6,
  }
]
