export default function ({ attr, artis, rule, def }) {
  if (attr.cpct * 2 + attr.cdmg >= 180) {
    return rule('七七-输出', { atk: 100, cpct: 100, cdmg: 100, dmg: 100, recharge: 30 })
  } 
  if (artis.is('phy', '4')) {
    return rule('七七-物理', { atk: 100, cpct: 100, cdmg: 100, recharge: 30 })
  }
  return def({ atk:100, cpct: 50, cdmg: 50, dmg: 25, recharge: 75, heal: 100 })
}
