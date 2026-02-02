export default function ({ attr, rule, def }) {
  if (attr.cpct * 2 + attr.cdmg >= 180) {
    return rule('琴-输出', { atk: 75, cpct: 100, cdmg: 100, dmg: 100, recharge: 25, heal: 25 })
  } 
  return def({ atk:100, cpct: 50, cdmg: 50, dmg: 25, recharge: 75, heal: 100 })
}
