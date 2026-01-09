import { SeedType } from './types';

// ===== Seed Types (Starting Points) =====

export const SEEDS: SeedType[] = [
  {
    id: 'sprout',
    name: 'Sprout',
    emoji: '🌱',
    description: 'The humble beginning. Grows into flowers and herbs.',
    cost: 0,
    baseGrowthTime: 30000,
  },
  {
    id: 'acorn',
    name: 'Acorn',
    emoji: '🌰',
    description: 'Slow but mighty. Grows into majestic trees.',
    cost: 150,
    baseGrowthTime: 45000,
  },
  {
    id: 'bean',
    name: 'Bean',
    emoji: '🫘',
    description: 'Fast climber. Grows into vines and gourds.',
    cost: 300,
    baseGrowthTime: 25000,
  },
  {
    id: 'bulb',
    name: 'Bulb',
    emoji: '🧅',
    description: 'Underground magic. Grows roots and exotic blooms.',
    cost: 500,
    baseGrowthTime: 35000,
  },
  {
    id: 'spore',
    name: 'Spore',
    emoji: '🍄',
    description: 'Shade lover. Grows fungi and mysterious plants.',
    cost: 800,
    baseGrowthTime: 40000,
  },
  {
    id: 'cactus',
    name: 'Cactus Pip',
    emoji: '🌵',
    description: 'Desert survivor. Grows succulents and hardy plants.',
    cost: 1200,
    baseGrowthTime: 50000,
  },
];

// Helper functions
export function getSeed(seedId: string): SeedType | undefined {
  return SEEDS.find(s => s.id === seedId);
}

export function getUnlockedSeeds(unlockedIds: string[]): SeedType[] {
  return SEEDS.filter(s => s.cost === 0 || unlockedIds.includes(s.id));
}

export function getSeedCost(seedId: string): number {
  return getSeed(seedId)?.cost ?? Infinity;
}
