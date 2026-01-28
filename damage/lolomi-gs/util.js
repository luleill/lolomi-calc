/**
 * 队伍配置
 */

// 角色名称映射
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
  'Lauma': '菈乌玛',
  'Flins': '菲林斯',
  'Nefer': '奈芙尔',
  'Jahoda': '雅珂达',
  'Durin': '杜林',
  'Columbina': '哥伦比娅'
};

/**
 * 根据命座数生成队友配置参数
 * @param {number} cons - 命座数
 * @param {string[]} teammateNames - 队友名称数组，calc里严格按照characterMap里定义的名称写
 * @returns {Object} 生成的参数对象
 */
const TeammateConfig = (cons, teammateNames = []) => {
  const [isLow, isMid, isBest] = [cons < 2, cons >= 2 && cons < 6, cons >= 6]; 
  
  let params = {};
  
  teammateNames.forEach(teammate => {
    // 中文名称转换为英文名称
    let englishName = teammate;
    for (const [eng, chs] of Object.entries(characterMap)) {
      if (chs === teammate) {
        englishName = eng;
        break;
      }
    }
    params[`${englishName}_best`] = isBest;
    params[`${englishName}_mid`] = isMid;
    params[`${englishName}_low`] = isLow;
  });
  
  return params;
};

const getCharacterInitial = (characterName) => {
  // 个别角色常规叫法
  const specialInitials = {
    '枫原万叶': '万',
    '申鹤': '鹤',
    '珊瑚宫心海': '心',
    '鹿野院平藏': '平',
    '流浪者': '散'
  };
  
  return specialInitials[characterName] || characterName.charAt(0);
};

/**
 * 根据主角色命座数和队友名称生成配置标题前缀
 * @param {number} cons
 * @param {string[]} teammateNames - 队友名称数组
 * @param {string} mainCharName - 主角色名称
 * @returns {string} 生成的标题前缀
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
  
  let primaryCharFirstLetter = primaryChar.charAt(0);
  if (characterMap[primaryChar]) {
    primaryCharFirstLetter = getCharacterInitial(characterMap[primaryChar]);
  }

  const teammateInitials = teammateNames.map(name => {
    if (characterMap[name]) {
      return getCharacterInitial(characterMap[name]);
    }
    return getCharacterInitial(name);
  });

  const uniqueInitials = [...new Set([primaryCharFirstLetter, ...teammateInitials])];
  const teamName = uniqueInitials.join('');
  
  return `${configLevel} ${teamName}`;
};

export { TeammateConfig, getTeamtitle };