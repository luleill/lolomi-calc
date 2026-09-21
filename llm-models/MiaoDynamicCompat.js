/**
 * 异常回落 miao 计算框架时兼容 lolomi
 * 实际有配置可以沿用 miao 的计算框架去计算 calc_llm 文件，可以对两个计算框架公式做对比
 * 如果不主动修改框架配置的话一般不会回落 miao，也不建议去修改，7.0版本后的参数写法都不一样
 * dynamic 第五个参数为数字时按 lolomi 的 basicNum 加算，非数字时保留 miao 原生语义
 * 某些基础值增伤buff仅在一次循环里生效一次，加 basicNum 方便写总伤计算
 */
import MiaoDmgCalc from '../../miao-plugin/models/dmg/DmgCalc.js'
import lodash from 'lodash'

export function patchMiaoDynamic () {
  if (MiaoDmgCalc.__llmDynamicCompat) return
  MiaoDmgCalc.__llmDynamicCompat = true

  const originalGetDmgFn = MiaoDmgCalc.getDmgFn
  MiaoDmgCalc.getDmgFn = function (data) {
    const dmgFn = originalGetDmgFn.call(this, data)
    const originalDynamic = dmgFn.dynamic

    // 回落后支持的反应和计算参数范围由 miao 自身决定
    dmgFn.withAttr = function (overrides = {}) {
      const attr = lodash.merge(lodash.cloneDeep(data.attr), lodash.cloneDeep(overrides))
      return MiaoDmgCalc.getDmgFn({ ...data, attr, ds: { ...data.ds, attr } })
    }

    dmgFn.dynamic = function (pctNum = 0, talent = false, dynamicData = false, ele = false, basicNum = 0) {
      if (typeof basicNum !== 'number') {
        return originalDynamic(pctNum, talent, dynamicData, ele, basicNum)
      }
      const ret = originalDynamic(pctNum, talent, dynamicData, ele)
      if (!basicNum) return ret
      const { attr } = data
      const multi = 1 + ((attr.multi ?? 0) + String(talent || '').split(',')
        .reduce((sum, k) => sum + (attr[k.trim()]?.multi ?? 0), 0)) / 100
      const extra = dmgFn.basic(basicNum / multi, talent, ele, dynamicData)
      const zero = dmgFn.basic(0, talent, ele, dynamicData)
      return { dmg: ret.dmg + extra.dmg - zero.dmg, avg: ret.avg + extra.avg - zero.avg }
    }

    return dmgFn
  }
}

export default patchMiaoDynamic
