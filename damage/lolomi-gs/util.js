// 圣遗物映射
const artifactMap = {
  'jincheng': '烬城勇者绘卷',
  'yege': '纺月的夜歌',
  'jiaoguan': '教官',
  'fengtao': '翠绿之影',
  'caotao': '深林的记忆',
  'qianyan': '千岩牢固',
  'panyan': '悠古的磐岩',
  'zongshi': '昔日宗室之仪'
};

// 圣遗物别名
const artifactAliases = {
  '烬城': 'jincheng',
  '夜歌': 'yege',
  '纺月': 'yege',
  '教官': 'jiaoguan',
  '风套': 'fengtao',
  '翠绿': 'fengtao',
  '草套': 'caotao',
  '深林': 'caotao',
  '千岩': 'qianyan',
  '磐岩': 'panyan',
  '宗室': 'zongshi',
};

// 角色映射
const characterMap = {
  'KamisatoAyaka': '神里绫华',
  'Jean': '琴',
  'Lisa': '丽莎',
  'Barbara': '芭芭拉',
  'Kaeya': '凯亚',
  'Diluc': '迪卢克',
  'Razor': '雷泽',
  'Amber': '安柏',
  'Venti': '温迪',
  'XiangLing': '香菱',
  'BeiDou': '北斗',
  'XingQiu': '行秋',
  'Xiao': '魈',
  'NingGuang': '凝光',
  'Klee': '可莉',
  'ZhongLi': '钟离',
  'Fischl': '菲谢尔',
  'Bennett': '班尼特',
  'Tartaglia': '达达利亚',
  'Noelle': '诺艾尔',
  'QiQi': '七七',
  'ChongYun': '重云',
  'GanYu': '甘雨',
  'Albedo': '阿贝多',
  'Diona': '迪奥娜',
  'Mona': '莫娜',
  'KeQing': '刻晴',
  'Sucrose': '砂糖',
  'XinYan': '辛焱',
  'Rosaria': '罗莎莉亚',
  'HuTao': '胡桃',
  'Kazuha': '枫原万叶',
  'Yanfei': '烟绯',
  'Yoimiya': '宵宫',
  'Thoma': '托马',
  'Eula': '优菈',
  'RaidenShogun': '雷电将军',
  'Sayu': '早柚',
  'Kokomi': '珊瑚宫心海',
  'Gorou': '五郎',
  'Sara': '九条裟罗',
  'Itto': '荒泷一斗',
  'YaeMiko': '八重神子',
  'Heizou': '鹿野院平藏',
  'YeLan': '夜兰',
  'Kirara': '绮良良',
  'Aloy': '埃洛伊',
  'ShenHe': '申鹤',
  'YunJin': '云堇',
  'KukiShinobu': '久岐忍',
  'KamisatoAyato': '神里绫人',
  'Collei': '柯莱',
  'Dori': '多莉',
  'Tighnari': '提纳里',
  'Nilou': '妮露',
  'Cyno': '赛诺',
  'Candace': '坎蒂丝',
  'Nahida': '纳西妲',
  'Layla': '莱依拉',
  'Wanderer': '流浪者',
  'Faruzan': '珐露珊',
  'YaoYao': '瑶瑶',
  'Alhaitham': '艾尔海森',
  'Dehya': '迪希雅',
  'Mika': '米卡',
  'Kaveh': '卡维',
  'BaiZhu': '白术',
  'Lynette': '琳妮特',
  'Lyney': '林尼',
  'Freminet': '菲米尼',
  'Wriothesley': '莱欧斯利',
  'Neuvillette': '那维莱特',
  'Charlotte': '夏洛蒂',
  'Furina': '芙宁娜',
  'Chevreuse': '夏沃蕾',
  'Navia': '娜维娅',
  'Gaming': '嘉明',
  'XianYun': '闲云',
  'Chiori': '千织',
  'Sigewinne': '希格雯',
  'Arlecchino': '阿蕾奇诺',
  'Sethos': '赛索斯',
  'Clorinde': '克洛琳德',
  'Emilie': '艾梅莉埃',
  'Kachina': '卡齐娜',
  'Mualani': '玛拉妮',
  'Kinich': '基尼奇',
  'Xilonen': '希诺宁',
  'Ororon': '欧洛伦',
  'Chasca': '恰斯卡',
  'Citlali': '茜特菈莉',
  'Mavuika': '玛薇卡',
  'LanYan': '蓝砚',
  'Mizuki': '梦见月瑞希',
  'Iansan': '伊安珊',
  'Varesa': '瓦雷莎',
  'Escoffier': '爱可菲',
  'Ifa': '伊法',
  'Dahlia': '塔利雅',
  'Skirk': '丝柯克',
  'Ineffa': '伊涅芙',
  'Aino': '爱诺',
  'Lauma': '菈乌玛',
  'Flins': '菲林斯',
  'Nefer': '奈芙尔',
  'Jahoda': '雅珂达',
  'Durin': '杜林',
  'Columbina': '哥伦比娅'
};

// 角色简称 - 常用辅助
const charactAliases = {
  '绫华': 'KamisatoAyaka',
  '万叶': 'Kazuha',
  '雷神': 'RaidenShogun',
  '心海': 'Kokomi',
  '奶奶': 'Citlali',
  '九条': 'Sara',
  '少女': 'Columbina',
};

const nameabbr = (characterName) => {
  // 个别角色使用常规叫法
  const specials = {
    '枫原万叶': '万',
    '申鹤': '鹤',
    '珊瑚宫心海': '心',
    '鹿野院平藏': '平',
    '流浪者': '散',
    '纳西妲': '草',
    '哥伦比娅': '月',
  };
  
  return specials[characterName] || characterName.charAt(0);
};

/**
 * 队友圣遗物配置
 * @param {...string} artifactNames - 圣遗物名称列表
 * @returns {Object}
 */
const ArtifactConfig = (...artifactNames) => {
  let params = {};
  
  artifactNames.forEach(artifactName => {
    if (artifactAliases[artifactName]) {
      const englishKeyName = artifactAliases[artifactName];
      params[englishKeyName] = true;
    } else if (artifactMap[artifactName]) {
      params[artifactName] = true;
    } else {
      params[artifactName] = true;
    }
  });
  
  return params;
};

/**
 * @param {number} cons
 * - 队友名称，calc里尽量按照官方定义的角色名称写
 * @param {string[]} teammateNames
 * @returns {Object}
 */
const TeammateConfig = (cons, teammateNames = []) => {
  const [isLow, isMid, isBest] = [cons < 2, cons >= 2 && cons < 6, cons >= 6]; 
  
  let params = {};
  
  teammateNames.forEach(teammate => {
    let Name = teammate;
    if (charactAliases[teammate]) {
      Name = charactAliases[teammate];
    } 
    else {
      for (const [eng, chs] of Object.entries(characterMap)) {
        if (chs === teammate) {
          Name = eng;
          break;
        }
      }
    }
    params[`${Name}_best`] = isBest;
    params[`${Name}_mid`] = isMid;
    params[`${Name}_low`] = isLow;
  });
  
  return params;
};

/**
 * 根据主角色命座和队友生成配置标题前缀
 * @param {number} cons
 * @param {string[]} teammateNames - 队友
 * @param {string} mainCharName - 主角色名称
 * @returns {string}
 */
const getTeamtitle = (cons, teammateNames, mainCharName = null) => {
  let configLevel;
  if (cons >= 6) {
    configLevel = '高配';
  } else if (cons >= 2) {
    configLevel = '中配';
  } else {
    configLevel = '低配';
  }

  const primaryChar = mainCharName || (teammateNames.length > 0 ? teammateNames[0] : '');
  
  let primaryCharName = primaryChar;
  if (!characterMap[primaryChar]) {
    for (const [eng, chs] of Object.entries(characterMap)) {
      if (chs === primaryChar) {
        primaryCharName = chs;
        break;
      }
    }
  } else {
    for (const [eng, chs] of Object.entries(characterMap)) {
      if (eng === primaryChar) {
        primaryCharName = chs;
        break;
      }
    }
  }

  let primaryCharFirstLetter = nameabbr(primaryCharName);

  const teammateInitials = teammateNames.map(name => {
    if (characterMap[name]) {
      return nameabbr(characterMap[name]);
    }
    return nameabbr(name);
  });

  const uniqueInitials = [...new Set([primaryCharFirstLetter, ...teammateInitials])];
  const teamName = uniqueInitials.join('');
  
  return `${configLevel} ${teamName}`;
};

/**
 * @param {number} cons
 * @param {string[]} teammateNames - 队友
 * @param {string[]} artifactNames - 队友配带圣遗物
 * @param {string} mainCharName - 主角色
 * @returns {Object}
 */
const TeamConfig = (cons, teammateNames = [], artifactNames = [], mainCharName = null) => {
  return {
    params: {
      ...TeammateConfig(cons, teammateNames),
      ...ArtifactConfig(...artifactNames)
    },
    title: getTeamtitle(cons, teammateNames, mainCharName)
  };
};

/**
 * 自适应高中低队友配置
 * 主角色命座不一样使用不同队友的情况下使用
 * @param {number} cons
 * @param {Object} adaptiveconfig  - 自定义配置
 * @param {string[]} artifactNames - 队友配带圣遗物
 * @param {string} mainCharName - 主角色名称
 * @returns {Object}
 */
const teamdefined = (cons, adaptiveconfig, artifactNames = [], mainCharName = null) => {
  let selectedTeammates = [];
  let configLevel = '';
  
  if (cons >= 6) {
    selectedTeammates = adaptiveconfig.best || [];
    configLevel = '高配';
  } else if (cons >= 2) {
    selectedTeammates = adaptiveconfig.mid || [];
    configLevel = '中配';
  } else {
    selectedTeammates = adaptiveconfig.low || [];
    configLevel = '低配';
  }
  
  // params
  const params = {
    ...TeammateConfig(cons, selectedTeammates),
    ...ArtifactConfig(...artifactNames)
  };
  
  // title
  const primaryChar = mainCharName || (selectedTeammates.length > 0 ? selectedTeammates[0] : '');
  
  // 主角色
  let primaryCharName = primaryChar;
  if (!characterMap[primaryChar]) {
    for (const [eng, chs] of Object.entries(characterMap)) {
      if (chs === primaryChar) {
        primaryCharName = chs;
        break;
      }
    }
  } else {
    for (const [eng, chs] of Object.entries(characterMap)) {
      if (eng === primaryChar) {
        primaryCharName = chs;
        break;
      }
    }
  }

  let primaryCharFirstLetter = nameabbr(primaryCharName);

  const teammateInitials = selectedTeammates.map(name => {
    if (characterMap[name]) {
      return nameabbr(characterMap[name]);
    }
    return nameabbr(name);
  });

  const uniqueInitials = [...new Set([primaryCharFirstLetter, ...teammateInitials])];
  const teamName = uniqueInitials.join('');
  
  const title = `${configLevel} ${teamName}`;
  
  return {
    params,
    title
  };
};

export { 
  TeammateConfig, 
  getTeamtitle, 
  ArtifactConfig, 
  TeamConfig, 
  teamdefined 
};