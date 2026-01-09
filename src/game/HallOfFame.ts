// ===== Hall of Fame =====
// Memorial for legendary elders who served the garden

import { RetiredPlant, PlantData, BondLevel, ElderTier } from './types';
import { getEvolution, getEvolutionEmoji } from './evolution';
import { ELDERS } from './config';

// Epitaph templates based on achievements
const EPITAPHS = {
  legendary_soulmate: [
    "A legendary heart who loved deeply.",
    "Forever remembered for their bonds.",
    "Their love echoes through the garden.",
  ],
  legendary: [
    "A wise elder who guided many.",
    "Their wisdom lives on in new growth.",
    "A legend in their own time.",
  ],
  ancient_soulmate: [
    "An ancient soul with a warm heart.",
    "Their friendships shaped the garden.",
  ],
  ancient: [
    "Watched over many generations.",
    "A pillar of the garden community.",
  ],
  wishmaker: [
    "Made dreams come true.",
    "A giver of wishes.",
  ],
  golden: [
    "Touched by golden light.",
    "Radiant until the end.",
  ],
  default: [
    "A beloved garden friend.",
    "Gone but not forgotten.",
    "Part of the garden forever.",
  ]
};

/** Generate an epitaph based on plant achievements */
function generateEpitaph(plant: RetiredPlant): string {
  let pool: string[];
  
  if (plant.elderTier === 'legendary' && plant.strongestBondLevel === 'soulmate') {
    pool = EPITAPHS.legendary_soulmate;
  } else if (plant.elderTier === 'legendary') {
    pool = EPITAPHS.legendary;
  } else if (plant.elderTier === 'ancient' && plant.strongestBondLevel === 'soulmate') {
    pool = EPITAPHS.ancient_soulmate;
  } else if (plant.elderTier === 'ancient') {
    pool = EPITAPHS.ancient;
  } else if (plant.wishesGranted >= 3) {
    pool = EPITAPHS.wishmaker;
  } else if (plant.wasGolden) {
    pool = EPITAPHS.golden;
  } else {
    pool = EPITAPHS.default;
  }
  
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Format time alive for display */
function formatTimeAlive(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours >= 1) {
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

/** Create a retired plant entry from a living plant */
export function createRetiredPlant(
  plant: PlantData, 
  elderTier: ElderTier,
  strongestBond: BondLevel,
  wishesGranted: number = 0
): RetiredPlant {
  const retired: RetiredPlant = {
    id: plant.id,
    name: plant.name || 'Unknown',
    personalityId: plant.personality || 'cheerful',
    evolutionId: plant.evolutionId,
    seedId: plant.seedId,
    elderTier,
    retiredAt: Date.now(),
    timeAlive: Date.now() - plant.lastUpdateTime, // Approximate time alive
    totalBonds: plant.neighborBonds?.length || 0,
    strongestBondLevel: strongestBond,
    wishesGranted,
    wasGolden: plant.isGolden || false,
  };
  
  retired.epitaph = generateEpitaph(retired);
  return retired;
}

export class HallOfFame {
  private container: HTMLElement | null = null;
  private isOpen: boolean = false;
  private retiredPlants: RetiredPlant[] = [];
  
  constructor() {
    this.createUI();
  }
  
  private createUI(): void {
    // Create the Hall of Fame overlay
    this.container = document.createElement('div');
    this.container.className = 'hall-of-fame-overlay';
    this.container.innerHTML = `
      <div class="hall-of-fame-modal">
        <div class="hof-header">
          <h2>🏛️ Hall of Fame</h2>
          <p class="hof-subtitle">Honoring our legendary elders</p>
          <button class="hof-close" aria-label="Close">✕</button>
        </div>
        <div class="hof-content">
          <div class="hof-empty">
            <span class="hof-empty-icon">🌱</span>
            <p>No plants have been retired yet.</p>
            <p class="hof-hint">Retire legendary elders to honor them here!</p>
          </div>
          <div class="hof-plants"></div>
        </div>
        <div class="hof-footer">
          <span class="hof-count">0 / ${ELDERS.MAX_HALL_OF_FAME} legends</span>
        </div>
      </div>
    `;
    
    this.container.style.display = 'none';
    document.body.appendChild(this.container);
    
    // Event listeners
    const closeBtn = this.container.querySelector('.hof-close');
    closeBtn?.addEventListener('click', () => this.close());
    
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) this.close();
    });
  }
  
  /** Set the retired plants data */
  public setPlants(plants: RetiredPlant[]): void {
    this.retiredPlants = plants;
    this.render();
  }
  
  /** Add a newly retired plant */
  public addPlant(plant: RetiredPlant): void {
    this.retiredPlants.unshift(plant);
    
    // Enforce maximum
    if (this.retiredPlants.length > ELDERS.MAX_HALL_OF_FAME) {
      this.retiredPlants = this.retiredPlants.slice(0, ELDERS.MAX_HALL_OF_FAME);
    }
    
    this.render();
  }
  
  /** Get all retired plants for saving */
  public getPlants(): RetiredPlant[] {
    return this.retiredPlants;
  }
  
  private render(): void {
    if (!this.container) return;
    
    const plantsContainer = this.container.querySelector('.hof-plants');
    const emptyState = this.container.querySelector('.hof-empty') as HTMLElement;
    const countEl = this.container.querySelector('.hof-count');
    
    if (!plantsContainer || !emptyState || !countEl) return;
    
    // Update count
    countEl.textContent = `${this.retiredPlants.length} / ${ELDERS.MAX_HALL_OF_FAME} legends`;
    
    // Show/hide empty state
    if (this.retiredPlants.length === 0) {
      emptyState.style.display = 'flex';
      plantsContainer.innerHTML = '';
      return;
    }
    
    emptyState.style.display = 'none';
    
    // Render plants
    plantsContainer.innerHTML = this.retiredPlants.map(plant => {
      const emoji = getEvolutionEmoji(plant.evolutionId);
      
      const tierClass = plant.elderTier === 'legendary' ? 'legendary' : 
                        plant.elderTier === 'ancient' ? 'ancient' : 'elder';
      
      const tierIcon = plant.elderTier === 'legendary' ? '👑' :
                       plant.elderTier === 'ancient' ? '✨' : '🌟';
      
      const bondIcon = plant.strongestBondLevel === 'soulmate' ? '💕' :
                       plant.strongestBondLevel === 'bestFriend' ? '💗' :
                       plant.strongestBondLevel === 'friend' ? '💛' : '';
      
      return `
        <div class="hof-plant ${tierClass} ${plant.wasGolden ? 'golden' : ''}">
          <div class="hof-plant-emoji">${emoji}</div>
          <div class="hof-plant-info">
            <div class="hof-plant-name">
              ${tierIcon} ${plant.name} ${bondIcon}
            </div>
            <div class="hof-plant-epitaph">"${plant.epitaph}"</div>
            <div class="hof-plant-stats">
              <span title="Time in garden">⏱️ ${formatTimeAlive(plant.timeAlive)}</span>
              ${plant.totalBonds > 0 ? `<span title="Bonds formed">🤝 ${plant.totalBonds}</span>` : ''}
              ${plant.wishesGranted > 0 ? `<span title="Wishes granted">💫 ${plant.wishesGranted}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  public open(): void {
    if (!this.container) return;
    this.isOpen = true;
    this.container.style.display = 'flex';
    this.render();
  }
  
  public close(): void {
    if (!this.container) return;
    this.isOpen = false;
    this.container.style.display = 'none';
  }
  
  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
