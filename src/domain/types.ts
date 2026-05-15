export type GameMode = 'idle' | 'planBlue' | 'planRed' | 'executing' | 'gameover';

export type UnitShape = 'circle' | 'diamond';

export type WeaponAction = 'bolt' | 'semi' | 'auto';

export type WeaponCategory =
  | 'rifle'
  | 'machine_gun'
  | 'mortar'
  | 'anti_tank'
  | 'artillery';

export type WeaponFamily =
  | 'bolt_action_rifle'
  | 'semi_auto_rifle'
  | 'assault_rifle'
  | 'submachine_gun'
  | 'light_machine_gun'
  | 'heavy_machine_gun'
  | 'anti_tank_rifle'
  | 'anti_tank_gun'
  | 'tank_gun'
  | 'autocannon'
  | 'rocket_launcher'
  | 'grenade_launcher'
  | 'mortar'
  | 'artillery'
  | 'handgun'
  | 'flamethrower'
  | 'engineer_explosive';

export type OutputMode =
  | 'kinetic_single'
  | 'kinetic_burst'
  | 'kinetic_auto'
  | 'kinetic_penetrator'
  | 'explosive_fragmentation'
  | 'indirect_explosive'
  | 'shaped_charge'
  | 'incendiary_area'
  | 'triggered_explosive'
  | 'demolition_blast';

export type EffectClass =
  | 'pistol_round'
  | 'submachinegun_round'
  | 'intermediate_rifle'
  | 'full_power_rifle'
  | 'heavy_machinegun_round'
  | 'small_autocannon'
  | 'medium_autocannon'
  | 'tank_kinetic'
  | 'small_grenade'
  | 'medium_grenade'
  | 'light_mortar_shell'
  | 'medium_mortar_shell'
  | 'heavy_mortar_shell'
  | 'field_artillery_shell'
  | 'heavy_artillery_shell'
  | 'anti_tank_rifle'
  | 'light_at_gun'
  | 'medium_at_gun'
  | 'heavy_at_gun'
  | 'shaped_charge_light'
  | 'shaped_charge_medium'
  | 'shaped_charge_heavy'
  | 'anti_personnel_mine'
  | 'anti_tank_mine'
  | 'molotov'
  | 'flamethrower_light'
  | 'flamethrower_heavy'
  | 'white_phosphorus'
  | 'demolition_charge_light'
  | 'demolition_charge_medium'
  | 'demolition_charge_heavy'
  | 'satchel_charge'
  | 'bangalore_torpedo';

export interface WeaponProfile {
  id: string;
  name: string;
  caliber: number;
  action: WeaponAction;
  barrelLength: number;
  sightMag: number;
  category?: WeaponCategory;
  tags?: string[];
  /** 武器家族分类（用于匹配训练模板、行为标签） */
  family: WeaponFamily;
  /** 输出模式（决定距离衰减曲线类型） */
  outputMode: OutputMode;
  /** 效果等级（决定对不同目标类型的基准毁伤） */
  effectClass: EffectClass;
}

export interface WeaponDerivedStats {
  accuracy: number;
  effectiveRange: number;
  fireIntervalMs: number;
  lethality: number;
  actionRPM: number;
}

export type WoundState = 'healthy' | 'light' | 'heavy' | 'incapacitated';

export interface CombatProfile {
  id: string;
  name: string;
  faction: 'blue' | 'red';
  states: { stamina: number; morale: number; focus: number };
  forces: { strike: number; survival: number; mobility: number; perception: number; control: number; sustainment: number };
  weapon: WeaponProfile;
  woundState: WoundState;
}

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
  /** Tactical facing direction: icon arrow, perception/fire/control sector center */
  angle: number;
  /** Last actual shot direction, used for debug/trail reference only */
  fireAngle: number;
  lastFireTime: number;
  combatProfile: CombatProfile;
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

export type LogTone = 'log-hit' | 'log-miss' | 'log-kill' | 'log-system' | '';

export interface LogEntry {
  timeLabel: string;
  unitId: string;
  text: string;
  tone: LogTone;
}

export type ToolbarHighlight = 'blue' | 'red' | 'exec' | null;

export type InteractionMode = 'browse' | 'measure' | 'planPath';
