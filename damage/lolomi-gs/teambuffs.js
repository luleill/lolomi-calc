import { getEngName } from './util.js'

/**
 * 同类型武器被动去重
 * 配置两种情况：
 * 1. 预设队友：{ char, getValue: (params) => number }
 * 2. 主角色自身武器：{ char: '__mainWeapon__', weaponNames, getValue: (ds) => number }
 *    weaponNames: 拥有同类型效果的武器列表
 *    getValue: 主角色的武器精炼效果
 *    主角色武器效果和队友重复时取最高值
 */
const MUTEX_WEAPON_PASSIVES = [
  {
    // 终末嗟叹之诗 / 苍古自由之誓 / 松籁响起之时 - 「千年的大乐章」同类被动：攻击力提升
    passiveName: '千年的大乐章',
    field: 'atkPct',
    providers: [
      {
        // 主角色装备同类型武器时的精炼等级对应值
        char: '__mainWeapon__',
        weaponNames: ['终末嗟叹之诗', '苍古自由之誓', '松籁响起之时'],
        getValue: (ds) => {
          const refineTable = [20, 25, 30, 35, 40]
          const refine = (ds.refine || 0)
          return refineTable[Math.min(refine, 4)]
        }
      },
      // 可能携带对应武器的角色
      ...[
        'Sara',   // 九条裟罗
        'Gorou',  // 五郎
        'Faruzan', // 珐露珊
        'Venti',   // 温迪
        'YeLan',   // 夜兰
        'Kazuha',  // 枫原万叶
        'Jean'     // 琴
      ].map(char => ({
        char,
        getValue: (params) => params[`${char}_best`] ? 40 : params[`${char}_mid`] ? 20 : 0
      }))
    ]
  }
  // 预留，遇到有其他武器冲突的时候再加
]

/**
 * 同名圣遗物去重
 */
const MUTEX_ARTI_PASSIVES = [
  { artiName: '昔日宗室之仪', paramKey: 'zongshi'  }, // 宗室 - 队伍20%攻击力
  { artiName: '烬城勇者绘卷', paramKey: 'jincheng' }, // 烬城 - 全元素伤害40%
  { artiName: '纺月的夜歌', paramKey: 'yege'     }, // 夜歌 - 精通120+月曜10%
  { artiName: '千岩牢固', paramKey: 'qianyan'  }, // 千岩 - 战技命中后加攻20%
  { artiName: '悠古的磐岩', paramKey: 'panyan'   }, // 磐岩 - 结晶元素增伤35%
  { artiName: '翠绿之影', paramKey: 'fengtao'  }, // 风套 - 对应元素减抗40
  { artiName: '深林的记忆', paramKey: 'caotao'   }, // 草套 - 减草抗30%
  { artiName: '天之美赐', paramKey: 'tianmei'  }, // 天之美赐 - 魔导队伍伤害提升40%
  { artiName: '炉火融炼之心', paramKey: 'luhuo' }, // 炉火 - 队伍星烁反应伤害提升50%
  { artiName: '教官', paramKey: 'jiaoguan' }, // 教官 - 触发反应后全队精通120
]

/**
 * 同类型武器被动的实际效果
 * @param {string} passiveName - 武器被动名称
 * @param {string} field - buff增益字段
 * @param {string} charKey - 队友名称
 */
const getMutexPassiveValue = (passiveName, field, charKey, params, ds = null) => {
  const group = MUTEX_WEAPON_PASSIVES.find(g => g.passiveName === passiveName && g.field === field)
  if (!group) return 0
  const allValues = group.providers.map(p => {
    if (p.char === '__mainWeapon__') {
      if (!ds || !ds.weapon) return 0
      const weaponName = ds.weapon.name || (ds.weapon.weaponName)
      if (!p.weaponNames.includes(weaponName)) return 0
      return p.getValue(ds)
    }
    return p.getValue(params)
  })
  const maxValue = Math.max(...allValues)

  const selfProvider = group.providers.find(p => p.char === charKey)
  if (!selfProvider) return 0
  const selfIdx = group.providers.findIndex(p => p.char === charKey)
  const selfValue = allValues[selfIdx]

  if (selfValue === 0) return 0
  if (selfValue < maxValue) return 0

  const firstMaxIdx = allValues.findIndex(v => v === maxValue)
  if (selfIdx !== firstMaxIdx) return 0

  return maxValue
}

/**
 * 队伍同名圣遗物效果去重
 */
const artiEffectActive = (paramKey, params, artis) => {
  if (!params[paramKey]) return false
  const mutex = MUTEX_ARTI_PASSIVES.find(m => m.paramKey === paramKey)
  if (!mutex) return true
  if (artis && artis[mutex.artiName] >= 4) return false
  return true
}

/**
 * 队伍魔导角色计数：队伍凑齐魔导秘仪才生效天之美赐的40增伤效果，否则只吃20增伤
 * 用于主角色非魔导，但带了魔导辅助的情况，例如 玛茜希尼
 */
const HEXEN_TEAMMATES = ['砂糖', '尼可', '杜林', '温迪', '莫娜', '可莉', '菲谢尔', '阿贝多', '雷泽', '法尔伽', '洛恩', '布伦妮'].map(getEngName)
const hexenCount = (params) => (params.Hexenzirkel ? 1 : 0) +
  HEXEN_TEAMMATES.filter(n => params[`${n}_best`] || params[`${n}_mid`] || params[`${n}_low`]).length

/**
 * 队伍水冰角色计数：爱可菲天赋按人数分档减水冰抗
 * 1/2/3/4人 → 5%/10%/15%/55%
 */
const WATER_ICE_TEAMMATES = [
  '茜特菈莉', '爱可菲', '申鹤', '七七', '米卡', '重云', '神里绫华', '迪奥娜', '奥黛塔', '丝柯克', '优菈', '凯亚', '埃洛伊', '夏洛蒂', '桑多涅', '洛恩', '甘雨', '罗莎莉亚', '莱依拉', '莱欧斯利', '菲米尼', '莫娜', '夜兰', '行秋', '芙宁娜', '妮露', '爱诺', '哥伦比娅', '沃雅妮莎', '坎蒂丝', '塔利雅', '希格雯', '玛拉妮', '珊瑚宫心海', '神里绫人', '芭芭拉', '达达利亚', '那维莱特'
].map(getEngName)
const hydroCryoCount = (params, element) => ((element === '水' || element === '冰') ? 1 : 0) +
  WATER_ICE_TEAMMATES.filter(n => params[`${n}_best`] || params[`${n}_mid`] || params[`${n}_low`]).length

/**
 * 纯水草队判断：妮露队伍天赋生效条件
 * 队伍所有角色均为水或草，且至少一名水和一名草
 */
const HYDRO_TEAMMATES = ['莫娜', '夜兰', '行秋', '芙宁娜', '妮露', '爱诺', '哥伦比娅', '沃雅妮莎', '坎蒂丝', '塔利雅', '希格雯', '玛拉妮', '珊瑚宫心海', '神里绫人', '芭芭拉', '达达利亚', '那维莱特'].map(getEngName)
const DENDRO_TEAMMATES = ['纳西妲', '提纳里', '艾尔海森', '柯莱', '瑶瑶', '白术', '卡维', '绮良良', '艾梅莉埃', '基尼奇', '菈乌玛', '奈芙尔'].map(getEngName)
const isPureHydroDendro = (params, element) => {
  if (element !== '水' && element !== '草') return false
  const names = Object.keys(params).filter(k => /_(best|mid|low)$/.test(k)).map(k => k.replace(/_(best|mid|low)$/, ''))
  if (!names.every(n => HYDRO_TEAMMATES.includes(n) || DENDRO_TEAMMATES.includes(n))) return false
  const otherSide = element === '水' ? DENDRO_TEAMMATES : HYDRO_TEAMMATES
  return names.some(n => otherSide.includes(n))
}

/**
 * 辅助角色buff生效次数限制
 * Nicole    尼可4命：8次
 * Durin     杜林1命：基础20次，4命30%几率不消耗，期望约28次
 * Citlali   茜特菈莉1命：基础10次 + 后续触发3次 = 13次
 * Xilonen   希诺宁4命：6次
 * Escoffier 爱可菲2命：5次
 * XianYun   闲云Q「仙力助推」：8次
 * ShenHe    申鹤「冰翎」：满命无限次、非满命7次
 * QiQi      七七6命：4次
 * Linnea    莉奈娅1命：18次
 * Illuga    叶洛亚Q「夜莺之歌」：基础21次 + 额外15次 = 36次
 * Lauma     菈乌玛Q：基础24层，6命机制默认视为无限次全程覆盖
 * Vodyanitsa 沃雅妮莎天赋「十二弦的泪歌」：前台主C生效25次
 */
const LIMITED_PLUS = {
  Nicole: {
    plus: ({ params }) => params.Nicole_best ? 3500 : 0,
    limit: 8
  },
  Durin: {
    plus: ({ params }) => (params.Durin_best || params.Durin_mid) ? 1800 : 0,
    limit: ({ params }) => params.Durin_best ? 28 : 20
  },
  Citlali: {
    plus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
    limit: 13
  },
  Xilonen: {
    plus: ({ params }) => params.Xilonen_best ? 2600 : 0,
    limit: 6
  },
  Escoffier: {
    plus: ({ params, element }) => (params.Escoffier_best && element === '冰') ? 9600 : (params.Escoffier_mid && element === '冰') ? 8400 : 0,
    limit: 5
  },
  XianYun: {
    plus: ({ params }) => (params.XianYun_best || params.XianYun_mid) ? 18000 : params.XianYun_low ? 7000 : 0,
    limit: 8
  },
  ShenHe: {
    plus: ({ params }) => params.ShenHe_best ? 5000 : params.ShenHe_mid ? 3500 : params.ShenHe_low ? 3000 : 0,
    limit: ({ params }) => params.ShenHe_best ? Infinity : 7
  },
  QiQi: {
    plus: ({ params }) => params.QiQi_best ? 18000 : 0,
    limit: 4
  },
  Linnea: {
    plus: ({ params }) => params.Linnea_best ? 10125 : params.Linnea_mid ? 3375 : 0,
    limit: 18
  },
  Illuga: {
    plus: 950,
    fyPlus: 6400,
    limit: 36
  },
  Lauma: {
    plus: ({ params }) => (params.Lauma_best || params.Lauma_mid) ? 9600 : params.Lauma_low ? 4000 : 0,
    limit: ({ params }) => params.Lauma_best ? Infinity : 24
  },
  Vodyanitsa: {
    // 高中配默认6万5血吃满上限，低配默认6万血
    plus: ({ params, element }) => (element === '水' || element === '冰') ? ((params.Vodyanitsa_best || params.Vodyanitsa_mid) ? 3500 : params.Vodyanitsa_low ? 2800 : 0) : 0,
    // 星扩散基础值对风/冰主C星扩散生效，星超导主C星超导反应传 noStarSwirlFy 移除这个buff
    fyPlus: ({ params, element }) => (element === '风' || element === '冰') && !params.noStarSwirlFy ? ((params.Vodyanitsa_best || params.Vodyanitsa_mid) ? 6500 : params.Vodyanitsa_low ? 5200 : 0) : 0,
    limit: 25
  }
}

/**
 * 队友buff动态标题：自动拼接当前实际生效的buff
 */
const BUFF_KEY_LABELS = {
  dmg: '增伤', kx: '减抗', cpct: '暴击提升', cdmg: '暴伤提升',
  atkPct: '加攻', atkPlus: '基础攻击力提升', hpPct: '生命加成', defPct: '防御加成', defPlus: '防御基础值提升',
  mastery: '精通提升', enemyDef: '敌方减防', ignore: '无视防御提升', phy: '物伤加成', shield: '护盾强效提升',
  aPlus: '普攻基础值提升', a2Plus: '重击基础值提升', a3Plus: '下落基础值提升', ePlus: '战技基础值提升', qPlus: '元素爆发基础值提升',
  aDmg: '普攻增伤', a2Dmg: '重击增伤', a3Dmg: '下落增伤', eDmg: '战技增伤', qDmg: '爆发增伤',
  vaporize: '蒸发增伤', melt: '融化增伤', swirl: '扩散增伤', electroCharged: '感电增伤',
  lunarCharged: '月感电增伤', lunarBloom: '月绽放增伤', lunarCrystallize: '月结晶增伤',
  lunarBloomCpct: '月绽放暴击提升', lunarBloomCdmg: '月绽放暴伤提升',
  stellarConduct: '星超导增伤', stellarVortex: '星扩散增伤',
  stellarVortexCdmg: '星扩散暴伤提升',
  elevated: '擢升', fypct: '反应基础增伤', fyplus: '反应基础值提升'
}
const FLAT_KEYS = ['atkPlus', 'defPlus', 'mastery', 'aPlus', 'a2Plus', 'a3Plus', 'ePlus', 'qPlus', 'fyplus']

const makeAutoTitle = (base, data) => (ds) => {
  const vals = {}
  for (const key of Object.keys(data)) {
    let val = data[key]
    if (typeof val === 'function') val = val(ds)
    if (val) vals[key] = val
  }
  const segs = []
  const handled = new Set()
  for (const [keys, label, flat] of [
    [['aPlus', 'a2Plus', 'a3Plus', 'ePlus', 'qPlus'], '全攻击基础值提升', true],
    [['aDmg', 'a2Dmg', 'a3Dmg', 'eDmg', 'qDmg'], '全攻击增伤', false]
  ]) {
    const present = keys.filter(k => vals[k] !== undefined)
    if (present.length === 5 && present.every(k => vals[k] === vals[present[0]])) {
      segs.push(`${label}${vals[present[0]]}${flat ? '' : '%'}`)
      present.forEach(k => handled.add(k))
    }
  }
  for (const key of Object.keys(vals)) {
    if (handled.has(key)) continue
    const label = BUFF_KEY_LABELS[key]
    if (!label) continue
    segs.push(`${label}${vals[key]}${FLAT_KEYS.includes(key) ? '' : '%'}`)
  }
  return segs.length ? `${base}：` + segs.join('，') : base
}

let TeamBuff = [
  // 纳塔地方传奇满层增伤+双药(20暴击20爆伤，属伤药)
  {
    check: ({ params }) => params.legend_max === true,
    title: '纳塔地方传奇900增伤',
    data: {
      dmg: 900 + 15,
      cdmg: 20,
      cpct: 20
    }
  },
  // 队伍增益 - 元素共鸣buff
  {
    check: ({ params }) => params.superconductivity === true,
    title: '元素反应：[超导] 降低受超导影响生物25%的物理抗性',
    data: {
      kx: 25
    }
  },
  {
    check: ({ params }) => params.hydro_two === true,
    title: '元素共鸣：[愈疗之水] 生命值上限提升25%',
    data: {
      hpPct: 25
    }
  },
  {
    check: ({ params }) => params.pyro_two === true,
    title: '元素共鸣：[热诚之火] 攻击力提高25%',
    data: {
      atkPct: 25
    }
  },
  {
    check: ({ params }) => params.geo_two === true,
    title: '元素共鸣：[坚定之岩] 护盾强效提升25%，造成的伤害提升15%，降低敌人20%元素抗性',
    data: {
      shield: 25,
      dmg: 15,
      kx: ({ element }) => element === '岩' ? 20 : 0
    }
  },
  {
    check: ({ params }) => params.dendro_two === true,
    title: '元素共鸣：[蔓生之草] 触发燃烧、原激化、绽放反应后，提升元素精通80点,',
    data: {
      mastery: 80
    }
  },
  {
    check: ({ params }) => params.cryo_two === true,
    title: '元素共鸣：[粉碎之冰] 攻击处于冰元素附着或冻结下的敌人时，暴击率提高15%',
    data: {
      cpct: 15
    }
  },

  // 队友圣遗物增益
  { 
    check: ({ params, artis }) => artiEffectActive('zongshi', params, artis),
    title: '昔日宗室之仪：队伍中所有角色攻击力提升20%',
    data: {
      atkPct: 20
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('jincheng', params, artis),
    title: '烬城勇者绘卷：所有元素伤害加成与物理伤害加成提升40%',
    data: {
      dmg: 40
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('yege', params, artis),
    title: '纺月的夜歌：元素精通提升120,月曜反应造成的伤害提升10%',
    data: {
      mastery: 120,
      lunarCharged: 10,
      lunarBloom: 10,
      lunarCrystallize: 10
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('jiaoguan', params, artis),
    title: '教官：触发元素反应后，队伍中所有角色的元素精通提高120点',
    data: {
      mastery: 120
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('fengtao', params, artis),
    title: '翠绿之影：根据扩散的元素类型，降低受到影响的敌人40%的对应元素抗性',
    data: {
      kx: 40
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('caotao', params, artis),
    title: '深林的记忆：使命中目标的元素抗性降低30%',
    data: {
      kx: 30
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('qianyan', params, artis),
    title: '千岩牢固：元素战技命中敌人后，使队伍中附近的所有角色攻击力提升20%，护盾强效提升30%',
    data: {
      atkPct: 20,
      shield: 30
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('panyan', params, artis),
    title: '悠古的磐岩：获得结晶反应形成的晶片时，队伍中所有角色获得35%对应元素伤害加成',
    data: {
      dmg: 35
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('tianmei', params, artis),
    title: '天之美赐：施放元素战技后附近的所有角色获得[dmg]%元素伤害加成',
    data: {
      dmg: ({ params }) => hexenCount(params) >= 2 ? 40 : 20
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('luhuo', params, artis),
    title: '炉火融炼之心：队伍中附近的所有角色造成的星烁反应伤害提升50%',
    data: {
      stellarConduct: 50,
      stellarVortex: 50,
      starSwirlAnemo: 50,
      starSwirlCryo: 50
    }    
  },

  // 辅助队友增益配
  // 配置说明：
  // - low (低配): 0+0 命座+专武 配置
  // - mid (中配): 2+1 命座+专武 配置
  // - best (高配): 6+5 命座+专武 配置
  // 参数命名：
  // - [角色英文名]_low: 启用低配置参数
  // - [角色英文名]_mid: 启用中配置参数
  // - [角色英文名]_best: 启用高配置参数
  {
    check: ({ params }) => params.KamisatoAyaka_best || params.KamisatoAyaka_mid || params.KamisatoAyaka_low,
    title: '神里绫华',
    // 四命减防30%
    data: {
      enemyDef: ({ params }) => params.KamisatoAyaka_best ? 30 : 0
    }
  },
  {
    check: ({ params }) => params.Jean_best || params.Jean_mid || params.Jean_low,
    title: '琴',
    // 四命减风抗40%
    data: {
      kx: ({ params, element }) => (params.Jean_best && element === '风') ? 40 : 0
    }
  },
  {
    check: ({ params }) => params.Lisa_best || params.Lisa_mid || params.Lisa_low,
    title: '丽莎',
    // 被动减防15%
    data: {
      enemyDef: 15
    }
  },
  {
    check: ({ params }) => params.Venti_best || params.Venti_mid || params.Venti_low,
    title: '温迪',
    // 魔导秘仪 触发扩散反应后该角色增伤50，暂时先限制风属性
    // 2命 减风抗和物抗24，物抗暂时不考虑
    // 4命 站场角色25风伤加成
    // 6命 风抗与对应元素转化抗性降低20
    // 终末 精五加攻40，加精通200，精一加攻20，加精通100
    data: {
      dmg: ({ params, element }) => {
        if (element !== '风') return 0
        return (hexenCount(params) >= 2 ? 50 : 0) + (params.Venti_best ? 25 : 0)
      },
      kx: ({ params, element }) => {
        if (element === '风') {
          if (params.Venti_best) return 44
          if (params.Venti_mid) return 24
          return 0
        }
        if (params.Venti_best && ['火', '水', '雷', '冰'].includes(element)) return 20
        return 0
      },
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Venti', ds.params, ds),
      mastery: ({ params }) => params.Venti_best ? 200 : params.Venti_mid ? 100 : 0
    }
  },
  {
    check: ({ params }) => params.Durin_best || params.Durin_mid || params.Durin_low,
    title: '杜林',
    // 天赋，除水冰元素外，减抗20，魔导秘仪队伍效果提升75%
    // 1命 基础值增伤
    // 2命 增伤50
    // 6命 减防30
    // 专武 精五加攻32，精一加攻16，魔导秘仪效果提升75%
    data: {
      aPlus: LIMITED_PLUS.Durin.plus,
      a2Plus: LIMITED_PLUS.Durin.plus,
      a3Plus: LIMITED_PLUS.Durin.plus,
      ePlus: LIMITED_PLUS.Durin.plus,
      qPlus: LIMITED_PLUS.Durin.plus,
      dmg: ({ params }) => (params.Durin_best || params.Durin_mid) ? 50 : 0,
      enemyDef: ({ params }) => params.Durin_best ? 30 : 0,
      kx: ({ params, element }) => {
        if (element === '水' || element === '冰') return 0
        return hexenCount(params) >= 2 ? 35 : 20
      },
      atkPct: ({ params }) => {
        const base = params.Durin_best ? 32 : params.Durin_mid ? 16 : 0
        return hexenCount(params) >= 2 ? base * 1.75 : base
      }
    }
  },
  {
    check: ({ params }) => params.Klee_best || params.Klee_mid || params.Klee_low,
    title: '可莉',
    // 2命 减防23%
    // 6命 火伤加成10%
    data: {
      enemyDef: ({ params }) => (params.Klee_best || params.Klee_mid) ? 23 : 0,
      dmg: ({ params, element }) => (params.Klee_best && element === '火') ? 10 : 0
    }
  },
  {
    check: ({ params }) => params.Fischl_best || params.Fischl_mid || params.Fischl_low,
    // 天赋魔导秘仪 触发超载，全队加攻，触发感电，全队加精通，默认都触发
    title: '菲谢尔',
    // 天赋：触发超载全队加攻22.5%，触发感电全队精通加90
    // 6命 天赋效果提升100%
    data: {
      atkPct: ({ params }) => hexenCount(params) >= 2 ? 45 : 0,
      mastery: ({ params }) => hexenCount(params) >= 2 ? 180 : 0
    }
  },
  {
    check: ({ params }) => params.Bennett_low || params.Bennett_mid || params.Bennett_best,
    title: '班尼特',
    // 高配风鹰剑 中配原木刀 低配西风剑
    // 6命 单手剑，双手剑，长柄武器获得15%火伤
    data: {
      atkPlus: ({ params }) =>
        params.Bennett_best ? 139 * 865.2 / 100 :
        params.Bennett_mid ? 139 * 756.2 / 100 :
        params.Bennett_low ? 139 * 645.2 / 100 : 0,
      dmg: ({ weaponTypeName, element }) => (['单手剑', '双手剑', '长柄武器'].includes(weaponTypeName) && element === '火') ? 15 : 0
    }
  },
  {
    check: ({ params }) => params.XiangLing_low || params.XiangLing_mid || params.XiangLing_best,
    title: '香菱',
    // 前台主c默认吃到锅巴辣椒加成加攻10
    // 1命 减火抗15
    // 6命 火伤加成15
    data: {
      atkPct: 10,
      dmg: ({ element }) => element === '火' ? 15 : 0,
      kx: ({ element }) => element === '火' ? 15 : 0
    }
  },
  {
    check: ({ params }) => params.Mika_low || params.Mika_mid || params.Mika_best,
    title: '米卡',
    // 6命必须，所有带米卡的物理队伍默认米卡满命
    data: {
      phy: 40,
      cdmg: 60
    }
  },
  {
    check: ({ params }) => params.ChongYun_low || params.ChongYun_mid || params.ChongYun_best,
    title: '重云',
    // 天赋 减冰抗10%
    data: {
      kx: ({ element }) => element === '冰' ? 10 : 0
    }
  },
  {
    check: ({ params }) => params.Furina_low || params.Furina_mid || params.Furina_best,
    title: '芙宁娜',
    // Q增伤 高配124 中配100 低配75
    data: {
      dmg: ({ params }) =>
        params.Furina_best ? 124 :
        params.Furina_mid ? 100 :
        params.Furina_low ? 75 : 0,
      phy: ({ params }) =>
        params.Furina_best ? 124 :
        params.Furina_mid ? 100 :
        params.Furina_low ? 75 : 0
    }
  },
  {
    check: ({ params }) => params.Escoffier_low || params.Escoffier_mid || params.Escoffier_best,
    title: function (ds) {
      const segs = []
      const kx = this.data.kx(ds)
      if (kx) segs.push(`减水冰抗${kx}%`)
      const cdmg = this.data.cdmg(ds)
      if (cdmg) segs.push(`冰伤暴伤提升${cdmg}%`)
      const plus = this.data.aPlus(ds)
      if (plus) segs.push(`冰伤基础值提升${plus}`)
      const atk = this.data.atkPct(ds)
      if (atk) segs.push(`攻击力提升${atk}%`)
      return segs.length ? '爱可菲：' + segs.join('，') : '爱可菲'
    },
    // 天赋 根据队伍水冰元素角色数量减水冰抗 5%/10%/15%/55%
    // 1命 冰伤暴伤60
    // 2命 冰伤基础值增伤
    // 香韵 精五加攻64，精一加攻32
    data: {
      kx: ({ params, element }) => {
        if (element !== '冰' && element !== '水') return 0
        const n = hydroCryoCount(params, element)
        if (n >= 4) return 55
        if (n === 3) return 15
        if (n === 2) return 10
        return 5
      },
      cdmg: ({ params, element }) => ((params.Escoffier_best || params.Escoffier_mid) && element === '冰') ? 60 : 0,
      aPlus: LIMITED_PLUS.Escoffier.plus,
      a2Plus: LIMITED_PLUS.Escoffier.plus,
      a3Plus: LIMITED_PLUS.Escoffier.plus,
      ePlus: LIMITED_PLUS.Escoffier.plus,
      qPlus: LIMITED_PLUS.Escoffier.plus,
      atkPct: ({ params }) => params.Escoffier_best ? 64 : params.Escoffier_mid ? 32 : 0
    }
  },
  {
    check: ({ params }) => params.Sara_low || params.Sara_mid || params.Sara_best,
    title: '九条裟罗',
    // 高配精五终末 中配精一终末 低配西风弓
    // E 基础加攻
    // 6命 雷伤爆伤加60
    // 终末：精五加40，加精通200，精一加攻20，加精通100
    data: {
      atkPlus: ({ params }) =>
        params.Sara_best ? 91.29 * 803 / 100 :
        params.Sara_mid ? 91.29 * 803 / 100 :
        params.Sara_low ? 91.29 * 649 / 100 : 0,
      cdmg: ({ element }) => element === '雷' ? 60 : 0,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Sara', ds.params, ds),
      mastery: ({ params }) => params.Sara_best ? 200 : params.Sara_mid ? 100 : 0
    }
  },
  {
    check: ({ params }) => params.Mona_low || params.Mona_mid || params.Mona_best,
    title: '莫娜',
    // Q 增伤60%
    // 天赋魔导秘仪 消耗一层buff使蒸发反应增伤5%，默认就打一层
    // 1命 扩散/感电/月感电/月结晶/蒸发增伤15
    //     1命效果处于后台的角色增伤效果提升至原本的160%，暂时不考虑这个
    // 2命 莫娜重击命中全队精通加80
    // 4命 全队暴击加15，仅魔导角色爆伤加15
    data: {
      dmg: 60,
      swirl: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      electroCharged: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      lunarCharged: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      lunarCrystallize: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      vaporize: ({ params }) => ((params.Mona_best || params.Mona_mid) ? 15 : 0) + (hexenCount(params) >= 2 ? 5 : 0),
      mastery: ({ params }) => params.Mona_best || params.Mona_mid ? 80 : 0,
      cpct: ({ params }) => params.Mona_best ? 15 : 0,
      cdmg: ({ params }) => params.Mona_best && params.Hexenzirkel ? 15 : 0,
    },
  },
  {
    check: ({ params }) => params.Citlali_low || params.Citlali_mid || params.Citlali_best,
    title: '茜特菈莉',
    // 高配默认1500精通，中配1300精通
    // 天赋 水火减抗20
    // 1命 基础值增伤
    // 2命 精通加250，水火额外减抗20
    // 6命 水火增伤60
    // 专武 精五增伤56，精一增伤28
    data: {
      aPlus: LIMITED_PLUS.Citlali.plus,
      a2Plus: LIMITED_PLUS.Citlali.plus,
      a3Plus: LIMITED_PLUS.Citlali.plus,
      ePlus: LIMITED_PLUS.Citlali.plus,
      qPlus: LIMITED_PLUS.Citlali.plus,
      mastery: ({ params }) => (params.Citlali_best || params.Citlali_mid) ? 250 : 0,
      kx: ({ params, element }) => {
        // 考虑到可以通过附魔，其他元素角色也能打出蒸发和融化反应
        // 不限制水火角色，如果有队伍带茜特菈莉辅助但是不打蒸发和融化，伤害就会异常高很多
        // const isHydroOrPyro = element === '火' || element === '水';
        return (params.Citlali_best || params.Citlali_mid) ? 40 : 20;
      },
      dmg: ({ params }) => {
        return params.Citlali_best ? 116 : params.Citlali_mid ? 28 : 0;
      }
    },
  },
  {
    check: ({ params }) => params.Kazuha_low || params.Kazuha_mid || params.Kazuha_best,
    title: '枫原万叶',
    // 中高配默认千精不开q，增伤40，低配800精通，增伤32
    // 2命 开q精通加200
    // 苍古 精五加攻40增伤32 精一加攻20增伤16
    data: {
      mastery: ({ params }) => (params.Kazuha_best || params.Kazuha_mid) ? 200 : 0,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Kazuha', ds.params, ds),
      dmg: ({ params }) => params.Kazuha_best ? 72 : params.Kazuha_mid ? 56 : 32
    }
  },
  {
    check: ({ params }) => params.Sucrose_low || params.Sucrose_mid || params.Sucrose_best,
    title: '砂糖',
    // 实战充能为主
    // 高配默认800精通，中配默认700，低配默认600
    // 天赋 队友固定加精通50，基于砂糖精通的20%提供精通加成
    // 天赋魔导秘仪 E提供增伤5.71，Q魔导角色额外增伤7.14
    // 6命 20对应元素增伤，魔导角色额外增伤8.57
    //     6命要元素转化才能增伤，暂时默认直接增伤20，不考虑岩草风带砂糖的特殊情况
    data: {
      mastery: ({ params }) => params.Sucrose_best ? 210 : params.Sucrose_mid ? 190 : 170,
      dmg: ({ params }) => {
        let v = 0
        if (hexenCount(params) >= 2) {
          v += 5.71
          if (params.Hexenzirkel) v += 7.14
        }
        v += 20
        if (params.Hexenzirkel) v += 8.57
        return v
      }
    }
  },
  {
    check: ({ params }) => params.ShenHe_low || params.ShenHe_mid || params.ShenHe_best,
    title: '申鹤',  
    // 高配默认5000攻击，中配4000，低配3500 
    // Q 减冰抗和物抗15，物抗不考虑
    // 冰翎对冰元素伤害基础增伤
    // 天赋 开q冰伤加15，冰翎增伤15
    // 2命 冰伤爆伤加15
    data: { 
      aPlus: LIMITED_PLUS.ShenHe.plus,
      a2Plus: LIMITED_PLUS.ShenHe.plus,
      a3Plus: LIMITED_PLUS.ShenHe.plus,
      ePlus: LIMITED_PLUS.ShenHe.plus,
      qPlus: LIMITED_PLUS.ShenHe.plus,
      cdmg: ({ params, element }) => ((params.ShenHe_best || params.ShenHe_mid) && element === '冰') ? 15 : 0,
      kx: ({ element }) => element === '冰' ? 15 : 0,
      dmg: ({ element }) => element === '冰' ? 15 : 0,
      eDmg: 15,
      qDmg: 15,
      aDmg: 15,
      a2Dmg: 15,
      a3Dmg: 15
    } 
  },
  {
    check: ({ params }) => params.XianYun_low || params.XianYun_mid || params.XianYun_best,
    title: '闲云',  
    // 高配6+5 默认4500攻击 中配2+1 4500攻击 低配0+0 3500攻击
    // 天赋 默认吃2层加6暴击
    // 天赋 仙力助推下落伤害基础增伤
    // 2命 仙力助推效果增强
    // 专武 精五下落增伤80，精一增伤28
    data: { 
      a3Plus: LIMITED_PLUS.XianYun.plus,
      cpct: 6,
      a3Dmg: ({ params }) => params.XianYun_best ? 80 : params.XianYun_mid ? 28 : 0
    } 
  },
  {
    check: ({ params }) => params.Nilou_low || params.Nilou_mid || params.Nilou_best,
    title: '妮露',
    // 高配6+5默认8万血，中2+1默认6.5万血，圣显之钥根据血量加全队精通
    // 天赋 纯水草队加100精通
    // 2命 纯水草队减水草抗35
    // 圣显之钥 精五基于生命0.4提供精通，精一基于生命0.2提供精通
    data: {
      mastery: ({ params, element }) => {
        const weaponMastery = params.Nilou_best ? 320 : params.Nilou_mid ? 130 : 0
        return weaponMastery + (isPureHydroDendro(params, element) ? 100 : 0)
      },
      kx: ({ params, element }) => {
        return ((params.Nilou_best || params.Nilou_mid) && isPureHydroDendro(params, element)) ? 35 : 0
      }
    }
  },
  {
    check: ({ params }) => params.Ineffa_low || params.Ineffa_mid || params.Ineffa_best,
    title: '伊涅芙',
    // 天赋 放q后基于攻击力6%提升精通，高配默认3000攻，中2500，低2000
    // 天赋 月感电基础增伤14
    // 1命 月感电增伤50
    // 专武 精五月感电增伤80，精一增伤40
    data: {
      lunarCharged: ({ params }) => {
        if (params.Ineffa_best) return 130;
        if (params.Ineffa_mid) return 90;
        return 0;
      },
      mastery: ({ params }) => params.Ineffa_best ? 180 : params.Ineffa_mid ? 150 : 120,
      fypct: 14
    }
  },
  {
    check: ({ params }) => params.Flins_low || params.Flins_mid || params.Flins_best,
    title: '菲林斯',
    // 天赋 月感电基础增伤14%
    // 2命 满辉减雷抗25
    // 6命 队伍月感电擢升10
    data: {
      fypct: 14,
      kx: ({ params }) => (params.Flins_best || params.Flins_mid) && (params.Moonsign || 0) >= 2 ? 25 : 0,
      elevated: ({ params }) => params.Flins_best ? 10 : 0
    }
  },
  {
    check: ({ params }) => 
      params.Xilonen_low || params.Xilonen_mid || params.Xilonen_best ||
      params.Xilonen_hydro === false || 
      params.Xilonen_pyro === false  || 
      params.Xilonen_cryo === false,
    title: '希诺宁',
    // 高配默认4000防御
    // 天赋E 减抗13级45，10级36
    // 2命 hydro水系加45生命  pyro火系加45攻击 geo岩系50增伤 cryo冰系60爆伤
    // 4命 普攻/重击/下落基础值增伤
    data: {
      kx: ({ params }) => params.Xilonen_best ? 45 : (params.Xilonen_mid || params.Xilonen_low) ? 36 : 0,
      hpPct: ({ params }) => (params.Xilonen_hydro && (params.Xilonen_best || params.Xilonen_mid)) ? 45 : 0,
      atkPct: ({ params }) => (params.Xilonen_pyro && (params.Xilonen_best || params.Xilonen_mid)) ? 45 : 0,
      dmg: ({ params, element }) => (element === '岩' && (params.Xilonen_best || params.Xilonen_mid)) ? 50 : 0,
      cdmg: ({ params }) => (params.Xilonen_cryo && (params.Xilonen_best || params.Xilonen_mid)) ? 60 : 0,
      aPlus: LIMITED_PLUS.Xilonen.plus,
      a2Plus: LIMITED_PLUS.Xilonen.plus,
      a3Plus: LIMITED_PLUS.Xilonen.plus
    }
  },
  {
    check: ({ params }) => params.Mavuika_low || params.Mavuika_mid || params.Mavuika_best,
    title: '玛薇卡',
    // 天赋：放Q增伤40，但会衰减，队友默认吃到20
    // 2命：减防20
    // 4命：放Q增伤不再衰减且额外增伤10
    data: {
      dmg: ({ params }) => params.Mavuika_best ? 50 : 20,
      enemyDef: ({ params }) => (params.Mavuika_best || params.Mavuika_mid) ? 20 : 0,
    }
  },
  {
    check: ({ params }) => params.YeLan_low || params.YeLan_mid || params.YeLan_best,
    title: '夜兰',
    // 高6+5终末 中2+1终末 低1+0西风 
    // 天赋开Q默认吃15%增伤
    // 4命：默认叠2层加生命20%
    // 终末：精五加40，加精通200，精一加攻20，加精通100
    data: {
      dmg: 15,
      hpPct: ({ params }) => params.YeLan_best ? 20 : 0,
      mastery: ({ params }) => params.YeLan_best ? 200 : params.YeLan_mid ? 100 : 0,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'YeLan', ds.params, ds)
    }
  },
  {
    check: ({ params }) => params.XingQiu_low || params.XingQiu_mid || params.XingQiu_best,
    title: '行秋',
    // 2命：减水抗15%
    data: {
      kx: ({ element }) => element === '水' ? 15 : 0,
    }
  },
  {
    check: ({ params }) => params.Nahida_low || params.Nahida_mid || params.Nahida_best,
    title: '纳西妲',
    // Q：基于精通为站场角色加精通
    // 2命：激化使敌人减防30，月绽放暴击加10，爆伤加20
    // 专武：精五全队加精通48，精一40
    data: {
      mastery: ({ params }) => {
        if (params.Nahida_best) return 298;
        if (params.Nahida_mid) return 290;
        if (params.Nahida_low) return 200;
        return 0;
      },
      enemyDef: ({ params, element }) => (params.Nahida_best || params.Nahida_mid) && element === '雷' ? 30 : 0,
      lunarBloomCpct: ({ params }) => (params.Nahida_best || params.Nahida_mid) ? 10 : 0,
      lunarBloomCdmg: ({ params }) => (params.Nahida_best || params.Nahida_mid) ? 20 : 0
    }
  },
  {
    check: ({ params }) => params.Faruzan_low || params.Faruzan_mid || params.Faruzan_best,
    title: '珐露珊',
    // 高配精五终末 中精一终末，低西风
    // Q：风伤增伤38.3，减抗30%
    // 天赋：基于基础攻击力32%提供风伤基础值增伤，蚊子腿提升
    // 6命风伤暴伤加40
    // 终末：精五加40，加精通200，精一加攻20，加精通100
    data: {
      aPlus: ({ element }) => element === '风' ? 258 : 0,
      a2Plus: ({ element }) => element === '风' ? 258 : 0,
      a3Plus: ({ element }) => element === '风' ? 258 : 0,
      ePlus: ({ element }) => element === '风' ? 258 : 0,
      qPlus: ({ element }) => element === '风' ? 258 : 0,
      cdmg: ({ element }) => element === '风' ? 40 : 0,
      kx: ({ element }) => (element === '风') ? 30 : 0,
      dmg: ({ element }) => element === '风' ? 38.3 : 0,
      mastery: ({ params }) => params.Faruzan_best ? 200 : params.Faruzan_mid ? 100 : 0,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Faruzan', ds.params, ds),
    }
  },
  {
    check: ({ params }) => params.Iansan_low || params.Iansan_mid || params.Iansan_best,
    title: '伊安珊',
    // 高精五香韵 中精一香韵 低西风
    // Q：基础攻击力提升810
    // 2命加攻30，6命增伤25
    // 香韵：精五加攻64，精一加攻32
    data: {
      atkPlus: 810,
      atkPct: ({ params }) => params.Iansan_best ? 94 : params.Iansan_mid ? 62 : params.Iansan_low ? 30 : 0,
      dmg: 25,
    }
  },
  {
    check: ({ params }) => params.Chevreuse_low || params.Chevreuse_mid || params.Chevreuse_best,
    title: '夏沃蕾',
    // 高精五香韵 中精一香韵 低西风
    // 天赋：纯雷火队超载后减雷火抗性40
    // 天赋：雷火队友加攻40%，默认4万生命吃满
    // 6命：火雷增伤60
    // 香韵：精五加攻64，精一加攻32
    data: {
      kx: ({ element }) => (element === '火' || element === '雷') ? 40 : 0,
      atkPct: ({ params, element }) => (params.Chevreuse_best ? 64 : params.Chevreuse_mid ? 32 : 0) + ((element === '火' || element === '雷') ? 40 : 0),
      dmg: ({ element }) => (element === '火' || element === '雷') ? 60 : 0,
    }
  },
  {
    check: ({ params }) => params.Aino_low || params.Aino_mid || params.Aino_best,
    title: function (ds) {
      const segs = []
      if (this.data.mastery) segs.push(`精通提升${this.data.mastery}`)
      const lunar = this.data.lunarBloom(ds)
      if (lunar) segs.push(`月曜增伤${lunar}%`)
      return segs.length ? '爱诺：' + segs.join('，') : '爱诺'
    },
    // 1命加80精通
    // 6命满辉月曜增伤35
    data: {
      mastery: 80,
      lunarBloom: ({ params }) => (params.Moonsign || 0) >= 2 ? 35 : 0,
      lunarCharged: ({ params }) => (params.Moonsign || 0) >= 2 ? 35 : 0,
      lunarCrystallize: ({ params }) => (params.Moonsign || 0) >= 2 ? 35 : 0
    }
  },
  {
    check: ({ params }) => params.Lauma_low || params.Lauma_mid || params.Lauma_best,
    title: '菈乌玛',
    // E：水草减抗，13级34，10级25
    // Q：月曜反应基础提升，暂时不考虑普通绽放
    // 月绽放基础提升14%，满辉月绽放暴击加10，爆伤加20
    // 月绽放增伤120/80，6命擢升25
    // 2命：Q效果额外提升，月绽放增伤40
    // 6命：月绽放擢升25
    // 专武：精五月绽放增伤80，精一40
    data: {
      kx: ({ params, element }) => (element === '水' || element === '草') ? (params.Lauma_best ? 34 : (params.Lauma_mid || params.Lauma_low) ? 25 : 0) : 0,
      fyplus: LIMITED_PLUS.Lauma.plus,
      lunarBloom: ({ params }) => {
        if (params.Lauma_best) return 120;
        if (params.Lauma_mid) return 80;
        return 0;
      },
      elevated: ({ params }) => params.Lauma_best ? 25 : 0,
      lunarBloomCpct: ({ params }) => (params.Moonsign || 0) >= 2 ? 10 : 0,
      lunarBloomCdmg: ({ params }) => (params.Moonsign || 0) >= 2 ? 20 : 0,
      fypct: 14
    }
  },
  {
    check: ({ params }) => params.Columbina_low || params.Columbina_mid || params.Columbina_best,
    title: '哥伦比娅',
    // 天赋7%月曜基础增伤，Q领域内月曜增伤，10级40%，13级49%
    // 2命基于生命值提供基础攻击，防御和精通加成，默认6万生命
    // 6命暴伤加80
    // 擢升：2命共8.5，6命共20
    data: {
      lunarBloom: ({ params }) => params.Columbina_best ? 49 : (params.Columbina_mid || params.Columbina_low) ? 40 : 0,
      lunarCharged: ({ params }) => params.Columbina_best ? 49 : (params.Columbina_mid || params.Columbina_low) ? 40 : 0,
      lunarCrystallize: ({ params }) => params.Columbina_best ? 49 : (params.Columbina_mid || params.Columbina_low) ? 40 : 0,
      atkPlus: ({ params }) => params.Columbina_best || params.Columbina_mid ? 600 : 0,
      defPlus: ({ params }) => params.Columbina_best || params.Columbina_mid ? 600 : 0,
      mastery: ({ params }) => params.Columbina_best || params.Columbina_mid ? 210 : 0,
      cdmg: ({ params }) => params.Columbina_best ? 80 : 0,
      elevated: ({ params }) => params.Columbina_best ? 20 : params.Columbina_mid ? 8.5 : 0,
      fypct: 7
    }
  },
  {
    check: ({ params }) => params.Illuga_low || params.Illuga_mid || params.Illuga_best,
    title: '叶洛亚',
    // 默认千精，纯水岩队伍
    // Q夜莺之歌：岩伤基础提升，月结晶基础提升
    // 天赋岩伤爆伤加10，暴击加5，6命改为爆伤加30，暴击加10
    // 4命前台队友防御力提升200
    // 6命精通提升80
    data: {
      fyplus: LIMITED_PLUS.Illuga.fyPlus,
      aPlus: LIMITED_PLUS.Illuga.plus,
      a2Plus: LIMITED_PLUS.Illuga.plus,
      a3Plus: LIMITED_PLUS.Illuga.plus,
      ePlus: LIMITED_PLUS.Illuga.plus,
      qPlus: LIMITED_PLUS.Illuga.plus,
      defPlus: 200,
      mastery: 80,
      cpct: 10,
      cdmg: 30
    }
  },
  {
    check: ({ params }) => params.Linnea_low || params.Linnea_mid || params.Linnea_best,
    title: '莉奈娅',
    // 高配4500防御，中4000防御，低3500防御
    // 天赋减岩抗 满辉30 非满辉15，月结晶基础提升14%，基于莉奈娅防御力5%提升前台月兆角色精通
    // 1命基于莉奈娅防御力75%提升月结晶基础值
    // 2命水岩暴伤加40
    // 4命前台队友防御提升25%
    // 6命 月结晶擢升25，1命效果消耗次数翻倍提升单次伤害（暂时还是按75%算）
    // 专武 精五提供队友岩伤/月结晶增伤40，精一20
    data: {
      fypct: 14,
      kx: ({ params, element }) => element === '岩' ? ((params.Moonsign || 0) >= 2 ? 30 : 15) : 0,
      mastery: ({ params }) => {
        // 非月兆角色无精通加成
        const moonsign = params.Moonsign || 0
        if (!moonsign) return 0
        if (params.Linnea_best) return 225
        if (params.Linnea_mid) return 200
        return 175
      },
      fyplus: LIMITED_PLUS.Linnea.plus,
      cdmg: ({ params, element }) => (element === '水' || element === '岩') && (params.Linnea_best || params.Linnea_mid) ? 40 : 0,
      defPct: ({ params }) => params.Linnea_best ? 25 : 0,
      elevated: ({ params }) => params.Linnea_best ? 25 : 0,
      dmg: ({ params, element }) => element === '岩' && (params.Linnea_best ? 40 : params.Linnea_mid ? 20 : 0),
      lunarCrystallize: ({ params }) => params.Linnea_best ? 40 : params.Linnea_mid ? 20 : 0
    }
  },
  {
    check: ({ params }) => params.Gorou_low || params.Gorou_mid || params.Gorou_best,
    title: '五郎',
    // 默认三岩队伍，高配精五终末，中精一终末，低西风
    // E提升基础防御力，岩伤加15
    // 天赋提供25%防御力
    // 6命提供岩爆伤40
    // 终末精五精通加200，加攻击40%，精一精通加100，加攻击20%
    data: {
      defPlus: 438.09,
      dmg: ({ element }) => (element === '岩') ? 15 : 0,
      cdmg: ({ element }) => element === '岩' ? 40 : 0,
      defPct: 25,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Gorou', ds.params, ds),
      mastery: ({ params }) => params.Gorou_best ? 200 : params.Gorou_mid ? 100 : 0
    }
  },
  {
    check: ({ params }) => params.Nicole_best || params.Nicole_mid || params.Nicole_low,
    title: '尼可',
    // Hexenzirkel 魔导·秘仪队伍
    // 10级E提供基础攻击力600 + 300
    // 低配默认4000攻，中配默认4000，高配5000
    // 2命减抗25，额外加攻300
    // 4命基于尼可攻击力70%，提升伤害基础值, 生效8次
    // 6命无视防御40
    // 专武：精五58增伤，精一26增伤
    data: {
      atkPlus: ({ params }) => params.Nicole_best ? 1308 : params.Nicole_mid ? 1200 : 900,
      kx: ({ params }) => (params.Nicole_best || params.Nicole_mid) ? 25 : 0,
      aPlus: LIMITED_PLUS.Nicole.plus,
      a2Plus: LIMITED_PLUS.Nicole.plus,
      a3Plus: LIMITED_PLUS.Nicole.plus,
      ePlus: LIMITED_PLUS.Nicole.plus,
      qPlus: LIMITED_PLUS.Nicole.plus,
      ignore: ({ params }) => params.Nicole_best ? 40 : 0,
      dmg: ({ params }) => params.Nicole_best ? 58 : params.Nicole_mid ? 26 : 0
    }
  },
  {
    check: ({ params }) => params.QiQi_low || params.QiQi_mid || params.QiQi_best,
    title: '七七',
    // 天赋：星烁反应增伤50
    // 6命：星烁反应基础提升18000，默认按七七3000攻击算，生效4次
    data: {
      stellarConduct: 50,
      stellarVortex: 50,
      starSwirlAnemo: 50,
      starSwirlCryo: 50,
      fyplus: LIMITED_PLUS.QiQi.plus
    }
  },
  {
    check: ({ params }) => params.Odette_low || params.Odette_mid || params.Odette_best,
    title: '奥黛塔',
    // 华彩效果默认满层转给队友
    // 每层华彩提升15星烁增伤，基础4层60增伤，2命及以上额外2层90增伤
    // 天赋：星烁基础提升14%
    // 2命华彩额外加攻7*6=42%，冰雷风减抗20
    // 4命Q提供给队友50%效果，13级Q星烁增伤62，队友获得31
    // 6命队友获得25星烁擢升
    data: {
      fypct: 14,
      stellarConduct: ({ params }) => (params.Odette_best || params.Odette_mid ? 90 : 60) + (params.Odette_best ? 31 : 0),
      stellarVortex: ({ params }) => (params.Odette_best || params.Odette_mid ? 90 : 60) + (params.Odette_best ? 31 : 0),
      starSwirlAnemo: ({ params }) => (params.Odette_best || params.Odette_mid ? 90 : 60) + (params.Odette_best ? 31 : 0),
      starSwirlCryo: ({ params }) => (params.Odette_best || params.Odette_mid ? 90 : 60) + (params.Odette_best ? 31 : 0),
      atkPct: ({ params }) => (params.Odette_mid || params.Odette_best) ? 42 : 0,
      kx: ({ params, element }) => ((params.Odette_mid || params.Odette_best) && ['冰', '雷', '风'].includes(element)) ? 20 : 0,
      elevated: ({ params }) => params.Odette_best ? 25 : 0
    }
  },
  {
    check: ({ params }) => params.Diona_low || params.Diona_mid || params.Diona_best,
    title: '迪奥娜',
    // 6命Q领域内星烁增伤40，精通加200
    data: {
      stellarConduct: 40,
      starSwirlAnemo: 40,
      starSwirlCryo: 40,
      stellarVortex: 40,
      mastery: 200
    }
  },
  {
    check: ({ params }) => params.YaeMiko_low || params.YaeMiko_mid || params.YaeMiko_best,
    title: '八重神子',
    // 1命触发星超导时，全队雷伤加50，星超导增伤50
    // 2命四阶杀生樱提升全队精通200
    // 4命提升全队20雷伤
    data: {
      dmg: ({ params, element }) => element === '雷' ? ((params.YaeMiko_best || params.YaeMiko_mid) ? 50 : 0) + (params.YaeMiko_best ? 20 : 0) : 0,
      stellarConduct: ({ params }) => (params.YaeMiko_best || params.YaeMiko_mid) ? 50 : 0,
      mastery: ({ params }) => (params.YaeMiko_best || params.YaeMiko_mid) ? 200 : 0,
    }
  },
  {
    check: ({ params }) => params.Cyno_low || params.Cyno_mid || params.Cyno_best,
    title: '赛诺',
    // 1命200精通继承给上场队友
    // 2命满层星超导增伤80
    data: {
      mastery: ({ params }) => (params.Cyno_mid || params.Cyno_best) ? 200 : 0,
      stellarConduct: ({ params }) => (params.Cyno_mid || params.Cyno_best) ? 80 : 0
    }
  },
  {
    check: ({ params }) => params.BeiDou_low || params.BeiDou_mid || params.BeiDou_best,
    title: '北斗',
    // 6命降低敌人雷抗15，星超导降低冰抗15，精通加200
    data: {
      kx: ({ element }) => (element === '冰' || element === '雷') ? 15 : 0,
      mastery: 200
    }
  },
  {
    check: ({ params }) => params.Alyosha_low || params.Alyosha_mid || params.Alyosha_best,
    title: '阿罗夏',
    // 天赋：星超导增伤20%
    // E猎者之准加攻：13级25.02%，6命可叠2层
    // 6命2层猎者之准精通加100
    data: {
      stellarConduct: 20,
      atkPct: 50.04,
      mastery: 100
    }
  },
  {
    check: ({ params }) => params.Vodyanitsa_low || params.Vodyanitsa_mid || params.Vodyanitsa_best,
    title: '沃雅妮莎',
    // E：降低敌人水/冰抗性，10级30.0%，13级35.4%，星扩散环境风抗降低35%
    // 天赋「十二弦的泪歌」：基于血量提升增伤基础值
    // 1命基于生命值提升攻击力，高中配默认6.5万血
    // 2命水冰暴伤加50%、星扩散暴伤加60%
    // 6命星扩散擢升30%、水冰增伤60%
    data: {
      kx: ({ params, element }) => (element === '水' || element === '冰') ? (params.Vodyanitsa_best ? 35.4 : 30) : element === '风' ? 35 : 0,
      atkPlus: ({ params }) => (params.Vodyanitsa_best || params.Vodyanitsa_mid) ? 650 : 0,
      fyplus: LIMITED_PLUS.Vodyanitsa.fyPlus,
      aPlus: LIMITED_PLUS.Vodyanitsa.plus,
      a2Plus: LIMITED_PLUS.Vodyanitsa.plus,
      a3Plus: LIMITED_PLUS.Vodyanitsa.plus,
      ePlus: LIMITED_PLUS.Vodyanitsa.plus,
      qPlus: LIMITED_PLUS.Vodyanitsa.plus,
      cdmg: ({ params, element }) => (params.Vodyanitsa_best || params.Vodyanitsa_mid) && (element === '水' || element === '冰') ? 50 : 0,
      stellarVortexCdmg: ({ params }) => (params.Vodyanitsa_best || params.Vodyanitsa_mid) ? 60 : 0,
      starSwirlAnemoCdmg: ({ params }) => (params.Vodyanitsa_best || params.Vodyanitsa_mid) ? 60 : 0,
      starSwirlCryoCdmg: ({ params }) => (params.Vodyanitsa_best || params.Vodyanitsa_mid) ? 60 : 0,
      elevated: ({ params }) => params.Vodyanitsa_best ? 30 : 0,
      dmg: ({ params, element }) => params.Vodyanitsa_best && (element === '水' || element === '冰') ? 60 : 0
    }
  }
]

TeamBuff.forEach(b => {
  if (typeof b.title === 'string' && !b.title.includes('：') && b.data) {
    b.title = makeAutoTitle(b.title, b.data)
  }
})

export { TeamBuff, LIMITED_PLUS }