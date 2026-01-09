// ===== Evolution System - Main Index =====

// Re-export types
export * from './types';

// Re-export seeds
export { SEEDS, getSeed, getUnlockedSeeds, getSeedCost } from './seeds';

// Re-export triggers
export { 
  checkTrigger, 
  isNightTime, 
  getNeighborPositions, 
  determineNextEvolution,
  createEvolutionData 
} from './triggers';

// Import config for growth scaling
import { GROWTH_SCALING } from '../config';

// Import all evolution trees
import { SPROUT_EVOLUTIONS } from './sprout-tree';
import { ACORN_EVOLUTIONS } from './acorn-tree';
import { BEAN_EVOLUTIONS } from './bean-tree';
import { BULB_EVOLUTIONS } from './bulb-tree';
import { SPORE_EVOLUTIONS } from './spore-tree';
import { CACTUS_EVOLUTIONS } from './cactus-tree';
import { Evolution } from './types';

// ===== Combined Evolution Registry =====

export const ALL_EVOLUTIONS: Evolution[] = [
  ...SPROUT_EVOLUTIONS,
  ...ACORN_EVOLUTIONS,
  ...BEAN_EVOLUTIONS,
  ...BULB_EVOLUTIONS,
  ...SPORE_EVOLUTIONS,
  ...CACTUS_EVOLUTIONS,
];

// Build lookup maps for fast access
const evolutionById = new Map<string, Evolution>();
const evolutionsBySeed = new Map<string, Evolution[]>();

for (const evo of ALL_EVOLUTIONS) {
  evolutionById.set(evo.id, evo);
  
  if (!evolutionsBySeed.has(evo.seedId)) {
    evolutionsBySeed.set(evo.seedId, []);
  }
  evolutionsBySeed.get(evo.seedId)!.push(evo);
}

// ===== Helper Functions =====

/** Get evolution by ID */
export function getEvolution(evolutionId: string): Evolution | undefined {
  return evolutionById.get(evolutionId);
}

/** Get all evolutions for a seed type */
export function getEvolutionsForSeed(seedId: string): Evolution[] {
  return evolutionsBySeed.get(seedId) ?? [];
}

/** Get the starting evolution for a seed */
export function getStartingEvolution(seedId: string): Evolution | undefined {
  return evolutionsBySeed.get(seedId)?.find(e => e.tier === 0);
}

/** Check if an evolution is max stage (harvestable) */
export function isMaxEvolution(evolutionId: string): boolean {
  const evo = getEvolution(evolutionId);
  if (!evo) return false;
  // Max if it has no default evolution AND has point value
  return evo.defaultEvolution === null && evo.pointValue > 0;
}

/** Check if an evolution is legendary */
export function isLegendaryEvolution(evolutionId: string): boolean {
  const evo = getEvolution(evolutionId);
  return evo?.isLegendary === true;
}

/** Get harvest value for an evolution */
export function getHarvestValue(evolutionId: string): number {
  return getEvolution(evolutionId)?.pointValue ?? 0;
}

/** Get visual scale for an evolution */
export function getVisualScale(evolutionId: string): number {
  return getEvolution(evolutionId)?.visualScale ?? 1.0;
}

/** Get emoji for an evolution */
export function getEvolutionEmoji(evolutionId: string): string {
  return getEvolution(evolutionId)?.emoji ?? '❓';
}

/** Get name for an evolution */
export function getEvolutionName(evolutionId: string): string {
  return getEvolution(evolutionId)?.name ?? 'Unknown';
}

/** Get growth time to next evolution (with tier scaling applied) */
export function getGrowthTime(evolutionId: string): number {
  const evo = getEvolution(evolutionId);
  if (!evo || !evo.defaultEvolution) return Infinity;
  
  const nextEvo = getEvolution(evo.defaultEvolution);
  if (!nextEvo) return Infinity;
  
  const baseTime = nextEvo.growthTime;
  if (baseTime === 0 || baseTime === Infinity) return baseTime;
  
  // Apply tier-based scaling multiplier
  const tier = nextEvo.tier;
  const multiplier = GROWTH_SCALING.TIER_MULTIPLIERS[tier] ?? 1;
  
  return Math.round(baseTime * multiplier);
}

/** Get raw growth time without scaling (for display purposes) */
export function getRawGrowthTime(evolutionId: string): number {
  const evo = getEvolution(evolutionId);
  if (!evo || !evo.defaultEvolution) return Infinity;
  
  const nextEvo = getEvolution(evo.defaultEvolution);
  return nextEvo?.growthTime ?? Infinity;
}

/** Count total evolutions */
export function getTotalEvolutionCount(): number {
  return ALL_EVOLUTIONS.length;
}

/** Count evolutions by rarity */
export function getEvolutionCountByRarity(): Record<string, number> {
  const counts: Record<string, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  };
  
  for (const evo of ALL_EVOLUTIONS) {
    const rarity = evo.rarity ?? 'common';
    counts[rarity]++;
  }
  
  return counts;
}

/** Get all harvestable (max) evolutions */
export function getHarvestableEvolutions(): Evolution[] {
  return ALL_EVOLUTIONS.filter(e => e.pointValue > 0);
}

/** Get all legendary evolutions */
export function getLegendaryEvolutions(): Evolution[] {
  return ALL_EVOLUTIONS.filter(e => e.isLegendary);
}

// ===== Stats for UI =====

/** Evolution info for discovery tracking */
export interface EvolutionStat {
  id: string;
  seedId: string;
  rarity: string;
}

/** Map of all evolutions by ID for discovery grid */
export const EVOLUTION_STATS: Record<string, EvolutionStat> = {};
for (const evo of ALL_EVOLUTIONS) {
  EVOLUTION_STATS[evo.id] = {
    id: evo.id,
    seedId: evo.seedId,
    rarity: evo.rarity ?? 'common',
  };
}

export const TOTAL_EVOLUTION_COUNT = ALL_EVOLUTIONS.length;
export const HARVESTABLE_COUNT = ALL_EVOLUTIONS.filter(e => e.pointValue > 0).length;
export const LEGENDARY_COUNT = ALL_EVOLUTIONS.filter(e => e.isLegendary).length;

console.log(`🌱 Evolution system loaded: ${TOTAL_EVOLUTION_COUNT} evolutions across 6 seed types`);
console.log(`   📊 Harvestable: ${HARVESTABLE_COUNT} | Legendary: ${LEGENDARY_COUNT}`);
