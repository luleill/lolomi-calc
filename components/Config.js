import chokidar from 'chokidar'
import YAML from 'yaml'
import fs from 'node:fs'

const _path = process.cwd()

class Config {
  constructor () {
    this.def = `${_path}/plugins/lolomi-calc/config/system/`
    this.defSet = {}

    this.user = `${_path}/plugins/lolomi-calc/config/`
    this.userSet = {}

    this.watcher = { userSet: {}, defSet: {} }

    this.initCfg()
  }

  /**
   * 初始化配置文件
   */
  initCfg () {
    const file = 'config.yaml'
    if (!fs.existsSync(`${this.user}${file}`)) {
      if (!fs.existsSync(this.user)) {
        fs.mkdirSync(this.user, { recursive: true })
      }
      if (fs.existsSync(`${this.def}${file}`)) {
        fs.copyFileSync(`${this.def}${file}`, `${this.user}${file}`)
      }
    }
    this.watch(`${this.user}${file}`, file.replace('.yaml', ''), 'userSet')
  }

  /**
   * 用户配置
   * @param {'def'|'user'} type 默认配置/用户配置
   * @param {string} name 文件名
   */
  getConfig (type, name) {
    const conf = this.getYaml(this.getFilePath(type), name)
    return conf
  }

  /**
   * 通用yaml读取
   * @param {string} path 路径
   * @param {string} name 文件名
   */
  getYaml (path, name) {
    try {
      const file = `${path}${name}.yaml`
      if (fs.existsSync(file)) {
        const data = fs.readFileSync(file, 'utf8')
        return YAML.parse(data)
      }
    } catch (error) {
      logger.error(`[lolomi-calc] 配置文件读取失败: ${error}`)
    }
    return {}
  }

  /**
   * 获取文件路径
   * @param {'def'|'user'} type 类型
   */
  getFilePath (type) {
    return type === 'def' ? this.def : this.user
  }

  /**
   * 监听配置文件
   * @param {string} file 文件路径
   * @param {string} name 文件名
   * @param {string} type 类型
   */
  watch (file, name, type = 'userSet') {
    if (this.watcher[type][name]) return

    const watcher = chokidar.watch(file)
    watcher.on('change', () => {
      delete this[type][name]
      logger.mark(`[lolomi-calc] 配置文件 ${name} 已更新`)
    })

    this.watcher[type][name] = watcher
  }

  /** 销毁监听 */
  destroy () {
    Object.values(this.watcher).forEach((watchers) => {
      Object.values(watchers).forEach((watcher) => {
        watcher.close()
      })
    })
  }
}

export default new Config()
