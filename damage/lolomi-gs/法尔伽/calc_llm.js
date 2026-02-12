import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '法尔伽'

const team = ['珐露珊','杜林','班尼特']
const artifact_normal = ['千岩', '宗室']

const team_B = ['珐露珊','莫娜','班尼特']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{cons_2: true})

export const details = applyStandardTeam([
{
  title: '触发满特效后攻击力',
  dmg: ({ attr, calc }) => {
    return { avg: Math.min(calc(attr.atk) * 1)}
  }
},{
    title: '「狂飙突进」普攻五段总伤',
    dmg: ({ talent }, dmg) => {
        const baseDamage = ['狂飙突进·一段伤害', '狂飙突进·二段伤害', '狂飙突进·三段伤害', '狂飙突进·四段伤害', '狂飙突进·五段伤害']
            .map(key => dmg(talent.e[key], 'e'));
        const totalBaseDmg = baseDamage.reduce((sum, d) => sum + d.dmg, 0);
        const totalBaseAvg = baseDamage.reduce((sum, d) => sum + d.avg, 0);
        return {
            dmg: totalBaseDmg,
            avg: totalBaseAvg
        };
    }
}, {
  title: '「四风将起」伤害',
  dmg: ({ talent }, dmg) => dmg(talent.e['四风将起伤害'], 'e')
}, {
  title: '「苍噬」伤害',
  dmg: ({ talent }, dmg) => dmg(talent.e['苍噬伤害'], 'e')
}, {
  title: '「我即朔风」第一段伤害',
  dmg: ({ talent }, dmg) => dmg(talent.q['技能第一段伤害'], 'q')
} ,{
  title: '「我即朔风」第二段伤害',
  dmg: ({ talent }, dmg) => dmg(talent.q['技能第二段伤害'], 'q')
} ,{
  // 队伍伤害
  title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「四风将起」伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team_B, artifact_B).params
  }),
  dmg: ({ talent }, dmg) => dmg(talent.e['四风将起伤害'], 'e')
} ,{
  title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「四风将起」伤害`,
  params: ({cons}) => ({
    ...teamConfig(cons, team, artifact_normal).params
  }),
  dmg: ({ talent }, dmg) => dmg(talent.e['四风将起伤害'], 'e')
}, {
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
])

export const defParams = { Hexenzirkel: true } // 魔女会成员
export const defDmgIdx = 1
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '法尔伽天赋：晓风的行军 1000点攻击力增伤10%',
    data: {
      dmg: 25,
      eMulti: 140,
    }
  }, {
    title: '法尔伽天赋：风帜的先引',
    data: {
      admg: 30,
      a2dmg: 30,
      edmg: 30
    }
  }, {
    title: '法尔伽1命：四风将起或苍噬造成原本200%的伤害',
    check: ({ params }) => params.sifeng === true, 
    cons: 1,
    data: {
      eMulti: 200,
    }
  }, {
    title: '法尔伽4命：所有角色分别获得20%风元素伤害加成与对应元素伤害加成',
    cons: 4,
    data: {
      dmg: 20
    }
  }, {
    title: '法尔伽6命：每层「苍牙之誓」使法尔伽的暴击伤害提升20%。',
    cons: 6,
    data: {
      cdmg: 80,
    }
  }
]

    