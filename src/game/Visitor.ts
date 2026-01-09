import { Position } from './types';
import { VISITORS } from './config';

export type VisitorType = 'butterfly' | 'bee' | 'rabbit' | 'bluebird';

export interface VisitorConfig {
  type: VisitorType;
  emoji: string;
  name: string;
  ability: string;
  effect: 'pollinate' | 'bonus_water' | 'instant_grow' | 'double_harvest';
}

export const VISITOR_TYPES: Record<VisitorType, VisitorConfig> = {
  butterfly: {
    type: 'butterfly',
    emoji: '🦋',
    name: 'Butterfly',
    ability: 'Pollinates nearby plants',
    effect: 'pollinate',
  },
  bee: {
    type: 'bee',
    emoji: '🐝',
    name: 'Busy Bee',
    ability: 'Bonus water regeneration',
    effect: 'bonus_water',
  },
  rabbit: {
    type: 'rabbit',
    emoji: '🐰',
    name: 'Lucky Rabbit',
    ability: 'Instantly grows 1 plant',
    effect: 'instant_grow',
  },
  bluebird: {
    type: 'bluebird',
    emoji: '🐦',
    name: 'Bluebird',
    ability: 'Next harvest worth 2x',
    effect: 'double_harvest',
  },
};

export class Visitor {
  private config: VisitorConfig;
  private element: HTMLElement;
  private gridSize: number;
  private position: Position;
  private targetPosition: Position | null = null;
  private onEffect: (effect: VisitorConfig['effect'], visitor: Visitor) => void;
  private isActive: boolean = false;
  private visitTimeout: number | null = null;
  private moveInterval: number | null = null;
  
  constructor(
    type: VisitorType,
    gridContainer: HTMLElement,
    gridSize: number,
    onEffect: (effect: VisitorConfig['effect'], visitor: Visitor) => void
  ) {
    this.config = VISITOR_TYPES[type];
    this.gridSize = gridSize;
    this.onEffect = onEffect;
    
    // Start from random edge
    this.position = this.getRandomEdgePosition();
    
    // Create visitor element
    this.element = document.createElement('div');
    this.element.className = 'visitor entering';
    this.element.textContent = this.config.emoji;
    this.element.setAttribute('data-type', type);
    gridContainer.appendChild(this.element);
    
    this.updateVisualPosition();
  }
  
  public getConfig(): VisitorConfig {
    return this.config;
  }
  
  public getPosition(): Position {
    return { ...this.position };
  }
  
  private getRandomEdgePosition(): Position {
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
      case 0: return { x: Math.floor(Math.random() * this.gridSize), y: -1 }; // Top
      case 1: return { x: this.gridSize, y: Math.floor(Math.random() * this.gridSize) }; // Right
      case 2: return { x: Math.floor(Math.random() * this.gridSize), y: this.gridSize }; // Bottom
      default: return { x: -1, y: Math.floor(Math.random() * this.gridSize) }; // Left
    }
  }
  
  public enter(targetPos?: Position): void {
    this.isActive = true;
    
    // Pick target position (random tile if not specified)
    this.targetPosition = targetPos || {
      x: Math.floor(Math.random() * this.gridSize),
      y: Math.floor(Math.random() * this.gridSize),
    };
    
    // Animate to target
    this.moveToTarget(() => {
      // Arrived! Start visiting
      this.element.classList.remove('entering');
      this.element.classList.add('active');
      
      // Apply effect immediately
      this.onEffect(this.config.effect, this);
      
      // Wander a bit while visiting
      this.startWandering();
      
      // Schedule departure
      const visitDuration = VISITORS.VISIT_DURATION_MIN + 
        Math.random() * (VISITORS.VISIT_DURATION_MAX - VISITORS.VISIT_DURATION_MIN);
      
      this.visitTimeout = window.setTimeout(() => this.leave(), visitDuration);
    });
  }
  
  private moveToTarget(onArrive: () => void): void {
    if (!this.targetPosition) {
      onArrive();
      return;
    }
    
    const moveStep = () => {
      const dx = this.targetPosition!.x - this.position.x;
      const dy = this.targetPosition!.y - this.position.y;
      
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        // Arrived
        this.position = { ...this.targetPosition! };
        this.updateVisualPosition();
        onArrive();
        return;
      }
      
      // Move towards target
      this.position.x += Math.sign(dx) * 0.5;
      this.position.y += Math.sign(dy) * 0.5;
      this.updateVisualPosition();
      
      requestAnimationFrame(moveStep);
    };
    
    moveStep();
  }
  
  private startWandering(): void {
    this.moveInterval = window.setInterval(() => {
      // Move to adjacent tile randomly
      const dx = Math.random() > 0.5 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      const dy = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : 0;
      
      const newX = Math.max(0, Math.min(this.gridSize - 1, this.position.x + dx));
      const newY = Math.max(0, Math.min(this.gridSize - 1, this.position.y + dy));
      
      this.position = { x: newX, y: newY };
      this.updateVisualPosition();
    }, 2000);
  }
  
  public leave(): void {
    if (!this.isActive) return;
    this.isActive = false;
    
    // Stop wandering
    if (this.moveInterval) {
      clearInterval(this.moveInterval);
      this.moveInterval = null;
    }
    
    // Clear visit timeout
    if (this.visitTimeout) {
      clearTimeout(this.visitTimeout);
      this.visitTimeout = null;
    }
    
    // Animate leaving
    this.element.classList.remove('active');
    this.element.classList.add('leaving');
    
    // Move to edge
    const exitPos = this.getRandomEdgePosition();
    this.targetPosition = exitPos;
    
    this.moveToTarget(() => {
      // Remove element
      this.element.remove();
    });
  }
  
  private updateVisualPosition(): void {
    const tilePercent = 100 / this.gridSize;
    const x = this.position.x * tilePercent + tilePercent / 2;
    const y = this.position.y * tilePercent + tilePercent / 2;
    
    this.element.style.left = `${x}%`;
    this.element.style.top = `${y}%`;
  }
  
  public destroy(): void {
    this.leave();
  }
}
