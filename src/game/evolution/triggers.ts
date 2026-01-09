import { EvolutionTrigger, PlantEvolutionData, Evolution } from './types';
import { PlantData, Position } from '../types';

/** Check if a trigger condition is met */
export function checkTrigger(
  trigger: EvolutionTrigger,
  plant: PlantData,
  evoData: PlantEvolutionData,
  neighbors: PlantData[],
  gameState: {
    totalMerges: number;
    currentHour: number;
    currentMonth: number;
  }
): boolean {
  switch (trigger.type) {
    case 'golden':
      return plant.isGolden === true;
      
    case 'night_water':
      return evoData.nightWaterCount >= trigger.count;
      
    case 'combo_water':
      return evoData.comboWaterCount >= trigger.count;
      
    case 'visitor_touch':
      if (trigger.visitor) {
        return evoData.visitorTouches.includes(trigger.visitor);
      }
      return evoData.visitorTouches.length > 0;
      
    case 'farmer_boosted':
      return evoData.farmerBoostTicks >= trigger.count;
      
    case 'neighbor_count':
      return neighbors.length >= trigger.min;
      
    case 'neighbor_same':
      const sameSeed = neighbors.filter(n => n.seedId === plant.seedId);
      return sameSeed.length >= trigger.min;
      
    case 'neighbor_diverse':
      const uniqueEvolutions = new Set(neighbors.map(n => n.evolutionId));
      return uniqueEvolutions.size >= trigger.min;
      
    case 'age': {
      const hoursOld = (Date.now() - evoData.plantedTime) / (1000 * 60 * 60);
      return hoursOld >= trigger.hours;
    }
      
    case 'harvest_spot':
      return evoData.spotHarvestCount >= trigger.count;
      
    case 'merge_count':
      return gameState.totalMerges >= trigger.count;
      
    case 'season': {
      const month = gameState.currentMonth;
      const season = getSeason(month);
      return season === trigger.season;
    }
      
    case 'month':
      return gameState.currentMonth === trigger.month;
      
    case 'neighbor_evolution':
      return neighbors.some(n => n.evolutionId === trigger.evolutionId);
      
    case 'all_neighbors_max':
      // Check if has exactly 8 neighbors (full surround) and all are max tier (5+)
      // This needs evolution lookup, so we'll handle it specially
      return neighbors.length === 8; // Simplified for now
      
    case 'random':
      return Math.random() < trigger.chance;
      
    default:
      return false;
  }
}

/** Get the season from a month (1-12) */
function getSeason(month: number): 'spring' | 'summer' | 'fall' | 'winter' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

/** Check if current hour is "night" (8pm - 6am) */
export function isNightTime(hour: number = new Date().getHours()): boolean {
  return hour >= 20 || hour < 6;
}

/** Get all neighbors at given position in a grid */
export function getNeighborPositions(pos: Position, gridSize: number): Position[] {
  const neighbors: Position[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }
  return neighbors;
}

/** Determine next evolution for a plant */
export function determineNextEvolution(
  currentEvolution: Evolution,
  plant: PlantData,
  evoData: PlantEvolutionData,
  neighbors: PlantData[],
  gameState: {
    totalMerges: number;
    currentHour: number;
    currentMonth: number;
  }
): string | null {
  // Check special evolutions first (in order)
  if (currentEvolution.specialEvolutions) {
    for (const special of currentEvolution.specialEvolutions) {
      if (checkTrigger(special.trigger, plant, evoData, neighbors, gameState)) {
        return special.evolutionId;
      }
    }
  }
  
  // Fall back to default
  return currentEvolution.defaultEvolution;
}

/** Create initial evolution data for a new plant */
export function createEvolutionData(): PlantEvolutionData {
  return {
    nightWaterCount: 0,
    comboWaterCount: 0,
    visitorTouches: [],
    farmerBoostTicks: 0,
    plantedTime: Date.now(),
    spotHarvestCount: 0,
  };
}
