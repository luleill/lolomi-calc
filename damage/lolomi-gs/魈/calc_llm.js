import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '魈'

const team = ['珐露珊','闲云','芙宁娜']
const artifact_normal = ['千岩', '宗室']

const team_B = ['珐露珊','闲云','伊安珊']
const artifact_B = ['千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '触发满特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    title: '「风轮两立」首次伤害',
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「风轮两立」满被动伤害',
    params: { max_e: true },
    dmg: ({ talent }, dmg) => dmg(talent.e['技能伤害'], 'e')
  }, {
    title: '「靖妖傩舞」下落擦伤',
    dmg: ({ talent }, dmg) => dmg(talent.a['下坠期间伤害'], 'a3')
  }, {
    title: '「靖妖傩舞」单次下落伤害',
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  } ,{
    title: '低空对双15秒站场总伤',
    // eeq 起手后开始计时再算伤害，双怪距离默认较近
    // 非满命默认下落A跳，低空平均插13次，极限14次不考虑
    // 低空基本稳定擦伤单怪，双怪默认擦伤次数按下落次数 * 1.5
    // 满命算下可能的超低空操作下落共7次，平地4E穿怪A跳，擦伤单怪，E打双怪
    // 考虑下实战环境，超低空失误很多，偏极限情况，平衡去个位数取整算40次E
    params: {max_e: true},
    dmg: ({ talent, cons }, dmg) => {
      const a3counts = cons >= 6 ? 7 : 12;
      const a3 = dmg(talent.a['低空/高空坠地冲击伤害'][0], 'a3');
      const a = dmg(talent.a['一段伤害'], 'a');
      const collision = dmg(talent.a['下坠期间伤害'], 'a3');
      const e = dmg(talent.e['技能伤害'], 'e');

      const singlea3 = { dmg: a3.dmg * 2 + a.dmg, avg: a3.avg * 2 + a.avg };
      const collisioncounts = cons >= 6 ? 7 : 18;
      
      return {
        dmg: singlea3.dmg * a3counts + collision.dmg * collisioncounts + (cons >= 6 ? e.dmg * 40 : 0),
        avg: singlea3.avg * a3counts + collision.avg * collisioncounts + (cons >= 6 ? e.avg * 40 : 0)
      };
    }
  }, {
    title: '高空对双15秒站场总伤',
    // eeq 起手后开始计时再算伤害，双怪距离默认较近
    // 非满命默认下落A跳，高空平均插12次，极限13次不考虑
    // 高空下落擦伤不稳定，下落擦伤单怪，擦伤次数就按下落次数算
    // 满命高空下落6次，平地4E穿怪A跳，擦伤单怪，E打双怪
    // 考虑下实战环境，满命E命中的次数按3/4算，6*4*2*0.75=36
    params: {max_e: true},
    dmg: ({ talent, cons }, dmg) => {
      const a3counts = cons >= 6 ? 6 : 12;
      const a3 = dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3');
      const a = dmg(talent.a['一段伤害'], 'a');
      const collision = dmg(talent.a['下坠期间伤害'], 'a3');
      const e = dmg(talent.e['技能伤害'], 'e');

      const single = { 
        dmg: a3.dmg * 2 + a.dmg + collision.dmg, 
        avg: a3.avg * 2 + a.avg + collision.avg 
      };
      
      return {
        dmg: single.dmg * a3counts + (cons >= 6 ? e.dmg * 36 : 0),
        avg: single.avg * a3counts + (cons >= 6 ? e.avg * 36 : 0)
      };
    }
  } ,{
    // 队伍伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「靖妖傩舞」单次下落`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  } ,{
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「靖妖傩舞」单次下落`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params
    }),
    dmg: ({ talent }, dmg) => dmg(talent.a['低空/高空坠地冲击伤害'][1], 'a3')
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => {
      return {
        avg: artis ,
        type: 'text'
      }
    }}
  ])

  export const defDmgIdx = 4
  export const consDmgKey = '高空对双15秒站场总伤'
  export const mainAttr = 'atk,cpct,cdmg'

  export const buffs = [
    ...TeamBuff,
    {
      title: '「靖妖傩舞」：普攻，重击，下落攻击伤害提升[aDmg]%',
      data: {
        aDmg: ({ talent }) => talent.q['普通攻击/重击/下落攻击伤害提升'],
        a2Dmg: ({ talent }) => talent.q['普通攻击/重击/下落攻击伤害提升'],
        a3Dmg: ({ talent }) => talent.q['普通攻击/重击/下落攻击伤害提升']
      }
    }, {
      title: '天赋「降魔·平妖大圣」：靖妖傩舞状态下，伤害提高5%，默认吃15%',
      data: {
        dmg: 15
      }
    }, {
      title: '天赋「坏劫·国土碾尘」：满层风轮两立造成的伤害提高45%',
      check: ({ params }) => params.max_e === true, 
      data: {
        eDmg: 45
      }
    }
    ]

    