import lodash from 'lodash'
import YAML from 'yaml'
import fs from 'node:fs'

const _path = process.cwd()
const _cfgPath = `${_path}/plugins/lolomi-calc/components/`
let cfg = {}

let configPath = `${_path}/plugins/lolomi-calc/config/`
let defSetPath = './plugins/lolomi-calc/defSet/'

const getConfig = function (app, name) {
  let defp = `${defSetPath}${app}/${name}.yaml`
  if (!fs.existsSync(`${configPath}${app}.${name}.yaml`)) {
    fs.copyFileSync(defp, `${configPath}${app}.${name}.yaml`)
  }
  let conf = `${configPath}${app}.${name}.yaml`

  try {
    return YAML.parse(fs.readFileSync(conf, 'utf8'))
  } catch (error) {
    logger.error(`[${app}][${name}] 格式错误 ${error}`)
    return false
  }
}

try {
  if (fs.existsSync(_cfgPath + 'cfg.json')) {
    cfg = JSON.parse(fs.readFileSync(_cfgPath + 'cfg.json', 'utf8')) || {}
    cfg.gachas = getConfig('gacha', 'gacha')
  }
} catch (e) {
  // do nth
}

let Cfg = {
  get (rote, def = '') {
    return lodash.get(cfg, rote, def)
  },
  set (rote, val) {
    lodash.set(cfg, rote, val)
    let gachas = cfg.gachas
    delete cfg.gachas
    fs.writeFileSync(_cfgPath + 'cfg.json', JSON.stringify(cfg, null, '\t'))
    cfg.gachas = gachas
  },
  del (rote) {
    lodash.set(cfg, rote, undefined)
    fs.writeFileSync(_cfgPath + 'cfg.json', JSON.stringify(cfg, null, '\t'))
  },
  /**
   * 根据系统配置的比例因子缩放给定的百分比值，并返回相应的CSS transform样式字符串
   * @param {number} pct - 输入的百分比值，默认为1
   * @returns {string} 返回包含transform:scale样式的CSS样式字符串
   */
  scale (pct = 1) {
      // 获取系统配置中的缩放比例，默认值为100
      let scale = Cfg.get('sys.scale', 100)
      // 将缩放比例限制在0.5到2之间
      scale = Math.min(2, Math.max(0.5, scale / 100))
      // 应用缩放比例到输入的百分比值
      pct = pct * scale
      return `style=transform:scale(${pct})`
    },
  isDisable (e, rote) {
    if (Cfg.get(rote, true)) {
      return false
    }
    return !/^#*洛洛米/.test(e.msg || '')
  },
  merged () {
    return lodash.merge({}, cfg)
  }
}

export default Cfg