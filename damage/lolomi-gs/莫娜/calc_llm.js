import { TeamBuff } from '../teambuffs.js'
export const details = [
{
  title: '开Q重击伤害',
  params: { q: true },
  dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2')
},{
  title: '开Q重击蒸发',
  params: { q: true },
  dmg: ({ talent }, dmg) => dmg(talent.a['重击伤害'], 'a2', 'vaporize')
},{
  title: '开Q「水中幻愿」持续伤害',
  params: { q: true },
  dmg: ({ talent }, dmg) => dmg(talent.e['持续伤害'], 'e')
},{
  title: '「星命定轨」泡影破裂伤害',
  params: { q: true },
  dmg: ({ talent }, dmg) => dmg(talent.q['泡影破裂伤害'], 'q')
}]
  
export const defParams = { Hexenzirkel: true } // 魔女会成员
export const defDmgIdx = 3
export const mainAttr = 'atk,cpct,cdmg,recharge'

export const buffs = [{
  ...TeamBuff,
  check: ({ params }) => params.q === true,
  title: '莫娜元素爆发：开Q获得[dmg]%伤害加成',
  data: {
    dmg: ({ talent }) => talent.q['伤害加成']
  }
}, {
  title: '莫娜天赋：基于元素充能效率获得水元素伤害[dmg]%',
  sort: 4,
  data: {
    dmg: ({ calc, attr }) => calc(attr.recharge) * 0.2
  }
}, {
  title: '莫娜1命：命中星异状态下的敌人水元素相关反应效果提升15%',
  cons: 1,
  data: {
    vaporize: ({ params }) => params.q ? 15 : 0
  }
}, {
  title: '莫娜2命：莫娜的重击命中敌人时，还会使队伍中附近的所有角色的元素精通提升80点',
  cons: 2,
  data: {
    mastery: 80
  }
}, {
  title: '莫娜4命：攻击处于星异状态下的敌人时暴击率提升15%，暴击伤害提升15%',
  cons: 4,
  data: {
    cpct: ({ params }) => params.q ? 15 : 0,
    cdmg: ({ params }) => params.q ? 15 : 0,
  }
}, {
  title: '莫娜6命：虚实流动状态后（或命中星异敌人）满Buff提升重击180%伤害',
  cons: 6,
  data: {
    a2Dmg: 180
  }
}, {
  title: '莫娜6命：对处于星异状态下的敌人，莫娜的重击将会造成原本200%的伤害',
  cons: 6,
  data: {
    a2Multi: 200
  }
}, 'vaporize']
  