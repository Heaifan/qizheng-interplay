import type { RuntimeUnit, WeaponIconKind, WeaponProfile } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponRegistry';

export type UnitGlyphKind = WeaponIconKind;

const GLYPH_PATHS: Record<UnitGlyphKind, string> = {
  rifle: 'M 0 8 L 0 -8 M 0 -8 L -4 -3 M 0 -8 L 4 -3',
  rifle_bar: 'M 0 8 L 0 -8 M 0 -8 L -4 -3 M 0 -8 L 4 -3 M -5 0 L 5 0',
  rifle_multi: 'M 0 8 L 0 -8 M 0 -8 L -4 -3 M 0 -8 L 4 -3 M -5 -1 L 5 -1 M -5 3 L 5 3',
  smg: 'M -4 7 L -4 -6 M 4 7 L 4 -6 M -4 0 L 4 0',
  machine_gun: 'M 0 8 L 0 -8 M 0 -8 L -4 -3 M 0 -8 L 4 -3 M -6 1 L 6 1 M -5 5 L 5 5',
  mortar: 'M -5 7 L 0 -7 L 5 7 M -6 7 L 6 7',
  anti_tank: 'M -7 4 L 7 -4 M 4 -7 L 7 -4 L 4 -1 M -6 7 L -2 3',
  artillery: 'M -7 5 L 7 -5 M -5 7 L 0 4 M 5 7 L 0 4',
  flamethrower: 'M -5 6 L -5 -6 M -5 -6 C 0 -10 5 -5 2 0 C 6 -2 7 4 1 6',
  engineer: 'M -6 6 L 6 -6 M -6 -6 L 6 6 M -5 0 L 5 0',
};

export function resolveGlyphKind(weapon?: WeaponProfile): UnitGlyphKind {
  if (weapon?.iconKind) return weapon.iconKind;
  switch (weapon?.family) {
    case 'bolt_action_rifle': case 'semi_auto_rifle': return 'rifle';
    case 'submachine_gun': return 'smg';
    case 'light_machine_gun': case 'heavy_machine_gun': return 'machine_gun';
    case 'mortar': return 'mortar';
    case 'anti_tank_rifle': case 'anti_tank_gun': case 'rocket_launcher': return 'anti_tank';
    case 'artillery': return 'artillery';
    default: return 'rifle';
  }
}

export function resolveUnitGlyphKind(unit: RuntimeUnit): UnitGlyphKind {
  return resolveGlyphKind(getWeaponById(unit.weaponId));
}

export function drawUnitGlyph(
  ctx: CanvasRenderingContext2D,
  kind: UnitGlyphKind,
  size = 1,
): void {
  const d = GLYPH_PATHS[kind] ?? GLYPH_PATHS.rifle;
  const path = new Path2D(d);
  ctx.save();
  ctx.scale(size, size);
  ctx.lineWidth = 1.4 / size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(40, 45, 45, 0.85)';
  ctx.stroke(path);
  ctx.restore();
}
