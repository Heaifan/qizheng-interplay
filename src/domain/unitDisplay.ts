import type { RuntimeUnit, WeaponProfile } from './types';
import { getWeaponById } from './weaponRegistry';

export function getFactionLabel(unit: RuntimeUnit): string {
  const f = unit.combatProfile?.faction;
  if (f === 'blue') return '德军';
  if (f === 'red') return '苏军';
  return '';
}

export function getRoleLabel(weapon?: WeaponProfile): string {
  if (weapon?.roleLabel) return weapon.roleLabel;
  switch (weapon?.family) {
    case 'bolt_action_rifle': return '步枪手';
    case 'semi_auto_rifle': return '半自动步枪手';
    case 'submachine_gun': return '冲锋枪手';
    case 'light_machine_gun': case 'heavy_machine_gun': return '机枪手';
    case 'mortar': return '迫击炮手';
    case 'anti_tank_rifle': case 'anti_tank_gun': case 'rocket_launcher': return '反坦克手';
    default: return '士兵';
  }
}

export function getUnitDisplayName(unit: RuntimeUnit): string {
  const weapon = getWeaponById(unit.weaponId);
  return `${getFactionLabel(unit)}${getRoleLabel(weapon)}`;
}

export function getWeaponDisplayName(unit: RuntimeUnit): string {
  const weapon = getWeaponById(unit.weaponId);
  return weapon?.displayName ?? weapon?.name ?? unit.weaponId ?? '?';
}
