export default function ({ attr, rule, def }) {
  if (attr.cpct * 2 + attr.cdmg >= 180) {
    return rule('芭芭拉-输出', { atk: 75, cpct: 100, cdmg: 100, dmg: 100, recharge: 25,heal: 50 })
  } 
  return def({ hp: 100, atk:25, cpct: 50, cdmg: 50, dmg: 50, recharge: 75, heal: 100 })
}
