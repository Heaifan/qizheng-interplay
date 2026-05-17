import type { RuntimeUnit, WeaponIconKind, WeaponProfile } from '@/domain/types';
import { getWeaponById } from '@/domain/weaponRegistry';

export type UnitGlyphKind =
  | 'rifle'
  | 'automatic_rifle'
  | 'submachine_gun'
  | 'light_machine_gun'
  | 'heavy_machine_gun'
  | 'mortar'
  | 'anti_tank'
  | 'artillery'
  | 'flamethrower'
  | 'engineer';

function pathFromPoints(draw: (p: Path2D) => void): Path2D {
  const p = new Path2D();
  draw(p);
  return p;
}

/**
 * 兵牌武器符号规范（枪口朝上）：
 *
 *   步枪        rifle             单箭头
 *   自动步枪    automatic_rifle   单箭头 + 1 横
 *   冲锋枪      submachine_gun    单箭头 + 2 横
 *   轻机枪      light_machine_gun 单箭头 + 2 横 + 脚架
 *   重机枪      heavy_machine_gun 单箭头 + 3 横 + 脚架
 *
 * drawUnits.ts 中旋转时需补 Math.PI/2 以对齐 +X 角度体系。
 */
const GLYPH_PATHS: Record<UnitGlyphKind, Path2D> = {
  // 单箭头
  rifle: pathFromPoints((p) => {
    p.moveTo(0, 9); p.lineTo(0, -9);
    p.moveTo(0, -9); p.lineTo(-4, -3);
    p.moveTo(0, -9); p.lineTo(4, -3);
  }),

  // 箭头 + 1 横
  automatic_rifle: pathFromPoints((p) => {
    p.moveTo(0, 9); p.lineTo(0, -9);
    p.moveTo(0, -9); p.lineTo(-4, -3);
    p.moveTo(0, -9); p.lineTo(4, -3);
    p.moveTo(-4, 1); p.lineTo(4, 1);
  }),

  // 箭头 + 2 横
  submachine_gun: pathFromPoints((p) => {
    p.moveTo(0, 9); p.lineTo(0, -9);
    p.moveTo(0, -9); p.lineTo(-4, -3);
    p.moveTo(0, -9); p.lineTo(4, -3);
    p.moveTo(-4, -1); p.lineTo(4, -1);
    p.moveTo(-4, 2.5); p.lineTo(4, 2.5);
  }),

  // 箭头 + 2 横 + 脚架
  light_machine_gun: pathFromPoints((p) => {
    p.moveTo(0, 8); p.lineTo(0, -9);
    p.moveTo(0, -9); p.lineTo(-4, -3);
    p.moveTo(0, -9); p.lineTo(4, -3);
    p.moveTo(-4, -1); p.lineTo(4, -1);
    p.moveTo(-4, 2.5); p.lineTo(4, 2.5);
    p.moveTo(0, 8); p.lineTo(0, 11);
    p.moveTo(0, 11); p.lineTo(-5, 14);
    p.moveTo(0, 11); p.lineTo(5, 14);
  }),

  // 箭头 + 3 横 + 脚架
  heavy_machine_gun: pathFromPoints((p) => {
    p.moveTo(0, 8); p.lineTo(0, -9);
    p.moveTo(0, -9); p.lineTo(-4, -3);
    p.moveTo(0, -9); p.lineTo(4, -3);
    p.moveTo(-4, -3); p.lineTo(4, -3);
    p.moveTo(-4, 0); p.lineTo(4, 0);
    p.moveTo(-4, 3); p.lineTo(4, 3);
    p.moveTo(0, 8); p.lineTo(0, 11);
    p.moveTo(0, 11); p.lineTo(-5, 14);
    p.moveTo(0, 11); p.lineTo(5, 14);
  }),

  mortar: pathFromPoints((p) => {
    p.moveTo(-2, 8); p.lineTo(3, -7);
    p.moveTo(-5, 8); p.lineTo(5, 8);
    p.moveTo(3, -7); p.lineTo(6, -3);
  }),

  anti_tank: pathFromPoints((p) => {
    p.moveTo(-6, 7); p.lineTo(6, -7);
    p.moveTo(6, -7); p.lineTo(2, -7);
    p.moveTo(6, -7); p.lineTo(6, -3);
    p.moveTo(-6, 10); p.lineTo(-2, 6);
  }),

  artillery: pathFromPoints((p) => {
    p.moveTo(-7, 5); p.lineTo(7, -3);
    p.moveTo(-3, 9); p.lineTo(0, 5);
    p.moveTo(3, 9); p.lineTo(0, 5);
  }),

  flamethrower: pathFromPoints((p) => {
    p.moveTo(0, 8); p.lineTo(0, -3);
    p.moveTo(0, -3); p.bezierCurveTo(3, -7, 7, -4, 5, 1);
    p.moveTo(0, 2); p.lineTo(-4, 6);
  }),

  engineer: pathFromPoints((p) => {
    p.moveTo(-5, -5); p.lineTo(5, 5);
    p.moveTo(-5, 5); p.lineTo(5, -5);
    p.moveTo(-5, 0); p.lineTo(5, 0);
  }),
};

export function resolveWeaponIconKind(weapon?: WeaponProfile): UnitGlyphKind {
  const raw = weapon?.iconKind as WeaponIconKind | undefined;
  switch (raw) {
    case 'rifle': case 'automatic_rifle': case 'submachine_gun':
    case 'light_machine_gun': case 'heavy_machine_gun':
    case 'mortar': case 'anti_tank': case 'artillery':
    case 'flamethrower': case 'engineer':
      return raw;
    default: break;
  }
  switch (weapon?.family) {
    case 'bolt_action_rifle': return 'rifle';
    case 'semi_auto_rifle': return 'automatic_rifle';
    case 'submachine_gun': return 'submachine_gun';
    case 'light_machine_gun': return 'light_machine_gun';
    case 'heavy_machine_gun': return 'heavy_machine_gun';
    default: return 'rifle';
  }
}

export function resolveUnitGlyphKind(unit: RuntimeUnit): UnitGlyphKind {
  return resolveWeaponIconKind(getWeaponById(unit.weaponId));
}

export function drawUnitGlyph(
  ctx: CanvasRenderingContext2D,
  kind: UnitGlyphKind,
  scale = 1,
): void {
  const path = GLYPH_PATHS[kind] ?? GLYPH_PATHS.rifle;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineWidth = 1.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(34, 38, 36, 0.95)';
  ctx.stroke(path);
  ctx.restore();
}
