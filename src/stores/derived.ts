import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';
import { BUSHES, COVERS } from '@/domain/terrain';
import type { GameMode, RuntimeUnit, ShotTrail } from '@/domain/types';
import {
  computeReadabilityHints,
  FIRE_SECTOR_RADIUS, HALF_FIRE_SECTOR_RAD,
  VISION_SECTOR_RADIUS, HALF_VISION_SECTOR_RAD,
} from '@/game/readability';

export interface DerivedDeps {
  units: Ref<RuntimeUnit[]>;
  shots: Ref<ShotTrail[]>;
  mode: Ref<GameMode>;
}

export function createDerivedState(d: DerivedDeps) {
  const readabilityHints = computed(() => computeReadabilityHints(d.units.value));

  const renderSnapshot = computed(() => ({
    covers: COVERS,
    bushes: BUSHES,
    units: d.units.value,
    shots: d.shots.value,
    threatZones: d.units.value.map((u) => ({
      unitId: u.id, x: u.x, y: u.y, angle: u.fireAngle,
      fireRadius: FIRE_SECTOR_RADIUS, fireHalfAngleRad: HALF_FIRE_SECTOR_RAD,
      visionRadius: VISION_SECTOR_RADIUS, visionHalfAngleRad: HALF_VISION_SECTOR_RAD,
      color: u.stroke,
    })),
    readabilityHints: readabilityHints.value,
    mode: d.mode.value,
    showPlannedPath: d.mode.value !== 'gameover',
    showPathArrow: true,
  }));

  return { readabilityHints, renderSnapshot };
}
