/**
 * @fileoverview 命座伤害计算对比
 * @description 计算面板添加角色命座与前后命座的伤害对比
 */

import Config from './Config.js'
import ProfileDmg from '../../miao-plugin/models/ProfileDmg.js'
import lodash from 'lodash'
import Character from '../../miao-plugin/models/Character.js'
import CharTalent from '../../miao-plugin/models/character/CharTalent.js'
import ProfileDmgLite from '../llm-models/ProfileDmgLite.js'
import LlmCharMeta from '../llm-models/LlmCharMeta.js'
import LlmDataIndex from '../llm-models/LlmDataIndex.js'

const cfg = Config.getConfig('user', 'config')

/** @constant {number} 缓存有效期 - 60秒（毫秒） */
const CACHE_TTL = 60 * 1000

/** @constant {number} 缓存清理间隔 - 10分钟（毫秒） */
const CLEANUP_INTERVAL = 10 * 60 * 1000

/** @constant {number} 缓存最大保留时间 - 5分钟（毫秒） */
const MAX_CACHE_AGE = 5 * 60 * 1000

/** @constant {number} 最高命座 */
const MAX_CONSTELLATION = 6

const ConsCompare = {
  cache: new Map(),
  /**
   * 命座伤害对比
   * @async
   * @param {string} characterName - 主角色名称
   * @param {number} currentCons - 主角色命座
   * @param {Object} calcData - 计算数据
   * @param {number} calcData.defDmgIdx - 标题伤害索引
   * @param {string} [calcData.consDmgKey] - 命座对比标题关键词（优先使用）
   * @param {Array} calcData.details - 伤害详情
   * @param {Object} profile - 角色面板
   */
  async getConsComparison(characterName, currentCons, calcData, profile) {
    const { defDmgIdx, consDmgKey, details } = calcData
    
    if (!cfg.conscompare) {
      return null
    }
    if (!details || defDmgIdx === undefined || defDmgIdx < 0) {
      return null
    }
    
    // 优先使用 consDmgKey 指定对比伤害词条
    let targetIdx = defDmgIdx
    if (consDmgKey) {
      const normalizedKey = consDmgKey.trim()
      const foundIdx = details.findIndex(d => {
        const title = typeof d.title === 'function' ? d.title({ cons: currentCons }) : d.title
        return title && title.includes(normalizedKey)
      })
      if (foundIdx >= 0) {
        targetIdx = foundIdx
          // logger.mark(`[lolomi-calc] 命座对比 [${consDmgKey}] 匹配索引 ${foundIdx}`)
      }
    }
    
    const targetDetail = details[targetIdx]
    if (!targetDetail) {
      return null
    }
    if (targetDetail.cons && currentCons < targetDetail.cons) {
      return null
    }
    
    const cacheKey = `${characterName}_${currentCons}_${targetIdx}_${consDmgKey || ''}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return cached.data
    }
    
    // 构建前后命座
    const consToCalc = []
    if (currentCons > 0) {
      consToCalc.push({ cons: currentCons - 1, label: '上一命座' })
    }
    if (currentCons < MAX_CONSTELLATION) {
      consToCalc.push({ cons: currentCons + 1, label: '下一命座' })
    }
    
    if (consToCalc.length === 0) {
      return null
    }
    
    const currentDmgResult = await this.calcuDamageCons(
      characterName, 
      currentCons, 
      targetIdx, 
      details,
      profile
    )
    
    if (!currentDmgResult.valid) {
      return null
    }
    
    let zeroConsDmgResult = null
    if (currentCons > 0) {
      zeroConsDmgResult = await this.calcuDamageCons(
        characterName,
        0,
        targetIdx,
        details,
        profile
      )
    }
    
    const results = {
      characterName,
      currentCons,
      targetIdx,
      currentDmg: currentDmgResult.dmg,
      currentAvg: currentDmgResult.avg,
      zeroConsAvg: zeroConsDmgResult?.avg || null,
      zeroConsDmg: zeroConsDmgResult?.dmg || null,
      comparisons: []
    }
    
    // 对比前后命座伤害
    for (const { cons, label } of consToCalc) {
      const simResult = await this.calcuDamageCons(
        characterName,
        cons,
        targetIdx,
        details,
        profile
      )
      
      if (!simResult.valid) {
        continue
      }
      
      // 计算命座百分比变化
      const percentageChange = this.calcPctChange(
        currentDmgResult.avg,
        simResult.avg
      )
      
      results.comparisons.push({
        cons,
        label,
        dmg: simResult.dmg,
        avg: simResult.avg,
        percentageChange,
        isUpgrade: percentageChange > 0
      })
    }
    
    this.cache.set(cacheKey, {
      data: results,
      time: Date.now()
    })
    
    return results
  },
  
  /**
   * 计算指定命座
   * @param {number} defDmgIdx - 伤害计算索引
   * @param {Array} details - 伤害详情配置
   * @param {Object} originalProfile - 原始角色面板
   */
  async calcuDamageCons(characterName, cons, targetIdx, details, originalProfile) {
    try {
      const tempProfile = JSON.parse(JSON.stringify(originalProfile))
      tempProfile.cons = cons
      
      if (tempProfile.talent && tempProfile.id && tempProfile.elem) {
        // 原神角色表优先查lolomi数据，使用 miao 兜底
        let char = null
        const llmChar = LlmCharMeta.getData(tempProfile.id) || LlmCharMeta.getData(tempProfile.name || characterName)
        if (llmChar) {
          char = { ...llmChar, game: 'gs', isGs: true }
        }
        const miaoChar = Character.get({ id: tempProfile.id, elem: tempProfile.elem })
        if (!char) {
          char = miaoChar
        }
        
        if (char) {
          const originalTalent = {}
          const currentCons = originalProfile.cons
          const talentCons = char.talentCons || {}
          const addTalent = { a: 3, e: 3, q: 3 }
          
          lodash.forEach(tempProfile.talent, (ds, key) => {
            if (ds && ds.original !== undefined) {
              originalTalent[key] = ds.original
            } else if (lodash.isNumber(ds)) {
              let original = ds
              const consUp = talentCons[key]
              if (consUp) {
                if (lodash.isArray(consUp)) {
                  for (const consLvl of consUp) {
                    if (currentCons >= consLvl) original -= addTalent[key]
                  }
                } else if (currentCons >= consUp) {
                  original -= addTalent[key]
                }
              }
              originalTalent[key] = original
            } else if (ds && ds.level !== undefined) {
              let original = ds.level
              const consUp = talentCons[key]
              if (consUp) {
                if (lodash.isArray(consUp)) {
                  for (const consLvl of consUp) {
                    if (currentCons >= consLvl) original -= addTalent[key]
                  }
                } else if (currentCons >= consUp) {
                  original -= addTalent[key]
                }
              }
              originalTalent[key] = original
            }
          })
          
          const newTalent = CharTalent.getAvatarTalent(char, originalTalent, cons, 'original')
          if (newTalent) {
            tempProfile.talent = newTalent
          }
        }
      }
      
      const targetDetail = details?.[targetIdx]
      const targetDmgKey = targetDetail?.dmgKey || null
      
      const useLlm = (cfg.engineMode || 'auto') !== 'miao' && LlmDataIndex.hasCharDetail(characterName)
      const tempDmg = useLlm ? new ProfileDmgLite(tempProfile, 'gs') : new ProfileDmg(tempProfile, 'gs')
      tempDmg.isCalculatingCons = true
      
      const originalGetCalcRule = tempDmg.getCalcRule.bind(tempDmg)
      tempDmg.getCalcRule = async function() {
        const rule = await originalGetCalcRule()
        if (rule) {
          rule.defDmgIdx = targetIdx
          if (targetDmgKey) {
            rule.defDmgKey = targetDmgKey
          }
        }
        return rule
      }
      
      const result = await tempDmg.calcData({
        mode: 'single',
        dmgIdx: targetIdx,
        idxIsInput: true
      })
      
      if (!result) {
        return { dmg: 0, avg: 0, valid: false }
      }
      
      return {
        dmg: result.dmg || 0,
        avg: result.avg || 0,
        valid: true
      }
    } catch (error) {
      logger.debug(`[lolomi-calc] ${characterName} ${cons}命计算出错：${error.message}`)
      return { dmg: 0, avg: 0, valid: false }
    }
  },
  
  /**
   * 计算百分比变化
   */
  calcPctChange(base, newValue) {
    if (!base || base === 0) {
      return '0%'
    }
    const change = ((newValue - base) / base) * 100
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}%`
  },
  /**
   * 清理过期缓存
   */
  cleanCache() {
    const now = Date.now()
    const expiredKeys = []
    
    for (const [key, value] of this.cache.entries()) {
      if (now - value.time > MAX_CACHE_AGE) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key)
    }
  }
}

/**
 * 定期清理缓存
 */
setInterval(() => {
  ConsCompare.cleanCache()
}, CLEANUP_INTERVAL)

export default ConsCompare
