export default function ({ attr, rule, def, cons }) {
  if (attr.cpct >= 180 && cons >= 6) {
    return rule('莫娜-输出', { atk: 100, cpct: 100, cdmg: 100, dmg: 100, recharge: 75 })
  } else if (attr.recharge >= 200 && cons < 2) {
    return rule('莫娜-辅助', { atk: 50, cpct: 50, cdmg: 75, dmg: 50, recharge: 100 })
  }
  return def({ atk: 50, cpct: 75, cdmg: 75, dmg: 75, recharge: 100  })
}
