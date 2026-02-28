import { Cfg, Version, Common, Data } from '#lolomi'
import Theme from './help/theme.js'
import lodash from 'lodash'

export class Help extends plugin {
  constructor () {
    super({
      name: 'lolomi帮助',
      dsc: 'lolomi帮助',
      event: 'message',
      priority: 40,
      rule: [
        {
          reg: '^#?(洛洛米|lolomi)帮助$',
          fnc: 'lolomihelp'
        },
        {
          reg: '^#?(洛洛米|lolomi)版本$',
          fnc: 'versionInfo'
        }
      ]
    })
  }

  async lolomihelp (e) {
    if (Cfg.get('sys.help', false)) return false
    let { diyCfg, sysCfg } = await Data.importCfg('help')
    // 自定义 > 默认
    let helpConfig = lodash.defaults(diyCfg.helpCfg || {}, sysCfg.helpCfg)
    let helpList = diyCfg.helpList || sysCfg.helpList
    let helpGroup = []

    lodash.forEach(helpList, (group) => {
      if (group.auth && group.auth === 'master' && !e.isMaster) return true
      lodash.forEach(group.list, (help) => {
        let icon = help.icon * 1
        if (!icon) {
          help.css = 'display:none'
        } else {
          // 图标编号转为坐标
          let x = (icon - 1) % 10
          let y = (icon - x - 1) / 10
          help.css = `background-position:-${x * 50}px -${y * 50}px`
        }
      })

      helpGroup.push(group)
    })
    
    let themeData = await Theme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})
    
    return await Common.render('help/index', {
      helpCfg: helpConfig,    // 帮助配置
      helpGroup,              // 帮助分组
      ...themeData,           // 主题数据
      element: 'default'      // 默认元素样式
    }, { e, scale: 1.2 })     // 渲染参数：事件对象和缩放比例
  }

  async versionInfo (e) {
    try {
      if (!Version.version) {
        return false;
      }
      if (!Version.changelogs || Version.changelogs.length === 0) {
      }
      const renderResult = await Common.render('help/version-info', {
        currentVersion: Version.version,    // 当前版本号
        changelogs: Version.changelogs,     // 版本日志
        elem: 'dendro'
      }, { e, scale: 1.2 });
      
      return renderResult;
      
    } catch (error) {
      logger.error(`[lolomi-calc] versionInfo error: ${error.message}`);
      logger.error(error.stack);
      return false;
    }
  }
}