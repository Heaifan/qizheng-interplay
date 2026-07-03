// ============================================================
// directFireContext — 直接火力上下文类型
//
// 从 combatFormula.ts 拆分，保持该文件 ≤100 行。
// ============================================================

export interface DirectFireContext {
  weaponName: string;
  distance: number;
  angleOffsetDeg: number;
  weaponAccuracy: number;
  effectiveRange: number;
  terminalEffect: number;
  distanceModifier: number;
  angleModifier: number;
  focusModifier: number;
  strikeModifier: number;
  sustainmentModifier: number;
  coverModifier: number;
  bushModifier: number;
  terrainHitModifier: number;
  hitChance: number;
  averageDamage: number;
  fireCooldownMs: number;
  firePressure: number;
  blocked: boolean;
  throughBush: boolean;
  terrainBlocked: boolean;
  inRange: boolean;
  inFireArc: boolean;
}
