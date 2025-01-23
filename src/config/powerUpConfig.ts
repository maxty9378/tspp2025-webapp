export const POWERUP_CONFIG = {
  MAX_ENERGY: 2000,
  ENERGY_REGEN_RATE: 0.8,
  ENERGY_COST: 10,
  COIN_TO_POINTS_RATIO: 10,
  POINTS_PER_CONVERSION: 100,
  STORAGE_KEYS: {
    STATE: 'powerup_state',
    ENERGY: 'powerup_energy',
    LAST_UPDATE: 'powerup_energy_last_update'
  }
} as const;