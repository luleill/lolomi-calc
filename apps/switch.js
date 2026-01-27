import fs from 'node:fs'
import { Config } from '#lolomi'
import YAML from 'yaml' 
const _path = process.cwd()
const cfg = Config.getConfig('user', 'config')
const configPath = `${_path}/plugins/lolomi-calc/config/config.yaml`

export class feedback extends plugin {
  constructor () {
    super({
      name: 'lolomi-calc开关',
      dsc: 'lolomi-calc开关',
      event: 'message',
      priority: 8000,
      rule: [
        {
          reg: '^#(停用|关闭)(洛洛米|lolomi)计算$',
          fnc: 'stoplolomi',
          permission: 'master'
        }, {
          reg: '^#(启用|开启)(洛洛米|lolomi)计算$',
          fnc: 'startlolomi',
          permission: 'master'
        }
      ]
    })
  }

  async startlolomi () {
    try {
      const configData = fs.readFileSync(configPath, 'utf8')
      const config = YAML.parse(configData)
      config.lolomicalc = true
      fs.writeFileSync(configPath, YAML.stringify(config), 'utf8')
      this.e.reply('已启用lolomi-calc~重启后生效~')
    } catch (error) {
      logger.error('保存配置失败:', error)
    }
    return true
  }
  async stoplolomi () {
    try {
      const configData = fs.readFileSync(configPath, 'utf8')
      const config = YAML.parse(configData)
      config.lolomicalc = false
      fs.writeFileSync(configPath, YAML.stringify(config), 'utf8')
      this.e.reply('已停用lolomi-calc~重启后生效~')
    } catch (error) {
      logger.error('保存配置失败:', error)
    }
    return true
  }
}
