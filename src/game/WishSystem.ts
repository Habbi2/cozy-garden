// ===== Plant Wish System =====
// Plants have desires that create emotional connection

import { PlantData, PlantWish, WishType, BondLevel } from './types';
import { isMaxEvolution } from './evolution';
import { isNightTime } from './evolution/triggers';

// Wish timing constants
const WISH_MIN_INTERVAL = 5 * 60 * 1000;   // 5 minutes minimum between wishes
const WISH_MAX_INTERVAL = 15 * 60 * 1000;  // 15 minutes maximum
const WISH_DURATION = 10 * 60 * 1000;       // Wishes expire after 10 minutes

// Wish definitions
interface WishDefinition {
  type: WishType;
  emoji: string;
  getText: (plant: PlantData, target?: PlantData) => string;
  canAppear: (plant: PlantData, neighbors: PlantData[], allPlants: PlantData[]) => boolean;
  isFulfilled: (plant: PlantData, neighbors: PlantData[], context: WishContext) => boolean;
  priority: number;  // Higher = more likely to be chosen
}

export interface WishContext {
  justWatered?: boolean;
  isNight?: boolean;
  visitorJustTouched?: string;
  neighborJustPlanted?: boolean;
}

const WISH_DEFINITIONS: WishDefinition[] = [
  {
    type: 'lonely',
    emoji: '🌱',
    getText: (plant) => `${plant.name} wants a friend nearby`,
    canAppear: (plant, neighbors) => neighbors.length === 0,
    isFulfilled: (plant, neighbors) => neighbors.length > 0,
    priority: 10,
  },
  {
    type: 'want_visitor',
    emoji: '🦋',
    getText: (plant) => `${plant.name} wants to meet a butterfly`,
    canAppear: (plant) => plant.evoData.visitorTouches.length === 0,
    isFulfilled: (plant, _, context) => context.visitorJustTouched !== undefined,
    priority: 5,
  },
  {
    type: 'night_water',
    emoji: '🌙',
    getText: (plant) => `${plant.name} wants moonlit water`,
    canAppear: () => isNightTime(),
    isFulfilled: (plant, _, context) => context.justWatered === true && context.isNight === true,
    priority: 8,
  },
  {
    type: 'help_friend',
    emoji: '💧',
    getText: (plant, target) => `${plant.name} wants you to water ${target?.name || 'their friend'}`,
    canAppear: (plant, neighbors) => {
      // Has a bonded friend that's not watered
      const bondedNeighbor = neighbors.find(n => {
        const bond = plant.neighborBonds?.find(b => b.plantId === n.id);
        return bond && (bond.level === 'friend' || bond.level === 'bestFriend' || bond.level === 'soulmate') && !n.isWatered;
      });
      return bondedNeighbor !== undefined;
    },
    isFulfilled: (plant, neighbors) => {
      // Check if bonded friend is now watered
      const bondedNeighbor = neighbors.find(n => {
        const bond = plant.neighborBonds?.find(b => b.plantId === n.id);
        return bond && (bond.level === 'friend' || bond.level === 'bestFriend' || bond.level === 'soulmate');
      });
      return bondedNeighbor?.isWatered === true;
    },
    priority: 12,
  },
  {
    type: 'grow_tall',
    emoji: '📈',
    getText: (plant) => `${plant.name} dreams of growing bigger`,
    canAppear: (plant) => !isMaxEvolution(plant.evolutionId) && plant.growthProgress < 0.3,
    isFulfilled: (plant) => plant.growthProgress >= 0.8 || isMaxEvolution(plant.evolutionId),
    priority: 4,
  },
  {
    type: 'make_friend',
    emoji: '💕',
    getText: (plant, target) => `${plant.name} wants to befriend ${target?.name || 'someone'}`,
    canAppear: (plant, neighbors) => {
      // Has a neighbor that's still just an acquaintance
      const acquaintance = neighbors.find(n => {
        const bond = plant.neighborBonds?.find(b => b.plantId === n.id);
        return bond && bond.level === 'acquaintance';
      });
      return acquaintance !== undefined;
    },
    isFulfilled: (plant, neighbors) => {
      // Check if any acquaintance became a friend
      return neighbors.some(n => {
        const bond = plant.neighborBonds?.find(b => b.plantId === n.id);
        return bond && bond.level !== 'acquaintance';
      });
    },
    priority: 7,
  },
  {
    type: 'sunny_spot',
    emoji: '☀️',
    getText: (plant) => `${plant.name} wants to be surrounded by friends`,
    canAppear: (plant, neighbors) => neighbors.length >= 1 && neighbors.length < 4,
    isFulfilled: (plant, neighbors) => neighbors.length >= 4,
    priority: 3,
  },
];

/**
 * Check if a plant should receive a new wish
 */
export function shouldGenerateWish(plant: PlantData, now: number): boolean {
  // Already has an active wish
  if (plant.activeWish && now < plant.activeWish.expiresAt) {
    return false;
  }
  
  // Check minimum interval since last wish
  const lastWishTime = plant.lastWishTime || plant.evoData.plantedTime;
  const timeSinceLastWish = now - lastWishTime;
  
  if (timeSinceLastWish < WISH_MIN_INTERVAL) {
    return false;
  }
  
  // Random chance increases with time since last wish
  const chance = Math.min((timeSinceLastWish - WISH_MIN_INTERVAL) / (WISH_MAX_INTERVAL - WISH_MIN_INTERVAL), 1);
  return Math.random() < chance * 0.1; // Max 10% chance per check when at max interval
}

/**
 * Generate a wish for a plant based on its current state
 */
export function generateWish(
  plant: PlantData, 
  neighbors: PlantData[], 
  allPlants: PlantData[],
  now: number
): PlantWish | null {
  // Find all valid wishes
  const validWishes = WISH_DEFINITIONS.filter(def => def.canAppear(plant, neighbors, allPlants));
  
  if (validWishes.length === 0) {
    return null;
  }
  
  // Weighted random selection by priority
  const totalPriority = validWishes.reduce((sum, w) => sum + w.priority, 0);
  let random = Math.random() * totalPriority;
  
  let selectedDef: WishDefinition | null = null;
  for (const def of validWishes) {
    random -= def.priority;
    if (random <= 0) {
      selectedDef = def;
      break;
    }
  }
  
  if (!selectedDef) {
    selectedDef = validWishes[0];
  }
  
  // Find target plant for wishes that involve another plant
  let targetPlant: PlantData | undefined;
  if (selectedDef.type === 'help_friend' || selectedDef.type === 'make_friend') {
    targetPlant = neighbors.find(n => {
      const bond = plant.neighborBonds?.find(b => b.plantId === n.id);
      if (selectedDef!.type === 'help_friend') {
        return bond && bond.level !== 'acquaintance' && !n.isWatered;
      } else {
        return bond && bond.level === 'acquaintance';
      }
    });
  }
  
  return {
    type: selectedDef.type,
    text: selectedDef.getText(plant, targetPlant),
    emoji: selectedDef.emoji,
    targetId: targetPlant?.id,
    createdAt: now,
    expiresAt: now + WISH_DURATION,
  };
}

/**
 * Check if a plant's current wish has been fulfilled
 */
export function checkWishFulfilled(
  plant: PlantData,
  neighbors: PlantData[],
  context: WishContext
): boolean {
  if (!plant.activeWish) {
    return false;
  }
  
  const def = WISH_DEFINITIONS.find(d => d.type === plant.activeWish!.type);
  if (!def) {
    return false;
  }
  
  return def.isFulfilled(plant, neighbors, context);
}

/**
 * Get the bond strength bonus for fulfilled wishes
 */
export function getWishFulfillmentBonus(wishType: WishType): number {
  // Returns milliseconds to add to bond formation
  switch (wishType) {
    case 'help_friend':
      return 2 * 60 * 1000;  // 2 minutes bonus
    case 'make_friend':
      return 3 * 60 * 1000;  // 3 minutes bonus
    case 'lonely':
      return 1 * 60 * 1000;  // 1 minute bonus
    default:
      return 30 * 1000;       // 30 seconds bonus
  }
}

/**
 * Check if a wish has expired
 */
export function isWishExpired(wish: PlantWish, now: number): boolean {
  return now >= wish.expiresAt;
}
