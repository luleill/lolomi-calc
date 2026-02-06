import ProfileDmg from '../../miao-plugin/models/ProfileDmg.js'
import Config from './Config.js'
import fs from 'node:fs'

const cfg = Config.getConfig('user', 'config')
const basePath = process.cwd()
const pluginPath = `${basePath}/plugins/lolomi-calc`

const Start = {
  init() {
    logger.mark('[lolomi-calc] 初始化...')
    logger.mark('[lolomi-calc] 配置状态 - lolomicalc:', cfg.lolomicalc)

    this.originalDmgRulePath = ProfileDmg.dmgRulePath
    this.setupPrioritySystem()
    this.startMonitoring()
  },

  /**
   * 优先级
   */
  setupPrioritySystem() {
    const self = this
    const originalMethod = ProfileDmg.dmgRulePath
    
    ProfileDmg.dmgRulePath = function(name, game = 'gs') {
      // 不是原神角色直接使用喵喵
      if (game !== 'gs') {
        return originalMethod.call(this, name, game)
      }
      return self.handleGenshinCharacter.call(self, name, game, originalMethod)
    }
  },

  /**
   * 洛洛米仅处理原神角色
   */
  handleGenshinCharacter(name, game, originalMethod) {
    logger.mark(`[lolomi-calc] 处理角色计算: ${name}`)
    
    if (!cfg.lolomicalc) {
      logger.debug('[lolomi-calc] 洛洛米计算未启用')
      return this.checkFallback(name, game, originalMethod)
    }
    
    const lolomiPath = this.findLolomiFile(name)
    if (lolomiPath) {
      return { path: lolomiPath, createdBy: 'lolomi-calc' }
    }
    logger.debug('[lolomi-calc] 暂无该角色计算，使用其他插件计算')
    return this.checkFallback(name, game, originalMethod)
  },

  findLolomiFile(name) {
    const normalizedName = this.normalizeName(name)
    const filePath = `${pluginPath}/damage/lolomi-gs/${normalizedName}/calc_llm.js`

    if (fs.existsSync(filePath)) {
      return filePath
    }
    return null
  },

  /**
   * 适配梁氏
   */
  checkFallback(name, game, originalMethod) {
    const liangshiStatus = this.getLiangshiStatus()
    logger.mark(`[lolomi-calc] 梁氏状态: ${JSON.stringify(liangshiStatus)}`)
    if (liangshiStatus.dirExists && liangshiStatus.configExists && liangshiStatus.calcLiang && liangshiStatus.gsEnabled) {
      const liangshiPath = this.findLiangshiFile(name, game)
      if (liangshiPath) {
        return { path: liangshiPath, createdBy: 'liangshi-calc' }
      }
    }
    
    return originalMethod.call(ProfileDmg, name, game)
  },

  getLiangshiStatus() {
    try {
      const liangshiDir = `${basePath}/plugins/liangshi-calc`
      const configPath = `${liangshiDir}/config/config.yaml`

      logger.debug(`[lolomi-calc] 检查梁氏目录: ${liangshiDir}`)
      logger.debug(`[lolomi-calc] 检查配置文件: ${configPath}`)

      const dirExists = fs.existsSync(liangshiDir)
      const configExists = fs.existsSync(configPath)

      let gsEnabled = true
      let calcLiang = false

      if (configExists) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8')
          logger.debug(`[lolomi-calc] 梁氏配置内容预览: ${configContent.substring(0, 200)}...`)

          const gsDisabledMatch = configContent.match(/GsDisabled:\s*(true|false)/i)
          const calcLiangMatch = configContent.match(/calcLiang:\s*(true|false)/i)

          if (gsDisabledMatch) {
            gsEnabled = gsDisabledMatch[1].toLowerCase() !== 'true'
          }
          if (calcLiangMatch) {
            calcLiang = calcLiangMatch[1].toLowerCase() === 'true'
          }
        } catch (e) {
          logger.error(`[lolomi-calc] 读取梁氏配置失败: ${e.message}`)
        }
      } else {
        logger.warn(`[lolomi-calc] 梁氏配置文件不存在: ${configPath}`)
      }

      const active = dirExists && configExists && calcLiang

      return {
        dirExists,
        configExists,
        gsEnabled,
        calcLiang,
        active
      }
    } catch (e) {
      logger.error(`[lolomi-calc] 检查梁氏状态异常: ${e.message}`)
      return { dirExists: false, configExists: false, gsEnabled: false, calcLiang: false, active: false }
    }
  },

  findLiangshiFile(name, game) {
    const normalizedName = this.normalizeName(name)
    
    const filePaths = [
      `${basePath}/plugins/liangshi-calc/damage/liangshi-${game}/${normalizedName}/calc_basic.js`,
      `${basePath}/plugins/liangshi-calc/damage/liangshi-${game}/${normalizedName}/calc_user.js`,
      `${basePath}/plugins/liangshi-calc/damage/liangshi-${game}/${normalizedName}/calc_complete.js`,
      `${basePath}/plugins/liangshi-calc/damage/liangshi-${game}/${normalizedName}/calc_team.js`,
      `${basePath}/plugins/liangshi-calc/damage/liangshi-${game}/${normalizedName}/calc_concise.js`,
    ]

    for (let filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        return filePath
      }
    }
    return null
  },

  normalizeName(name) {
    let newName = name
    return newName
  },

  /**
   * 监控覆盖
   */
  startMonitoring() {
    setInterval(() => {
      try {
        const currentMethod = ProfileDmg.dmgRulePath
        const methodString = currentMethod?.toString() || ''

        if (!methodString.includes('[lolomi-calc]') && !methodString.includes('handleGenshinCharacter')) {
          logger.warn('[lolomi-calc] 检测到方法被覆盖，正在恢复...')
          this.setupPrioritySystem()
        }
      } catch (e) {
        logger.debug('[lolomi-calc] 监控检查异常:', e.message)
      }
    }, 5000)
  }
}

export default Start