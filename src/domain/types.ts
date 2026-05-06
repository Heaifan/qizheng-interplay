/** 游戏阶段：规划 / 执行 / 结束 */
export type GameMode = 'idle' | 'planBlue' | 'planRed' | 'executing' | 'gameover';

export type UnitShape = 'circle' | 'diamond';

export interface Point {
  x: number;
  y: number;
}

export interface CoverRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BushCircle {
  x: number;
  y: number;
  r: number;
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
  /** Movement-facing direction */
  angle: number;
  /** Fire-control direction used by ZOC sector */
  fireAngle: number;
  lastFireTime: number;
}

export interface ShotTrail {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  alpha: number;
  blocked: boolean;
}

export type LogTone = 'log-hit' | 'log-miss' | 'log-kill' | '';

export interface LogEntry {
  timeLabel: string;
  unitId: string;
  text: string;
  tone: LogTone;
}

export type ToolbarHighlight = 'blue' | 'red' | 'exec' | null;
