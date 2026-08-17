/*
* 此文件夹下同目录数据均从 miao-plugin 迁移
* 由于miao更新实在太慢，迁移后，原神7.0及后续版本 lolomi 自行维护更改，伤害计算逻辑不再依赖 miao 框架
* 后续计算逻辑和新反应公式和 miao 可能存在差异
* */
export default class AttrItem {
  constructor (ds) {
    this.base = ds.base * 1 || 0
    this.plus = ds.plus * 1 || 0
    this.pct = ds.pct * 1 || 0
    this.inc = ds.inc * 1 || 0
  }

  static create (ds) {
    return new AttrItem(ds)
    /*
    return {
      base: ds.base * 1 || 0,
      plus: ds.plus * 1 || 0,
      pct: ds.pct * 1 || 0,
      inc: ds.inc * 1 || 0
    } */
  }

  toString () {
    return (this.base || 0) + (this.plus || 0) + ((this.base || 0) * (this.pct || 0) / 100)
  }
}


