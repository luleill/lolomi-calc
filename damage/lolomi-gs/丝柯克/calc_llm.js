import { TeamBuff, LIMITED_PLUS } from '../teambuffs.js'
import { teamConfig, withStdTeam } from '../util.js'
import { Config } from '#lolomi'

const mainCharName = '丝柯克'

const team = ['沃雅妮莎', '爱可菲', '芙宁娜']
const artifact_normal = ['千岩']

const team_A = ['申鹤', '爱可菲', '沃雅妮莎']
const artifact_A = ['千岩']

const team_B = ['申鹤', '爱可菲', '芙宁娜']
const artifact_B = ['千岩']

const config = Config.getConfig('user', 'config');
const applyStandardTeam = withStdTeam(mainCharName, team, artifact_normal, config, {mie: true, cryo_two: true})

// 「极恶技·灭」总伤 - 长E开Q爆发
const mieTotalDmg = (ds, dmg) => {
  const { talent, calc, attr, cons, params = {} } = ds
  const limited = ['Escoffier', 'ShenHe', 'Vodyanitsa'].map(name => {
    const source = LIMITED_PLUS[name]
    return {
      plus: source.plus({ ...ds, params, element: '冰' }),
      remain: typeof source.limit === 'function' ? source.limit({ ...ds, params }) : source.limit
    }
  }).filter(source => source.plus > 0)
  const variants = new Map()
  const total = { dmg: 0, avg: 0 }
  const addHit = (pct, slot, basic = false) => {
    let over = 0
    for (const source of limited) {
      if (source.remain > 0) source.remain--
      else over += source.plus
    }
    const key = `${slot}:${over}`
    if (!variants.has(key)) {
      variants.set(key, over ? dmg.withAttr({
        [slot]: { plus: (attr[slot]?.plus || 0) - over }
      }) : dmg)
    }
    const hitDmg = variants.get(key)
    const ret = basic ? hitDmg.basic(calc(attr.atk) * pct / 100, slot) : hitDmg(pct, slot)
    total.dmg += ret.dmg
    total.avg += ret.avg
  }

  if (cons >= 1) {
    for (let i = 0; i < 3; i++) addHit(500, 'a2', true)
  }
  if (cons >= 6) {
    for (let i = 0; i < 3; i++) addHit(750, 'q', true)
  }
  for (let i = 0; i < 5; i++) addHit(talent.q['斩击伤害2'][0], 'q')
  addHit(talent.q['斩击最终段伤害'], 'q')
  return total
}

// 「极恶技·尽」- 站场普攻
// 默认手法：EQ吸3枚裂隙 + 3轮5A + 重击吸2枚裂隙收尾，大约耗时11秒
const jinTotalDmg = (ds, dmg) => {
  const { talent, attr, calc, cons, params = {} } = ds
  const hits = []
  const addHit = (frame, pct, slot) => hits.push({ frame, pct, slot })
  if (cons >= 1) {
    for (let i = 0; i < 3; i++) addHit(-1, 500, 'a2')
  }

  // 模拟5A动画帧数和耗时，决定队友限次buff生效时序
  const normalFrames = [[12, [12]], [21, [11]], [31, [11, 23]], [33, [11, 27]], [51, [25]]]
  let frame = 0
  let c6Remain = cons >= 6 ? 3 : 0
  for (let round = 0; round < 3; round++) {
    for (const [index, stage] of [...'一二三四五'].entries()) {
      const key = `${stage}段伤害`
      const [duration, delays] = normalFrames[index]
      const values = talent.e[`${key}2`]
      delays.forEach((delay, i) => addHit(frame + delay,
        Array.isArray(values) ? values[i] : talent.e[key] / delays.length, 'a'))
      if ((index === 2 || index === 4) && c6Remain > 0) {
        c6Remain--
        for (let i = 1; i <= 3; i++) addHit(frame + delays[0] + i * 3, 180, 'a')
      }
      frame += duration
    }
  }
  if (cons >= 1) {
    for (let i = 0; i < 2; i++) addHit(frame, 500, 'a2')
  }
  const [chargedPct, chargedHits] = talent.e['重击伤害2'] || [talent.e['重击伤害'] / 3, 3]
  for (let i = 0; i < chargedHits; i++) addHit(frame + 12 + i * 6, chargedPct, 'a2')
  hits.sort((a, b) => a.frame - b.frame)

  // 队友buff生效次数
  const limited = ['Escoffier', 'ShenHe', 'Vodyanitsa'].map(name => {
    const source = LIMITED_PLUS[name]
    return {
      plus: source.plus({ ...ds, params, element: '冰' }),
      remain: typeof source.limit === 'function' ? source.limit(ds) : source.limit
    }
  }).filter(source => source.plus > 0)
  const jinBonus = params.jin === true ? talent.q['汲取0/1/2/3枚虚境裂隙伤害提升'][3] : 0
  // 「凋尽」普攻增伤生效10次
  let jinRemain = 10
  let lastJinFrame = -Infinity
  const variants = new Map()
  const total = { dmg: 0, avg: 0 }
  for (const hit of hits) {
    let over = 0
    for (const source of limited) {
      if (source.remain > 0) source.remain--
      else over += source.plus
    }
    const jinCovered = hit.slot === 'a' && jinRemain > 0 && hit.frame - lastJinFrame >= 6
    if (jinCovered) {
      jinRemain--
      lastJinFrame = hit.frame
    }
    const removeJin = hit.slot === 'a' && !jinCovered ? jinBonus : 0
    const key = `${hit.slot}:${over}:${removeJin}`
    if (!variants.has(key)) {
      const patch = {}
      if (over || removeJin) {
        patch[hit.slot] = {
          plus: (attr[hit.slot]?.plus || 0) - over,
          dmg: (attr[hit.slot]?.dmg || 0) - removeJin
        }
      }
      variants.set(key, Object.keys(patch).length ? dmg.withAttr(patch) : dmg)
    }
    const ret = variants.get(key).basic(calc(attr.atk) * hit.pct / 100, hit.slot)
    total.dmg += ret.dmg
    total.avg += ret.avg
  }
  return total
}

export const details = applyStandardTeam([
  {
    title: '触发满特效后攻击力',
    params: { jin : true },
    dmg: ({ attr, calc }) => ({ avg: Math.min(calc(attr.atk))})
  }, {
    params: { jin : true },
    title: `「七相一闪」普攻五段总伤`,
    dmg: ({ talent, calc, attr, cons }, dmg) => {
      const acounts = '一二三四五'.split('');
      const aDamage = acounts.reduce((sum, num) => sum + calc(attr.atk) * talent.e[`${num}段伤害`] / 100, 0);
      const totala = dmg.basic(aDamage, 'a');
      const c6Extra = cons >= 6 ? dmg.basic(calc(attr.atk) * 180 * 3 * 3 / 100, 'q') : { dmg: 0, avg: 0 };
      const c1Extra = cons >= 1 ? dmg.basic(calc(attr.atk) * 500 * 3 / 100, 'a2') : { dmg: 0, avg: 0 };
      return {
        dmg: totala.dmg + c6Extra.dmg + c1Extra.dmg,
        avg: totala.avg + c6Extra.avg + c1Extra.avg
      };
    }
  }, {
    params: { jin : true },
    title: `「七相一闪」重击伤害`,
    dmg: ({ talent, calc, attr }, { basic }) => basic(calc(attr.atk) * talent.e[`重击伤害`] / 100, 'a2')
  }, {
    params: { mie : true },
    title: `「极恶技·灭」总伤`,
    dmg: mieTotalDmg
  }, {
    params: { jin : true },
    title: `「极恶技·尽」11秒站场总伤`,
    dmg: jinTotalDmg
  }, {
    title: '1命晶刃额外伤害',
    cons: 1,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 500 / 100, 'a2')
  }, {
    params: { jin : true },
    title: '6命「七相一闪」额外协同伤害',
    cons: 6,
    dmg: ({ calc, attr }, dmg) => dmg.basic(calc(attr.atk) * 180 * 3 / 100, 'a')
  }, {
    params: { mie : true },
    title: '6命「极恶技·灭」额外协同伤害',
    cons: 6,
    dmg: ({ calc, attr }, { basic }) => basic(calc(attr.atk) * 750 * 3 / 100, 'q')
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title}「极恶技·尽」11秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_A, artifact_A).params,
      cryo_two: true, jin: true
    }),
    dmg: jinTotalDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_A, artifact_A, mainCharName).title}「极恶技·灭」总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_A, artifact_A).params,
      cryo_two: true, mie: true 
    }),
    dmg: mieTotalDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「极恶技·尽」11秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true, jin: true
    }),
    dmg: jinTotalDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team_B, artifact_B, mainCharName).title}「极恶技·灭」总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team_B, artifact_B).params,
      cryo_two: true, mie: true 
    }),
    dmg: mieTotalDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「极恶技·尽」11秒总伤`,
    params: ({ cons }) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true, jin: true
    }),
    dmg: jinTotalDmg
  }, {
    title: ({ cons }) => `${teamConfig(cons, team, artifact_normal, mainCharName).title}「极恶技·灭」总伤`,
    params: ({cons}) => ({
      ...teamConfig(cons, team, artifact_normal).params,
      cryo_two: true, mie: true 
    }),
    dmg: mieTotalDmg
  }, {
    title: '当前圣遗物套装',
    dmg: ({ artis }) => ({ avg: artis, type: 'text' })
  }
  ])

export const defDmgIdx = 3
export const consDmgKey = '「极恶技·灭」总伤'
export const mainAttr = 'atk,cpct,cdmg'

export const buffs = [
  ...TeamBuff,
  {
    // 天赋需要三个队友分别触发，默认有挂件队友触发天赋叠满层，不叠层纯单人伤害会差一大截
    title: '天赋「万流归寂」：三层死河渡断使七相一闪模式下的普通攻击造成原本170%的伤害，极恶技·灭造成原本160%的伤害',
    data: {
      aMulti: 70,
      qMulti: 60
    }
  }, {
    check: ({ params }) => params.mie === true,
    title: '「极恶技·灭」：每点蛇之狡谋使元素爆发造成的伤害提升[qPct]%',
    data: {
      qPct: ({ talent, cons }) => {
        return talent.q['蛇之狡谋加成'] * (cons > 1 ? 22 : 12)
      }
    }
  }, {
    check: ({ params }) => params.jin === true,
    title: '「极恶技·尽」：汲取3枚虚境裂隙时，使本次普通攻击造成的伤害提高[aDmg]%',
    data: {
      aDmg: ({ talent }) => talent.q['汲取0/1/2/3枚虚境裂隙伤害提升'][3]
    }
  }, {
    title: '1命「湮远」：每汲取一枚虚境裂隙，就造成500%攻击力视为重击的冰元素伤害',
    cons: 1
  }, {
    check: ({ params }) => params.jin === true,
    title: '2命「坠渊」：释放「极恶技·尽」后攻击力提升70%',
    cons: 2,
    data: {
      atkPct: 70
    }
  }, {
    title: '4命「流断」：三层死河渡断攻击力提升[atkPct]%',
    cons: 4,
    data: {
      atkPct: 40
    }
  }, {
    title: '6命「至源」：「极恶技·灭」造成至多3次750%攻击力视为元素爆发的冰元素伤害,「极恶技·尽」第三段攻击或第五段攻击命中敌人时，造成3次180%攻击力视为普通攻击的冰元素伤害',
    cons: 6
  }
]

    