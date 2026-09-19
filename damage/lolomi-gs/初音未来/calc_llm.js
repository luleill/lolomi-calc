import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '初音未来'

const team = ['珐露珊', '杜林', '尼可']
const artifact_normal = ['千岩', '天美']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

const aRound = (talent, dmg) => ['一段伤害', '二段伤害', '三段伤害', '四段伤害']
  .map(key => dmg(talent.a[key], 'a'))
  .reduce((acc, hit) => ({ dmg: acc.dmg + hit.dmg, avg: acc.avg + hit.avg }), { dmg: 0, avg: 0 })

const resonanceRound = (talent, dmg) => ['一段伤害', '二段伤害', '三段伤害', '四段伤害']
  .map(key => dmg(talent.e[`音律共振·${key}`], 'e'))
  .reduce((acc, hit) => ({ dmg: acc.dmg + hit.dmg, avg: acc.avg + hit.avg }), { dmg: 0, avg: 0 })

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「音律剑舞·未来节拍」四段总伤',
    dmg: ({ talent }, dmg) => aRound(talent, dmg)
  }, {
    title: '「音律剑舞·未来节拍」重击伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a')
  }, {
    title: '「音波共鸣·葱绿绽放」技能伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '音律共振状态普攻四段总伤',
    dmg: ({ talent }, dmg) => resonanceRound(talent, dmg)
  }, {
    title: '「传世音律·千本樱」技能伤害',
    params: { q: true },
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q')
  }, {
    title: '单人站场10秒总伤',
    params: { q: true, has_music: true, music_layers: 4 },
    dmg: ({ talent, cons }, dmg) => {
      const eHit = dmg(talent.e['技能伤害'], 'e')
      const qHit = dmg(talent.q['技能伤害'], 'q')
      const aSet = aRound(talent, dmg)
      const resonanceSet = resonanceRound(talent, dmg)
      const rounds = cons >= 2 ? 3 : 2
      const ca = dmg(talent.a['重击伤害'], 'a')
      const caResonance = dmg(talent.e['音律共振·重击伤害'], 'e')
      return {
        dmg: eHit.dmg + qHit.dmg + (aSet.dmg + resonanceSet.dmg) * rounds + ca.dmg + caResonance.dmg,
        avg: eHit.avg + qHit.avg + (aSet.avg + resonanceSet.avg) * rounds + ca.avg + caResonance.avg
      }
    }
  }, {
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}音律共振重击`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.e['音律共振·重击伤害'], 'e')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 5
export const consDmgKey = '单人站场10秒总伤'
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.q === true,
    title: '「传世音律·千本樱」：领域内满层「音律」时，队伍攻击力提升[atkPct]%，元素精通提升[mastery]',
    data: {
      atkPct: 20,
      mastery: 200
    }
  }, {
    title: '1命「节拍之心·音律起」：每层「音律」使暴击伤害提升[cdmg]%',
    cons: 1,
    data: {
      cdmg: ({ params }) => (params.music_layers ?? 0) * 15
    }
  }, {
    title: '4命「世界第一公主殿下的祝福」：拥有「音律」时，队伍暴击率提升[cpct]%',
    cons: 4,
    data: {
      cpct: ({ params }) => params.has_music ? 15 : 0
    }
  }, {
    title: '6命「VOCALOID永恒旋律」：拥有「音律」时，自身暴击伤害提升[cdmg]%',
    cons: 6,
    data: {
      cdmg: ({ params }) => params.has_music ? 100 : 0
    }
  }
]
