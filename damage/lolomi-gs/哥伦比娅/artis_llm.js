export default function ({ attr, rule, def,cons }) {
  if (attr.recharge >= 200 && cons < 2) {
    return rule('哥伦比娅-辅助', { hp: 100, cpct: 75, cdmg: 75, mastery: 35, recharge: 100 })
  }
}
