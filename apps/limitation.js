import { Character } from '../../miao-plugin/models/index.js'
const replace_list = [
  '极限',
  '核爆',
  '辅助'
]

export class ysmb_input_replace extends plugin {
  constructor () {
    super({
      name: '极限面板',
      dsc: '极限面板',
      event: 'message',
      priority: -10000,
      rule: []
    })
  }

  async accept (e) {
    let reg = RegExp(replace_list.join('|'))
    if (!reg.test(e.msg) || /添加|删除|表情/.test(e.msg)) return false
    let msg = /换/.test(e.msg) ? e.msg.split('换') : [e.msg]
    if (replace_list.includes(msg[0])) return false
    let result = this._replace(msg)
    let Msg = result[0].replace(/#/g, '')
    if (reg.test(msg[0])) {
      let uid = Msg.match(/\d+/)
      let name = Msg.replace(uid, '')
      let char = Character.get(name.replace(/面板|圣遗物|伤害|武器/g, ''), 'gs')
      if (!char && !/面板/.test(Msg)) return false
      result[0] = `#${name}${/面板|圣遗物|伤害|武器/.test(Msg) ? '' : '面板'}${uid}`
    }
    e.msg = msg.length > 1 ? result.slice(0).join('换') : result[0]
  }

  _replace (msg) {
    let Msg = []
    msg.forEach(i => {
      let idx = replace_list.findIndex(k => i.includes(k))
      const replacements = ['999999999', '888888888', '777777777']
      Msg.push(idx !== -1 ? i.replace(replace_list[idx], replacements[idx]) : i)
    })
    return Msg
  }
}