import { PlantData, Position, GameEvent, GardenConfig, NeighborBond, BondLevel, ElderTier, GriefState } from './types';
import { 
  getEvolution, 
  getStartingEvolution, 
  isMaxEvolution,
  getGrowthTime,
  getVisualScale,
  getEvolutionEmoji,
  determineNextEvolution,
  createEvolutionData,
  isNightTime,
  getNeighborPositions,
  getHarvestValue,
  isLegendaryEvolution
} from './evolution';
import { INTERACTION, ECONOMY, GARDEN, BONDS, ELDERS, WATERING } from './config';
import { getRandomPersonality, getPersonalityConfig, getHarvestReaction, PersonalityTrait } from './Personality';
import { generatePlantName } from './NameGenerator';
import { shouldGenerateWish, generateWish, checkWishFulfilled, isWishExpired, WishContext } from './WishSystem';

export class Garden {
  private config: GardenConfig;
  private plants: PlantData[];
  private gridElement: HTMLElement;
  private onEvent: (event: GameEvent) => void;
  private canUseWater: () => boolean;
  private getSelectedSeed: () => string;
  private getGameState: () => { totalMerges: number };
  
  private tiles: Map<string, HTMLElement> = new Map();
  private plantElements: Map<string, HTMLElement> = new Map();
  
  private draggedPlant: PlantData | null = null;
  private dragStartPos = { x: 0, y: 0 };
  
  // Drag-to-plant tracking
  private isDragPlanting: boolean = false;
  private dragPlantedTiles: Set<string> = new Set();
  
  // Combo watering tracking
  private recentWaters: { plant: PlantData; time: number }[] = [];
  
  // Tooltip element for plant info
  private tooltip: HTMLElement | null = null;
  private hoveredPlant: PlantData | null = null;
  private tooltipDelayTimer: number | null = null;
  private readonly TOOLTIP_DELAY = 500;  // 0.5s delay before showing

  // Neighbor bond system - now uses BONDS config
  private lastBondCheck: number = 0;
  private lastBondParticle: number = 0;
  private readonly BOND_CHECK_INTERVAL = 5000;  // Check bonds every 5s (more responsive)
  private readonly BOND_PARTICLE_COOLDOWN = 30000; // Max 1 particle per 30s
  
  // Wish system
  private lastWishCheck: number = 0;
  private readonly WISH_CHECK_INTERVAL = 10000;  // Check wishes every 10s
  
  // Elder system
  private lastElderCheck: number = 0;
  private readonly ELDER_CHECK_INTERVAL = 30000;  // Check elder status every 30s
  
  constructor(
    plants: PlantData[],
    gridElement: HTMLElement,
    onEvent: (event: GameEvent) => void,
    canUseWater: () => boolean,
    getSelectedSeed: () => string,
    getGameState: () => { totalMerges: number }
  ) {
    this.config = GARDEN;
    this.plants = plants;
    this.gridElement = gridElement;
    this.onEvent = onEvent;
    this.canUseWater = canUseWater;
    this.getSelectedSeed = getSelectedSeed;
    this.getGameState = getGameState;
  }
  
  public render(): void {
    // Clear grid
    this.gridElement.innerHTML = '';
    this.tiles.clear();
    this.plantElements.clear();
    
    // Set grid size
    this.gridElement.style.setProperty('--grid-size', this.config.gridSize.toString());
    
    // Setup grid-level drag handlers for drag-to-plant
    this.setupDragPlantHandlers();
    
    // Create tooltip element
    this.createTooltip();
    
    // Create tiles
    for (let y = 0; y < this.config.gridSize; y++) {
      for (let x = 0; x < this.config.gridSize; x++) {
        const tile = this.createTile(x, y);
        this.gridElement.appendChild(tile);
        this.tiles.set(`${x},${y}`, tile);
      }
    }
    
    // Render existing plants
    for (const plant of this.plants) {
      this.renderPlant(plant);
    }
  }
  
  private setupDragPlantHandlers(): void {
    // Mouse events
    this.gridElement.addEventListener('mousedown', (e) => this.handleDragPlantStart(e));
    this.gridElement.addEventListener('mousemove', (e) => this.handleDragPlantMove(e));
    this.gridElement.addEventListener('mouseup', () => this.handleDragPlantEnd());
    this.gridElement.addEventListener('mouseleave', () => this.handleDragPlantEnd());
    
    // Touch events
    this.gridElement.addEventListener('touchstart', (e) => this.handleDragPlantStart(e), { passive: false });
    this.gridElement.addEventListener('touchmove', (e) => this.handleDragPlantMove(e), { passive: false });
    this.gridElement.addEventListener('touchend', () => this.handleDragPlantEnd());
    this.gridElement.addEventListener('touchcancel', () => this.handleDragPlantEnd());
  }
  
  private handleDragPlantStart(e: MouseEvent | TouchEvent): void {
    const target = e.target as HTMLElement;
    
    // Only start drag-plant on empty tiles (not on plants)
    if (!target.classList.contains('tile')) return;
    
    const x = parseInt(target.dataset.x || '0');
    const y = parseInt(target.dataset.y || '0');
    const plant = this.getPlantAt(x, y);
    
    // Only start drag-planting on empty tiles
    if (!plant) {
      this.isDragPlanting = true;
      this.dragPlantedTiles.clear();
      
      // Plant on the starting tile
      this.plantSeedIfEmpty(x, y);
      
      // Prevent default to avoid text selection
      e.preventDefault();
    }
  }
  
  private handleDragPlantMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDragPlanting) return;
    
    // Get coordinates
    let clientX: number, clientY: number;
    if (e instanceof TouchEvent) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Find tile under cursor
    const tile = this.getTileAtPosition(clientX, clientY);
    if (tile) {
      const x = parseInt(tile.dataset.x || '0');
      const y = parseInt(tile.dataset.y || '0');
      this.plantSeedIfEmpty(x, y);
    }
  }
  
  private handleDragPlantEnd(): void {
    this.isDragPlanting = false;
    this.dragPlantedTiles.clear();
  }
  
  private getTileAtPosition(clientX: number, clientY: number): HTMLElement | null {
    for (const [key, tile] of this.tiles) {
      const rect = tile.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        return tile;
      }
    }
    return null;
  }
  
  private plantSeedIfEmpty(x: number, y: number): void {
    const key = `${x},${y}`;
    
    // Skip if already planted during this drag
    if (this.dragPlantedTiles.has(key)) return;
    
    // Skip if there's already a plant
    if (this.getPlantAt(x, y)) return;
    
    // Plant the seed
    this.plantSeed(x, y);
    this.dragPlantedTiles.add(key);
  }
  
  private createTile(x: number, y: number): HTMLElement {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.dataset.x = x.toString();
    tile.dataset.y = y.toString();
    
    // Click handler
    tile.addEventListener('click', (e) => this.handleTileClick(x, y, e));
    
    return tile;
  }
  
  private handleTileClick(x: number, y: number, e: Event): void {
    // Ignore if we were dragging a plant (merging)
    if (this.draggedPlant) return;
    
    // Ignore if this was a drag-plant action (planting is handled by drag)
    if (this.dragPlantedTiles.size > 0) return;
    
    const plant = this.getPlantAt(x, y);
    
    if (plant) {
      // Check if max stage - harvest it!
      if (isMaxEvolution(plant.evolutionId)) {
        // Check if confirmation needed
        const { needsConfirm, reason } = this.shouldConfirmHarvest(plant);
        if (needsConfirm) {
          this.showHarvestConfirmation(plant, reason || '');
        } else {
          this.harvestPlant(plant);
        }
      }
      // Water existing plant - but only if player has water!
      else if (!plant.isWatered) {
        if (this.canUseWater()) {
          this.waterPlant(plant);
        } else {
          // No water! Emit event for feedback
          this.onEvent({ type: 'water_changed', amount: 0 });
        }
      }
    }
    // Planting is now handled by drag system
  }
  
  private plantSeed(x: number, y: number): void {
    const seedId = this.getSelectedSeed();
    const startingEvolution = getStartingEvolution(seedId);
    if (!startingEvolution) return;
    
    // Check for golden seed (10% chance)
    const isGolden = Math.random() < ECONOMY.GOLDEN_CHANCE;
    
    // Generate name and personality based on seed type
    const name = generatePlantName(seedId);
    const personality = getRandomPersonality(seedId);
    
    const plant: PlantData = {
      id: `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      seedId: seedId,
      evolutionId: startingEvolution.id,
      position: { x, y },
      isWatered: false,
      waterCount: 0,
      growthProgress: 0,
      lastUpdateTime: Date.now(),
      isGolden,
      growthBoost: 1,
      name,
      personality,
      neighborBonds: [],
      evoData: createEvolutionData(),
    };
    
    this.plants.push(plant);
    this.renderPlant(plant, true);  // true = new plant animation

    this.onEvent({ type: 'plant_placed', plant });
  }
  
  /** Water a plant at a specific position */
  public waterPlantAt(x: number, y: number, isFreeWater: boolean = false): boolean {
    const plant = this.getPlantAt(x, y);
    if (plant && !plant.isWatered) {
      this.waterPlant(plant, isFreeWater);
      return true;
    }
    return false;
  }
  
  private waterPlant(plant: PlantData, isFreeWater: boolean = false): void {
    const now = Date.now();
    const isNight = isNightTime();
    
    plant.isWatered = true;
    plant.waterCount = (plant.waterCount || 0) + 1;  // Track for diminishing returns
    plant.lastUpdateTime = now;
    
    // Track night watering for evolution triggers
    if (isNight) {
      plant.evoData.nightWaterCount++;
    }
    
    // Update visual
    const el = this.plantElements.get(plant.id);
    if (el) {
      el.classList.add('watered');
      
      // Show diminishing returns indicator if not first water
      if (plant.waterCount > 1) {
        this.showDiminishingReturnsFeedback(plant, el);
      }
    }
    
    // Update tile
    const tile = this.tiles.get(`${plant.position.x},${plant.position.y}`);
    if (tile) {
      tile.classList.add('watered');
    }
    
    // Emit event - include whether this costs water or not
    this.onEvent({ type: 'plant_watered', plant, isFreeWater, isNight });
    
    // Track for combo detection
    this.trackComboWater(plant, now);
  }
  
  /** Show visual feedback for diminishing returns */
  private showDiminishingReturnsFeedback(plant: PlantData, el: HTMLElement): void {
    const effectiveness = this.getWaterEffectiveness(plant.waterCount);
    const percent = Math.round(effectiveness * 100);
    
    // Create floating text showing reduced effectiveness
    const feedback = document.createElement('div');
    feedback.className = 'water-diminished-feedback';
    feedback.textContent = `${percent}%`;
    feedback.style.cssText = `
      position: absolute;
      top: -5px;
      right: -5px;
      font-size: 0.7rem;
      color: ${percent <= 25 ? '#f88' : '#ff0'};
      font-weight: bold;
      animation: diminish-fade 1.5s ease-out forwards;
      pointer-events: none;
      z-index: 100;
    `;
    
    el.style.position = 'relative';
    el.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 1500);
  }
  
  /** Get water effectiveness based on water count (diminishing returns) */
  private getWaterEffectiveness(waterCount: number): number {
    const index = Math.min(waterCount - 1, WATERING.DIMINISHING_RETURNS.length - 1);
    if (index < 0) return 1.0;
    return Math.max(WATERING.DIMINISHING_RETURNS[index], WATERING.MIN_EFFECTIVENESS);
  }
  
  private trackComboWater(plant: PlantData, time: number): void {
    // Add to recent waters
    this.recentWaters.push({ plant, time });
    
    // Remove waters older than combo window
    const cutoff = time - ECONOMY.COMBO_WINDOW;
    this.recentWaters = this.recentWaters.filter(w => w.time >= cutoff);
    
    // Check for combo (3+ waters in window)
    if (this.recentWaters.length >= ECONOMY.COMBO_MIN_SIZE) {
      // Apply growth boost and track combo count for evolution triggers
      const comboPlants = this.recentWaters.map(w => w.plant);
      for (const p of comboPlants) {
        p.growthBoost = ECONOMY.COMBO_GROWTH_BOOST;
        p.evoData.comboWaterCount++;
        
        // Add combo visual to plant
        const plantEl = this.plantElements.get(p.id);
        if (plantEl) {
          plantEl.classList.add('combo-boosted');
          setTimeout(() => plantEl.classList.remove('combo-boosted'), 3000);
        }
      }
      
      this.onEvent({ 
        type: 'combo_watered', 
        plants: comboPlants, 
        comboSize: comboPlants.length 
      });
      
      // Clear combo tracking to start fresh
      this.recentWaters = [];
    }
  }
  
  private harvestPlant(plant: PlantData, isRetiring: boolean = false): void {
    const evolution = getEvolution(plant.evolutionId);
    if (!evolution) return;
    
    // Trigger grief on bonded plants BEFORE removing
    this.triggerGriefOnBondedPlants(plant);
    
    // Calculate points from evolution value
    let points = evolution.pointValue;
    if (plant.isGolden) {
      points *= ECONOMY.GOLDEN_MULTIPLIER;
    }
    
    // Add neighbor bonus
    const neighbors = this.countSameSeedNeighbors(plant);
    points = Math.round(points * (1 + neighbors * ECONOMY.NEIGHBOR_BONUS));
    
    // Add elder bonus
    const elderTier = this.getPlantElderTier(plant);
    if (elderTier !== 'none') {
      const elderBonus = elderTier === 'legendary' ? 3 : elderTier === 'ancient' ? 2 : 1.5;
      points = Math.round(points * elderBonus);
    }
    
    // Extra bonus for retiring to Hall of Fame
    if (isRetiring) {
      points = Math.round(points * 1.5);
    }
    
    // Play harvest animation before removing
    const el = this.plantElements.get(plant.id);
    if (el) {
      el.classList.add('harvesting');
      setTimeout(() => {
        this.removePlantVisual(plant);
      }, 300);
    } else {
      this.removePlantVisual(plant);
    }
    
    // Remove from state
    const index = this.plants.indexOf(plant);
    if (index > -1) {
      this.plants.splice(index, 1);
    }
    
    // Clear any active wish
    if (plant.activeWish) {
      this.hideWishBubble(plant);
    }
    
    // Emit appropriate event
    if (isRetiring) {
      this.onEvent({
        type: 'plant_retired',
        plant
      });
    }
    
    // Emit harvest event with points
    this.onEvent({ 
      type: 'plant_harvested', 
      plant, 
      points,
      wasGolden: plant.isGolden || false,
      evolutionId: plant.evolutionId
    });
  }
  
  private countSameSeedNeighbors(plant: PlantData): number {
    const { x, y } = plant.position;
    const directions = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];
    
    let count = 0;
    for (const { dx, dy } of directions) {
      const neighbor = this.getPlantAt(x + dx, y + dy);
      if (neighbor && neighbor.seedId === plant.seedId) {
        count++;
      }
    }
    return count;
  }
  
  /** Get all neighbors (8 directions) of a plant */
  private getAllNeighbors(plant: PlantData): PlantData[] {
    const positions = getNeighborPositions(plant.position, this.config.gridSize);
    return positions
      .map(pos => this.getPlantAt(pos.x, pos.y))
      .filter((p): p is PlantData => p !== undefined);
  }
  
  private removePlantVisual(plant: PlantData): void {
    const el = this.plantElements.get(plant.id);
    if (el) {
      el.remove();
      this.plantElements.delete(plant.id);
    }
    
    // Clear watered state on tile
    const tile = this.tiles.get(`${plant.position.x},${plant.position.y}`);
    if (tile) {
      tile.classList.remove('watered');
    }
  }
  
  private renderPlant(plant: PlantData, isNew: boolean = false): void {
    const tile = this.tiles.get(`${plant.position.x},${plant.position.y}`);
    if (!tile) return;
    
    // Remove any existing plant element in this tile
    const existingPlant = tile.querySelector('.plant');
    if (existingPlant) {
      existingPlant.remove();
    }
    
    const el = document.createElement('div');
    el.className = 'plant';
    el.textContent = getEvolutionEmoji(plant.evolutionId);
    el.dataset.plantId = plant.id;
    
    // Apply visual scale
    const scale = getVisualScale(plant.evolutionId);
    if (scale !== 1.0) {
      el.style.transform = `scale(${scale})`;
    }
    
    // Apply watered state
    if (plant.isWatered) {
      el.classList.add('watered');
      tile.classList.add('watered');
    }
    
    // Apply golden state
    if (plant.isGolden) {
      el.classList.add('golden');
    }
    
    // Apply new plant animation
    if (isNew) {
      el.classList.add('planted');
    }
    
    // Setup drag handlers
    this.setupPlantDrag(el, plant);
    
    // Setup hover handlers for tooltip
    this.setupPlantHover(el, plant);
    
    tile.appendChild(el);
    this.plantElements.set(plant.id, el);
  }
  
  private setupPlantHover(el: HTMLElement, plant: PlantData): void {
    el.addEventListener('mouseenter', (e) => {
      if (!this.draggedPlant) {
        // Clear any existing timer
        if (this.tooltipDelayTimer) {
          clearTimeout(this.tooltipDelayTimer);
        }
        // Start delay timer
        const x = e.clientX;
        const y = e.clientY;
        this.tooltipDelayTimer = window.setTimeout(() => {
          this.showTooltip(plant, x, y);
        }, this.TOOLTIP_DELAY);
      }
    });
    
    el.addEventListener('mousemove', (e) => {
      if (this.hoveredPlant === plant && !this.draggedPlant) {
        this.positionTooltip(e.clientX, e.clientY);
      }
    });
    
    el.addEventListener('mouseleave', () => {
      // Clear delay timer if still waiting
      if (this.tooltipDelayTimer) {
        clearTimeout(this.tooltipDelayTimer);
        this.tooltipDelayTimer = null;
      }
      this.hideTooltip();
    });
  }
  
  private setupPlantDrag(el: HTMLElement, plant: PlantData): void {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let grabOffsetX = 0;
    let grabOffsetY = 0;
    
    const onStart = (clientX: number, clientY: number) => {
      startX = clientX;
      startY = clientY;
      this.dragStartPos = { x: clientX, y: clientY };
      
      // Store the offset from where we clicked to the element's top-left
      const rect = el.getBoundingClientRect();
      grabOffsetX = clientX - rect.left;
      grabOffsetY = clientY - rect.top;
    };
    
    const onMove = (clientX: number, clientY: number) => {
      const dx = Math.abs(clientX - startX);
      const dy = Math.abs(clientY - startY);
      
      if (!isDragging && (dx > INTERACTION.DRAG_THRESHOLD || dy > INTERACTION.DRAG_THRESHOLD)) {
        isDragging = true;
        this.draggedPlant = plant;
        el.classList.add('dragging');
        this.highlightMergeTargets(plant);
        this.hideTooltip();  // Hide tooltip when dragging starts
      }
      
      if (isDragging) {
        // Keep the element where we grabbed it relative to cursor
        el.style.position = 'fixed';
        el.style.left = `${clientX - grabOffsetX}px`;
        el.style.top = `${clientY - grabOffsetY}px`;
        el.style.zIndex = '1000';
      }
    };
    
    const onEnd = (clientX: number, clientY: number) => {
      if (isDragging) {
        el.classList.remove('dragging');
        el.style.position = '';
        el.style.left = '';
        el.style.top = '';
        el.style.zIndex = '';
        
        this.clearMergeHighlights();
        
        // Find drop target
        const target = this.findDropTarget(clientX, clientY, plant);
        if (target) {
          this.attemptMerge(plant, target);
        }
        
        isDragging = false;
        this.draggedPlant = null;
      }
    };
    
    // Mouse events
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
      
      const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
      const onMouseUp = (e: MouseEvent) => {
        onEnd(e.clientX, e.clientY);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    
    // Touch events
    el.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      onStart(touch.clientX, touch.clientY);
    }, { passive: true });
    
    el.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      onMove(touch.clientX, touch.clientY);
      if (isDragging && e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });
    
    el.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      onEnd(touch.clientX, touch.clientY);
    });
  }
  
  private highlightMergeTargets(source: PlantData): void {
    for (const plant of this.plants) {
      if (plant.id === source.id) continue;
      if (this.canMerge(source, plant)) {
        const el = this.plantElements.get(plant.id);
        if (el) {
          el.classList.add('merge-target');
        }
        const tile = this.tiles.get(`${plant.position.x},${plant.position.y}`);
        if (tile) {
          tile.classList.add('drop-target');
        }
      }
    }
  }
  
  private clearMergeHighlights(): void {
    for (const [, el] of this.plantElements) {
      el.classList.remove('merge-target');
    }
    for (const [, tile] of this.tiles) {
      tile.classList.remove('drop-target');
    }
  }
  
  private canMerge(source: PlantData, target: PlantData): boolean {
    // Same seed type and same evolution, both watered
    return source.seedId === target.seedId &&
           source.evolutionId === target.evolutionId &&
           source.isWatered && target.isWatered &&
           !isMaxEvolution(target.evolutionId);
  }
  
  private findDropTarget(clientX: number, clientY: number, source: PlantData): PlantData | null {
    for (const [key, tile] of this.tiles) {
      const rect = tile.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        const [x, y] = key.split(',').map(Number);
        const target = this.getPlantAt(x, y);
        if (target && target.id !== source.id && this.canMerge(source, target)) {
          return target;
        }
      }
    }
    return null;
  }
  
  private attemptMerge(source: PlantData, target: PlantData): void {
    const evolution = getEvolution(target.evolutionId);
    if (!evolution || !evolution.defaultEvolution) return;
    
    // Get next evolution (merge = force default evolution)
    const nextEvolutionId = evolution.defaultEvolution;
    const nextEvolution = getEvolution(nextEvolutionId);
    if (!nextEvolution) return;
    
    // Update target plant to next evolution
    target.evolutionId = nextEvolutionId;
    target.isWatered = false;
    target.growthProgress = 0;
    target.waterCount = 0;  // Reset diminishing returns on merge
    
    // Transfer golden status if source was golden
    if (source.isGolden && !target.isGolden) {
      target.isGolden = true;
    }
    
    // Remove source plant
    const sourceIndex = this.plants.indexOf(source);
    if (sourceIndex > -1) {
      this.plants.splice(sourceIndex, 1);
    }
    this.removePlantVisual(source);
    
    // Update target visual
    const targetEl = this.plantElements.get(target.id);
    if (targetEl) {
      targetEl.textContent = nextEvolution.emoji;
      targetEl.classList.add('growing');
      targetEl.classList.remove('watered');
      setTimeout(() => targetEl.classList.remove('growing'), 600);
      
      const scale = nextEvolution.visualScale;
      if (scale !== 1.0) {
        targetEl.style.transform = `scale(${scale})`;
      }
    }
    
    const tile = this.tiles.get(`${target.position.x},${target.position.y}`);
    if (tile) {
      tile.classList.remove('watered');
    }
    
    // Emit event
    this.onEvent({
      type: 'plants_merged',
      source,
      target,
      result: target
    });
  }
  
  /** Update growth for all plants - called from game loop */
  public updateGrowth(multiplier: number = 1, farmerPos?: Position): void {
    const now = Date.now();
    const gameState = this.getGameState();
    
    for (const plant of this.plants) {
      if (!plant.isWatered) continue;
      
      const evolution = getEvolution(plant.evolutionId);
      if (!evolution) continue;
      
      // Skip if already at max
      if (isMaxEvolution(plant.evolutionId)) continue;
      
      // Skip if grieving (reduced growth rate instead of stopping)
      const griefEndTime = plant.griefState ? plant.griefState.since + plant.griefState.duration : 0;
      const isGrieving = plant.griefState && griefEndTime > now;
      
      const growthTime = getGrowthTime(plant.evolutionId);
      if (growthTime === Infinity) continue;
      
      const elapsed = now - plant.lastUpdateTime;
      let growthRate = 1.0;
      
      // Apply multiplier
      growthRate *= multiplier;
      
      // Apply growth boost (from combos)
      if (plant.growthBoost && plant.growthBoost > 1) {
        growthRate *= plant.growthBoost;
      }
      
      // Apply golden boost
      if (plant.isGolden) {
        growthRate *= 1.5;
      }
      
      // Apply farmer proximity bonus
      if (farmerPos) {
        const dx = Math.abs(plant.position.x - farmerPos.x);
        const dy = Math.abs(plant.position.y - farmerPos.y);
        if (dx <= 1 && dy <= 1) {
          growthRate *= (1 + ECONOMY.FARMER_PROXIMITY_BONUS);
          plant.evoData.farmerBoostTicks++;
        }
      }
      
      // Apply bond boost from nearby friends
      const bondBoost = this.getTotalBondBoost(plant);
      if (bondBoost > 0) {
        growthRate *= (1 + bondBoost);
      }
      
      // Apply elder aura boost from nearby elders
      const elderBoost = this.getElderAuraBoostForPlant(plant);
      if (elderBoost > 0) {
        growthRate *= (1 + elderBoost);
      }
      
      // Apply grief penalty (grows 50% slower while grieving)
      if (isGrieving) {
        growthRate *= 0.5;
      }
      
      // Apply watering diminishing returns
      const waterEffectiveness = this.getWaterEffectiveness(plant.waterCount || 1);
      growthRate *= waterEffectiveness;
      
      // Calculate progress
      const progressGain = (elapsed * growthRate) / growthTime;
      plant.growthProgress += progressGain;
      plant.lastUpdateTime = now;
      
      // Check for evolution
      if (plant.growthProgress >= 1) {
        plant.growthProgress = 0;
        
        // Determine next evolution (check for special evolutions first)
        const neighbors = this.getAllNeighbors(plant);
        const nextEvoId = determineNextEvolution(
          evolution,
          plant,
          plant.evoData,
          neighbors,
          {
            totalMerges: gameState.totalMerges,
            currentHour: new Date().getHours(),
            currentMonth: new Date().getMonth() + 1
          }
        );
        
        if (nextEvoId) {
          const isSpecial = nextEvoId !== evolution.defaultEvolution;
          const previousEvoId = plant.evolutionId;
          plant.evolutionId = nextEvoId;
          plant.isWatered = false;
          plant.waterCount = 0;  // Reset diminishing returns on evolution
          
          this.updatePlantVisual(plant, isSpecial);
          
          this.onEvent({
            type: 'plant_evolved',
            plant,
            fromEvolution: previousEvoId,
            toEvolution: nextEvoId,
            isSpecial
          });
          
          // Check if newly discovered
          const nextEvo = getEvolution(nextEvoId);
          if (nextEvo) {
            this.onEvent({
              type: 'evolution_discovered',
              evolutionId: nextEvoId,
              isLegendary: isLegendaryEvolution(nextEvoId)
            });
          }
        }
      }
    }
  }
  
  private updatePlantVisual(plant: PlantData, isSpecialEvolution: boolean = false): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    const evolution = getEvolution(plant.evolutionId);
    if (!evolution) return;
    
    el.textContent = evolution.emoji;
    el.classList.remove('watered');
    el.classList.add(isSpecialEvolution ? 'special-evolving' : 'evolving');
    
    const scale = evolution.visualScale;
    if (scale !== 1.0) {
      el.style.transform = `scale(${scale})`;
    }
    
    setTimeout(() => {
      el.classList.remove('evolving', 'special-evolving');
    }, isSpecialEvolution ? 1000 : 800);
    
    const tile = this.tiles.get(`${plant.position.x},${plant.position.y}`);
    if (tile) {
      tile.classList.remove('watered');
    }
  }
  
  /** Apply offline progress */
  public applyOfflineGrowth(deltaMs: number, offlineMultiplier: number): { plant: PlantData; evolutions: number }[] {
    const grown: { plant: PlantData; evolutions: number }[] = [];
    
    for (const plant of this.plants) {
      if (!plant.isWatered) continue;
      
      let totalEvolutions = 0;
      let remainingTime = deltaMs * offlineMultiplier;
      
      while (remainingTime > 0 && !isMaxEvolution(plant.evolutionId)) {
        const growthTime = getGrowthTime(plant.evolutionId);
        if (growthTime === Infinity) break;
        
        const timeToNextEvo = growthTime * (1 - plant.growthProgress);
        
        if (remainingTime >= timeToNextEvo) {
          // Evolve to next stage (always default during offline)
          const evolution = getEvolution(plant.evolutionId);
          if (evolution?.defaultEvolution) {
            plant.evolutionId = evolution.defaultEvolution;
            plant.growthProgress = 0;
            totalEvolutions++;
          } else {
            break;
          }
          remainingTime -= timeToNextEvo;
        } else {
          // Partial progress
          plant.growthProgress += remainingTime / growthTime;
          break;
        }
      }
      
      if (totalEvolutions > 0) {
        grown.push({ plant, evolutions: totalEvolutions });
        this.updatePlantVisual(plant, false);
      }
    }
    
    return grown;
  }
  
  /** Get plant at position */
  public getPlantAt(x: number, y: number): PlantData | undefined {
    return this.plants.find(p => p.position.x === x && p.position.y === y);
  }
  
  /** Get all plants */
  public getPlants(): PlantData[] {
    return this.plants;
  }
  
  /** Get grid size */
  public getGridSize(): number {
    return this.config.gridSize;
  }
  
  /** Mark a plant as visitor-touched */
  public markVisitorTouch(plantId: string, visitorType: string): void {
    const plant = this.plants.find(p => p.id === plantId);
    if (plant && !plant.evoData.visitorTouches.includes(visitorType)) {
      plant.evoData.visitorTouches.push(visitorType);
      this.onEvent({
        type: 'visitor_touched_plant',
        plant,
        visitorType
      });
    }
  }
  
  // ===== Tooltip System =====
  
  private createTooltip(): void {
    // Remove existing tooltip if any
    if (this.tooltip) {
      this.tooltip.remove();
    }
    
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'plant-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background: rgba(20, 20, 20, 0.85);
      color: white;
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 2000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(this.tooltip);
  }
  
  private showTooltip(plant: PlantData, x: number, y: number): void {
    if (!this.tooltip) return;
    this.hoveredPlant = plant;
    
    const evolution = getEvolution(plant.evolutionId);
    
    // Calculate age
    const ageMs = Date.now() - plant.evoData.plantedTime;
    const ageText = this.formatAge(ageMs);
    
    // Simple tooltip: just name and age
    const nameDisplay = plant.name || 'Unknown';
    const evoEmoji = evolution?.emoji || '🌱';
    const goldenBadge = plant.isGolden ? ' ✨' : '';
    
    this.tooltip.innerHTML = `${evoEmoji} <strong>${nameDisplay}</strong>${goldenBadge} • ${ageText}`;
    this.tooltip.style.opacity = '1';
    
    // Position tooltip
    this.positionTooltip(x, y);
  }
  
  private positionTooltip(x: number, y: number): void {
    if (!this.tooltip) return;
    
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 15;
    
    // Default position: to the right and above cursor
    let left = x + padding;
    let top = y - tooltipRect.height - padding;
    
    // Flip horizontally if too close to right edge
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = x - tooltipRect.width - padding;
    }
    
    // Flip vertically if too close to top
    if (top < padding) {
      top = y + padding;
    }
    
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }
  
  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.style.opacity = '0';
    }
    this.hoveredPlant = null;
  }
  
  private formatAge(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return 'Just planted';
    }
  }
  
  private getVisitorEmoji(visitorType: string): string {
    const map: Record<string, string> = {
      butterfly: '🦋',
      bee: '🐝',
      rabbit: '🐰',
      bluebird: '🐦'
    };
    return map[visitorType] || '🐾';
  }
  
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  
  // ===== Neighbor Bond System =====
  
  /** Calculate bond level based on time together */
  private calculateBondLevel(timeTogether: number): BondLevel {
    if (timeTogether >= BONDS.SOULMATE_TIME) return 'soulmate';
    if (timeTogether >= BONDS.BEST_FRIEND_TIME) return 'bestFriend';
    if (timeTogether >= BONDS.FRIEND_TIME) return 'friend';
    return 'acquaintance';
  }
  
  /** Get growth boost from bond level */
  private getBondBoost(level: BondLevel): number {
    switch (level) {
      case 'soulmate': return BONDS.SOULMATE_BOOST;
      case 'bestFriend': return BONDS.BEST_FRIEND_BOOST;
      case 'friend': return BONDS.FRIEND_BOOST;
      default: return 0;
    }
  }
  
  /** Get grief duration based on bond level */
  private getGriefDuration(level: BondLevel): number {
    switch (level) {
      case 'soulmate': return BONDS.SOULMATE_GRIEF;
      case 'bestFriend': return BONDS.BEST_FRIEND_GRIEF;
      case 'friend': return BONDS.FRIEND_GRIEF;
      default: return 0;
    }
  }
  
  /** Update neighbor bonds - call from game loop */
  public updateNeighborBonds(): void {
    const now = Date.now();
    
    // Only check periodically
    if (now - this.lastBondCheck < this.BOND_CHECK_INTERVAL) return;
    this.lastBondCheck = now;
    
    // For each plant, check adjacency and update bonds
    for (const plant of this.plants) {
      if (!plant.neighborBonds) {
        plant.neighborBonds = [];
      }
      
      const neighbors = this.getAllNeighbors(plant);
      const currentNeighborIds = new Set(neighbors.map(n => n.id));
      
      // Remove bonds for plants no longer adjacent
      plant.neighborBonds = plant.neighborBonds.filter(bond => 
        currentNeighborIds.has(bond.plantId)
      );
      
      // Add or update bond entries for neighbors
      for (const neighbor of neighbors) {
        const existingBond = plant.neighborBonds.find(b => b.plantId === neighbor.id);
        if (!existingBond) {
          // New neighbor - start as acquaintance
          plant.neighborBonds.push({
            plantId: neighbor.id,
            since: now,
            level: 'acquaintance'
          });
        } else {
          // Update bond level based on time together
          const timeTogether = now - existingBond.since;
          const newLevel = this.calculateBondLevel(timeTogether);
          
          // Emit event if bond level increased
          if (newLevel !== existingBond.level && this.isHigherBondLevel(newLevel, existingBond.level)) {
            existingBond.level = newLevel;
            this.onEvent({
              type: 'bond_formed',
              plant1: plant,
              plant2: neighbor,
              level: newLevel
            });
            
            // Update visual classes
            this.updatePlantBondVisuals(plant);
            this.updatePlantBondVisuals(neighbor);
          }
        }
      }
      
      // Update grief state
      if (plant.griefState) {
        const griefElapsed = now - plant.griefState.since;
        if (griefElapsed >= plant.griefState.duration) {
          // Grief has ended
          plant.griefState = undefined;
          this.updatePlantGriefVisual(plant, false);
        }
      }
    }
    
    // Show bond particle if enough time has passed
    this.maybeShowBondParticle(now);
  }
  
  /** Check if level1 is higher than level2 */
  private isHigherBondLevel(level1: BondLevel, level2: BondLevel): boolean {
    const order: BondLevel[] = ['acquaintance', 'friend', 'bestFriend', 'soulmate'];
    return order.indexOf(level1) > order.indexOf(level2);
  }
  
  /** Update plant visual to show bond status */
  private updatePlantBondVisuals(plant: PlantData): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    // Remove old bond classes
    el.classList.remove('bond-friend', 'bond-bestfriend', 'bond-soulmate');
    
    // Find highest bond level
    const highestBond = plant.neighborBonds?.reduce((highest, bond) => {
      if (this.isHigherBondLevel(bond.level, highest)) return bond.level;
      return highest;
    }, 'acquaintance' as BondLevel);
    
    // Add appropriate class
    if (highestBond === 'soulmate') {
      el.classList.add('bond-soulmate');
    } else if (highestBond === 'bestFriend') {
      el.classList.add('bond-bestfriend');
    } else if (highestBond === 'friend') {
      el.classList.add('bond-friend');
    }
  }
  
  /** Update plant visual to show grief status */
  private updatePlantGriefVisual(plant: PlantData, isGrieving: boolean): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    if (isGrieving) {
      el.classList.add('grieving');
    } else {
      el.classList.remove('grieving');
    }
  }
  
  /** Trigger grief on bonded plants when a plant is harvested */
  private triggerGriefOnBondedPlants(harvestedPlant: PlantData): void {
    const now = Date.now();
    const harvestedName = harvestedPlant.name || 'a friend';
    
    for (const plant of this.plants) {
      if (!plant.neighborBonds) continue;
      
      const bond = plant.neighborBonds.find(b => b.plantId === harvestedPlant.id);
      if (bond && bond.level !== 'acquaintance') {
        const griefDuration = this.getGriefDuration(bond.level);
        
        if (griefDuration > 0) {
          plant.griefState = {
            mourning: harvestedName,
            since: now,
            duration: griefDuration
          };
          
          this.updatePlantGriefVisual(plant, true);
          
          this.onEvent({
            type: 'plant_grieving',
            plant,
            lostFriend: harvestedName
          });
        }
      }
    }
  }
  
  private maybeShowBondParticle(now: number): void {
    // Cooldown check
    if (now - this.lastBondParticle < this.BOND_PARTICLE_COOLDOWN) return;
    
    // Find all pairs with friend level or higher
    const bondedPairs: { plant1: PlantData; plant2: PlantData; level: BondLevel }[] = [];
    
    for (const plant of this.plants) {
      if (!plant.neighborBonds) continue;
      
      for (const bond of plant.neighborBonds) {
        if (bond.level !== 'acquaintance') {
          const neighbor = this.plants.find(p => p.id === bond.plantId);
          if (neighbor) {
            // Avoid duplicates (only add if plant.id < neighbor.id)
            if (plant.id < neighbor.id) {
              bondedPairs.push({ plant1: plant, plant2: neighbor, level: bond.level });
            }
          }
        }
      }
    }
    
    // Higher chance for stronger bonds
    if (bondedPairs.length > 0) {
      const totalChance = bondedPairs.reduce((sum, pair) => {
        const baseChance = pair.level === 'soulmate' ? 0.15 : pair.level === 'bestFriend' ? 0.10 : 0.05;
        return sum + baseChance;
      }, 0);
      
      if (Math.random() < totalChance) {
        const pair = bondedPairs[Math.floor(Math.random() * bondedPairs.length)];
        this.showBondParticle(pair.plant1, pair.plant2, pair.level);
        this.lastBondParticle = now;
      }
    }
  }
  
  private showBondParticle(plant1: PlantData, plant2: PlantData, level: BondLevel): void {
    const el1 = this.plantElements.get(plant1.id);
    const el2 = this.plantElements.get(plant2.id);
    
    if (!el1 || !el2) return;
    
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    
    // Create particle at midpoint
    const particle = document.createElement('div');
    particle.textContent = '💕';
    particle.style.cssText = `
      position: fixed;
      left: ${(rect1.left + rect2.left) / 2 + rect1.width / 2}px;
      top: ${(rect1.top + rect2.top) / 2}px;
      font-size: 16px;
      pointer-events: none;
      z-index: 1500;
      animation: bond-float 2s ease-out forwards;
      opacity: 0;
    `;
    
    document.body.appendChild(particle);
    
    // Trigger animation
    requestAnimationFrame(() => {
      particle.style.opacity = '1';
    });
    
    // Remove after animation
    setTimeout(() => {
      particle.remove();
    }, 2000);
  }
  
  /** Get total bond boost for a plant from all its bonded neighbors */
  private getTotalBondBoost(plant: PlantData): number {
    if (!plant.neighborBonds || plant.neighborBonds.length === 0) return 0;
    
    let totalBoost = 0;
    for (const bond of plant.neighborBonds) {
      totalBoost += this.getBondBoost(bond.level);
    }
    
    // Cap at 50% total bond boost
    return Math.min(totalBoost, 0.5);
  }
  
  /** Get elder aura boost for a plant from nearby elders */
  private getElderAuraBoostForPlant(plant: PlantData): number {
    const neighbors = this.getAllNeighbors(plant);
    
    let totalBoost = 0;
    for (const neighbor of neighbors) {
      const elderTier = this.getPlantElderTier(neighbor);
      totalBoost += this.getElderAuraBoost(elderTier);
    }
    
    // Cap at 50% total elder boost
    return Math.min(totalBoost, 0.5);
  }
  
  /** Check if plant should show harvest confirmation */
  public shouldConfirmHarvest(plant: PlantData): { needsConfirm: boolean; reason?: string } {
    const strongestBond = this.getStrongestBond(plant);
    const elderTier = this.getPlantElderTier(plant);
    
    if (strongestBond === 'soulmate') {
      const bondedNames = this.getBondedPlantNames(plant);
      return { 
        needsConfirm: true, 
        reason: `${plant.name || 'This plant'} is soulmates with ${bondedNames.join(', ')}. They will grieve for a long time.`
      };
    }
    
    if (elderTier === 'legendary') {
      return {
        needsConfirm: true,
        reason: `${plant.name || 'This plant'} is a legendary elder! Its wisdom benefits the entire garden.`
      };
    }
    
    if (elderTier === 'ancient') {
      return {
        needsConfirm: true,
        reason: `${plant.name || 'This plant'} is an ancient elder. Are you sure you want to harvest it?`
      };
    }
    
    return { needsConfirm: false };
  }
  
  // ===== Elder System =====
  
  /** Calculate elder tier based on time at max evolution */
  private calculateElderTier(timeAtMax: number): ElderTier {
    if (timeAtMax >= ELDERS.LEGENDARY_TIME) return 'legendary';
    if (timeAtMax >= ELDERS.ANCIENT_TIME) return 'ancient';
    if (timeAtMax >= ELDERS.ELDER_TIME) return 'elder';
    return 'none';
  }
  
  /** Get elder aura boost value */
  private getElderAuraBoost(tier: ElderTier): number {
    switch (tier) {
      case 'legendary': return ELDERS.LEGENDARY_AURA_BOOST;
      case 'ancient': return ELDERS.ANCIENT_AURA_BOOST;
      case 'elder': return ELDERS.ELDER_AURA_BOOST;
      default: return 0;
    }
  }
  
  /** Update elder status for all max-tier plants */
  public updateElderStatus(): void {
    const now = Date.now();
    
    // Only check periodically
    if (now - this.lastElderCheck < this.ELDER_CHECK_INTERVAL) return;
    this.lastElderCheck = now;
    
    for (const plant of this.plants) {
      // Only check max evolution plants
      if (!isMaxEvolution(plant.evolutionId)) continue;
      
      // Set maxedAt if not set
      if (!plant.maxedAt) {
        plant.maxedAt = now;
        continue;
      }
      
      const timeAtMax = now - plant.maxedAt;
      const newTier = this.calculateElderTier(timeAtMax);
      const currentTier = this.getPlantElderTier(plant);
      
      // Check if tier increased
      if (newTier !== currentTier && this.isHigherElderTier(newTier, currentTier)) {
        this.updatePlantElderVisual(plant, newTier);
        
        this.onEvent({
          type: 'elder_reached',
          plant,
          tier: newTier
        });
      }
    }
  }
  
  /** Get a plant's current elder tier */
  public getPlantElderTier(plant: PlantData): ElderTier {
    if (!isMaxEvolution(plant.evolutionId) || !plant.maxedAt) return 'none';
    const timeAtMax = Date.now() - plant.maxedAt;
    return this.calculateElderTier(timeAtMax);
  }
  
  /** Check if tier1 is higher than tier2 */
  private isHigherElderTier(tier1: ElderTier, tier2: ElderTier): boolean {
    const order: ElderTier[] = ['none', 'elder', 'ancient', 'legendary'];
    return order.indexOf(tier1) > order.indexOf(tier2);
  }
  
  /** Update plant visual to show elder status */
  private updatePlantElderVisual(plant: PlantData, tier: ElderTier): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    // Remove old elder classes
    el.classList.remove('elder', 'ancient', 'legendary-elder');
    
    // Add new class
    if (tier === 'legendary') {
      el.classList.add('legendary-elder');
    } else if (tier === 'ancient') {
      el.classList.add('ancient');
    } else if (tier === 'elder') {
      el.classList.add('elder');
    }
  }
  
  // ===== Wish System =====
  
  /** Update wishes for all plants */
  public updateWishes(): void {
    const now = Date.now();
    
    // Only check periodically
    if (now - this.lastWishCheck < this.WISH_CHECK_INTERVAL) return;
    this.lastWishCheck = now;
    
    for (const plant of this.plants) {
      // Check if current wish expired
      if (plant.activeWish && isWishExpired(plant.activeWish, now)) {
        plant.activeWish = undefined;
        plant.lastWishTime = now;
        this.hideWishBubble(plant);
      }
      
      // Maybe generate a new wish
      if (!plant.activeWish && shouldGenerateWish(plant, now)) {
        const neighbors = this.getAllNeighbors(plant);
        const wish = generateWish(plant, neighbors, this.plants, now);
        
        if (wish) {
          plant.activeWish = wish;
          this.showWishBubble(plant, wish);
          
          this.onEvent({
            type: 'wish_appeared',
            plant,
            wish
          });
        }
      }
    }
  }
  
  /** Check if any wishes were fulfilled by recent actions */
  public checkWishFulfillment(context: WishContext): void {
    for (const plant of this.plants) {
      if (!plant.activeWish) continue;
      
      const neighbors = this.getAllNeighbors(plant);
      
      if (checkWishFulfilled(plant, neighbors, context)) {
        const fulfilledWish = plant.activeWish;
        plant.activeWish = undefined;
        plant.lastWishTime = Date.now();
        
        this.hideWishBubble(plant);
        this.showWishFulfilledEffect(plant);
        
        this.onEvent({
          type: 'wish_fulfilled',
          plant,
          wish: fulfilledWish
        });
      }
    }
  }
  
  /** Show wish bubble above plant */
  private showWishBubble(plant: PlantData, wish: { emoji: string; text: string }): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    // Remove any existing bubble
    const existing = el.querySelector('.wish-bubble');
    if (existing) existing.remove();
    
    const bubble = document.createElement('div');
    bubble.className = 'wish-bubble';
    bubble.innerHTML = `<span class="wish-emoji">${wish.emoji}</span>`;
    bubble.title = wish.text;
    
    el.appendChild(bubble);
  }
  
  /** Hide wish bubble */
  private hideWishBubble(plant: PlantData): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    const bubble = el.querySelector('.wish-bubble');
    if (bubble) {
      bubble.classList.add('fading');
      setTimeout(() => bubble.remove(), 300);
    }
  }
  
  /** Show effect when wish is fulfilled */
  private showWishFulfilledEffect(plant: PlantData): void {
    const el = this.plantElements.get(plant.id);
    if (!el) return;
    
    const tile = this.tiles.get(`${plant.position.x},${plant.position.y}`);
    if (!tile) return;
    
    // Create hearts burst
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const heart = document.createElement('div');
        heart.className = 'wish-fulfilled-heart';
        heart.textContent = '💖';
        heart.style.setProperty('--offset', `${(Math.random() - 0.5) * 40}px`);
        tile.appendChild(heart);
        setTimeout(() => heart.remove(), 1000);
      }, i * 100);
    }
  }
  
  /** Check if plant has strong bonds (for harvest confirmation) */
  public getStrongestBond(plant: PlantData): BondLevel {
    if (!plant.neighborBonds || plant.neighborBonds.length === 0) return 'acquaintance';
    
    return plant.neighborBonds.reduce((highest, bond) => {
      if (this.isHigherBondLevel(bond.level, highest)) return bond.level;
      return highest;
    }, 'acquaintance' as BondLevel);
  }
  
  /** Get names of bonded plants */
  public getBondedPlantNames(plant: PlantData): string[] {
    if (!plant.neighborBonds) return [];
    
    return plant.neighborBonds
      .filter(bond => bond.level !== 'acquaintance')
      .map(bond => {
        const neighbor = this.plants.find(p => p.id === bond.plantId);
        return neighbor?.name || 'Unknown';
      });
  }
  
  // ===== Harvest Confirmation Modal =====
  
  private harvestConfirmOverlay: HTMLElement | null = null;
  private pendingHarvestPlant: PlantData | null = null;
  private onRetirePlant: ((plant: PlantData) => void) | null = null;
  
  /** Set callback for retiring plants to Hall of Fame */
  public setRetireCallback(callback: (plant: PlantData) => void): void {
    this.onRetirePlant = callback;
  }
  
  /** Show harvest confirmation modal */
  private showHarvestConfirmation(plant: PlantData, reason: string): void {
    this.pendingHarvestPlant = plant;
    
    const elderTier = this.getPlantElderTier(plant);
    const emoji = getEvolutionEmoji(plant.evolutionId);
    const canRetire = elderTier === 'legendary' || elderTier === 'ancient';
    
    // Create overlay
    this.harvestConfirmOverlay = document.createElement('div');
    this.harvestConfirmOverlay.className = 'harvest-confirm-overlay';
    this.harvestConfirmOverlay.innerHTML = `
      <div class="harvest-confirm-modal">
        <div class="plant-preview">${emoji}</div>
        <h3>${plant.name || 'This Plant'}</h3>
        <p>${reason}</p>
        <div class="harvest-confirm-buttons">
          <button class="btn-cancel">Keep Growing</button>
          ${canRetire ? `<button class="btn-retire">🏛️ Retire</button>` : ''}
          <button class="btn-harvest-confirm">Harvest</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.harvestConfirmOverlay);
    
    // Event listeners
    const cancelBtn = this.harvestConfirmOverlay.querySelector('.btn-cancel');
    const retireBtn = this.harvestConfirmOverlay.querySelector('.btn-retire');
    const harvestBtn = this.harvestConfirmOverlay.querySelector('.btn-harvest-confirm');
    
    cancelBtn?.addEventListener('click', () => this.closeHarvestConfirmation());
    
    retireBtn?.addEventListener('click', () => {
      if (this.pendingHarvestPlant && this.onRetirePlant) {
        this.onRetirePlant(this.pendingHarvestPlant);
        this.harvestPlant(this.pendingHarvestPlant, true); // true = retiring
      }
      this.closeHarvestConfirmation();
    });
    
    harvestBtn?.addEventListener('click', () => {
      if (this.pendingHarvestPlant) {
        this.harvestPlant(this.pendingHarvestPlant);
      }
      this.closeHarvestConfirmation();
    });
    
    // Click outside to close
    this.harvestConfirmOverlay.addEventListener('click', (e) => {
      if (e.target === this.harvestConfirmOverlay) {
        this.closeHarvestConfirmation();
      }
    });
  }
  
  /** Close harvest confirmation modal */
  private closeHarvestConfirmation(): void {
    if (this.harvestConfirmOverlay) {
      this.harvestConfirmOverlay.remove();
      this.harvestConfirmOverlay = null;
    }
    this.pendingHarvestPlant = null;
  }
  
  /** Count wishes fulfilled for a plant (for retirement stats) */
  public getWishesGrantedCount(plant: PlantData): number {
    // This would need to be tracked - for now return 0
    // Could be enhanced later to track in PlantData
    return 0;
  }
}
