import { Cfg, Version, Common, Data } from '#lolomi'
import Theme from './help/theme.js'
import lodash from 'lodash'
import fs from 'node:fs'

const _path = process.cwd()
const helpPath = `${_path}/plugins/lolomi-calc/resources/help`

export class Help extends plugin {
  constructor () {
    super({
      name: '[伤害计算拓展插件]帮助',
      dsc: '伤害计算拓展帮助',
      event: 'message',
      priority: 40,
      rule: [
        {
          reg: '^#?(洛洛米|lolomi)帮助$',
          fnc: 'help'
        },
        {
          reg: '^#?(洛洛米|lolomi)版本$',
          fnc: 'versionInfo'
        }
      ]
    })
  }

  async help (e) {
    if (Cfg.get('sys.help', false)) return false

    let custom = {}
    let help = {}
    if (fs.existsSync(`${helpPath}/help-cfg.js`)) {
      console.log('lolomi-calc: 检测到存在help-cfg.js配置\n建议将help-cfg.js移为config/help.js或重新复制config/help_default.js进行配置~')
      help = await import(`file://${helpPath}/help-cfg.js?version=${new Date().getTime()}`)
    } else if (fs.existsSync(`${helpPath}/help-list.js`)) {
      console.log('lolomi-calc: 检测到存在help-list.js配置，建议将help-list.js移为config/help.js或重新复制config/help_default.js进行配置~')
      help = await import(`file://${helpPath}/help-list.js?version=${new Date().getTime()}`)
    }

    let { diyCfg, sysCfg } = await Data.importCfg('help')

    // 兼容一下旧字段
    if (lodash.isArray(help.helpCfg)) {
      custom = {
        helpList: help.helpCfg,
        helpCfg: {}
      }
    } else custom = help

    let helpConfig = lodash.defaults(diyCfg.helpCfg || {}, custom.helpCfg, sysCfg.helpCfg)
    let helpList = diyCfg.helpList || custom.helpList || sysCfg.helpList

    let helpGroup = []

    lodash.forEach(helpList, (group) => {
      if (group.auth && group.auth === 'master' && !e.isMaster) return true

      lodash.forEach(group.list, (help) => {
        let icon = help.icon * 1
        if (!icon) help.css = 'display:none'
        else {
          let x = (icon - 1) % 10
          let y = (icon - x - 1) / 10
          help.css = `background-position:-${x * 50}px -${y * 50}px`
        }
      })

      helpGroup.push(group)
    })
    let themeData = await Theme.getThemeData(diyCfg.helpCfg || {}, sysCfg.helpCfg || {})
    return await Common.render('help/index', {
      helpCfg: helpConfig,
      helpGroup,
      ...themeData,
      element: 'default'
    }, { e, scale: 1.2 })
  }

  async versionInfo (e) {
    try {
      
      if (!Version.version) {
        return false;
      }
      
      if (!Version.changelogs || Version.changelogs.length === 0) {
      }
      
      const renderResult = await Common.render('help/version-info', {
        currentVersion: Version.version,
        changelogs: Version.changelogs,
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
