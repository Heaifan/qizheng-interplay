import type { RuntimeUnit, WeaponIconKind, WeaponProfile } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponRegistry';

export type UnitGlyphKind = WeaponIconKind;

/**
 * 兵牌武器符号规范（枪口统一朝 +X）：
 *
 *   步枪        rifle             单箭头
 *   自动步枪    automatic_rifle   单箭头 + 1 横
 *   冲锋枪      submachine_gun    单箭头 + 2 横
 *   轻机枪      light_machine_gun 单箭头 + 2 横 + 脚架
 *   重机枪      heavy_machine_gun 单箭头 + 3 横 + 脚架
 */
const GLYPH_PATHS: Record<UnitGlyphKind, string> = {
  // 单箭头
  rifle: 'M -8 0 L 8 0 M 8 0 L 3 -4 M 8 0 L 3 4',

  // 箭头 + 一横
  automatic_rifle: 'M -8 0 L 8 0 M 8 0 L 3 -4 M 8 0 L 3 4 M 0 -5 L 0 5',

  // 箭头 + 两横
  submachine_gun: 'M -8 0 L 8 0 M 8 0 L 3 -4 M 8 0 L 3 4 M -2 -5 L -2 5 M 2 -5 L 2 5',

  // 箭头 + 两横 + 脚架
  light_machine_gun: 'M -8 0 L 8 0 M 8 0 L 3 -4 M 8 0 L 3 4 M -2 -5 L -2 5 M 2 -5 L 2 5 M -7 5 L -2 0 M -7 -5 L -2 0',

  // 箭头 + 三横 + 脚架
  heavy_machine_gun: 'M -8 0 L 8 0 M 8 0 L 3 -4 M 8 0 L 3 4 M -4 -5 L -4 5 M 0 -5 L 0 5 M 4 -5 L 4 5 M -7 5 L -2 0 M -7 -5 L -2 0',

  mortar: 'M -6 6 L 3 -6 M -7 6 L 7 6 M 3 -6 L 6 -3',
  anti_tank: 'M -8 2 L 8 -2 M 8 -2 L 4 -5 M 8 -2 L 4 1 M -6 5 L -2 1',
  artillery: 'M -8 3 L 8 -3 M -4 6 L 0 3 M 4 6 L 0 3',
  flamethrower: 'M -8 2 L 3 0 M 3 0 C 8 -4 8 4 3 2 M -3 0 L -5 5',
  engineer: 'M -6 -6 L 6 6 M -6 6 L 6 -6 M -5 0 L 5 0',
};

export function resolveGlyphKind(weapon?: WeaponProfile): UnitGlyphKind {
  if (weapon?.iconKind) return weapon.iconKind;
  switch (weapon?.family) {
    case 'bolt_action_rifle': return 'rifle';
    case 'semi_auto_rifle': return 'automatic_rifle';
    case 'submachine_gun': return 'submachine_gun';
    case 'light_machine_gun': return 'light_machine_gun';
    case 'heavy_machine_gun': return 'heavy_machine_gun';
    case 'mortar': return 'mortar';
    case 'anti_tank_rifle': case 'anti_tank_gun': case 'rocket_launcher': return 'anti_tank';
    default: return 'rifle';
  }
}

export function resolveUnitGlyphKind(unit: RuntimeUnit): UnitGlyphKind {
  return resolveGlyphKind(getWeaponById(unit.weaponId));
}

export function drawUnitGlyph(
  ctx: CanvasRenderingContext2D,
  kind: UnitGlyphKind,
): void {
  const d = GLYPH_PATHS[kind] ?? GLYPH_PATHS.rifle;
  const path = new Path2D(d);
  ctx.lineWidth = 1.05;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(34, 38, 36, 0.92)';
  ctx.stroke(path);
}
