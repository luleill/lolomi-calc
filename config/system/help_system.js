/*
* 此配置文件为系统使用，请勿修改，否则可能无法正常使用
*
* 如需自定义配置请复制修改上一级help_default.js
*
* */

export const helpCfg = {
  title: 'lolomi帮助',
  subTitle: 'Yunzai-Bot & lolomi-calc',
  columnCount: 3,
  colWidth: 280,
  theme: 'all',
  themeExclude: ['default'],
  style: {
    fontColor: '#ceb78b',
    descColor: '#eee',
    contBgColor: 'rgba(6, 21, 31, .5)',
    contBgBlur: 3,
    headerBgColor: 'rgba(6, 21, 31, .4)',
    rowBgColor1: 'rgba(6, 21, 31, .2)',
    rowBgColor2: 'rgba(6, 21, 31, .35)'
  }
}

export const helpList = [
  {
    group: '极限面板',
    list: [
      {
        icon: 58,
        title: 'jx刻晴',
        desc: '查看角色理论极限面板'
      },
      {
        icon: 59,
        title: 'hb胡桃',
        desc: '查询角色核爆极限面板'
      },
      {
        icon: 60,
        title: 'fz心海',
        desc: '查询角色辅助极限面板'
      },
      {
        icon: 6,
        title: 'jx面板',
        desc: '已定义的所有角色极限面板'
      },
      {
        icon: 7,
        title: 'hb面板',
        desc: '已定义的所有角色核爆面板'
      },
      {
        icon: 8,
        title: 'fz面板',
        desc: '已定义的所有角色辅助面板'
      },
      {
        icon: 81,
        title: '#标配计算停用',
        desc: '首次安装默认停用'
      },
      {
        icon: 81,
        title: '#标配计算启用',
        desc: '计算面板展示2+1和6+5队友'
      },
      {
        icon: 81,
        title: '#洛洛米计算启用',
        desc: '首次安装默认停用'
      },
      {
        icon: 81,
        title: '#洛洛米计算停用',
        desc: '禁用插件'
      },
      {
        icon: 81,
        title: '#更新洛洛米',
        desc: '标准更新'
      },
      {
        icon: 81,
        title: '#强制更新洛洛米',
        desc: '强制更新'
      }
    ]
  }
]

export const isSys = true
