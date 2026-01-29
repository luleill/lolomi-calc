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
          fnc: 'toggleLolomi',
          permission: 'master'
        }, {
          reg: '^#(启用|开启)(洛洛米|lolomi)计算$',
          fnc: 'toggleLolomi',
          permission: 'master'
        },
        {
          reg: '^#(停用|关闭)标配计算$',
          fnc: 'toggleTemplaterTeam',
          permission: 'master'
        }, {
          reg: '^#(启用|开启)标配计算$',
          fnc: 'toggleTemplaterTeam',
          permission: 'master'
        }
      ]
    })
  }

  async toggleLolomi() {
    try {
      const configData = fs.readFileSync(configPath, 'utf8')
      const config = YAML.parse(configData)
      
      const enable = this.e.msg.includes('启用') || this.e.msg.includes('开启')
      config.lolomicalc = enable
      
      fs.writeFileSync(configPath, YAML.stringify(config), 'utf8')
      
      const statusText = enable ? '启用' : '停用'
      this.e.reply(`已${statusText}lolomi-calc~重启后生效~`)
    } catch (error) {
      logger.error('保存配置失败:', error)
    }
    return true
  }
  
  async toggleTemplaterTeam() {
    try {
      const configData = fs.readFileSync(configPath, 'utf8')
      const config = YAML.parse(configData)
      
      const enable = this.e.msg.includes('启用') || this.e.msg.includes('开启')
      config.templateteam = enable
      
      fs.writeFileSync(configPath, YAML.stringify(config), 'utf8')
      
      const statusText = enable ? '启用' : '停用'
      this.e.reply(`已${statusText}lolomi-calc标配队友计算~重启后生效~`)
    } catch (error) {
      logger.error('保存配置失败:', error)
    }
    return true
  }
}