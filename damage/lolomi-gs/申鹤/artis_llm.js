export default function ({ attr, rule, def, cons }) {
  if (attr.cpct >= 180 && cons >= 6) {
    return rule('申鹤-输出', { atk: 100, cpct: 100, cdmg: 100, dmg: 100, recharge: 75 })
  } 
  return def({ atk: 100, cpct: 50, cdmg: 50, recharge: 100  })
}
