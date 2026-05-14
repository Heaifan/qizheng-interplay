import type { Ref } from 'vue';
import { computed } from 'vue';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { GameMode, RuntimeUnit, ShotTrail } from '@/domain/types';
import { deriveWeaponStats } from '@/domain/weapon';
import { computeReadabilityHints } from '@/game/readability';

export interface DerivedDeps {
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  mode: Ref<GameMode>;
  highlightedUnitId: Ref<string | null>;
  uiPanelTab: Ref<'log' | 'editor'>;
}

const PERCEPTION_HALF_ANGLE = (110 * Math.PI) / 360;
const FIRE_HALF_ANGLE = (60 * Math.PI) / 360;
const CONTROL_HALF_ANGLE = (80 * Math.PI) / 360;

const FIRE_VISUAL_MAX = 380;

function computeUnitFields(units: readonly RuntimeUnit[]) {
  return units.map((u) => {
    const ws = deriveWeaponStats(u.combatProfile.weapon);
    const pf = u.combatProfile.forces.perception;
    return {
      unitId: u.id,
      x: u.x,
      y: u.y,
      angle: u.angle, // tactical facing: icon arrow, perception, fire, control sectors
      perceptionRange: 500 + pf * 3,
      perceptionHalfAngle: PERCEPTION_HALF_ANGLE,
      fireRange: Math.min(ws.effectiveRange, FIRE_VISUAL_MAX),
      fireHalfAngle: FIRE_HALF_ANGLE,
      controlRange: Math.min(ws.effectiveRange * 0.18, 150),
      controlHalfAngle: CONTROL_HALF_ANGLE,
      strokeColor: u.stroke,
    };
  });
}

export function createDerivedState(d: DerivedDeps) {
  const readabilityHints = computed(() => computeReadabilityHints(d.units.value));

  const showSectorLabels = computed(() => d.uiPanelTab.value === 'editor');

  const renderSnapshot = computed(() => ({
    covers: COVERS,
    bushes: BUSHES,
    units: d.units.value,
    shots: d.shots.value,
    unitFields: computeUnitFields(d.units.value),
    readabilityHints: readabilityHints.value,
    mode: d.mode.value,
    showPlannedPath: d.mode.value !== 'gameover',
    showPathArrow: true,
    highlightedUnitId: d.highlightedUnitId.value,
    showSectorLabels: showSectorLabels.value,
  }));

  return { readabilityHints, renderSnapshot };
}
