export default function ({ attr, rule, def, cons }) {
  if (attr.recharge >= 200 && cons < 2) {
    return rule('哥伦比娅-辅助', { hp: 100, cpct: 75, cdmg: 75, mastery: 35, recharge: 100 })
  }
  return def({ hp: 100, cpct: 100, cdmg: 100, mastery: 75, recharge: 75  })
}
