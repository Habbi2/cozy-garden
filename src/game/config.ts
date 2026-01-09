import { GardenConfig } from './types';

// ===== Timing Constants =====
export const TIMING = {
  GROWTH_TICK: 1000,           // Check growth every 1s
  OFFLINE_MULTIPLIER: 0.3,     // 30% speed while away
  MAX_OFFLINE_MS: 8 * 60 * 60 * 1000,  // 8 hours max
  WATER_REGEN_TIME: 1500,      // 1 water per 1.5s (generous!)
  FARMER_MOVE_INTERVAL: 1000,  // Farmer moves every 1s
  FARMER_ACTION_INTERVAL: 8000, // Farmer does action every 8-12s
};

// ===== Resource Constants =====
export const RESOURCES = {
  WATER_MAX: 4,              // Bigger pool = more planting before waiting
  SEEDS_UNLIMITED: true,
};

// ===== Interaction Constants =====
export const INTERACTION = {
  DRAG_THRESHOLD: 20,  // pixels before drag starts
  LONG_PRESS_TIME: 300, // ms for long press
};

// ===== Harvest & Economy =====
export const ECONOMY = {
  BASE_HARVEST_POINTS: 10,        // Base points (evolution pointValue used instead)
  HARVEST_WATER_RETURN: 3,        // Water returned on harvest
  GOLDEN_MULTIPLIER: 2,           // Golden plants worth 2x
  GOLDEN_CHANCE: 0.1,             // 10% chance for golden seed
  COMBO_WINDOW: 2000,             // 2 seconds to chain waters
  COMBO_MIN_SIZE: 3,              // Minimum plants for combo
  COMBO_GROWTH_BOOST: 1.5,        // +50% growth for combo'd plants
  NEIGHBOR_BONUS: 0.25,           // +25% per same-seed neighbor
  FARMER_PROXIMITY_BONUS: 0.5,    // +50% growth near farmer
  FARMER_AUTO_WATER_INTERVAL: 3000, // Farmer waters every 3s
};

// ===== Watering Diminishing Returns =====
// Each subsequent watering per evolution is less effective
export const WATERING = {
  // Multipliers for each water count (1st, 2nd, 3rd, etc.)
  DIMINISHING_RETURNS: [1.0, 0.5, 0.25, 0.1],  // 100%, 50%, 25%, 10%
  MIN_EFFECTIVENESS: 0.1,                       // Floor at 10%
};

// ===== Growth Time Scaling by Tier =====
// Multipliers applied to base growth times in evolution files
// This creates the hybrid timing: fast early, slow late game
export const GROWTH_SCALING = {
  // Tier -> multiplier
  // Tier 0: instant (seed)
  // Tier 1: ~15-30 seconds (keep fast, tutorial feel)
  // Tier 2: ~1-2 minutes (start to feel investment)
  // Tier 3: ~5-10 minutes (meaningful commitment)
  // Tier 4: ~15-30 minutes (real anticipation)
  // Tier 5+: 0 (max evolution, no growth needed)
  TIER_MULTIPLIERS: {
    0: 1,      // Tier 0: unchanged (instant)
    1: 0.5,    // Tier 1: halve base times (~15-25s)
    2: 2,      // Tier 2: double base times (~1-2 min)
    3: 8,      // Tier 3: 8x base times (~5-10 min)
    4: 20,     // Tier 4: 20x base times (~15-30 min)
    5: 1,      // Tier 5+: not used (max plants don't grow)
    6: 1,      // Legendary tier
  } as Record<number, number>,
};

// ===== Bond System =====
export const BONDS = {
  // Time thresholds for bond levels (ms)
  ACQUAINTANCE_TIME: 0,              // Immediate
  FRIEND_TIME: 2 * 60 * 1000,        // 2 minutes
  BEST_FRIEND_TIME: 5 * 60 * 1000,   // 5 minutes  
  SOULMATE_TIME: 15 * 60 * 1000,     // 15 minutes
  
  // Growth boost per bond level
  FRIEND_BOOST: 0.05,                // +5%
  BEST_FRIEND_BOOST: 0.10,           // +10%
  SOULMATE_BOOST: 0.15,              // +15%
  
  // Grief durations (ms)
  FRIEND_GRIEF: 5 * 60 * 1000,       // 5 minutes
  BEST_FRIEND_GRIEF: 15 * 60 * 1000, // 15 minutes
  SOULMATE_GRIEF: 30 * 60 * 1000,    // 30 minutes
  
  // Grief effects
  GRIEF_GROWTH_PENALTY: 0.5,         // 50% slower growth while grieving
};

// ===== Elder System =====
export const ELDERS = {
  // Time at max tier to reach elder status (ms)
  ELDER_TIME: 10 * 60 * 1000,        // 10 minutes
  ANCIENT_TIME: 30 * 60 * 1000,      // 30 minutes
  LEGENDARY_TIME: 60 * 60 * 1000,    // 1 hour
  
  // Aura boost for adjacent plants
  ELDER_AURA_BOOST: 0.10,            // +10%
  ANCIENT_AURA_BOOST: 0.15,          // +15%
  LEGENDARY_AURA_BOOST: 0.20,        // +20%
  
  // Hall of Fame
  MAX_HALL_OF_FAME: 5,               // Maximum retired elders
};

// ===== Visitors =====
export const VISITORS = {
  SPAWN_INTERVAL_MIN: 45000,      // Minimum 45s between visitors
  SPAWN_INTERVAL_MAX: 60000,      // Maximum 60s between visitors  
  VISIT_DURATION_MIN: 15000,      // Stay at least 15s
  VISIT_DURATION_MAX: 20000,      // Stay at most 20s
  MAX_PLANT_BONUS: 0.05,          // +5% spawn chance per max plant
};

// ===== Garden Config (Single unified garden) =====
export const GARDEN: GardenConfig = {
  gridSize: 3,                    // Cozy 5x5 - each plant feels special
  backgroundColor: '#2d5a3d',
  tileColor: '#8B4513',
};

// ===== Farmer =====
export const FARMER = {
  emoji: '🧑‍🌾',
  reactions: {
    celebrate: '🎉',
    wave: '👋',
    heart: '❤️',
    sparkle: '✨',
  },
  speechBubbles: {
    plant: ['New friend! 🌱', 'Grow strong!', 'Welcome~', 'Excited!'],
    water: ['Splash! 💧', 'Stay hydrated!', 'Good drink~', 'Refreshing!'],
    grow: ['So pretty! 🌸', 'Growing nicely~', 'Wow!', 'Look at you!'],
    evolve: ['Evolution! ✨', 'Amazing!', 'Transformed!', 'New form!'],
    harvest: ['Wonderful! 🌟', 'Great job!', 'Amazing!', 'Well done!'],
    combo: ['On fire! 🔥', 'Combo!!', 'Speed run!', 'Unstoppable!'],
    golden: ['Shiny! ✨', 'So lucky!', 'Gold!!', 'Precious~'],
    legendary: ['LEGENDARY! 👑', 'Incredible!!', 'So rare!', 'Magnificent!'],
    idle: ['Nice day~', 'La la la~', '🎵', 'Peaceful...'],
    discovery: ['New plant! 📖', 'Discovery!', 'Never seen!', 'Exciting!'],
  },
};

// ===== Legacy Helper Functions (for migration) =====
// These are deprecated - use evolution system instead

import { PlantFamily, ZoneConfig } from './types';

// Legacy plant families - kept for save migration
export const PLANT_FAMILIES: PlantFamily[] = [
  {
    id: 'flowers',
    name: 'Flowers',
    zoneId: 'garden',
    stages: [
      { emoji: '🌱', name: 'Seedling', growthTime: 0, visualScale: 1.0 },
      { emoji: '🌿', name: 'Sprout', growthTime: 30000, visualScale: 1.0 },
      { emoji: '🌷', name: 'Tulip', growthTime: 60000, visualScale: 1.2 },
      { emoji: '🌸', name: 'Blossom', growthTime: 120000, visualScale: 1.5 },
      { emoji: '🌺', name: 'Hibiscus', growthTime: 240000, visualScale: 1.8 },
      { emoji: '💐', name: 'Bouquet', growthTime: 480000, visualScale: 2.2 },
    ],
  },
  {
    id: 'trees',
    name: 'Trees',
    zoneId: 'greenhouse',
    stages: [
      { emoji: '🌱', name: 'Seed', growthTime: 0, visualScale: 1.0 },
      { emoji: '🌿', name: 'Sapling', growthTime: 45000, visualScale: 1.0 },
      { emoji: '🪴', name: 'Potted', growthTime: 120000, visualScale: 1.3 },
      { emoji: '🌲', name: 'Pine', growthTime: 240000, visualScale: 1.6 },
      { emoji: '🌳', name: 'Oak', growthTime: 480000, visualScale: 2.0 },
      { emoji: '🎄', name: 'Grand Tree', growthTime: 900000, visualScale: 2.5 },
    ],
  },
];

// Legacy zones - kept for save migration  
export const ZONES: ZoneConfig[] = [
  {
    id: 'garden',
    name: 'Garden',
    emoji: '🏡',
    gridSize: 5,
    unlockCondition: null,
    plantFamilies: ['flowers'],
    backgroundColor: '#2d5a3d',
    tileColor: '#8B4513',
  },
  {
    id: 'greenhouse',
    name: 'Greenhouse',
    emoji: '🌿',
    gridSize: 5,
    unlockCondition: { type: 'plants_maxed', count: 10 },
    plantFamilies: ['trees'],
    backgroundColor: '#2a4a3a',
    tileColor: '#6B4423',
  },
];

/** @deprecated Use evolution system */
export function getPlantFamily(familyId: string): PlantFamily | undefined {
  return PLANT_FAMILIES.find(f => f.id === familyId);
}

/** @deprecated Use evolution system */
export function getZone(zoneId: string): ZoneConfig | undefined {
  return ZONES.find(z => z.id === zoneId);
}

/** @deprecated Use evolution system */
export function getDefaultFamilyForZone(zoneId: string): PlantFamily | undefined {
  const zone = getZone(zoneId);
  if (!zone || zone.plantFamilies.length === 0) return undefined;
  return getPlantFamily(zone.plantFamilies[0]);
}

/** @deprecated Use evolution system */
export function isMaxStage(familyId: string, stage: number): boolean {
  const family = getPlantFamily(familyId);
  if (!family) return false;
  return stage >= family.stages.length - 1;
}

/** @deprecated Use evolution system */
export function getGrowthTimeForStage(familyId: string, stage: number): number {
  const family = getPlantFamily(familyId);
  if (!family || stage >= family.stages.length - 1) return Infinity;
  return family.stages[stage + 1].growthTime;
}
