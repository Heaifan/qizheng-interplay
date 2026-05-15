import type { WeaponProfile } from './type_weapon';

export type GameMode = 'idle' | 'planBlue' | 'planRed' | 'executing' | 'gameover';
export type UnitShape = 'circle' | 'diamond';
export type WoundState = 'healthy' | 'light' | 'heavy' | 'incapacitated';
export type LogTone = 'log-hit' | 'log-miss' | 'log-kill' | 'log-system' | '';
export type ToolbarHighlight = 'blue' | 'red' | 'exec' | null;
export type InteractionMode = 'browse' | 'measure' | 'planPath';

export interface Point { x: number; y: number; }
export interface CoverRect { x: number; y: number; w: number; h: number; }
export interface BushCircle { x: number; y: number; r: number; }

export interface CombatProfile {
  id: string;
  name: string;
  faction: 'blue' | 'red';
  states: { stamina: number; morale: number; focus: number };
  forces: {
    strike: number; survival: number; mobility: number;
    perception: number; control: number; sustainment: number;
  };
  weapon: WeaponProfile;
  woundState: WoundState;
}

/** 单位静态配置（来自关卡数据） */
export interface UnitTemplate {
  id: string;
  type: UnitShape;
  startX: number;
  startY: number;
  color: string;
  stroke: string;
}

/** 运行时单位状态 */
export interface RuntimeUnit extends UnitTemplate {
  x: number;
  y: number;
  hp: number;
  dead: boolean;
  path: Point[];
  currentPathIdx: number;
  /** Tactical facing direction: icon arrow, perception/fire/control sector center */
  angle: number;
  /** Last actual shot direction, used for debug/trail reference only */
  fireAngle: number;
  lastFireTime: number;
  combatProfile: CombatProfile;
}

export interface ShotTrail {
  x1: number; y1: number; x2: number; y2: number;
  color: string; alpha: number; blocked: boolean;
}

export interface LogEntry {
  timeLabel: string;
  unitId: string;
  text: string;
  tone: LogTone;
}
