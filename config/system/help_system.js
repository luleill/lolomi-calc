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
    group: '有问题联系729011189',
    list: [
      {
        icon: 58,
        title: 'jx刻晴',
        desc: '极限面板，暂时沿用老数据，需要更新角色可提'
      },
      {
        icon: 59,
        title: 'hb胡桃',
        desc: '核爆面板'
      },
      {
        icon: 60,
        title: 'fz心海',
        desc: '辅助面板'
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
        desc: '首次安装默认启用'
      },
      {
        icon: 81,
        title: '#洛洛米计算停用',
        desc: '禁用插件，手动重启生效'
      },
      {
        icon: 81,
        title: '#命座对比停用',
        desc: '首次安装默认停用，计算面板不展示命座对比'
      },
      {
        icon: 81,
        title: '#命座对比启用',
        desc: '开启命座对比，重启生效，返回图片会变慢几秒'
      },
      {
        icon: 81,
        title: '#更新洛洛米',
        desc: '标准更新，更新成功自动重启'
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
