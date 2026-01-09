import { FarmerState, FarmerAction, Position } from './types';
import { FARMER, TIMING, ECONOMY } from './config';

export class Farmer {
  private state: FarmerState;
  private element: HTMLElement;
  private gridSize: number;
  
  private moveInterval: number | null = null;
  private actionInterval: number | null = null;
  private autoWaterInterval: number | null = null;
  private onTapped: (() => void) | null = null;
  private onAutoWater: (() => void) | null = null;
  
  constructor(state: FarmerState, gridContainer: HTMLElement, gridSize: number) {
    this.state = state;
    this.gridSize = gridSize;
    this.element = document.getElementById('farmer')!;
    
    this.updatePosition();
    this.startBehavior();
    this.setupTapHandler();
  }
  
  /** Set callback for when farmer is tapped */
  public setOnTapped(callback: () => void): void {
    this.onTapped = callback;
  }
  
  private setupTapHandler(): void {
    this.element.style.cursor = 'pointer';
    this.element.addEventListener('click', (e) => {
      e.stopPropagation(); // Don't trigger tile click
      if (this.onTapped) {
        this.onTapped();
      }
    });
  }
  
  /** Set callback for auto-water (called every 15 seconds) */
  public setOnAutoWater(callback: () => void): void {
    this.onAutoWater = callback;
    
    // Start auto-water interval
    if (this.autoWaterInterval) {
      clearInterval(this.autoWaterInterval);
    }
    
    this.autoWaterInterval = window.setInterval(() => {
      if (this.onAutoWater && this.state.currentAction === 'idle') {
        // Do watering animation
        this.setAction('watering');
        setTimeout(() => {
          this.onAutoWater?.();
          this.setAction('idle');
        }, 500);
      }
    }, ECONOMY.FARMER_AUTO_WATER_INTERVAL);
  }
  
  /** Get farmer's current grid position */
  public getPosition(): Position {
    return { ...this.state.position };
  }
  
  /** Call farmer to a specific tile */
  public callTo(pos: Position): void {
    // Stop current behavior temporarily
    this.setAction('walking');
    this.state.targetPosition = pos;
    
    // Animate walking to position
    this.animateWalkTo(pos);
  }
  
  private animateWalkTo(targetPos: Position): void {
    const dx = targetPos.x - this.state.position.x;
    const dy = targetPos.y - this.state.position.y;
    
    // If already at target, celebrate!
    if (dx === 0 && dy === 0) {
      this.react('wave');
      return;
    }
    
    // Move one step towards target
    const stepX = dx !== 0 ? Math.sign(dx) : 0;
    const stepY = stepX === 0 && dy !== 0 ? Math.sign(dy) : 0;
    
    const nextPos = {
      x: this.state.position.x + stepX,
      y: this.state.position.y + stepY
    };
    
    // Update position
    this.state.position = nextPos;
    this.updatePosition();
    
    // Continue walking or arrive
    setTimeout(() => {
      if (this.state.position.x !== targetPos.x || this.state.position.y !== targetPos.y) {
        this.animateWalkTo(targetPos);
      } else {
        this.state.targetPosition = null;
        this.react('wave');
      }
    }, 200);
  }
  
  public setGridSize(size: number): void {
    this.gridSize = size;
    this.updatePosition();
  }
  
  private updatePosition(): void {
    // Calculate position based on grid
    const tilePercent = 100 / this.gridSize;
    const x = this.state.position.x * tilePercent + tilePercent / 2;
    const y = this.state.position.y * tilePercent + tilePercent / 2;
    
    this.element.style.left = `${x}%`;
    this.element.style.top = `${y}%`;
    this.element.style.transform = 'translate(-50%, -50%)';
  }
  
  private startBehavior(): void {
    // Random movement
    this.moveInterval = window.setInterval(() => {
      if (this.state.currentAction === 'idle') {
        this.randomMove();
      }
    }, TIMING.FARMER_MOVE_INTERVAL + Math.random() * 2000);
    
    // Random actions
    this.actionInterval = window.setInterval(() => {
      if (Math.random() < 0.3) {
        this.doRandomAction();
      }
    }, TIMING.FARMER_ACTION_INTERVAL + Math.random() * 4000);
    
    // Start with idle animation
    this.setAction('idle');
  }
  
  private randomMove(): void {
    // Pick random adjacent tile
    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const newX = this.state.position.x + dir.x;
    const newY = this.state.position.y + dir.y;
    
    // Check bounds
    if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
      this.moveTo({ x: newX, y: newY });
    }
  }
  
  private moveTo(pos: Position): void {
    this.setAction('walking');
    this.state.targetPosition = pos;
    
    // Animate movement
    setTimeout(() => {
      this.state.position = pos;
      this.updatePosition();
      
      setTimeout(() => {
        this.state.targetPosition = null;
        this.setAction('idle');
      }, 500);
    }, 100);
  }
  
  private setAction(action: FarmerAction): void {
    this.state.currentAction = action;
    this.state.lastActionTime = Date.now();
    
    // Update element class
    this.element.className = 'farmer ' + action;
  }
  
  private doRandomAction(): void {
    const actions: FarmerAction[] = ['looking', 'waving'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    this.setAction(action);
    
    // Return to idle after a bit
    setTimeout(() => {
      this.setAction('idle');
    }, 1500);
  }
  
  public react(type: 'celebrate' | 'wave' | 'heart'): void {
    this.setAction('celebrating');
    
    // Show reaction emoji
    const reaction = document.createElement('div');
    reaction.className = 'farmer-reaction';
    reaction.textContent = FARMER.reactions[type] || FARMER.reactions.sparkle;
    this.element.appendChild(reaction);
    
    setTimeout(() => {
      reaction.remove();
      this.setAction('idle');
    }, 1000);
  }
  
  /** Show a speech bubble above the farmer */
  public speak(category: keyof typeof FARMER.speechBubbles): void {
    const messages = FARMER.speechBubbles[category];
    if (!messages || messages.length === 0) return;
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Remove existing speech bubble if any
    const existing = this.element.querySelector('.farmer-speech');
    if (existing) existing.remove();
    
    // Create speech bubble
    const bubble = document.createElement('div');
    bubble.className = 'farmer-speech';
    bubble.textContent = message;
    this.element.appendChild(bubble);
    
    // Auto-remove after 2 seconds
    setTimeout(() => bubble.remove(), 2000);
  }
  
  public destroy(): void {
    if (this.moveInterval) clearInterval(this.moveInterval);
    if (this.actionInterval) clearInterval(this.actionInterval);
    if (this.autoWaterInterval) clearInterval(this.autoWaterInterval);
  }
}
