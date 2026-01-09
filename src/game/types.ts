// ===== Core Types =====

import { PlantEvolutionData } from './evolution/types';
import { PersonalityTrait } from './Personality';

export interface Position {
  x: number;
  y: number;
}

// Neighbor bond tracking
export interface NeighborBond {
  plantId: string;    // ID of bonded neighbor
  since: number;      // Timestamp when bond started forming
  level: BondLevel;   // Current bond strength
}

export type BondLevel = 'acquaintance' | 'friend' | 'bestFriend' | 'soulmate';

// Grief state when a bonded plant is harvested
export interface GriefState {
  mourning: string;   // Name of the lost plant
  since: number;      // When grief started
  duration: number;   // How long grief lasts (ms)
}

// Wish system
export type WishType = 
  | 'lonely'           // Wants a neighbor
  | 'want_visitor'     // Wants to see a butterfly/bee
  | 'night_water'      // Wants to be watered at night
  | 'help_friend'      // Wants you to water their bonded neighbor
  | 'grow_tall'        // Wants to evolve
  | 'make_friend'      // Wants to bond with a specific neighbor
  | 'sunny_spot';      // Wants more neighbors (surrounded)

export interface PlantWish {
  type: WishType;
  text: string;        // Display text
  emoji: string;       // Thought bubble emoji
  targetId?: string;   // For wishes involving another plant
  createdAt: number;
  expiresAt: number;   // Fades after 10 min
}

// Elder status
export type ElderTier = 'none' | 'elder' | 'ancient' | 'legendary';

// Retired plant for Hall of Fame
export interface RetiredPlant {
  id: string;
  name: string;
  personalityId: string;
  evolutionId: string;
  seedId: string;
  elderTier: ElderTier;
  retiredAt: number;
  timeAlive: number;           // Total time from planting to retirement
  totalBonds: number;          // How many plants bonded with this one
  strongestBondLevel: BondLevel;
  wishesGranted: number;       // How many wishes were fulfilled
  wasGolden: boolean;
  epitaph?: string;            // Auto-generated memorial text
}

// Legacy types (kept for compatibility during migration)
export interface PlantStage {
  emoji: string;
  name: string;
  growthTime: number;
  visualScale: number;
}

export interface PlantFamily {
  id: string;
  name: string;
  stages: PlantStage[];
  zoneId: string;
}

// ===== New Evolution-Based Plant Data =====

export interface PlantData {
  id: string;
  seedId: string;           // Which seed type (sprout, acorn, bean, etc.)
  evolutionId: string;      // Current evolution state
  position: Position;
  isWatered: boolean;
  waterCount: number;       // Times watered this evolution (for diminishing returns)
  growthProgress: number;   // 0-1, progress to next evolution
  lastUpdateTime: number;
  isGolden?: boolean;       // Golden plants = special evolutions + 2x points
  growthBoost?: number;     // Temporary growth multiplier (from combos)
  
  // Personality & Identity (cosmetic)
  name?: string;                      // Plant's botanical pun name
  personality?: PersonalityTrait;     // Personality trait
  neighborBonds?: NeighborBond[];     // Bonds with adjacent plants
  
  // Relationship systems
  activeWish?: PlantWish;             // Current wish (if any)
  lastWishTime?: number;              // When last wish appeared/expired
  griefState?: GriefState;            // Mourning a lost bond
  maxedAt?: number;                   // Timestamp when reached max tier (for elder)
  
  // Evolution tracking data
  evoData: PlantEvolutionData;
  
  // Legacy fields (for migration)
  familyId?: string;
  stage?: number;
}

// ===== Garden Config (Single Zone) =====

export interface GardenConfig {
  gridSize: number;
  backgroundColor: string;
  tileColor: string;
}

// Legacy zone types (kept for migration)
export interface ZoneConfig {
  id: string;
  name: string;
  emoji: string;
  gridSize: number;
  unlockCondition: UnlockCondition | null;
  plantFamilies: string[];
  backgroundColor: string;
  tileColor: string;
}

export interface UnlockCondition {
  type: 'plants_maxed';
  count: number;
}

export interface ZoneState {
  id: string;
  plants: PlantData[];
  isUnlocked: boolean;
}

// ===== Farmer =====

export interface FarmerState {
  position: Position;
  targetPosition: Position | null;
  currentAction: FarmerAction;
  lastActionTime: number;
}

export type FarmerAction = 'idle' | 'walking' | 'celebrating' | 'waving' | 'looking' | 'watering';

// ===== Game State =====

export interface GameState {
  // Garden (single zone now)
  plants: PlantData[];
  
  // Seeds & Discovery
  unlockedSeeds: string[];        // Seed IDs the player has unlocked
  discoveredEvolutions: string[]; // Evolution IDs the player has seen
  selectedSeedId: string;         // Currently selected seed for planting
  
  // Farmer
  farmer: FarmerState;
  
  // Resources
  water: number;
  lastWaterRegen: number;
  gardenPoints: number;
  
  // Stats
  totalPlantsMaxed: number;
  totalMerges: number;
  harvestCounts: Record<string, number>;  // evolutionId -> count
  spotHarvestCounts: Record<string, number>; // "x,y" -> count
  
  // Meta
  lastSaveTime: number;
  lastPlayTime: number;
  
  // Hall of Fame
  retiredPlants: RetiredPlant[];
  
  // Legacy (for migration)
  currentZoneId?: string;
  zones?: ZoneState[];
}

export interface OfflineProgress {
  timeAway: number;
  plantsGrown: { plant: PlantData; evolutions: number }[];
  waterRegened: number;
}

// ===== Events =====

export type GameEvent = 
  | { type: 'plant_placed'; plant: PlantData }
  | { type: 'plant_watered'; plant: PlantData; isFreeWater?: boolean; isNight?: boolean }
  | { type: 'plant_evolved'; plant: PlantData; fromEvolution: string; toEvolution: string; isSpecial: boolean }
  | { type: 'plants_merged'; source: PlantData; target: PlantData; result: PlantData }
  | { type: 'water_changed'; amount: number }
  | { type: 'plant_harvested'; plant: PlantData; points: number; wasGolden: boolean; evolutionId: string }
  | { type: 'combo_watered'; plants: PlantData[]; comboSize: number }
  | { type: 'seed_unlocked'; seedId: string }
  | { type: 'evolution_discovered'; evolutionId: string; isLegendary: boolean }
  | { type: 'visitor_touched_plant'; plant: PlantData; visitorType: string }
  | { type: 'wish_appeared'; plant: PlantData; wish: PlantWish }
  | { type: 'wish_fulfilled'; plant: PlantData; wish: PlantWish }
  | { type: 'bond_formed'; plant1: PlantData; plant2: PlantData; level: BondLevel }
  | { type: 'plant_grieving'; plant: PlantData; lostFriend: string }
  | { type: 'elder_reached'; plant: PlantData; tier: ElderTier }
  | { type: 'plant_retired'; plant: PlantData };

// Legacy event types (for compatibility)
export type LegacyGameEvent =
  | { type: 'plant_grew'; plant: PlantData; newStage: number }
  | { type: 'zone_unlocked'; zone: ZoneConfig };
