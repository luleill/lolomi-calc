export default function ({ attr, rule, def, cons }) {
  if (attr.cpct * 2 + attr.cdmg >= 180) {
    return rule('申鹤-输出', { atk: 100, cpct: 100, cdmg: 100, dmg: 100, recharge: 75 })
  } 
  return def({ atk: 100, cpct: 50, cdmg: 50, recharge: 100  })
}
