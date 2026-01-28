let TeamBuff = [
  // 纳塔地方传奇满层增伤+双药(20暴击20爆伤，属伤药)
  {
    check: ({ params }) => params.legend_max  === true,
    title: '纳塔地方传奇900增伤',
    data: {
      dmg: 900 + 15,
      cdmg: 20,
      cpct: 20
    }
  },
  // 队伍增益 - 元素共鸣buff
  {
    check: ({ params }) => params.hydro_two === true,
    title: '元素共鸣：[愈疗之水] 生命值上限提升[hpPct]%',
    data: {
      hpPct: 25
    }
  },{
    check: ({ params }) => params.pyro_two === true,
    title: '元素共鸣：[热诚之火] 攻击力提高[atkPct]%',
    data: {
      atkPct: 25
    }
  },{
    check: ({ params }) => params.geo_two === true,
    title: '元素共鸣：[坚定之岩] 护盾强效提升[shield]%，造成的伤害提升[dmg]%，降低敌人[kx]%元素抗性',
    data: {
      shield: 25,
      dmg: 15,
      kx: ({ element }) => element === '岩' ? 20 : 0
    }
  },{
    check: ({ params }) => params.dendro_two === true,
    title: '元素共鸣：[蔓生之草] 触发燃烧、原激化、绽放反应后，提升元素精通[mastery]点,',
    data: {
      mastery: 80
    }
  },{
    check: ({ params }) => params.cryo_two === true,
    title: '元素共鸣：[粉碎之冰] 攻击处于冰元素附着或冻结下的敌人时，暴击率提高[cpct]%',
    data: {
      cpct: 15
    }
  },

  // 队友圣遗物增益
  { 
    check: ({ params }) => params.zongshi === true,
    title: '昔日宗室之仪：队伍中所有角色攻击力提升[atkPct]%',
    data: {
      atkPct: 20
    }    
  },
  { 
    check: ({ params }) => params.jincheng === true,
    title: '烬城勇者绘卷：所有元素伤害加成与物理伤害加成提升[dmg]%',
    data: {
      dmg: 40
    }    
  },
  { 
    check: ({ params }) => params.yege === true,
    title: '纺月的夜歌：元素精通提升[mastery],月曜反应造成的伤害提升[lunarBloom]%',
    data: {
      mastery: 120,
      lunarCharged: 10,
      lunarBloom: 10,
      lunarCrystallize: 10
    }    
  },
  { 
    check: ({ params }) => params.jiaoguan === true,
    title: '教官：触发元素反应后，队伍中所有角色的元素精通提高[mastery]点',
    data: {
      mastery: 120
    }    
  },
  { 
    check: ({ params }) => params.fengtao === true,
    title: '翠绿之影：根据扩散的元素类型，降低受到影响的敌人[fykx]%的对应元素抗性',
    data: {
      kx: 40
    }    
  },
  { 
    check: ({ params }) => params.caotao === true,
    title: '深林的记忆：使命中目标的元素抗性降低[kx]%',
    data: {
      kx: 30
    }    
  },
  { 
    check: ({ params }) => params.qianyan === true,
    title: '千岩牢固：元素战技命中敌人后，使队伍中附近的所有角色攻击力提升[atkPct]%，护盾强效提升[shield]%',
    data: {
      atkPct: 20,
      shield: 30
    }    
  },
  { 
    check: ({ params }) => params.panyan === true,
    title: '悠古的磐岩：获得结晶反应形成的晶片时，队伍中所有角色获得[dmg]%对应元素伤害加成',
    data: {
      dmg: 35
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
    check: ({ params }) => params.KamisatoAyaka_best,
    title: '神里绫华',
    // 四命减防30%
    data: {
      enemyDef:30
      }
  },{
    check: ({ params }) => params.Jean_best,
    title: '琴',
    // 四命减风抗40%
    data: {
      kx:({ params , element}) => params.Jean_best && element === '风' ? 40 : 0
      }
  },{
    check: ({ params }) => params.Lisa_base,
    title: '丽莎',
    // 被动减防15%
    data: {
      enemyDef:15
      }
  },{
    check: ({ params }) => params.Venti_best || params.Venti_mid || params.Venti_low || params.Hexenzirkel_Venti,
    title: '温迪',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      dmg: ({ params , element}) => {
        if (params.Hexenzirkel_Venti && element !== '风') {
          return 50
        } else if ( params.Venti_best && element === '风') {
          return 25
        }
      },
      kx: ({ params , element }) => {
        if (params.Venti_best && element === '风') {  
          return 44
        } else if (params.Venti_mid && element === '风') {
          return 24
        } else if (params.Venti_best && element !== '风') {
          return 24
        }
      }
    }
  },{
    check: ({ params }) => params.Klee_best || params.Klee_mid || params.Hexenzirkel_Klee,
    title: '可莉',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      enemyDef: ({ params }) => (params.Klee_best || params.Klee_mid) ? 23 : 0,
      dmg: ({ params , element }) => (params.Klee_best && element === '火' ) ? 10 : 0,
    }
  },{
    check: ({ params }) => params.ZhongLi_mark,
    title: '钟离',
    data: {
      kx: 20
    }
  },{
    check: ({ params }) => params.Hexenzirkel_Fischl_overloaded || params.Hexenzirkel_Fischl_charged,
    title: '菲谢尔',
    data: {
      atkPct: ({ params }) => params.Hexenzirkel_Fischl_overloaded ? 22.5 : 0,
      mastery: ({ params }) => params.Hexenzirkel_Fischl_charged ? 90 : 0,
    }
  },{
    check: ({ params }) => params.Bennett_low || params.Bennett_mid || params.Bennett_best,
    title: '班尼特',
    // 高配13级q风鹰剑 中配13级q原木刀 低配10级q西风剑
    data: {
      atkPlus: ({ params }) => 
        params.Bennett_best ? 139 * 865.2 / 100 : 
        params.Bennett_mid ? 139 * 756.2 / 100 : 
        params.Bennett_low ? 120.8 * 645.2 / 100 : 0
    }
  },{
    check: ({ params }) => params.Sara_low || params.Sara_mid || params.Sara_best,
    title: '九条裟罗',
    // 高配13级e精五终末 中配13级e精一终末 低配10级e西风弓
    data: {
      atkPlus: ({ params }) => 
        params.Sara_best ? 91.29 * 803 / 100 : 
        params.Sara_mid ? 91.29 * 803 / 100 : 
        params.Sara_low ? 77.33 * 649 / 100 : 0,
      cdmg: ({ params , element }) => 
        (params.Sara_best && element === '雷') ? 60 : 0,
      atkPct: ({ params }) => 
        params.Sara_best ? 40 : 
        params.Sara_mid ? 20 : 0,
      mastery: ({ params }) => 
        params.Sara_best ? 200 : 
        params.Sara_mid ? 100 : 0,
    }
  },
  {
    check: ({ params }) => params.Mona_low || params.Mona_mid || params.Mona_best || params.Hexenzirkel_Mona,
    title: '莫娜',
    // Hexenzirkel 魔导·秘仪队伍
    data: {
      dmg: 60,
      swirl: ({params}) => params.Mona_best || params.Mona_mid ? 15 : 0,
      electroCharged: ({params}) => params.Mona_best || params.Mona_mid ? 15 : 0,
      lunarCharged: ({params}) => params.Mona_best || params.Mona_mid ? 15 : 0,
      vaporize: ({params}) => {
        const isMonaC1 = params.Mona_best || params.Mona_mid;
        const isHexenzirkel = params.Hexenzirkel_Mona;
        return (isMonaC1 && isHexenzirkel) ? 30 : (isMonaC1 || isHexenzirkel) ? 15 : 0;
      },
      mastery: ({ params }) => params.Mona_best || params.Mona_mid ? 80 : 0,
      cpct : ({ params }) => params.Mona_best ? 15 : 0,
      cdmg: ({ params }) => params.Mona_best && params.Hexenzirkel ? 15 : 0,
    },
  },
  {
    check: ({ params }) => params.Citlali_low || params.Citlali_mid || params.Citlali_best,
    title: '茜特菈莉',
    // 高配默认1500精通，中配1300精通
    data: {
      aplus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      a2plus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      a3plus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      eplus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      qplus: ({ params }) => params.Citlali_best ? 3000 : params.Citlali_mid ? 2600 : 0,
      mastery: ({ params }) => (params.Citlali_best || params.Citlali_mid) ? 250 : 0,
      kx: ({ params, element }) => {
        const isHydroOrPyro = element === '火' || element === '水';
        return (params.Citlali_best && isHydroOrPyro) ? 40 : (params.Citlali_mid && isHydroOrPyro) ? 20 : 0;
      },
      dmg: ({ params, element }) => {
        const isHydroOrPyro = element === '火' || element === '水';
        return (params.Citlali_best && isHydroOrPyro) ? 116 : params.Citlali_best ? 56 : params.Citlali_mid ? 28 : 0;
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
      atkPct: ({ params }) => (params.Kazuha_best || params.Kazuha_mid) ? 40 : 20,
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
      cdmg : ({ params }) => { params.ShenHe_best || params.ShenHe_mid ? 15 : 0},
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
    check: ({ params }) => params.Nilou_low || params.Nilou_mid || params.Nilou_best,
    title: '妮露',
    data: {
      mastery: ({ params }) => (params.Nilou_best || params.Nilou_mid) ? 120 : params.Nilou_low ? 280 : 0,
      kx: ({ params }) => (params.Nilou_best || params.Nilou_mid) ? 35 : 0
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
      hpPct: ({ params}) => params.Xilonen_hydro ? 45 : 0,
      atkPct: ({ params}) => params.Xilonen_pyro ? 45 : 0,
      dmg: ({ params}) => params.Xilonen_geo ? 50 : 0,
      cdmg: ({ params}) => params.Xilonen_cryo ? 60 : 0,
      aplus: ({ params}) => params.Xilonen_best ? 2600 : 0,
      a2plus: ({ params}) => params.Xilonen_electro ? 2600 : 0,
      a3plus: ({ params}) => params.Xilonen_anemo ? 2600 : 0,
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
    fyplus: ({ params }) => (params.Lauma_best || params.Lauma_mid) ? 9000 : params.Lauma_low ? 4800 : 0,
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
  }
]

export { TeamBuff }