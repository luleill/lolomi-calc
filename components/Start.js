/**
 * 插件启动初始化、计算优先级设置、命座对比注入
 * 与梁氏和喵喵的兼容
 */

import ProfileDmg from '../../miao-plugin/models/ProfileDmg.js'
import Config from './Config.js'
import ConsCompare from './Constellation.js'
import LlmDataIndex from '../llm-models/LlmDataIndex.js'
import ProfileDmgLite from '../llm-models/ProfileDmgLite.js'
import { patchMiaoDynamic } from '../llm-models/MiaoDynamicCompat.js'
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
    logger.mark('[lolomi-calc] 计算框架 - engineMode:', cfg.engineMode || 'auto')

    this.originalDmgRulePath = ProfileDmg.dmgRulePath
    this.originalCalcData = ProfileDmg.prototype.calcData
    
    this.initialization()
    this.initLlmData()
    this.setupPrioritySystem()
    this.setupRuleGuard()
    // 如果回落miao计算框架，传入lolomi的新加参数
    patchMiaoDynamic()
    this.setConsCalc()
    this.startMonitoring()
  },

  initLlmData() {
    this.llmDataReady = LlmDataIndex.init()
      .then((stat) => {
        logger.mark(`[lolomi-calc] 自有数据加载完成 - 已写角色:${stat.char}`)
        return true
      })
      .catch((e) => {
        logger.warn(logger.red(`[lolomi-calc] 自有数据加载失败，计算回落 miao: ${e.message}`))
        return false
      })
  },

  async calcByLlmEngine(pd, params) {
    const mode = cfg.engineMode || 'auto'
    if (mode === 'miao' || !pd.isGs) {
      return { handled: false }
    }
    const charName = pd.char?.name || pd.profile?.name
    try {
      // 等待数据注册写入完成，启动后首次计算可能早于写入
      const ready = await this.llmDataReady
      if (!ready || !charName || !LlmDataIndex.hasCharDetail(charName)) {
        if (mode === 'lolomi') {
          logger.warn(logger.red(`[lolomi-calc] ${charName || '未知角色'} lolomi数据未收录`))
          return { handled: true, error: new Error('lolomi数据未收录') }
        }
        return { handled: false }
      }
      const lite = new ProfileDmgLite(pd.profile, 'gs')
      const result = await lite.calcData(params || {})
      if (result === false) {
        if (mode === 'lolomi') {
          logger.warn(logger.red(`[lolomi-calc] ${charName} lolomi计算无结果`))
          return { handled: true, error: new Error('lolomi计算无结果') }
        }
        return { handled: false }
      }
      return { handled: true, result, ruleSnapshot: lite.ruleSnapshot }
    } catch (error) {
      if (error?.constructor?.name === 'MiaoError') {
        return { handled: true, error }
      }
      if (mode === 'lolomi') {
        return { handled: true, error }
      }
      logger.warn(`[lolomi-calc] ${charName || '未知角色'} lolomi计算异常，回落 miao: ${error.message}`)
      return { handled: false }
    }
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
   * defDmgIdx 伤害索引越界处理
   */
  setupRuleGuard() {
    const self = this
    const originalGetCalcRule = ProfileDmg.prototype.getCalcRule
    ProfileDmg.prototype.getCalcRule = async function() {
      const rule = await originalGetCalcRule.call(this)
      if (rule && Array.isArray(rule.details) && rule.defDmgIdx >= rule.details.length) {
        const oobIdx = rule.defDmgIdx
        const name = this.char?.name || '未知角色'
        const logKey = `defdmgidx_oob_${name}`
        const now = Date.now()
        const last = self.logCache.get(logKey)
        if (!last || now - last > LOG_DEBOUNCE_MS) {
          logger.mark(logger.red(`[lolomi-calc] ${name} defDmgIdx=${oobIdx} 伤害索引异常，跳过该角色计算，请联系源作者`))
          self.logCache.set(logKey, now)
        }
        return false
      }
      return rule
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
      const engineRet = await self.calcByLlmEngine(this, params)
      let result
      if (engineRet.handled) {
        if (engineRet.error) {
          if (engineRet.error?.constructor?.name === 'MiaoError') {
            throw engineRet.error
          }
          logger.warn(logger.red(`[lolomi-calc] ${this.char?.name || '未知角色'} lolomi计算失败: ${engineRet.error.message}`))
          return null
        }
        result = engineRet.result
      } else {
        try {
          result = await originalCalcData.call(this, params)
        } catch (error) {
          if (error?.constructor?.name === 'MiaoError') {
            throw error
          }
          logger.warn(logger.red(`[lolomi-calc] ${this.char?.name || '未知角色'} 计算出错，跳过本次计算: ${error.message}`))
          return null
        }
      }
      if (params?.mode === 'single' && result && !Number.isFinite(result.avg)) {
        const name = this.char?.name || '未知角色'
        const logKey = `dmgidx_nonnum_${name}`
        const now = Date.now()
        const last = self.logCache.get(logKey)
        if (!last || now - last > LOG_DEBOUNCE_MS) {
          logger.mark(logger.red(`[lolomi-calc] ${name} defDmgIdx 伤害索引异常，指向非数值伤害条目`))
          self.logCache.set(logKey, now)
        }
        return null
      }
      if (!result || !this.profile) {
        return result
      }
      
      // 命座对比功能仅在lolomi计算原神角色时触发
      if (!engineRet.handled) {
        return result
      }
      
      const enableConstellation = cfg.conscompare ?? true
      if (!enableConstellation) {
        return result
      }
      
      try {
        const characterName = this.char?.name || this.profile.name
        const currentCons = Number(this.profile.cons)
        const calcRule = engineRet.ruleSnapshot
        if (calcRule?.defDmgIdx !== undefined && calcRule.defDmgIdx >= 0) {
          const consCalcData = {
            defDmgIdx: calcRule.defDmgIdx,
            consDmgKey: calcRule.consDmgKey,
            details: calcRule.details,
            ruleSnapshot: calcRule
          }
          await self.calcConsDiff(characterName, currentCons, consCalcData, this.profile, result)
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