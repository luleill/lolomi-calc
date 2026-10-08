import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '基尼奇'

const team = ['伊安珊', '杜林', '尼可']
const artifact_normal = ['天美']

const config = Config.getConfig('user', 'config')
const teamParams = { pyro_two: true }
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, teamParams)

/**
 * @param {*} stacks  猎人心得层数，默认1层
 * @param {*} isFirst  是否首炮
 * @param {*} bounce 是否计算六命弹跳
 * @param {*} over  本次要扣掉的失效队友加算buff，默认0
 */
const cannonHit = (ds, dmg, stacks, isFirst, bounce = false, over = 0) => {
  const { talent, cons, attr, calc } = ds
  // 二命只有首炮增伤
  const dynamic = { dynamicCdmg: cons >= 1 ? 100 : 0, dynamicDmg: cons >= 2 && isFirst ? 100 : 0 }
  // 猎人心得使用后层数清零
  const flat = calc(attr.atk) * 3.2 * Math.max(0, Math.min(2, stacks)) - over
  return dmg.dynamic(bounce ? 700 : talent.e['迴猎贯鳞炮伤害'], 'e,nightsoul', dynamic, false, flat)
}

const cannonDmg = (ds, dmg) => {
  const stacks = ds.params?.hunter_stacks ?? 1
  // 首炮直伤
  const main = cannonHit(ds, dmg, stacks, true)
  if (ds.cons < 6) return main
  // 六命弹跳
  const bounce = cannonHit(ds, dmg, stacks, true, true)
  return { dmg: main.dmg + bounce.dmg, avg: main.avg + bounce.avg }
}

// E持续10秒，开Q延长1.7秒；站场约12秒
// 默认木桩自挂火，开E，A一下打出环绕射击触发天赋再开Q，Q动画结束夜魂回满即可开首炮
/**
 * 可调参数
 * @param {*} cannon_times 迴猎贯鳞炮次数，默认4炮，运气好可以5炮，我自己木桩测试大部分情况只能打出4炮
 *                         据说有手法可以稳定5炮，首炮死角区方向可以通过镜头控制
 * @param {*} cannon_timing 贯鳞炮命中时刻区间，默认在4.5～12秒均匀分布
 * @param {*} circum_times  环绕射击次数，默认7次，每次两段伤害
 * @param {*} q_breath      龙息次数，站场时间内默认4次
 * @param {*} hunter_stacks 猎人心得层数，默认1层
 * @param {*} hunter_stacks_seq 猎人心得层数序列，队伍伤害默认首炮和第三炮吃到猎人心得
 */
const rotationDmg = (ds, dmg) => {
  const { talent, cons, params = {} } = ds
  const cannonTimes = Math.max(0, Math.floor(params.cannon_times ?? 4))  // 迴猎贯鳞炮次数
  const circumTimes = Math.max(0, Math.floor(params.circum_times ?? Math.max(0, cannonTimes * 2 - 1)))
  const qBreath = Math.max(0, Math.min(4, Math.floor(params.q_breath ?? 4)))
  const stacks = params.hunter_stacks_seq ?? [params.hunter_stacks ?? 1, 0, 1, 0]
  const cannonTiming = Array.from({ length: cannonTimes }, (_, i) =>
    params.cannon_timing?.[i] ?? (cannonTimes === 1 ? 4.5 : 4.5 + 7.5 * i / (cannonTimes - 1)))
  // Q在3秒时开始释放
  const hits = [{ time: 3, type: 'q', pct: talent.q['技能伤害'] }]
  // Q的持续龙息伤害从4.5秒开始
  for (let i = 0; i < qBreath; i++) {
    hits.push({ time: 4.5 + i * 2.5, type: 'q', pct: talent.q['龙息伤害'] })
  }
  for (let i = 0; i < cannonTimes; i++) {
    const time = cannonTiming[i]
    hits.push({ time, type: 'cannon', index: i })
    // 6命每炮附带一次弹跳，按延迟0.8秒命中，继承同一炮的心得与首炮状态
    if (cons >= 6) hits.push({ time: time + 0.8, type: 'bounce', index: i })
  }
  // 每次环绕射击两段命中，消耗2次队友buff
  for (let i = 0; i < circumTimes; i++) {
    const group = i === 0 || cannonTimes <= 1 ? 0
      : 1 + Math.floor((i - 1) * (cannonTimes - 1) / (circumTimes - 1))
    const end = cannonTimes <= 1 ? circumTimes : group === 0 ? 1
      : 1 + Math.ceil(group * (circumTimes - 1) / (cannonTimes - 1))
    const before = group === 0 ? Math.min(3, cannonTiming[0] ?? 4.5) : cannonTiming[group]
    const time = before - (end - i) * 0.7
    const pct = talent.e['环绕射击伤害2'][0]
    hits.push({ time, type: 'e', pct }, { time: time + 0.13, type: 'e', pct })
  }
  hits.sort((a, b) => a.time - b.time)

  // 尼可和杜林限次buff，按伤害时序生效对应段数伤害，buff消耗完后移除对应加算buff
  const limited = [LIMITED_PLUS.Nicole, LIMITED_PLUS.Durin].map(source => ({
    plus: source.plus(ds),
    remain: typeof source.limit === 'function' ? source.limit(ds) : source.limit
  }))
  return hits.reduce((total, hit) => {
    let over = 0
    for (const source of limited) {
      if (!source.plus) continue
      const covered = Math.min(1, Math.max(0, source.remain))
      over += source.plus * (1 - covered)
      source.remain -= covered
    }
    const ret = hit.type === 'cannon' || hit.type === 'bounce'
      ? cannonHit(ds, dmg, stacks[hit.index] ?? 0, hit.index === 0, hit.type === 'bounce', over)
      : dmg.dynamic(hit.pct, `${hit.type},nightsoul`, {}, false, -over)
    return { dmg: total.dmg + ret.dmg, avg: total.avg + ret.avg }
  }, { dmg: 0, avg: 0 })
}

export const details = applyStandardTeam([
  {
    title: '触发特效后攻击力',
    dmg: ({ attr, calc }) => ({ avg: calc(attr.atk) })
  }, {
    title: '「迴猎贯鳞炮」伤害',
    dmg: cannonDmg
  }, {
    title: '「迴猎贯鳞炮」首炮伤害',
    dmg: (ds, dmg) => cannonHit(ds, dmg, ds.params?.hunter_stacks ?? 1, true)
  }, {
    title: '6命首炮额外弹跳伤害',
    cons: 6,
    dmg: (ds, dmg) => cannonHit(ds, dmg, ds.params?.hunter_stacks ?? 1, true, true)
  }, {
    title: '「环绕射击」伤害',
    dmg: ({ talent }, dmg) => {
      const hit = dmg(talent.e['环绕射击伤害2'][0], 'e,nightsoul')
      return { dmg: hit.dmg * 2, avg: hit.avg * 2 }
    }
  }, {
    title: '「向伟大圣龙致意」技能伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['技能伤害'], 'q,nightsoul')
  }, {
    title: '「向伟大圣龙致意」龙息伤害',
    dmg: ({ talent }, dmg) => dmg(talent.q['龙息伤害'], 'q,nightsoul')
  }, {
    title: '站场12秒总伤',
    // 木桩自挂火，默认4炮，单人夜魂迸发间隔18秒，仅首炮消耗1层猎人心得增伤
    params: { cannon_times: 4, hunter_stacks_seq: [1, 0, 0, 0, 0] },
    dmg: rotationDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 「贯鳞炮」伤害`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, ...teamParams }),
    // 队伍单炮仅计算首炮本体，不包含6命弹跳
    dmg: (ds, dmg) => cannonHit(ds, dmg, ds.params?.hunter_stacks ?? 1, true)
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title} 一轮总伤`,
    params: ({ cons }) => ({ ...teamConfig(cons, team, artifact_normal).params, ...teamParams }),
    dmg: rotationDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
])

export const defDmgIdx = 1
export const consDmgKey = '站场12秒总伤'
export const defParams = { Nightsoul: true }
export const mainAttr = 'atk,cpct,cdmg,dmg'

export const buffs = [
  ...TeamBuff,
  {
    title: '天赋「焰灵的契约」：每消耗1层「猎人心得」使本次迴猎贯鳞炮基于攻击力的320%提高造成的伤害',
  }, {
    title: '1命「七鹦之喙」：迴猎贯鳞炮的暴击伤害提升100%',
    cons: 1,
  }, {
    title: '2命「星虎之掌」：降低敌人草元素抗性[kx]%，首次迴猎贯鳞炮的伤害提升100%',
    cons: 2,
    data: {
      kx: 30
    }
  }, {
    title: '4命「蜂鸟之羽」：元素爆发造成的伤害提升[qDmg]%',
    cons: 4,
    data: {
      qDmg: 70
    }
  }, {
    title: '6命「瑞兽之形」：迴猎贯鳞炮额外造成攻击力700%的弹跳伤害',
    cons: 6,
  }
]
