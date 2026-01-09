// ===== Evolution System Types =====

/** Seed types - starting points for evolution trees */
export interface SeedType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: number;           // Garden points to unlock (0 = free)
  baseGrowthTime: number; // Base ms per stage
}

/** A single plant evolution (node in the tree) */
export interface Evolution {
  id: string;
  name: string;
  emoji: string;
  seedId: string;         // Which seed tree this belongs to
  tier: number;           // 0 = seed, 1-5 = growth stages, 6+ = special
  growthTime: number;     // ms to reach next evolution
  visualScale: number;    // Size multiplier for display
  pointValue: number;     // Harvest value (0 = can't harvest yet)
  
  // Evolution paths
  evolvesFrom: string | null;     // Parent evolution ID (null for seeds)
  defaultEvolution: string | null; // Default next evolution
  specialEvolutions?: SpecialEvolution[]; // Conditional branches
  
  // Display
  description?: string;
  isLegendary?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/** Conditional evolution path */
export interface SpecialEvolution {
  evolutionId: string;    // Target evolution
  trigger: EvolutionTrigger;
  hint?: string;          // Hint shown in collection (e.g., "Try watering at night...")
}

/** Trigger types for special evolutions */
export type EvolutionTrigger = 
  | { type: 'golden' }                          // Plant is golden
  | { type: 'night_water'; count: number }      // Watered at night X times
  | { type: 'combo_water'; count: number }      // Part of X combo waterings
  | { type: 'visitor_touch'; visitor?: string } // Touched by visitor (optional specific type)
  | { type: 'farmer_boosted'; count: number }   // Boosted by farmer X growth ticks
  | { type: 'neighbor_count'; min: number }     // Has at least X neighbors
  | { type: 'neighbor_same'; min: number }      // Has at least X same-seed neighbors
  | { type: 'neighbor_diverse'; min: number }   // Has X different evolution types adjacent
  | { type: 'age'; hours: number }              // Plant is X hours old
  | { type: 'harvest_spot'; count: number }     // Spot has had X harvests
  | { type: 'merge_count'; count: number }      // Player has merged X times total
  | { type: 'season'; season: 'spring' | 'summer' | 'fall' | 'winter' }
  | { type: 'month'; month: number }            // Real-world month (1-12)
  | { type: 'neighbor_evolution'; evolutionId: string } // Has specific neighbor
  | { type: 'all_neighbors_max' }               // All 8 neighbors are max stage
  | { type: 'random'; chance: number };         // Random chance (0-1)

/** Player's discovered evolutions */
export interface DiscoveryState {
  discovered: Set<string>;      // Evolution IDs the player has seen
  harvestCounts: Map<string, number>; // How many of each evolution harvested
}

/** Runtime plant tracking for evolution triggers */
export interface PlantEvolutionData {
  nightWaterCount: number;
  comboWaterCount: number;
  visitorTouches: string[];     // Visitor types that touched
  farmerBoostTicks: number;
  plantedTime: number;
  spotHarvestCount: number;
}
