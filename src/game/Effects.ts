import { Position } from './types';

export class Effects {
  private effectsLayer: HTMLElement;
  private messageTimeout: number | null = null;
  
  constructor() {
    this.effectsLayer = document.getElementById('effects')!;
  }
  
  public waterEffect(position: Position): void {
    // Water drops falling
    this.spawnParticles(position, ['💧', '💦'], 5, 'water-drop');
    
    // Water ripple at ground level
    const pos = this.gridToScreen(position);
    setTimeout(() => {
      const ripple = document.createElement('div');
      ripple.className = 'water-ripple';
      ripple.style.left = `${pos.x}px`;
      ripple.style.top = `${pos.y + 20}px`;
      this.effectsLayer.appendChild(ripple);
      setTimeout(() => ripple.remove(), 800);
    }, 400);
  }
  
  public plantEffect(position: Position): void {
    // Initial plant sparkles
    this.spawnParticles(position, ['🌱', '✨', '🌿'], 4, 'sparkle');
    
    // Float up emoji
    this.floatEmoji(position, '🌱');
  }
  
  public growthEffect(position: Position): void {
    // Growth ring effect
    const pos = this.gridToScreen(position);
    const ring = document.createElement('div');
    ring.className = 'growth-effect';
    ring.style.left = `${pos.x - 30}px`;
    ring.style.top = `${pos.y - 30}px`;
    this.effectsLayer.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
    
    // Sparkles around the plant
    this.spawnParticles(position, ['✨', '⭐', '💫'], 6, 'sparkle');
    
    // Small float emoji
    this.floatEmoji(position, '✨');
  }
  
  public mergeEffect(position: Position): void {
    const pos = this.gridToScreen(position);
    
    // Golden merge burst
    const burst = document.createElement('div');
    burst.className = 'merge-burst';
    burst.style.left = `${pos.x - 40}px`;
    burst.style.top = `${pos.y - 40}px`;
    this.effectsLayer.appendChild(burst);
    setTimeout(() => burst.remove(), 700);
    
    // Golden sparkles
    this.spawnGoldenSparkles(position, 10);
    
    // Confetti!
    this.spawnConfetti(position, 8);
    
    // Float up star
    this.floatEmoji(position, '⭐');
  }
  
  public unlockEffect(position: Position): void {
    // Big celebration effect
    const pos = this.gridToScreen(position);
    
    // Multiple bursts
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const burst = document.createElement('div');
        burst.className = 'merge-burst';
        burst.style.left = `${pos.x - 40 + (Math.random() - 0.5) * 60}px`;
        burst.style.top = `${pos.y - 40 + (Math.random() - 0.5) * 60}px`;
        this.effectsLayer.appendChild(burst);
        setTimeout(() => burst.remove(), 700);
      }, i * 150);
    }
    
    // Lots of confetti
    this.spawnConfetti(position, 15);
    
    // Float up trophy
    this.floatEmoji(position, '🏆');
  }
  
  private spawnParticles(position: Position, emojis: string[], count: number, className: string): void {
    const basePos = this.gridToScreen(position);
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = className;
      particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      
      // Random offset
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;
      
      particle.style.left = `${basePos.x + offsetX}px`;
      particle.style.top = `${basePos.y + offsetY}px`;
      
      // Stagger spawn
      setTimeout(() => {
        this.effectsLayer.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
      }, i * 50);
    }
  }
  
  private spawnGoldenSparkles(position: Position, count: number): void {
    const basePos = this.gridToScreen(position);
    
    for (let i = 0; i < count; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle golden';
      sparkle.textContent = ['✨', '⭐', '🌟'][Math.floor(Math.random() * 3)];
      
      const angle = (i / count) * Math.PI * 2;
      const radius = 30 + Math.random() * 20;
      
      sparkle.style.left = `${basePos.x + Math.cos(angle) * radius}px`;
      sparkle.style.top = `${basePos.y + Math.sin(angle) * radius}px`;
      
      setTimeout(() => {
        this.effectsLayer.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
      }, i * 30);
    }
  }
  
  private spawnConfetti(position: Position, count: number): void {
    const basePos = this.gridToScreen(position);
    const confettiChars = ['🎉', '🎊', '✨', '💫', '⭐'];
    
    for (let i = 0; i < count; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.textContent = confettiChars[Math.floor(Math.random() * confettiChars.length)];
      
      const offsetX = (Math.random() - 0.5) * 80;
      confetti.style.left = `${basePos.x + offsetX}px`;
      confetti.style.top = `${basePos.y - 20}px`;
      confetti.style.animationDuration = `${1 + Math.random() * 0.5}s`;
      
      setTimeout(() => {
        this.effectsLayer.appendChild(confetti);
        setTimeout(() => confetti.remove(), 1500);
      }, i * 40);
    }
  }
  
  private floatEmoji(position: Position, emoji: string): void {
    const pos = this.gridToScreen(position);
    const floater = document.createElement('div');
    floater.className = 'float-emoji';
    floater.textContent = emoji;
    floater.style.left = `${pos.x}px`;
    floater.style.top = `${pos.y - 20}px`;
    
    this.effectsLayer.appendChild(floater);
    setTimeout(() => floater.remove(), 1500);
  }
  
  private gridToScreen(position: Position): { x: number; y: number } {
    const grid = document.getElementById('game-grid')!;
    const rect = grid.getBoundingClientRect();
    const gridSize = parseInt(getComputedStyle(grid).getPropertyValue('--grid-size')) || 5;
    
    const tileWidth = rect.width / gridSize;
    const tileHeight = rect.height / gridSize;
    
    return {
      x: rect.left + position.x * tileWidth + tileWidth / 2,
      y: rect.top + position.y * tileHeight + tileHeight / 2,
    };
  }
  
  public showMessage(text: string, type: 'info' | 'success' | 'warning' = 'info'): void {
    const colors = {
      info: 'rgba(0, 0, 0, 0.85)',
      success: 'rgba(46, 125, 50, 0.9)',
      warning: 'rgba(230, 126, 34, 0.9)'
    };
    
    // Create floating message
    const message = document.createElement('div');
    message.className = 'floating-message';
    message.textContent = text;
    message.style.cssText = `
      position: fixed;
      top: 40%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${colors[type]};
      color: white;
      padding: 15px 30px;
      border-radius: 20px;
      font-size: 1.2rem;
      font-weight: 600;
      z-index: 1000;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      animation: message-pop 2.5s ease-out forwards;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes message-pop {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
        10% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        20% { transform: translate(-50%, -50%) scale(1); }
        70% { opacity: 1; }
        100% { opacity: 0; transform: translate(-50%, -60%) scale(0.95); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
      style.remove();
    }, 2500);
  }
}
