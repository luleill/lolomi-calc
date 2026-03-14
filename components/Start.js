/**
 * 插件启动初始化、计算优先级设置、命座对比注入
 * 与梁氏和喵喵的兼容
 */

import ProfileDmg from '../../miao-plugin/models/ProfileDmg.js'
import Config from './Config.js'
import ConsCompare from './Constellation.js'
import fs from 'node:fs'

const basePath = process.cwd()
const pluginPath = `${basePath}/plugins/lolomi-calc`
const cfg = Config.getConfig('user', 'config')
/** @constant {number} 日志缓存去重间隔（毫秒） */
const LOG_DEBOUNCE_MS = 5000
/** @constant {number} 梁氏状态缓存有效期（毫秒） */
const LIANGSHI_CACHE_TTL = 10000
/** @constant {number} 监控检查间隔（毫秒） */
const MONITOR_INTERVAL_MS = 5000

const Start = {
  init() {
    logger.mark('[lolomi-calc] 初始化完成...')
    logger.mark('[lolomi-calc] 计算状态 - lolomicalc:', cfg.lolomicalc)
    logger.mark('[lolomi-calc] 标配预设 - templateteam:', cfg.templateteam)
    logger.mark('[lolomi-calc] 命座对比 - conscompare:', cfg.conscompare)

    this.originalDmgRulePath = ProfileDmg.dmgRulePath
    this.originalCalcData = ProfileDmg.prototype.calcData
    
    this.initialization()
    this.setupPrioritySystem()
    this.setConsCalc()
    this.startMonitoring()
  },
  /**
   * 初始化极限面板数据并复制到云崽的数据目录
   */
  initialization() {
    this.logCache = new Map()
    
    const sourceBasePath = `${basePath}/plugins/lolomi-calc/replace/data/1`
    const fileMappings = [{
      source: `${sourceBasePath}/PlayerData/gs`,
      miaomiao: `${basePath}/data/PlayerData/gs`,
      extension: '.json'
    }]
    
    fileMappings.forEach(mapping => {
      try {
        const sourceFiles = fs.readdirSync(mapping.source)
          .filter(file => file.endsWith(mapping.extension))
        
        sourceFiles.forEach(filename => {
          fs.copyFileSync(
            `${mapping.source}/${filename}`, 
            `${mapping.miaomiao}/${filename}`
          )
        })
      } catch (error) {
        logger.debug(`[lolomi-calc] 初始化面板数据失败: ${error.message}`)
      }
    })
  },
  /**
   * 计算优先级
   */
  setupPrioritySystem() {
    const self = this
    const originalMethod = ProfileDmg.dmgRulePath
    
    ProfileDmg.dmgRulePath = function(name, game = 'gs') {
      // 仅处理原神角色
      if (game !== 'gs') {
        return originalMethod.call(this, name, game)
      }
      return self.handleGenshinCharacter.call(self, name, game, originalMethod)
    }
  },

  /**
   * 原神角色计算规则
   * 优先级：洛洛米 > 梁氏 > 喵喵默认
   */
  handleGenshinCharacter(name, game, originalMethod) {
    const logKey = `genshin_calc_${name}`
    const now = Date.now()
    const lastLog = this.logCache.get(logKey)
    
    if (!lastLog || now - lastLog > LOG_DEBOUNCE_MS) {
      logger.mark(`[lolomi-calc] 处理角色计算：${name}`)
      this.logCache.set(logKey, now)
    }
    
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

    return fs.existsSync(filePath) ? filePath : null
  },

  checkFallback(name, game, originalMethod) {
    const liangshiStatus = this.getLiangshiStatus()
    
    // 梁氏是否可用且状态启用
    if (liangshiStatus.active && liangshiStatus.gsEnabled) {
      const liangshiPath = this.findLiangshiFile(name, game)
      if (liangshiPath) {
        return { path: liangshiPath, createdBy: 'liangshi-calc' }
      }
    }
    // 喵喵默认计算
    return originalMethod.call(ProfileDmg, name, game)
  },

  /**
   * 检查梁氏插件状态
   * @returns {boolean} returns.dirExists - 插件目录是否存在
   * @returns {boolean} returns.configExists - 配置文件是否存在
   * @returns {boolean} returns.gsEnabled - 原神计算是否启用
   * @returns {boolean} returns.calcLiang - 梁氏计算是否启用
   * @returns {boolean} returns.active - 插件状态
   */
  getLiangshiStatus() {
    const now = Date.now()
    const cacheKey = 'liangshi_status_cache'
    const cached = this.logCache.get(cacheKey)
    
    if (cached && now - cached.timestamp < LIANGSHI_CACHE_TTL) {
      return cached.status
    }
    
    try {
      const liangshiDir = `${basePath}/plugins/liangshi-calc`
      const configPath = `${liangshiDir}/config/config.yaml`

      const dirExists = fs.existsSync(liangshiDir)
      const configExists = fs.existsSync(configPath)

      let gsEnabled = true
      let calcLiang = false

      if (configExists) {
        try {
          const configContent = fs.readFileSync(configPath, 'utf8')

          const gsDisabledMatch = configContent.match(/GsDisabled:\s*(true|false)/i)
          const calcLiangMatch = configContent.match(/calcLiang:\s*(true|false)/i)

          if (gsDisabledMatch) {
            gsEnabled = gsDisabledMatch[1].toLowerCase() !== 'true'
          }
          if (calcLiangMatch) {
            calcLiang = calcLiangMatch[1].toLowerCase() === 'true'
          }
        } catch (e) {
          logger.debug(`[lolomi-calc] 读取梁氏配置失败：${e.message}`)
        }
      }

      const active = dirExists && configExists && calcLiang

      const status = {
        dirExists,
        configExists,
        gsEnabled,
        calcLiang,
        active
      }
      
      const previous = this.logCache.get('liangshi_status_previous')
      const statusChanged = !previous || JSON.stringify(previous) !== JSON.stringify(status)
      
      if (statusChanged) {
        logger.mark(`[lolomi-calc] 梁氏状态：${JSON.stringify(status)}`)
        this.logCache.set('liangshi_status_previous', status)
      }
      
      this.logCache.set(cacheKey, { timestamp: now, status })
      return status
    } catch (e) {
      logger.debug(`[lolomi-calc] 检查梁氏状态异常：${e.message}`)
      const errorStatus = { 
        dirExists: false, 
        configExists: false, 
        gsEnabled: false, 
        calcLiang: false, 
        active: false 
      }
      this.logCache.set(cacheKey, { timestamp: now, status: errorStatus })
      return errorStatus
    }
  },

  findLiangshiFile(name, game) {
    const normalizedName = this.normalizeName(name)
    
    const calcTypes = ['basic', 'user', 'complete', 'team', 'concise']
    
    for (const type of calcTypes) {
      const filePath = `${basePath}/plugins/liangshi-calc/damage/liangshi-${game}/${normalizedName}/calc_${type}.js`
      if (fs.existsSync(filePath)) {
        return filePath
      }
    }
    return null
  },

  /**
   * 预留方法，处理角色别名映射
   */
  normalizeName(name) {
    // 预留
    return name
  },

  /**
   * 从calc_llm.js文件中获取 consDmgKey
   */
  getConsDmgKey(characterName) {
    try {
      const normalizedName = this.normalizeName(characterName)
      const filePath = `${pluginPath}/damage/lolomi-gs/${normalizedName}/calc_llm.js`
      if (!fs.existsSync(filePath)) {
        return null
      }
      const content = fs.readFileSync(filePath, 'utf8')
      const match = content.match(/export\s+const\s+consDmgKey\s*=\s*['"`]([^'"`]+)['"`]/)
      return match ? match[1].trim() : null
    } catch (error) {
      return null
    }
  },

  /**
   * 命座对比计算
   */
  setConsCalc() {
    const self = this
    const originalCalcData = this.originalCalcData
    
    ProfileDmg.prototype.calcData = async function(params) {
      if (this.isCalculatingCons) {
        return await originalCalcData.call(this, params)
      }
      const result = await originalCalcData.call(this, params)
      if (!result || !this.char || !this.profile) {
        return result
      }
      
      const enableConstellation = cfg.conscompare ?? true
      if (!enableConstellation) {
        return result
      }
      
      try {
        const characterName = this.char.name
        const currentCons = Number(this.profile.cons)
        const calcRule = await this.getCalcRule()
        
        if (calcRule?.defDmgIdx !== undefined && calcRule.defDmgIdx >= 0) {
          const calcKey = `constellation_calc_${characterName}_${currentCons}`
          if (!this[calcKey]) {
            this[calcKey] = true
            const consDmgKey = self.getConsDmgKey(characterName)
            const consCalcData = {
              defDmgIdx: calcRule.defDmgIdx,
              consDmgKey: consDmgKey,
              details: calcRule.details
            }
            await self.calcConsDiff(characterName, currentCons, consCalcData, this.profile, result)
          }
        }
      } catch (error) {
        logger.debug(`[lolomi-calc] 命座计算出错: ${error.message}`)
      }
      
      return result
    }
  },
  
  /**
   * 命座伤害对比计算
   * @param {string} characterName - 角色名称
   * @param {number} currentCons - 当前命座
   * @param {Object} consCalcData - 命座对比数据
   * @param {number} consCalcData.defDmgIdx - 默认伤害索引
   * @param {string} [consCalcData.consDmgKey] - 对比的标题关键词
   * @param {Array} consCalcData.details - 伤害详情列表
   * @param {Object} profile - 角色面板
   * @param {Object} result - 计算结果
   */
  async calcConsDiff(characterName, currentCons, consCalcData, profile, result) {
    try {
      const comparison = await ConsCompare.getConsComparison(
        characterName,
        currentCons,
        consCalcData,
        profile
      )
      
      if (!comparison?.comparisons?.length) {
        return
      }
      result.constellationInfo = comparison
      const targetIdx = comparison.targetIdx ?? consCalcData.defDmgIdx
      
      const targetDetail = consCalcData.details?.[targetIdx]
      const dmgTitle = targetDetail?.title || '未知伤害'
      
      if (!result.ret) {
        result.ret = []
      }
      
      const resolvedTitle = typeof dmgTitle === 'function' 
        ? dmgTitle({ cons: currentCons }) 
        : dmgTitle
      
      result.ret.push({
        title: `命座对比 ${resolvedTitle}`,
        avg: Math.floor(comparison.currentAvg),
        dmg: Math.floor(comparison.currentDmg),
        type: 'text'
      })
      
      // 添加命座对比数据
      for (const comp of comparison.comparisons) {
        if (comp.cons === 0) continue
        
        const avgNum = Math.floor(comp.avg)
        const dmgNum = Math.floor(comp.dmg)
        const pctChange = comp.percentageChange.replace(/^[+-]/, '')
        
        const displayTitle = comp.cons < currentCons
          ? `对比 ${comp.cons} 命提升 ${pctChange}`
          : `${comp.cons} 命预计提升 ${pctChange}`
        
        result.ret.push({
          title: displayTitle,
          avg: avgNum,
          dmg: dmgNum,
          type: comp.isUpgrade ? 'upgrade' : 'downgrade'
        })
      }
      
      // 添加对比0命的总提升
      if (currentCons > 0 && comparison.zeroConsAvg > 0) {
        const zeroConsPct = ((comparison.currentAvg - comparison.zeroConsAvg) / comparison.zeroConsAvg * 100).toFixed(2)
        
        result.ret.push({
          title: `对比 0 命总提升 ${zeroConsPct}%`,
          avg: Math.floor(comparison.zeroConsAvg),
          dmg: Math.floor(comparison.zeroConsDmg || 0),
          type: 'upgrade'
        })
      }
      
      logger.mark(`[lolomi-calc] ${characterName} ${currentCons}命 伤害对比完成`)
    } catch (error) {
      logger.debug(`[lolomi-calc] 命座对比计算出错: ${error.message}`)
    }
  },

  /**
   * 监控覆盖
   */
  startMonitoring() {
    let lastRecoveryLog = 0
    setInterval(() => {
      try {
        const currentMethod = ProfileDmg.dmgRulePath
        const methodString = currentMethod?.toString() || ''
        const isOverridden = !methodString.includes('[lolomi-calc]') && 
                            !methodString.includes('handleGenshinCharacter')
        
        if (isOverridden) {
          const now = Date.now()
          if (!lastRecoveryLog || now - lastRecoveryLog > LOG_DEBOUNCE_MS) {
            logger.warn('[lolomi-calc] 检测到计算覆盖，执行恢复...')
            lastRecoveryLog = now
          }
          this.setupPrioritySystem()
        }
      } catch (e) {
        logger.debug(`[lolomi-calc] 监控检查异常: ${e.message}`)
      }
    }, MONITOR_INTERVAL_MS)
  }
}

export default Start