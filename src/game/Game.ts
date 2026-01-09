import { GameState, FarmerState, PlantData, Position, OfflineProgress, GameEvent } from './types';
import { RESOURCES, TIMING, VISITORS, ECONOMY, GARDEN } from './config';
import { Garden } from './Garden';
import { Farmer } from './Farmer';
import { SaveManager } from './SaveManager';
import { SoundManager } from './SoundManager';
import { Effects } from './Effects';
import { Visitor, VisitorType, VISITOR_TYPES, VisitorConfig } from './Visitor';
import { WishContext } from './WishSystem';
import { HallOfFame, createRetiredPlant } from './HallOfFame';
import { 
  SEEDS,
  getSeed, 
  getEvolution, 
  isMaxEvolution, 
  isLegendaryEvolution,
  getSeedCost,
  EVOLUTION_STATS,
  TOTAL_EVOLUTION_COUNT,
  createEvolutionData
} from './evolution';

export class Game {
  private state: GameState;
  private garden: Garden;
  private farmer: Farmer;
  private saveManager: SaveManager;
  private soundManager: SoundManager;
  private effects: Effects;
  private hallOfFame: HallOfFame;
  
  private gridElement: HTMLElement;
  private waterCountElement: HTMLElement;
  private pointsCountElement: HTMLElement;
  private discoveryCountElement: HTMLElement;
  
  private growthInterval: number | null = null;
  private waterRegenInterval: number | null = null;
  private ambientInterval: number | null = null;
  private visitorSpawnTimeout: number | null = null;
  private currentVisitor: Visitor | null = null;
  private doubleHarvestActive: boolean = false;
  
  constructor() {
    // Get DOM elements
    this.gridElement = document.getElementById('game-grid')!;
    this.waterCountElement = document.getElementById('water-count')!;
    this.pointsCountElement = document.getElementById('points-count')!;
    this.discoveryCountElement = document.getElementById('discovery-count')!;
    
    // Initialize managers
    this.saveManager = new SaveManager();
    this.soundManager = new SoundManager();
    this.effects = new Effects();
    
    // Load or create state
    const savedState = this.saveManager.load();
    
    if (savedState) {
      // Migrate old state if needed
      this.state = this.migrateState(savedState);
      this.checkOfflineProgress();
    } else {
      this.state = this.createInitialState();
    }
    
    // Initialize garden
    this.garden = new Garden(
      this.state.plants,
      this.gridElement,
      (event: GameEvent) => this.handleGameEvent(event),
      () => this.state.water > 0,
      () => this.state.selectedSeedId,
      () => ({ totalMerges: this.state.totalMerges })
    );
    
    // Initialize farmer
    const centerPos = Math.floor(GARDEN.gridSize / 2);
    if (!this.state.farmer) {
      this.state.farmer = {
        position: { x: centerPos, y: centerPos },
        targetPosition: null,
        currentAction: 'idle',
        lastActionTime: Date.now(),
      };
    }
    
    this.farmer = new Farmer(
      this.state.farmer,
      this.gridElement,
      GARDEN.gridSize
    );
    
    // Setup farmer tap handler (auto-water nearby plants)
    this.farmer.setOnTapped(() => this.handleFarmerTapped());
    
    // Setup farmer auto-water (waters 1 nearby plant every 15s)
    this.farmer.setOnAutoWater(() => this.handleFarmerAutoWater());
    
    // Initialize Hall of Fame
    this.hallOfFame = new HallOfFame();
    this.hallOfFame.setPlants(this.state.retiredPlants || []);
    
    // Setup retire callback for garden
    this.garden.setRetireCallback((plant) => this.retirePlantToHallOfFame(plant));
    
    // Setup UI
    this.setupSeedPicker();
    this.setupShop();
    this.setupDiscoveryModal();
    this.setupHallOfFameButton();
    this.updateUI();
    
    // Render garden
    this.garden.render();
    
    // Start game loops
    this.startGrowthLoop();
    this.startWaterRegenLoop();
    this.startAmbientLoop();
    this.scheduleNextVisitor();
    
    // Set initial ambient
    this.updateAmbient();
  }
  
  private createInitialState(): GameState {
    const centerPos = Math.floor(GARDEN.gridSize / 2);
    
    return {
      plants: [],
      farmer: {
        position: { x: centerPos, y: centerPos },
        targetPosition: null,
        currentAction: 'idle',
        lastActionTime: Date.now(),
      },
      water: RESOURCES.WATER_MAX,
      lastWaterRegen: Date.now(),
      gardenPoints: 0,
      totalPlantsMaxed: 0,
      totalMerges: 0,
      unlockedSeeds: ['sprout'], // Start with sprout unlocked
      discoveredEvolutions: [],
      selectedSeedId: 'sprout',
      harvestCounts: {},
      spotHarvestCounts: {},
      lastSaveTime: Date.now(),
      lastPlayTime: Date.now(),
      retiredPlants: [],
    };
  }
  
  /** Migrate old save format to new format */
  private migrateState(saved: any): GameState {
    // Check if already new format
    if (saved.plants !== undefined && saved.unlockedSeeds !== undefined) {
      return saved as GameState;
    }
    
    // Old format had zones array - migrate to new format
    console.log('Migrating save from old zone format...');
    
    const centerPos = Math.floor(GARDEN.gridSize / 2);
    const newState: GameState = {
      plants: [],
      farmer: saved.farmer || {
        position: { x: centerPos, y: centerPos },
        targetPosition: null,
        currentAction: 'idle',
        lastActionTime: Date.now(),
      },
      water: saved.water || RESOURCES.WATER_MAX,
      lastWaterRegen: saved.lastWaterRegen || Date.now(),
      gardenPoints: saved.gardenPoints || 0,
      totalPlantsMaxed: saved.totalPlantsMaxed || 0,
      totalMerges: saved.totalMerges || 0,
      unlockedSeeds: ['sprout'],
      discoveredEvolutions: [],
      selectedSeedId: 'sprout',
      harvestCounts: {},
      spotHarvestCounts: {},
      lastSaveTime: saved.lastSaveTime || Date.now(),
      lastPlayTime: saved.lastPlayTime || Date.now(),
      retiredPlants: [],
    };
    
    // Migrate plants from zones if they exist
    if (saved.zones && Array.isArray(saved.zones)) {
      for (const zone of saved.zones) {
        if (zone.plants && Array.isArray(zone.plants)) {
          for (const oldPlant of zone.plants) {
            // Convert old plant to new format (best effort)
            const newPlant: PlantData = {
              id: oldPlant.id || `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              seedId: 'sprout', // Default to sprout
              evolutionId: 'sprout_seedling', // Start at beginning
              position: oldPlant.position || { x: 0, y: 0 },
              isWatered: oldPlant.isWatered || false,
              waterCount: 0,
              growthProgress: oldPlant.growthProgress || 0,
              lastUpdateTime: oldPlant.lastUpdateTime || Date.now(),
              isGolden: oldPlant.isGolden || false,
              growthBoost: oldPlant.growthBoost || 1,
              evoData: createEvolutionData(),
            };
            
            // Only add if position is valid for new grid
            if (newPlant.position.x < GARDEN.gridSize && newPlant.position.y < GARDEN.gridSize) {
              newState.plants.push(newPlant);
            }
          }
        }
      }
    }
    
    return newState;
  }
  
  private setupSeedPicker(): void {
    const picker = document.getElementById('seed-picker');
    if (!picker) return;
    
    picker.innerHTML = '';
    
    // Create buttons for unlocked seeds
    for (const seed of SEEDS) {
      const btn = document.createElement('button');
      btn.className = 'seed-btn';
      btn.dataset.seed = seed.id;
      btn.textContent = seed.emoji;
      btn.title = seed.name;
      
      if (!this.state.unlockedSeeds.includes(seed.id)) {
        btn.classList.add('locked');
        btn.textContent = '🔒';
      }
      
      if (seed.id === this.state.selectedSeedId) {
        btn.classList.add('selected');
      }
      
      btn.addEventListener('click', () => {
        if (!this.state.unlockedSeeds.includes(seed.id)) {
          return;
        }
        
        this.selectSeed(seed.id);
      });
      
      picker.appendChild(btn);
    }
  }
  
  private selectSeed(seedId: string): void {
    this.state.selectedSeedId = seedId;
    
    // Update UI
    document.querySelectorAll('.seed-btn').forEach(btn => {
      btn.classList.toggle('selected', (btn as HTMLElement).dataset.seed === seedId);
    });
    
    this.soundManager.play('click');
    this.save();
  }
  
  private setupShop(): void {
    const shopBtn = document.getElementById('shop-btn');
    const shopModal = document.getElementById('seed-shop');
    const closeBtn = document.getElementById('shop-close');
    
    if (!shopBtn || !shopModal) return;
    
    shopBtn.addEventListener('click', () => {
      this.renderShop();
      shopModal.classList.remove('hidden');
      this.soundManager.play('click');
    });
    
    closeBtn?.addEventListener('click', () => {
      shopModal.classList.add('hidden');
      this.soundManager.play('click');
    });
    
    // Close on click outside
    shopModal.addEventListener('click', (e) => {
      if (e.target === shopModal) {
        shopModal.classList.add('hidden');
      }
    });
  }
  
  private renderShop(): void {
    const seedList = document.getElementById('seed-list');
    if (!seedList) return;
    
    seedList.innerHTML = '';
    
    for (const seed of SEEDS) {
      const isUnlocked = this.state.unlockedSeeds.includes(seed.id);
      const cost = getSeedCost(seed.id);
      const canAfford = this.state.gardenPoints >= cost;
      
      const item = document.createElement('div');
      item.className = `seed-item${isUnlocked ? ' unlocked' : ''}`;
      
      item.innerHTML = `
        <span class="seed-emoji">${seed.emoji}</span>
        <div class="seed-info">
          <div class="seed-name">${seed.name}</div>
          <div class="seed-desc">${seed.description}</div>
        </div>
        <div class="seed-price">
          ${isUnlocked ? '✓ Owned' : `${cost} 🌟`}
        </div>
      `;
      
      if (!isUnlocked) {
        item.classList.toggle('can-afford', canAfford);
        item.addEventListener('click', () => {
          if (canAfford) {
            this.unlockSeed(seed.id);
          }
        });
      }
      
      seedList.appendChild(item);
    }
  }
  
  private unlockSeed(seedId: string): void {
    const cost = getSeedCost(seedId);
    if (this.state.gardenPoints < cost) return;
    
    this.state.gardenPoints -= cost;
    this.state.unlockedSeeds.push(seedId);
    
    const seed = getSeed(seedId);
    if (seed) {
      this.soundManager.play('unlock');
    }
    
    this.setupSeedPicker();
    this.renderShop();
    this.updateUI();
    this.save();
    
    this.handleGameEvent({ type: 'seed_unlocked', seedId });
  }
  
  private setupDiscoveryModal(): void {
    const discoveryBtn = document.getElementById('discovery-display');
    const modal = document.getElementById('discovery-modal');
    const closeBtn = modal?.querySelector('.close-modal');
    const tabs = modal?.querySelectorAll('.discovery-tab');
    
    if (!discoveryBtn || !modal) return;
    
    discoveryBtn.addEventListener('click', () => {
      this.renderDiscoveryGrid('all');
      modal.classList.remove('hidden');
      this.soundManager.play('click');
    });
    
    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
      this.soundManager.play('click');
    });
    
    tabs?.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = (tab as HTMLElement).dataset.filter || 'all';
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.renderDiscoveryGrid(filter);
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  }
  
  private setupHallOfFameButton(): void {
    // Create Hall of Fame button in the header
    const discoveryBtn = document.getElementById('discovery-btn');
    if (!discoveryBtn?.parentElement) return;
    
    const hofBtn = document.createElement('div');
    hofBtn.id = 'hall-of-fame-btn';
    hofBtn.className = 'hall-of-fame-display';
    hofBtn.innerHTML = `
      <span class="hof-icon">🏛️</span>
      <span id="hof-count">${this.state.retiredPlants?.length || 0}</span>
    `;
    hofBtn.title = 'Hall of Fame';
    
    hofBtn.addEventListener('click', () => {
      this.hallOfFame.toggle();
      this.soundManager.play('click');
    });
    
    // Insert after discovery button
    discoveryBtn.parentElement.insertBefore(hofBtn, discoveryBtn.nextSibling);
  }
  
  /** Retire a plant to the Hall of Fame */
  private retirePlantToHallOfFame(plant: PlantData): void {
    const elderTier = this.garden.getPlantElderTier(plant);
    const strongestBond = this.garden.getStrongestBond(plant);
    const wishesGranted = this.garden.getWishesGrantedCount(plant);
    
    const retired = createRetiredPlant(plant, elderTier, strongestBond, wishesGranted);
    
    // Add to Hall of Fame
    this.hallOfFame.addPlant(retired);
    
    // Update state
    if (!this.state.retiredPlants) {
      this.state.retiredPlants = [];
    }
    this.state.retiredPlants = this.hallOfFame.getPlants();
    
    // Update button count
    const hofCount = document.getElementById('hof-count');
    if (hofCount) {
      hofCount.textContent = this.state.retiredPlants.length.toString();
    }
    
    // Play special sound
    this.soundManager.play('grow');
    
    // Farmer celebrates
    this.farmer.speak('evolve');
  }

  private renderDiscoveryGrid(filter: string): void {
    const grid = document.getElementById('discovery-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Get all evolutions for selected seed type (or all)
    const allEvolutions = Object.values(EVOLUTION_STATS);
    let filtered = allEvolutions;
    
    if (filter !== 'all') {
      filtered = allEvolutions.filter(evo => evo.seedId === filter);
    }
    
    for (const evo of filtered) {
      const isDiscovered = this.state.discoveredEvolutions.includes(evo.id);
      
      const item = document.createElement('div');
      item.className = `discovery-item${isDiscovered ? '' : ' undiscovered'}`;
      item.dataset.rarity = evo.rarity;
      
      if (isDiscovered) {
        const evolution = getEvolution(evo.id);
        item.innerHTML = `
          <div class="discovery-emoji">${evolution?.emoji || '❓'}</div>
          <div class="discovery-name">${evolution?.name || 'Unknown'}</div>
        `;
      } else {
        item.innerHTML = `
          <div class="discovery-emoji">❓</div>
          <div class="discovery-name">???</div>
        `;
      }
      
      grid.appendChild(item);
    }
  }
  
  private handleGameEvent(event: GameEvent): void {
    switch (event.type) {
      case 'plant_placed':
        this.soundManager.play('plant');
        this.effects.plantEffect(event.plant.position);
        this.farmer.react('wave');
        if (Math.random() < 0.3) {
          this.farmer.speak('plant');
        }
        break;
        
      case 'plant_watered':
        if (!event.isFreeWater) {
          this.state.water--;
          this.updateUI();
        }
        this.soundManager.play('water');
        this.effects.waterEffect(event.plant.position);
        this.farmer.react('celebrate');
        if (Math.random() < 0.2) {
          this.farmer.speak('water');
        }
        // Check if any plant wishes were fulfilled
        this.garden.checkWishFulfillment({
          justWatered: true,
          isNight: this.isNightTime()
        });
        break;
        
      case 'plant_evolved':
        this.soundManager.play('grow');
        this.effects.growthEffect(event.plant.position);
        
        if (event.isSpecial) {
          this.farmer.speak('evolve');
        } else {
          this.farmer.speak('grow');
        }
        
        // Check if max
        if (isMaxEvolution(event.toEvolution)) {
          this.state.totalPlantsMaxed++;
          
          if (isLegendaryEvolution(event.toEvolution)) {
            this.farmer.speak('legendary');
          }
        }
        break;
        
      case 'evolution_discovered':
        // Add to discovered list if not already there
        if (!this.state.discoveredEvolutions.includes(event.evolutionId)) {
          this.state.discoveredEvolutions.push(event.evolutionId);
          this.updateUI();
          this.farmer.speak('discovery');
        }
        break;
        
      case 'plants_merged':
        this.state.totalMerges++;
        this.soundManager.play('merge');
        this.effects.mergeEffect(event.result.position);
        this.farmer.react('celebrate');
        break;
        
      case 'plant_harvested':
        let harvestPoints = event.points;
        if (this.doubleHarvestActive) {
          harvestPoints *= 2;
          this.doubleHarvestActive = false;
        }
        
        this.state.gardenPoints += harvestPoints;
        
        // Track harvest count for triggers
        const evoId = event.evolutionId;
        this.state.harvestCounts[evoId] = (this.state.harvestCounts[evoId] || 0) + 1;
        
        // Track spot harvest
        const spotKey = `${event.plant.position.x},${event.plant.position.y}`;
        this.state.spotHarvestCounts[spotKey] = (this.state.spotHarvestCounts[spotKey] || 0) + 1;
        
        // Water return
        const waterReturn = Math.min(
          ECONOMY.HARVEST_WATER_RETURN,
          RESOURCES.WATER_MAX - this.state.water
        );
        this.state.water += waterReturn;
        
        this.soundManager.play('unlock');
        this.effects.mergeEffect(event.plant.position);
        
        this.farmer.react('celebrate');
        this.farmer.speak(event.wasGolden ? 'golden' : 'harvest');
        this.updateUI();
        break;
        
      case 'combo_watered':
        this.farmer.speak('combo');
        break;
        
      case 'seed_unlocked':
        // Handled in unlockSeed
        break;
        
      case 'visitor_touched_plant':
        // Track for evolution triggers
        // Check if any plant wishes were fulfilled (want_visitor)
        this.garden.checkWishFulfillment({
          visitorJustTouched: event.visitorType,
          isNight: this.isNightTime()
        });
        break;
        
      case 'water_changed':
        break;
      
      // Relationship system events
      case 'bond_formed':
        // Quiet celebration for new bonds
        if (event.level === 'soulmate') {
          this.farmer.speak('evolve'); // Special reaction
          this.soundManager.play('grow');
        }
        break;
        
      case 'wish_appeared':
        // Plants have wishes - maybe farmer notices
        break;
        
      case 'wish_fulfilled':
        // Celebration when wishes come true
        this.farmer.react('celebrate');
        // Give a small points bonus
        this.state.gardenPoints += 5;
        this.updateUI();
        break;
        
      case 'elder_reached':
        // Celebrate elder status
        if (event.tier === 'legendary') {
          this.farmer.speak('evolve');
          this.soundManager.play('grow');
        } else if (event.tier === 'ancient') {
          this.soundManager.play('grow');
        }
        break;
        
      case 'plant_grieving':
        // Sad moment - farmer might notice
        if (Math.random() < 0.3) {
          this.farmer.react('wave'); // Sympathetic gesture
        }
        break;
      
      case 'plant_retired':
        // Hall of fame entry
        break;
    }
    
    this.save();
  }
  
  private startGrowthLoop(): void {
    this.growthInterval = window.setInterval(() => {
      const farmerPos = this.farmer.getPosition();
      this.garden.updateGrowth(1.0, farmerPos);
      this.garden.updateNeighborBonds();  // Check neighbor bonds
      this.garden.updateWishes();         // Check plant wishes
      this.garden.updateElderStatus();    // Check elder status
    }, TIMING.GROWTH_TICK);
  }
  
  private startWaterRegenLoop(): void {
    this.waterRegenInterval = window.setInterval(() => {
      if (this.state.water < RESOURCES.WATER_MAX) {
        const now = Date.now();
        const elapsed = now - this.state.lastWaterRegen;
        
        if (elapsed >= TIMING.WATER_REGEN_TIME) {
          this.state.water = Math.min(
            this.state.water + Math.floor(elapsed / TIMING.WATER_REGEN_TIME),
            RESOURCES.WATER_MAX
          );
          this.state.lastWaterRegen = now;
          this.updateUI();
          this.save();
        }
      }
    }, 1000);
  }
  
  private startAmbientLoop(): void {
    this.ambientInterval = window.setInterval(() => {
      this.updateAmbient();
    }, 60000);
  }
  
  private updateAmbient(): void {
    const hour = new Date().getHours();
    const root = document.documentElement;
    
    let brightness: number;
    let overlayColor: string;
    
    if (hour >= 6 && hour < 19) {
      brightness = 1;
      overlayColor = 'rgba(255, 250, 240, 0.05)';
    } else if (hour >= 19 && hour < 20) {
      brightness = 0.95;
      overlayColor = 'rgba(255, 180, 100, 0.1)';
    } else if (hour >= 20 || hour < 5) {
      brightness = 0.85;
      overlayColor = 'rgba(100, 120, 180, 0.15)';
    } else {
      brightness = 0.92;
      overlayColor = 'rgba(255, 200, 150, 0.08)';
    }
    
    root.style.setProperty('--ambient-brightness', brightness.toString());
    root.style.setProperty('--ambient-overlay', overlayColor);
  }
  
  /** Check if it's currently night time (8pm - 5am) */
  private isNightTime(): boolean {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 5;
  }

  private checkOfflineProgress(): void {
    const now = Date.now();
    const timeAway = now - this.state.lastPlayTime;

    if (timeAway < 60000) {
      this.state.lastPlayTime = now;
      return;
    }

    const cappedTime = Math.min(timeAway, TIMING.MAX_OFFLINE_MS);

    const progress: OfflineProgress = {
      timeAway: cappedTime,
      plantsGrown: [],
      waterRegened: 0,
    };

    // Regain water
    const waterGained = Math.floor(cappedTime / TIMING.WATER_REGEN_TIME);
    progress.waterRegened = Math.min(waterGained, RESOURCES.WATER_MAX - this.state.water);
    this.state.water = Math.min(this.state.water + waterGained, RESOURCES.WATER_MAX);
    
    // Apply offline growth (need garden to be initialized first)
    // This will be called after garden is created
    this.state.lastPlayTime = now;
    
    if (progress.waterRegened > 0) {
      this.showWelcomeBack(progress);
    }
  }
  
  private showWelcomeBack(progress: OfflineProgress): void {
    const modal = document.getElementById('welcome-back')!;
    const timeAwayEl = document.getElementById('time-away')!;
    const summaryEl = document.getElementById('growth-summary')!;
    const continueBtn = document.getElementById('welcome-continue')!;
    
    const hours = Math.floor(progress.timeAway / (1000 * 60 * 60));
    const minutes = Math.floor((progress.timeAway % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      timeAwayEl.textContent = `${hours}h ${minutes}m`;
    } else {
      timeAwayEl.textContent = `${minutes} minutes`;
    }
    
    let summaryHTML = '';
    
    if (progress.waterRegened > 0) {
      summaryHTML += `<div class="growth-item">💧 +${progress.waterRegened} water</div>`;
    }
    
    if (progress.plantsGrown.length > 0) {
      summaryHTML += `<div class="growth-item">🌱 ${progress.plantsGrown.length} plants evolved!</div>`;
    }
    
    if (summaryHTML === '') {
      summaryHTML = '<div class="growth-item">Your garden is waiting! 🌻</div>';
    }
    
    summaryEl.innerHTML = summaryHTML;
    
    modal.classList.remove('hidden');
    
    continueBtn.onclick = () => {
      modal.classList.add('hidden');
      this.soundManager.play('click');
    };
  }
  
  private handleFarmerTapped(): void {
    const farmerPos = this.farmer.getPosition();
    
    const positions = [
      { x: farmerPos.x, y: farmerPos.y },
      { x: farmerPos.x - 1, y: farmerPos.y },
      { x: farmerPos.x + 1, y: farmerPos.y },
      { x: farmerPos.x, y: farmerPos.y - 1 },
      { x: farmerPos.x, y: farmerPos.y + 1 },
    ];
    
    let wateredCount = 0;
    for (const pos of positions) {
      const plant = this.garden.getPlantAt(pos.x, pos.y);
      if (plant && !plant.isWatered && this.state.water > 0) {
        this.garden.waterPlantAt(pos.x, pos.y, true);
        this.state.water--;
        wateredCount++;
      }
    }
    
    if (wateredCount > 0) {
      this.farmer.react('celebrate');
      this.updateUI();
      this.save();
    } else {
      this.farmer.react('wave');
    }
  }
  
  private handleFarmerAutoWater(): void {
    const farmerPos = this.farmer.getPosition();
    
    const positions = [
      { x: farmerPos.x, y: farmerPos.y },
      { x: farmerPos.x - 1, y: farmerPos.y },
      { x: farmerPos.x + 1, y: farmerPos.y },
      { x: farmerPos.x, y: farmerPos.y - 1 },
      { x: farmerPos.x, y: farmerPos.y + 1 },
    ];
    
    for (const pos of positions) {
      const plant = this.garden.getPlantAt(pos.x, pos.y);
      if (plant && !plant.isWatered) {
        this.garden.waterPlantAt(pos.x, pos.y, true);
        this.save();
        return;
      }
    }
  }
  
  private updateUI(): void {
    this.waterCountElement.textContent = this.state.water.toString();
    this.pointsCountElement.textContent = this.state.gardenPoints.toString();
    
    // Update discovery count
    const total = TOTAL_EVOLUTION_COUNT;
    const discovered = this.state.discoveredEvolutions.length;
    this.discoveryCountElement.textContent = `${discovered}/${total}`;
  }
  
  private save(): void {
    this.state.lastSaveTime = Date.now();
    this.saveManager.save(this.state);
  }
  
  // ===== Visitor System =====
  
  private scheduleNextVisitor(): void {
    if (this.visitorSpawnTimeout) {
      clearTimeout(this.visitorSpawnTimeout);
    }
    
    const maxPlantsCount = this.state.plants.filter(p => isMaxEvolution(p.evolutionId)).length;
    
    let interval = VISITORS.SPAWN_INTERVAL_MIN + 
      Math.random() * (VISITORS.SPAWN_INTERVAL_MAX - VISITORS.SPAWN_INTERVAL_MIN);
    
    const bonusReduction = Math.min(0.5, maxPlantsCount * VISITORS.MAX_PLANT_BONUS);
    interval *= (1 - bonusReduction);
    
    this.visitorSpawnTimeout = window.setTimeout(() => this.spawnVisitor(), interval);
  }
  
  private spawnVisitor(): void {
    if (this.currentVisitor) {
      this.scheduleNextVisitor();
      return;
    }
    
    const types: VisitorType[] = ['butterfly', 'butterfly', 'butterfly', 'bee', 'rabbit', 'bluebird'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = VISITOR_TYPES[type];
    
    this.soundManager.play('unlock');
    
    this.currentVisitor = new Visitor(
      type,
      this.gridElement,
      GARDEN.gridSize,
      (effect, visitor) => this.handleVisitorEffect(effect, visitor)
    );
    
    this.currentVisitor.enter();
    
    const visitDuration = VISITORS.VISIT_DURATION_MAX + 1000;
    setTimeout(() => {
      this.currentVisitor = null;
      this.scheduleNextVisitor();
    }, visitDuration);
  }
  
  private handleVisitorEffect(effect: VisitorConfig['effect'], visitor: Visitor): void {
    const visitorPos = visitor.getPosition();
    
    switch (effect) {
      case 'pollinate':
        for (const plant of this.state.plants) {
          const dx = Math.abs(plant.position.x - visitorPos.x);
          const dy = Math.abs(plant.position.y - visitorPos.y);
          if (dx <= 1 && dy <= 1) {
            plant.growthBoost = Math.max(plant.growthBoost || 1, 1.5);
            // Track visitor touch for evolution triggers
            this.garden.markVisitorTouch(plant.id, 'butterfly');
          }
        }
        break;
        
      case 'bonus_water':
        this.state.water = RESOURCES.WATER_MAX;
        this.updateUI();
        break;
        
      case 'instant_grow':
        const growable = this.state.plants.filter(p => 
          p.isWatered && !isMaxEvolution(p.evolutionId)
        );
        
        if (growable.length > 0) {
          const lucky = growable[Math.floor(Math.random() * growable.length)];
          lucky.growthProgress = 1;
          this.garden.markVisitorTouch(lucky.id, 'rabbit');
        }
        break;
        
      case 'double_harvest':
        this.doubleHarvestActive = true;
        break;
    }
    
    this.farmer.speak('plant');
  }
  
  public getState(): GameState {
    return this.state;
  }
}
