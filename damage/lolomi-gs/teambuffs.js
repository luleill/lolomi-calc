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
  { artiName: '', paramKey: 'zongshi'  }, // 宗室 - 队伍20%攻击力
  { artiName: '', paramKey: 'jincheng' }, // 烬城 - 全元素伤害40%
  { artiName: '', paramKey: 'yege'     }, // 夜歌 - 精通120+月曜10%
  { artiName: '', paramKey: 'qianyan'  }, // 千岩 - 战技命中后加攻20%
  { artiName: '', paramKey: 'panyan'   }, // 磐岩 - 结晶元素增伤35%
  { artiName: '', paramKey: 'fengtao'  }, // 风套 - 扩散减抗40%
  { artiName: '', paramKey: 'caotao'   }, // 草套 - 减草抗30%
  { artiName: '', paramKey: 'tianmei'  }, // 天之美赐 - 魔导队伍伤害提升40%
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
    title: '元素反应：[超导] 降低受超导影响生物[kx]%的物理抗性',
    data: {
      kx: 25
    }
  },
  {
    check: ({ params }) => params.hydro_two === true,
    title: '元素共鸣：[愈疗之水] 生命值上限提升[hpPct]%',
    data: {
      hpPct: 25
    }
  },
  {
    check: ({ params }) => params.pyro_two === true,
    title: '元素共鸣：[热诚之火] 攻击力提高[atkPct]%',
    data: {
      atkPct: 25
    }
  },
  {
    check: ({ params }) => params.geo_two === true,
    title: '元素共鸣：[坚定之岩] 护盾强效提升[shield]%，造成的伤害提升[dmg]%，降低敌人[kx]%元素抗性',
    data: {
      shield: 25,
      dmg: 15,
      kx: ({ element }) => element === '岩' ? 20 : 0
    }
  },
  {
    check: ({ params }) => params.dendro_two === true,
    title: '元素共鸣：[蔓生之草] 触发燃烧、原激化、绽放反应后，提升元素精通[mastery]点,',
    data: {
      mastery: 80
    }
  },
  {
    check: ({ params }) => params.cryo_two === true,
    title: '元素共鸣：[粉碎之冰] 攻击处于冰元素附着或冻结下的敌人时，暴击率提高[cpct]%',
    data: {
      cpct: 15
    }
  },

  // 队友圣遗物增益
  { 
    check: ({ params, artis }) => artiEffectActive('zongshi', params, artis),
    title: '昔日宗室之仪：队伍中所有角色攻击力提升[atkPct]%',
    data: {
      atkPct: 20
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('jincheng', params, artis),
    title: '烬城勇者绘卷：所有元素伤害加成与物理伤害加成提升[dmg]%',
    data: {
      dmg: 40
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('yege', params, artis),
    title: '纺月的夜歌：元素精通提升[mastery],月曜反应造成的伤害提升[lunarBloom]%',
    data: {
      mastery: 120,
      lunarCharged: 10,
      lunarBloom: 10,
      lunarCrystallize: 10
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('jiaoguan', params, artis),
    title: '教官：触发元素反应后，队伍中所有角色的元素精通提高[mastery]点',
    data: {
      mastery: 120
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('fengtao', params, artis),
    title: '翠绿之影：根据扩散的元素类型，降低受到影响的敌人[fykx]%的对应元素抗性',
    data: {
      kx: 40
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('caotao', params, artis),
    title: '深林的记忆：使命中目标的元素抗性降低[kx]%',
    data: {
      kx: 30
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('qianyan', params, artis),
    title: '千岩牢固：元素战技命中敌人后，使队伍中附近的所有角色攻击力提升[atkPct]%，护盾强效提升[shield]%',
    data: {
      atkPct: 20,
      shield: 30
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('panyan', params, artis),
    title: '悠古的磐岩：获得结晶反应形成的晶片时，队伍中所有角色获得[dmg]%对应元素伤害加成',
    data: {
      dmg: 35
    }    
  },
  { 
    check: ({ params, artis }) => artiEffectActive('tianmei', params, artis),
    title: '天之美赐：施放元素战技后附近的所有角色获得[dmg]%元素伤害加成',
    data: {
      dmg: ({ params }) => params.Hexenzirkel ? 40 : 0
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
      enemyDef: (params) => params.KamisatoAyaka_best ? 30 : 0
    }
  },
  {
    check: ({ params }) => params.Jean_best || params.Jean_mid || params.Jean_low,
    title: '琴',
    // 四命减风扗40%
    data: {
      kx: ({ params, element }) => (params.Jean_best && element === '风') ? 40 : 0
    }
  },
  {
    check: ({ params }) => params.Lisa_best || params.Lisa_mid || params.Lisa_best_low,
    title: '丽莎',
    // 被动减防15%
    data: {
      enemyDef: 15
    }
  },
  {
    check: ({ params }) => params.Venti_best || params.Venti_mid || params.Venti_low || params.Hexenzirkel === false,
    title: '温迪',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      dmg: ({ params, element }) => {
        if (params.Hexenzirkel && element !== '风') return 50
        if (params.Venti_best && element === '风') return 25
      },
      kx: ({ params, element }) => {
        if (params.Venti_best && element === '风') return 44
        if (params.Venti_mid && element === '风') return 24
        if (params.Venti_best && element !== '风') return 24
      },
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Venti', ds.params, ds),
      mastery: ({ params }) => params.Venti_best ? 200 : params.Venti_mid ? 100 : 0
    }
  },
  {
    check: ({ params }) => params.Durin_best || params.Durin_mid || params.Durin_low || params.Hexenzirkel === false,
    title: '杜林',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      aPlus: ({ params }) => (params.Durin_best || params.Durin_mid) ? 1800: 0,
      dmg: ({ params }) => (params.Durin_best && params.Durin_mid) ? 50 : 0,
      enemyDef: ({ params }) => params.Durin_best ? 30 : 0,
      kx: ({ params, element }) => {
        if ((params.Durin_best || params.Durin_mid || params.Durin_low) && params.Hexenzirkel && (element !== '水' || element !== '冰')) return 35
        if ((params.Durin_best || params.Durin_mid || params.Durin_low) && (element !== '水' || element !== '冰')) return 20
      },
      atkPct: ({ params }) => {
        if (params.Durin_best && params.Hexenzirkel) return 56
        if (params.Durin_best) return 32
        if (params.Durin_mid && params.Hexenzirkel) return 28
        if (params.Durin_mid) return 16
      }
    }
  },
  {
    check: ({ params }) => params.Klee_best || params.Klee_mid || params.Klee_low || params.Hexenzirkel === false,
    title: '可莉',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      enemyDef: ({ params }) => (params.Klee_best || params.Klee_mid) ? 23 : 0,
      dmg: ({ params, element }) => (params.Klee_best && element === '火') ? 10 : 0
    }
  },
  {
    check: ({ params }) => params.Fischl_best || params.Fischl_mid || params.Fischl_low || params.Hexenzirkel === false,
    // 触发超载，全队加攻，触发感电，全队加精通，默认魔导队攻击和精通都吃
    title: '菲谢尔',
    data: {
      atkPct: ({ params }) => (params.Fischl_best || params.Fischl_mid || (params.Fischl_low && params.Hexenzirkel)) ? 22.5 : 0,
      mastery: ({ params }) => (params.Fischl_best || params.Fischl_mid || (params.Fischl_low && params.Hexenzirkel)) ? 90 : 0
    }
  },
  {
    check: ({ params }) => params.Bennett_low || params.Bennett_mid || params.Bennett_best,
    title: '班尼特',
    // 高配13级q风鹰剑 中配13级q原木刀 低配10级q西风剑
    data: {
      atkPlus: ({ params }) =>
        params.Bennett_best ? 139 * 865.2 / 100 :
        params.Bennett_mid ? 139 * 756.2 / 100 :
        params.Bennett_low ? 120.8 * 645.2 / 100 : 0
    }
  },
  {
    check: ({ params }) => params.XiangLing_low || params.XiangLing_mid || params.XiangLing_best,
    title: '香菱',
    // 前台主c默认吃到锅巴辣椒加成
    data: {
      atkPct: 10,
      dmg: ({ params, element }) => (params.XiangLing_best && element === '火') ? 15 : 0,
      kx: ({ params, element }) => (params.XiangLing_best || params.XiangLing_mid) && element === '火' ? 15 : 0
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
    data: {
      kx: ({ params, element }) => (
        (params.ChongYun_best || params.ChongYun_mid || params.ChongYun_low)
        && element === '冰') ? 10 : 0
    }
  },
  {
    check: ({ params }) => params.Furina_low || params.Furina_mid || params.Furina_best,
    title: '芙宁娜',
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
    title: '爱可菲',
    data: {
      kx: ({ element }) => (element === '冰' || element === '水') ? 55 : 0,
      cdmg: ({ params, element }) => ((params.Escoffier_best || params.Escoffier_mid) && element === '冰') ? 60 : 0,
      // 爱可菲获得5层「冷煮」，除爱可菲外的附近的当前场上角色普通攻击、重击、下落攻击、元素战技和元素爆发对敌人造成冰元素伤害时，将消耗1层「冷煮」，提升造成的伤害
      aPlus: ({ params, element }) => (params.Escoffier_best && element === '冰') ? 9600 : (params.Escoffier_mid && element === '冰') ? 8400 : 0,
      a2Plus: ({ params, element }) => (params.Escoffier_best && element === '冰') ? 9600 : (params.Escoffier_mid && element === '冰') ? 8400 : 0,
      a3Plus: ({ params, element }) => (params.Escoffier_best && element === '冰') ? 9600 : (params.Escoffier_mid && element === '冰') ? 8400 : 0,
      ePlus: ({ params, element }) => (params.Escoffier_best && element === '冰') ? 9600 : (params.Escoffier_mid && element === '冰') ? 8400 : 0,
      qPlus: ({ params, element }) => (params.Escoffier_best && element === '冰') ? 9600 : (params.Escoffier_mid && element === '冰') ? 8400 : 0,
      atkPct: ({ params }) => params.Escoffier_best ? 64 : params.Escoffier_mid ? 32 : 0
    }
  },
  {
    check: ({ params }) => params.Sara_low || params.Sara_mid || params.Sara_best,
    title: '九条裟罗',
    // 高配13级e精五终末 中配13级e精一终末 低配10级e西风弓
    data: {
      atkPlus: ({ params }) =>
        params.Sara_best ? 91.29 * 803 / 100 :
        params.Sara_mid ? 91.29 * 803 / 100 :
        params.Sara_low ? 77.33 * 649 / 100 : 0,
      cdmg: ({ params, element }) =>
        (params.Sara_best && element === '雷') ? 60 : 0,
      // 终末被动取去重
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Sara', ds.params, ds),
      mastery: ({ params }) =>
        params.Sara_best ? 200 :
        params.Sara_mid ? 100 : 0
    }
  },
  {
    check: ({ params }) => params.Mona_low || params.Mona_mid || params.Mona_best || params.Hexenzirkel === false,
    title: '莫娜',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      dmg: 60,
      swirl: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      electroCharged: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      lunarCharged: ({ params }) => params.Mona_best || params.Mona_mid ? 15 : 0,
      vaporize: ({ params }) => {
        const isMonaC1 = params.Mona_best || params.Mona_mid;
        const isHexenzirkel = params.Hexenzirkel;
        return (isMonaC1 && isHexenzirkel) ? 30 : (isMonaC1 || isHexenzirkel) ? 15 : 0;
      },
      mastery: ({ params }) => params.Mona_best || params.Mona_mid ? 80 : 0,
      cpct: ({ params }) => params.Mona_best ? 15 : 0,
      cdmg: ({ params }) => params.Mona_best && params.Hexenzirkel ? 15 : 0,
    },
  },
  {
    check: ({ params }) => params.Citlali_low || params.Citlali_mid || params.Citlali_best,
    title: '茜特菈莉',
    // 高配默认1500精通，中配1300精通
    data: {
      aPlus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      a2Plus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      a3Plus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      ePlus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      qPlus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      mastery: ({ params }) => (params.Citlali_best || params.Citlali_mid) ? 250 : 0,
      kx: ({ params, element }) => {
        // 考虑到可以通过附魔，其他元素角色也能打出蒸发和融化反应
        // 不限制水火角色，如果有队伍带茜特菈莉辅助但是不打蒸发和融化，伤害就会异常高很多
        // const isHydroOrPyro = element === '火' || element === '水';
        return (params.Citlali_best) ? 40 : (params.Citlali_mid) ? 20 : 0;
      },
      dmg: ({ params }) => {
        return params.Citlali_best ? 116 : params.Citlali_mid ? 28 : 0;
      }
    },
  },
  {
    check: ({ params }) => params.Kazuha_low || params.Kazuha_mid || params.Kazuha_best,
    title: '枫原万叶',
    // 中高配默认千精40增伤，默认二命开q加200精通，低配默认30增伤
    // 精一苍古加攻20增伤16  精五加攻40增伤32 
    data: {
      mastery: ({ params }) => (params.Kazuha_best || params.Kazuha_mid) ? 200 : 0,
      // 苍古被动去重
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Kazuha', ds.params, ds),
      dmg: ({ params }) => (params.Kazuha_best || params.Kazuha_mid) ? 72 : 56
    }
  },
  {
    check: ({ params }) => params.ShenHe_low || params.ShenHe_mid || params.ShenHe_best,
    title: '申鹤',  
    // 高配默认5000攻击，中配4000，低配3500 
    data: { 
      aPlus: ({ params }) => params.ShenHe_best ? 5000 : params.ShenHe_mid ? 3500 : params.ShenHe_low ? 3000 : 0,
      a2Plus: ({ params }) => params.ShenHe_best ? 5000 : params.ShenHe_mid ? 3500 : params.ShenHe_low ? 3000 : 0,
      a3Plus: ({ params }) => params.ShenHe_best ? 5000 : params.ShenHe_mid ? 3500 : params.ShenHe_low ? 3000 : 0,
      ePlus: ({ params }) => params.ShenHe_best ? 5000 : params.ShenHe_mid ? 3500 : params.ShenHe_low ? 3000 : 0,
      qPlus: ({ params }) => params.ShenHe_best ? 5000 : params.ShenHe_mid ? 3500 : params.ShenHe_low ? 3000 : 0,
      cdmg: ({ params }) => (params.ShenHe_best || params.ShenHe_mid) ? 15 : 0,
      kx: 15,
      dmg: 15,
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
    // 高配2+5 默认4500攻击 中配2+1 4500攻击 低配0+0 3500攻击
    // 天赋默认吃满+10暴击
    data: { 
      a3Plus: ({ params }) => (params.XianYun_best || params.XianYun_mid) ? 18000 : params.XianYun_low ? 7000 : 0,
      cdmg: 10,
      a3Dmg: ({ params }) => params.XianYun_best ? 80 : params.XianYun_mid ? 28 : 0
    } 
  },
  {
    check: ({ params }) => params.Nilou_low || params.Nilou_mid || params.Nilou_best,
    title: '妮露',
    // 高配6+5默认8万血，中2+1默认6.5万血，圣显之钥根据血量加全队精通
    // 天赋纯水草队+100精通
    data: {
      mastery: ({ params }) => {
        // 圣显之钥提供的精通
        const weaponMastery = params.Nilou_best ? 320 : params.Nilou_mid ? 130 : 0
        // 纯水草队天赋加100精通
        const talentMastery = params.pureHydroDendro === false ? 0 : 100
        return weaponMastery + talentMastery
      },
      kx: ({ params, element }) => {
        // 二命减抗35%需要同时满足：中高配 + 纯水草队 + 主角色是水或草元素
        const isNotPureHydroDendro = params.pureHydroDendro === false
        const isMidOrBest = params.Nilou_best || params.Nilou_mid
        return (isMidOrBest && !isNotPureHydroDendro && (element === '水' || element === '草')) ? 35 : 0
      }
    }
  },
  {
    check: ({ params }) => params.Ineffa_low || params.Ineffa_mid || params.Ineffa_best,
    title: '伊涅芙',
    data: {
      lunarCharged: ({ params }) => {
        if (params.Ineffa_best) return 130;
        if (params.Ineffa_mid) return 90;
        return 0;
      },
      mastery: 180,
      fypct: 14
    }
  },
  {
    check: ({ params }) => 
      params.Xilonen_low || params.Xilonen_mid || params.Xilonen_best ||
      params.Xilonen_hydro === false || 
      params.Xilonen_pyro === false  || 
      params.Xilonen_geo === false   ||
      params.Xilonen_cryo === false,
    title: '希诺宁',
    // 高配默认4000防御
    // 二命hydro水系加45生命  pyro火系加45攻击 geo岩系50增伤 cryo冰系60爆伤
    data: {
      kx: ({ params }) => params.Xilonen_best ? 45 : (params.Xilonen_mid || params.Xilonen_low) ? 36 : 0,
      hpPct: ({ params }) => (params.Xilonen_hydro && (params.Xilonen_best || params.Xilonen_mid)) ? 45 : 0,
      atkPct: ({ params }) => (params.Xilonen_pyro && (params.Xilonen_best || params.Xilonen_mid)) ? 45 : 0,
      dmg: ({ params }) => (params.Xilonen_geo && (params.Xilonen_best || params.Xilonen_mid)) ? 50 : 0,
      cdmg: ({ params }) => (params.Xilonen_cryo && (params.Xilonen_best || params.Xilonen_mid)) ? 60 : 0,
      aPlus: ({ params }) => params.Xilonen_best ? 2600 : 0,
      a2Plus: ({ params }) => params.Xilonen_best ? 2600 : 0,
      a3Plus: ({ params }) => params.Xilonen_best ? 2600 : 0
    }
  },
  {
    check: ({ params }) => params.Mavuika_low || params.Mavuika_mid || params.Mavuika_best,
    title: '玛薇卡',
    data: {
      dmg: 40,
      enemyDef: ({ params }) => (params.Mavuika_best || params.Mavuika_mid) ? 20 : 0,
    }
  },
  {
    check: ({ params }) => params.YeLan_low || params.YeLan_mid || params.YeLan_best,
    title: '夜兰',
    // 高6+5终末 中2+1终末 低1+0西风 天赋开Q默认吃15%增伤
    data: {
      hpPct: ({ params }) => params.YeLan_best ? 40 : 0,
      mastery: ({ params }) => params.YeLan_best ? 200 : params.YeLan_mid ? 100 : 0,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'YeLan', ds.params, ds),
      dmg: 15
    }
  },
  {
    check: ({ params }) => params.XingQiu_low || params.XingQiu_mid || params.XingQiu_best,
    title: '行秋',
    data: {
      kx: ({ params, element }) => (params.XingQiu_best || params.XingQiu_mid && element === '水') ? 15 : 0,
    }
  },
  {
    check: ({ params }) => params.Nahida_low || params.Nahida_mid || params.Nahida_best,
    title: '纳西妲',
    data: {
      mastery: ({ params }) => {
        if (params.Nahida_best) return 298;
        if (params.Nahida_mid) return 290;
        return 0;
      }
    }
  },
  {
    check: ({ params }) => params.Faruzan_low || params.Faruzan_mid || params.Faruzan_best,
    title: '珐露珊',
    // 高配6+5终末 中6+1终末，低2+0西风
    data: {
      aPlus: ({ params }) => (params.Faruzan_best || params.Faruzan_mid) ? 258 : params.Faruzan_low ? 209 : 0,
      a2Plus: ({ params }) => (params.Faruzan_best || params.Faruzan_mid) ? 258 : params.Faruzan_low ? 209 : 0,
      a3Plus: ({ params }) => (params.Faruzan_best || params.Faruzan_mid) ? 258 : params.Faruzan_low ? 209 : 0,
      ePlus: ({ params }) => (params.Faruzan_best || params.Faruzan_mid) ? 258 : params.Faruzan_low ? 209 : 0,
      qPlus: ({ params }) => (params.Faruzan_best || params.Faruzan_mid) ? 258 : params.Faruzan_low ? 209 : 0,
      cdmg: ({ params, element }) => (params.Faruzan_best && element === '风') ? 40 : 0,
      kx: ({ element }) => (element === '风') ? 30 : 0,
      dmg: ({ params, element }) => (params.Faruzan_best || (params.Faruzan_mid && element === '风')) ? 38.25 : (params.Faruzan_low && element === '风') ? 32.4 : 0,
      mastery: ({ params }) => params.Faruzan_best ? 200 : params.Faruzan_mid ? 100 : 0,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Faruzan', ds.params, ds),
    }
  },
  {
    check: ({ params }) => params.Iansan_low || params.Iansan_mid || params.Iansan_best,
    title: '伊安珊',
    // 高6+5香韵 中6+1香韵 低 2+0西风
    data: {
      atkPlus: ({ params }) => (params.Iansan_best || params.Iansan_mid) ? 810 : 690,
      atkPct: ({ params }) => params.Iansan_best ? 94 : params.Iansan_mid ? 62 : params.Iansan_low ? 30 : 0,
      dmg: ({ params }) => (params.Iansan_best || params.Iansan_mid) ? 25 : 0,
    }
  },
  {
    check: ({ params }) => params.Chevreuse_low || params.Chevreuse_mid || params.Chevreuse_best,
    title: '夏沃蕾',
    // 高6+5香韵 中6+1香韵 低 2+0西风
    data: {
      kx: 40,
      atkPct: ({ params }) => params.Iansan_best ? 104 : params.Iansan_mid ? 72 : params.Iansan_low ? 40 : 0,
      dmg: ({ params , element }) => (params.Iansan_best && element === '火' || element === '雷') ? 60 : 0,
    }
  },
  {
    check: ({ params }) => params.Aino_low || params.Aino_mid || params.Aino_best,
    title: '爱诺',
    data: {
      mastery: ({ params }) => (params.Aino_best || params.Aino_mid) ? 80 : 0,
      lunarBloom: ({ params }) => params.Aino_best ? 35 : 0,
      lunarCharged: ({ params }) => params.Aino_best ? 35 : 0
    }
  },
  {
    check: ({ params }) => params.Lauma_low || params.Lauma_mid || params.Lauma_best,
    title: '菈乌玛',
    data: {
      kx: ({ params }) => params.Lauma_best ? 34 : (params.Lauma_mid || params.Lauma_low) ? 25 : 0,
      fyPlus: ({ params }) => (params.Lauma_best || params.Lauma_mid) ? 9000 : params.Lauma_low ? 4800 : 0,
      lunarBloom: ({ params }) => {
        if (params.Lauma_best) return 120;
        if (params.Lauma_mid) return 80;
        return 0;
      },
      elevated: ({ params }) => params.Lauma_best ? 25 : 0,
      cpct: 10,
      cdmg: 20,
      fypct: 14
    }
  },
  {
    check: ({ params }) => params.Columbina_low || params.Columbina_mid || params.Columbina_best,
    title: '哥伦比娅',
    data: {
      lunarBloom: ({ params }) => params.Columbina_best ? 49 : (params.Columbina_mid || params.Columbina_low) ? 40 : 0,
      lunarCharged: ({ params }) => params.Columbina_best ? 49 : (params.Columbina_mid || params.Columbina_low) ? 40 : 0,
      lunarCrystallize: ({ params }) => params.Columbina_best ? 49 : (params.Columbina_mid || params.Columbina_low) ? 40 : 0,
      atkPlus: ({ params }) => params.Columbina_best || params.Columbina_mid ? 600 : 0,
      defPlus: ({ params }) => params.Columbina_best || params.Columbina_mid ? 600 : 0,
      mastery: ({ params }) => params.Columbina_best || params.Columbina_mid ? 200 : 0,
      cdmg: ({ params }) => params.Columbina_best ? 80 : 0,
      elevated: ({ params }) => params.Columbina_best ? 20 : params.Columbina_mid ? 8.5 : 0,
      fypct: 7
    }
  },
  {
    check: ({ params }) => params.Illuga_low || params.Illuga_mid || params.Illuga_best,
    title: '叶洛亚',
    // 默认千精，纯水岩队伍，提升月结晶反应基础值，天赋吃满额外提升160%
    data: {
      fyplus: ({ params }) => (params.Illuga_best || params.Illuga_mid) ? 6400 : params.Illuga_low ? 5500 : 0,
      aPlus: ({ params }) => (params.Illuga_best || params.Illuga_mid) ? 950 : params.Illuga_low ? 850 : 0,
      a2Plus: ({ params }) => (params.Illuga_best || params.Illuga_mid) ? 950 : params.Illuga_low ? 850 : 0,
      a3Plus: ({ params }) => (params.Illuga_best || params.Illuga_mid) ? 950 : params.Illuga_low ? 850 : 0,
      ePlus: ({ params }) => (params.Illuga_best || params.Illuga_mid) ? 950 : params.Illuga_low ? 850 : 0,
      qPlus: ({ params }) => (params.Illuga_best || params.Illuga_mid) ? 950 : params.Illuga_low ? 850 : 0,
      defPlus: ({ params }) => params.Illuga_best ? 200 : 0,
      mastery: ({ params }) => params.Illuga_best ? 80 : 50,
      cpct: ({ params }) => params.Illuga_best ? 10 : 5,
      cdmg: ({ params }) => params.Illuga_best ? 30 : 10
    }
  },
  {
    check: ({ params }) => params.Linnea_low || params.Linnea_mid || params.Linnea_best,
    title: '莉奈娅',
    // 高配4500防御，中4000防御，低3500防御
    data: {
      fypct: 14,
      kx: ({ element }) => (element === '岩') ? 30 : 0,
      mastery: ({ params }) => {
        // 非月兆角色无精通加成
        const moonsign = params.Moonsign || 0
        if (!moonsign) return 0
        if (params.Linnea_best) return 225
        if (params.Linnea_mid) return 200
        return 175
      },
      fyplus: ({ params }) => params.Linnea_best ? 10125 : (params.Linnea_mid ? 3375 : 0),
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
    // 默认三岩队伍，高配6+5终末，中2+1终末，低0+0
    data: {
      defPlus: ({ params }) => params.Gorou_best ? 438.09 : (params.Gorou_mid || params.Gorou_low) ? 371.09 : 0,
      dmg: ({ element }) => (element === '岩') ? 15 : 0,
      cdmg: ({ params, element }) => (element === '岩' && params.Gorou_best) ? 40 : 0,
      defPct: 25,
      atkPct: (ds) => getMutexPassiveValue('千年的大乐章', 'atkPct', 'Gorou', ds.params, ds),
      mastery: ({ params }) => params.Gorou_best ? 200 : params.Gorou_mid ? 100 : 0
    }
  },
  {
    check: ({ params }) => params.Nicole_best || params.Nicole_mid || params.Nicole_low || params.Hexenzirkel === false,
    title: '尼可',
    // Hexenzirkel 魔导·秘仪队伍
    // 低配0+0: 默认4000攻，攻击力提升至多900
    // 中配2+1: 默认4000攻，减抗20%
    // 高配6+5: 默认5000攻, 减抗20%, 4命基础提升3500, 6命无视防御40
    // 专武精五 58增伤，精一 26增伤
    data: {
      atkPlus: ({ params }) => params.Nicole_best ? 1248 : params.Nicole_mid ? 1140 : 900,
      kx: ({ params }) => (params.Nicole_best || params.Nicole_mid) ? 20 : 0,
      aPlus: ({ params }) => params.Nicole_best ? 3500 : 0,
      a2Plus: ({ params }) => params.Nicole_best ? 3500 : 0,
      a3Plus: ({ params }) => params.Nicole_best ? 3500 : 0,
      ePlus: ({ params }) => params.Nicole_best ? 3500 : 0,
      qPlus: ({ params }) => params.Nicole_best ? 3500 : 0,
      ignore: ({ params }) => params.Nicole_best ? 40 : 0,
      dmg: ({ params }) => params.Nicole_best ? 58 : params.Nicole_mid ? 26 : 0
    }
  }
]

export { TeamBuff }