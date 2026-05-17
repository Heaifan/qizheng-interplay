export type WeaponAction = 'bolt' | 'semi' | 'auto';

export type WeaponCategory =
  | 'rifle' | 'machine_gun' | 'mortar' | 'anti_tank' | 'artillery';

export type WeaponFamily =
  | 'bolt_action_rifle' | 'semi_auto_rifle' | 'assault_rifle'
  | 'submachine_gun' | 'light_machine_gun' | 'heavy_machine_gun'
  | 'anti_tank_rifle' | 'anti_tank_gun' | 'tank_gun'
  | 'autocannon' | 'rocket_launcher' | 'grenade_launcher'
  | 'mortar' | 'artillery' | 'handgun'
  | 'flamethrower' | 'engineer_explosive';

export type OutputMode =
  | 'kinetic_single' | 'kinetic_burst' | 'kinetic_auto' | 'kinetic_penetrator'
  | 'explosive_fragmentation' | 'indirect_explosive' | 'shaped_charge'
  | 'incendiary_area' | 'triggered_explosive' | 'demolition_blast';

export type EffectClass =
  | 'pistol_round' | 'submachinegun_round' | 'intermediate_rifle' | 'full_power_rifle'
  | 'heavy_machinegun_round' | 'small_autocannon' | 'medium_autocannon' | 'tank_kinetic'
  | 'small_grenade' | 'medium_grenade'
  | 'light_mortar_shell' | 'medium_mortar_shell' | 'heavy_mortar_shell'
  | 'field_artillery_shell' | 'heavy_artillery_shell'
  | 'anti_tank_rifle' | 'light_at_gun' | 'medium_at_gun' | 'heavy_at_gun'
  | 'shaped_charge_light' | 'shaped_charge_medium' | 'shaped_charge_heavy'
  | 'anti_personnel_mine' | 'anti_tank_mine'
  | 'molotov' | 'flamethrower_light' | 'flamethrower_heavy' | 'white_phosphorus'
  | 'demolition_charge_light' | 'demolition_charge_medium' | 'demolition_charge_heavy'
  | 'satchel_charge' | 'bangalore_torpedo';

export type WeaponIconKind =
  | 'rifle' | 'automatic_rifle' | 'submachine_gun'
  | 'light_machine_gun' | 'heavy_machine_gun'
  | 'mortar' | 'anti_tank' | 'artillery'
  | 'flamethrower' | 'engineer';

export interface WeaponProfile {
  id: string;
  name: string;
  displayName?: string;
  shortName?: string;
  country?: string;
  era?: string;
  caliber: number;
  action: WeaponAction;
  barrelLength: number;
  sightMag: number;
  category?: WeaponCategory;
  family: WeaponFamily;
  outputMode: OutputMode;
  effectClass: EffectClass;
  outputProfileId?: string;
  roleLabel?: string;
  iconKind?: WeaponIconKind;
  tags?: string[];
  /** 弹匣容量 */
  magazineSize?: number;
  /** 射击间隔（ms） */
  shotIntervalMs?: number;
  /** 换弹时间（ms） */
  reloadTimeMs?: number;
  /** 射击模式 */
  fireMode?: 'single' | 'semi' | 'auto' | 'burst';
  /** 点射发数（仅 auto/burst） */
  burstSize?: number;
  /** 点射内子弹间隔（ms） */
  burstIntervalMs?: number;
}

export interface WeaponDerivedStats {
  accuracy: number;
  effectiveRange: number;
  fireIntervalMs: number;
  lethality: number;
  actionRPM: number;
}
