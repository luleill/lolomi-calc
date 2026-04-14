import { TeamBuff } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '恰斯卡'

const team = ['茜特菈莉', '芙宁娜', '班尼特']
const artifact_normal = ['烬城', '千岩', '宗室']

const team_B = ['茜特菈莉', '希诺宁', '班尼特']
const artifact_B = ['烬城', '千岩', '宗室']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config,{HuanYing: true, cons_6 : true})

const AIM_BULLET_COUNT = 6
/**
 * 重击染色弹数量计算
 * 1 2 3 4 5 6（重击子弹发射顺序倒序，6到1）
 * 染色规则：
 * - 第1枚固定风弹，带希诺宁和另外两种元素队友第四枚固定风弹
 * - 两个后台元素第5和第6枚必定染色（基础2发）
 * - 3元素队伍天赋第3枚必定转化（+1发）
 * - 1命：使第2枚转化（+1发）
 * 
 * 预估结果：
 * - 0命3元素：4发染色 + 2发风弹
 * - 1命3元素：5发染色 + 1发风弹
 * - 0命2元素（希诺宁队）：3发染色 + 3发风弹
 * - 1命2元素（希诺宁队）：4发染色 + 2发风弹
 * 
 * @param {number} cons - 命座
 * @param {number} elementCount - 后台火/水/冰/雷元素角色数量
 * @returns {number} 染色弹数量
 */
const getCount_E = (cons, elementCount) => {
  let spiritCount = 2
  // 3元素队伍
  if (elementCount >= 3) {
    spiritCount += 2
  }
  // 2元素队伍
  else if (elementCount >= 2) {
    spiritCount += 1
  }
  // 1命转化
  if (cons >= 1 && elementCount >= 1) {
    spiritCount += 1
  }
  return Math.min(AIM_BULLET_COUNT - 1, spiritCount)
}
// 焕光追影弹伤害
const spiritShot = ({ talent, dmg, reaction = 'scene' }) => {
  return dmg(talent.e['焕光追影弹伤害'], 'a2,nightsoul', reaction)
}
// 普通风元素追影弹伤害
const shellShot = ({ talent, dmg }) => {
  return dmg(talent.e['追影弹伤害'], 'a2,nightsoul')
}
// 2命追加伤害
const extra_c2 = ({ cons, spiritCount, attr, calc, basic }) => {
  if (cons < 2 || spiritCount <= 0 || typeof basic !== 'function') {
    return { dmg: 0, avg: 0 }
  }
  return basic(calc(attr.atk) * 4, 'a2,nightsoul', 'scene')
}
// 4命追加伤害
const extra_c4 = ({ cons, overflowCount, attr, calc, basic }) => {
  if (cons < 4 || overflowCount <= 0 || typeof basic !== 'function') {
    return { dmg: 0, avg: 0 }
  }
  return basic(calc(attr.atk) * 4, 'a2,nightsoul', 'scene')
}
/**
 * 元素爆发染色弹数量计算
 * 1 2 3 4 5 6（子弹发射顺序倒序）
 * 染色规则：
 * - 每个元素角色直接对应转化2发染色弹
 * - 带希诺宁的队伍最后两枚就是风属性子弹
 */
const getCount_Q = (elementCount) => {
  return Math.min(6, elementCount * 2)
}
const resolveDmg = (calcApi) => (typeof calcApi === 'function' ? calcApi : calcApi?.dmg)
const resolveBasic = (calcApi) => (typeof calcApi === 'object' ? calcApi?.basic : undefined)

/**
 * 计算单轮重击总伤害
 * @param {number} spiritCount - 染色弹数量
 * @param {number} elementCount - 队伍中可转化元素数量（判断希诺宁队）
 * @param {boolean} withCons6 - 是否含6命加成
 * - 6命效果应该只有在免蓄力的那次重击才有120爆伤加成
 * - 染色完全随机，三色队伍假定一次重击触发2次元素反应
 * - 融化(火×冰)2.0系数、蒸发(火×水)1.5系数
 * 
 * 希诺宁队特殊逻辑：
 * - 0命2元素只有3颗染色弹 → 假定只触发1次2.0系数的反应
 * - 1命2元素4颗染色弹 → 1融化(火×冰)2.0系数、1蒸发(火×水)1.5系数
 * 
 * 3元素队伍逻辑：
 * - 0命4颗染色弹 → 1蒸发+1融化+2染色弹
 * - 1命5颗染色弹 → 1蒸发+1融化+3染色弹
 */
const calcRound = ({ talent, attr, cons, calc, dmg, basic, spiritCount, elementCount = 3, withCons6 = true }) => {
  const shellCount = AIM_BULLET_COUNT - spiritCount
  const shell = shellShot({ talent, dmg })
  const spiritNormal = spiritShot({ talent, dmg })
  const spiritVaporize = spiritShot({ talent, dmg, reaction: 'scene,vaporize' })
  const spiritMelt = spiritShot({ talent, dmg, reaction: 'scene,melt' })
  let vaporizeCount = 0, meltCount = 0, normalCount = spiritCount
  
  // 0命带希诺宁特殊处理：只触发1次融化
  if (elementCount === 2 && cons < 1 && spiritCount === 3) {
    meltCount = 1
    normalCount = 2
  } else {
    // 常规水火冰队伍：1蒸发+1融化
    if (spiritCount >= 1) {
      vaporizeCount = 1
      normalCount--
    }
    if (spiritCount >= 2) {
      meltCount = 1
      normalCount--
    }
  }

  const extra = extra_c2({ cons, spiritCount, attr, calc, basic })
  // miao框架风系融化伤害需加个4/3补偿
  const spiritMeltFixed = { dmg: spiritMelt.dmg * 4 / 3, avg: spiritMelt.avg * 4 / 3 }
  
  let round = {
    dmg: shell.dmg * shellCount 
       + spiritNormal.dmg * normalCount 
       + spiritVaporize.dmg * vaporizeCount 
       + spiritMeltFixed.dmg * meltCount 
       + extra.dmg,
    avg: shell.avg * shellCount 
       + spiritNormal.avg * normalCount 
       + spiritVaporize.avg * vaporizeCount 
       + spiritMeltFixed.avg * meltCount 
       + extra.avg
  }
  // 首次重击不吃6命加成
  if (cons >= 6 && !withCons6) {
    const cpct = Math.max(0, Math.min(1, (attr.cpct.base + attr.cpct.plus) / 100 + (attr.a2?.cpct || 0) / 100))
    const cdmg = Math.max(0, (attr.cdmg.base + attr.cdmg.plus) / 100 + (attr.a2?.cdmg || 0) / 100)
    const extraCdmg = 1.2
    const dmgScale = (1 + cdmg) / (1 + cdmg + extraCdmg)
    const avgScale = cpct > 0 ? (1 + cpct * cdmg) / (1 + cpct * (cdmg + extraCdmg)) : 1
    round = { dmg: round.dmg * dmgScale, avg: round.avg * avgScale }
  }
  return round
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk)) })
  }, {
    title: '「追影弹」伤害',
    params: { cons_6: true },
    dmg: ({ talent }, calcApi) => {
      const dmg = resolveDmg(calcApi)
      return shellShot({ talent, dmg })
    }
  }, {
    title: '「焕光追影弹」伤害',
    params: { HuanYing: true, cons_6: true },
    dmg: ({ talent }, calcApi) => {
      const dmg = resolveDmg(calcApi)
      return spiritShot({ talent, dmg })
    }
  }, {
    title: '「焕光追影弹」火蒸伤害',
    params: { HuanYing: true, cons_6: true },
    dmg: ({ talent }, calcApi) => {
      const dmg = resolveDmg(calcApi)
      return spiritShot({ talent, dmg, reaction: 'scene,vaporize' })
    }
  }, {
    title: '「焕光追影弹」火融伤害',
    params: { HuanYing: true, cons_6: true },
    dmg: ({ talent }, calcApi) => {
      const dmg = resolveDmg(calcApi)
      const base = spiritShot({ talent, dmg, reaction: 'scene,melt' })
      return { dmg: base.dmg * 4 / 3, avg: base.avg * 4 / 3 }
    }
  }, {
    title: '「溢光索魂弹」伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['溢光索魂弹伤害'], 'q,nightsoul', 'scene')
  }, {
    title: '伪单人元素爆发总伤',
    // 水火冰挂件队友：6发索魂弹全部转化为溢光索魂弹
    // 首次命中风伤，6发染色弹 + 1次4命额外伤害
    // 不考虑天赋触发的一次夜魂迸发伤害
    dmg: ({ talent, attr, cons, calc }, calcApi) => {
      const dmg = resolveDmg(calcApi)
      const basic = resolveBasic(calcApi)
      const overflowCount = getCount_Q(3)
      const soulCount = 6 - overflowCount
      const fissure = dmg(talent.q['裂风索魂弹伤害'], 'q,nightsoul')
      const soul = dmg(talent.q['索魂弹伤害'], 'q,nightsoul')
      const overflowNormal = dmg(talent.q['溢光索魂弹伤害'], 'q,nightsoul', 'scene')
      const overflowVaporize = dmg(talent.q['溢光索魂弹伤害'], 'q,nightsoul', 'scene,vaporize')
      const overflowMelt = dmg(talent.q['溢光索魂弹伤害'], 'q,nightsoul', 'scene,melt')
      let vaporizeCount = 0, meltCount = 0, normalCount = overflowCount
      if (overflowCount >= 1) {
        vaporizeCount = 1
        normalCount--
      }
      if (overflowCount >= 2) {
        meltCount = 1
        normalCount--
      }

      const c4Extra = extra_c4({ cons, overflowCount, attr, calc, basic })
      
      return {
        dmg: fissure.dmg 
           + soul.dmg * soulCount 
           + overflowNormal.dmg * normalCount 
           + overflowVaporize.dmg * vaporizeCount 
           + overflowMelt.dmg * meltCount 
           + c4Extra.dmg,
        avg: fissure.avg 
           + soul.avg * soulCount 
           + overflowNormal.avg * normalCount 
           + overflowVaporize.avg * vaporizeCount 
           + overflowMelt.avg * meltCount 
           + c4Extra.avg
      }
    }
  }, {
    title: '伪单人重击伤害',
    // 后台水火冰队友
    // 6命算上了免蓄力的一次，等于打了两轮重击
    params: { HuanYing: true, cons_6: true },
    dmg: ({ talent, attr, cons, calc }, calcApi) => {
      const dmg   = resolveDmg(calcApi)
      const basic = resolveBasic(calcApi)
      const spiritCount = getCount_E(cons, 3)
      const round1 = calcRound({ talent, attr, cons, calc, dmg, basic, spiritCount, elementCount: 3, withCons6: false })
      if (cons < 6) {
        return round1
      }
      const round2 = calcRound({ talent, attr, cons, calc, dmg, basic, spiritCount, elementCount: 3, withCons6: true })
      return {
        dmg: round1.dmg + round2.dmg,
        avg: round1.avg + round2.avg
      }
    }
  }, {
    // 恰茜希班，组队只计算一次伤害，6命算免蓄力的那一次重击伤害
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title} 重击一轮伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      HuanYing: true, cons_6 : true
    }),
    dmg: ({ talent, attr, cons, calc }, calcApi) => {
      const dmg   = resolveDmg(calcApi)
      const basic = resolveBasic(calcApi)
      const spiritCount = getCount_E(cons, 2)
      return calcRound({ talent, attr, cons, calc, dmg, basic, spiritCount, elementCount: 2 })
    }
  }, {
    // 恰茜芙班
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 重击一轮伤害`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      HuanYing: true, cons_6 : true
    }),
    dmg: ({ talent, attr, cons, calc }, calcApi) => {
      const dmg   = resolveDmg(calcApi)
      const basic = resolveBasic(calcApi)
      const spiritCount = getCount_E(cons, 3)
      return calcRound({ talent, attr, cons, calc, dmg, basic, spiritCount, elementCount: 3 })
    }
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const mainAttr = 'atk,mastery,cpct,cdmg'
export const defParams = { Nightsoul: true }
export const defDmgIdx = 7
export const consDmgKey = '伪单人重击伤害'

export const buffs = [
    ...TeamBuff,
  {
    check: ({ params }) => params.HuanYing === true,
    title: '天赋「子弹的戏法」：3层「焕影之灵」使焕光追影弹伤害提升[a2Dmg]%',
    data: { 
      a2Dmg: 65 
    }
  }, {
    title: '2命「枪口，灼烧的轻烟」：重击额外造成1次攻击力400%的伤害',
    cons: 2,
  }, {
    title: '4命「星火，瞬息的击发」：元素爆发额外造成1次攻击力400%的伤害',
    cons: 4,
  }, {
    check: ({ params }) => params.cons_6 === true,
    title: '6命「相决，斗争的荣光」：免蓄力的重击暴击伤害提升120%',
    cons: 6,
    data: { 
      a2Cdmg: 120 
    }
  }
]
