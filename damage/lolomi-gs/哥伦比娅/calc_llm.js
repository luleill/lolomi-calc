import { TeamBuff } from '../teambuffs.js'
import { teamConfig, teamDefined , withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '哥伦比娅'

const team = ['伊涅芙','希诺宁','妮露']

const artifact_normal = ['夜歌']

const definedconfig =
  {
    best: ['菈乌玛','妮露','纳西妲'],  
    mid: ['菈乌玛','妮露','纳西妲'],  
    low: ['菈乌玛','爱诺','纳西妲'] 
  }

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config)

export const details = applyStandardTeam([
  {
    title: '单人触发满特效后生命值',
    dmg: ({ attr, calc }) => {
      return {
        avg: Math.min(calc(attr.hp) * 1)
      }
    }
  },{
    title: '「她的乡愁」月曜伤害提升',
    dmg: ({ talent }) => {
      return {
        avg: Math.floor(talent.q['月曜反应伤害提升']) + "%",
        type: 'text'
      }
    }
  },{
    check: ({ cons }) => cons > 0,
    title: ({ cons }) => `${cons}命月曜伤害总擢升`,
    dmg: ({ cons }) => {
      const values = [0, 1.5, 8.5, 10, 11.5, 13, 20];
      return {
        avg: (cons > 0 ? values[Math.min(cons, 6)] : 0) + "%",
        type: 'text'
      };
    }
  },{
    check: ({ cons }) => cons >= 2,
    title: '一命月结晶队雨海护盾量',
    dmg: ({ calc, attr }) => {
      return {
        avg: calc(attr.hp) * 12 / 100
      }
    }
  },{
    check: ({ cons }) => cons >= 2,
    title: '二命提升 攻击力 | 精通 | 防御力',
    dmg: ({ calc, attr }) => {
      const atkValue = Math.floor(calc(attr.hp) * 1 / 100);
      const masteryValue = Math.floor(calc(attr.hp) * 0.35 / 100);
      const defValue = Math.floor(calc(attr.hp) * 1 / 100);
      return {
        avg: `${atkValue} | ${masteryValue} | ${defValue}`,
        type: 'text'
      };
    }
  },{
    params: { q: true, gravity: true, is_luna: true ,Bloom : true},
    title: '「月露涤荡」重击伤害',
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let damage = calc(attr.hp) * talent.a['月露涤荡伤害'] / 100;
      if (params.cons >= 4) {
          damage += calc(attr.hp) * 2.5 / 100;
      }
      return basic(damage, '', 'lunarBloom');
    }
  },{
    params: { gravity: true },
    title: '引力涟漪常态伤害',
    dmg: ({ attr, calc, talent }, { basic }) => basic(calc(attr.hp) * talent.e['引力涟漪·持续伤害'] / 100, 'e')
  },{
    params: { q: true, gravity: true, is_luna: true,Charged: true },
    title: '「引力干涉」月感电伤害',
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let lunarChargedDamage = calc(attr.hp) * talent.e['引力干涉·月感电伤害'] / 100;
      if (params.cons >= 4) {
        lunarChargedDamage += calc(attr.hp) * 12.5 / 100;
      }
      return basic(lunarChargedDamage, '', 'lunarCharged');
    }
  },{
    params: { q: true, gravity: true, is_luna: true ,Bloom : true},
    title: '「引力干涉」月绽放伤害',
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let lunarBloomDamage = calc(attr.hp) * talent.e['引力干涉·月绽放伤害'] / 100;
      if (params.cons >= 4) {
        lunarBloomDamage += calc(attr.hp) * 2.5 / 100;
      }
      return basic(lunarBloomDamage, '', 'lunarBloom');
    }
  },{
    params: { q: true, gravity: true, is_luna: true, Crystallize: true },
    title: '「引力干涉」月结晶伤害',
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let lunarCrystallizeDamage = calc(attr.hp) * talent.e['引力干涉·月结晶伤害'] / 100;
      if (params.cons >= 4) {
        lunarCrystallizeDamage += calc(attr.hp) * 12.5 / 100;
      }
      return basic(lunarCrystallizeDamage, '', 'lunarCrystallize');
    }
  },{
    title: ({cons}) =>  `${(teamDefined(cons,definedconfig,artifact_normal,mainCharName)).title}「月露涤荡」重击伤害`,
    params: ({cons}) => ({
      ...(teamDefined(cons,definedconfig,artifact_normal,mainCharName)).params,
      q: true, gravity: true, is_luna: true, Bloom: true, hydro_two: true
    }),
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let lunarBloomDamage = calc(attr.hp) * talent.a['月露涤荡伤害'] / 100;
      if (params.cons >= 4) {
        lunarBloomDamage += calc(attr.hp) * 12.5 / 100;
      }
      return basic(lunarBloomDamage, '', 'lunarBloom');
    }
  },{
    title: ({cons}) =>  `${(teamDefined(cons,definedconfig,artifact_normal,mainCharName)).title}「引力干涉」月绽放伤害`,
    params: ({cons}) => ({
      ...(teamDefined(cons,definedconfig,artifact_normal,mainCharName)).params,
      q: true, gravity: true, is_luna: true, Bloom: true, hydro_two: true
    }),
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let lunarBloomDamage = calc(attr.hp) * talent.e['引力干涉·月绽放伤害'] / 100;
      if (params.cons >= 4) {
        lunarBloomDamage += calc(attr.hp) * 12.5 / 100;
      }
      return basic(lunarBloomDamage, '', 'lunarBloom');
    }
  },{
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「引力干涉」月感电伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params, 
      q: true, gravity: true, is_luna: true, Charged: true, hydro_two: true,
      ...(cons >= 2 && { Xilonen_hydro: true }),
    }),
    dmg: ({ attr, calc, talent, params }, { basic }) => {
      let lunarChargedDamage = calc(attr.hp) * talent.e['引力干涉·月感电伤害'] / 100;
      if (params.cons >= 4) {
        lunarChargedDamage += calc(attr.hp) * 12.5 / 100;
      }
      return basic(lunarChargedDamage, '', 'lunarCharged');
    }
  },{
  title: '当前圣遗物套装',
  dmg: ({ artis }) => {
    return {
      avg: artis ,
      type: 'text'
    }
  }}
]);

export const defDmgIdx = 4;
export const mainAttr = 'hp,cpct,cdmg,mastery';
export const defParams = { Moonsign: 2 };

export const buffs = [
  ...TeamBuff,
  {
    check: ({ params }) => params.q === true,
    title: '哥伦比娅元素爆发：施放元素爆发后，月曜反应伤害将会提升[lunarBloom]%',
    data: {
      lunarBloom: ({ talent }) => talent.q['月曜反应伤害提升'],
      lunarCharged: ({ talent }) => talent.q['月曜反应伤害提升'],
      lunarCrystallize: ({ talent }) => talent.q['月曜反应伤害提升']
    }
  },{
    check: ({ params }) => params.gravity === true,
    title: '哥伦比娅天赋：触发引力干涉时，使自身的暴击率最高提升[cpct]%',
    data: {
      cpct: 5 * 3
    }
  },{
    check: ({ params }) => params.is_luna === true,
    title: '哥伦比娅天赋：基于哥伦比娅的生命值上限，对队伍中角色造成的月曜反应提升[fypct]%的基础伤害',
    data: {
      fypct: ({ attr, calc }) => Math.min(Math.floor(calc(attr.hp) / 1000) * 0.2, 7)
    }
  },{
    title: '哥伦比娅1命：月曜反应伤害擢升[elevated]%',
    cons: 1,
    data: {
      elevated: 1.5
    }
  },{
    title: '哥伦比娅2命：月曜反应伤害擢升[elevated]%。触发引力干涉时，生命值提升[hpPct]%',
    cons: 2,
    data: {
      elevated: 7,
      hpPct: 40
    }
  },{
    check: ({ params }) => params.cons >= 2 && params.Bloom === true,
    title: '哥伦比娅2命：绽放队提升精通[mastery]',
    cons: 2,
    sort: 9,
    data: {
      mastery: ({ attr, calc }) => calc(attr.hp) * 0.35 / 100
    }
  },{
    check: ({ params }) => params.cons >= 2 && params.Charged === true,
    title: '哥伦比娅2命：感电队提升基础攻击[atk]',
    cons: 2,
    sort: 9,
    data: {
      atk: ({ attr, calc }) => calc(attr.hp) * 1 / 100
    }
  },{
    check: ({ params }) => params.cons >= 2 && params.Crystallize === true,
    title: '哥伦比娅2命：结晶队提升基础防御[atk]',
    cons: 2,
    sort: 9,
    data: {
      def: ({ attr, calc }) => calc(attr.hp) * 1 / 100
    }
  },{
    title: '哥伦比娅3命：月曜反应伤害擢升[elevated]%',
    cons: 3,
    data: {
      elevated: 1.5
    }
  },{
    title: '哥伦比娅4命：月曜反应伤害擢升[elevated]% ，触发引力干涉时，造成的月曜反应伤害基于哥伦比娅的生命值上限提升',
    cons: 4,
    data: {
      elevated: 1.5,
    }
  },{
    title: '哥伦比娅5命：月曜反应伤害擢升[elevated]%',
    cons: 5,
    data: {
      elevated: 1.5
    }
  },{
    title: '哥伦比娅6命：月曜反应伤害擢升[elevated]%。触发月曜反应后的8秒内，依据参与反应的元素类型，对应元素类型伤害的暴击伤害提升[cdmg]%',
    cons: 6,
    data: {
      elevated: 7,
      cdmg: 80
    }
  }
]