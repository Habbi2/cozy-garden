type SoundType = 'plant' | 'water' | 'grow' | 'merge' | 'unlock' | 'click' | 'locked';

// Simple placeholder sounds using Web Audio API
// TODO: Replace with actual sound files
export class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;
  private hasUserInteracted = false;
  
  constructor() {
    // Initialize audio context on first user interaction
    const onInteract = () => {
      this.hasUserInteracted = true;
      this.initAudio();
    };
    document.addEventListener('click', onInteract, { once: true });
    document.addEventListener('touchstart', onInteract, { once: true });
  }
  
  private initAudio(): void {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio not supported');
    }
  }
  
  public play(type: SoundType): void {
    if (!this.enabled) return;
    
    // Haptic feedback for mobile (if supported)
    this.vibrate(type);
    
    if (!this.audioContext) return;
    
    // Generate simple tones for different actions
    // These are placeholder sounds - replace with actual audio files
    switch (type) {
      case 'plant':
        this.playTone(200, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(300, 0.1, 'sine', 0.2), 50);
        break;
        
      case 'water':
        this.playTone(400, 0.15, 'sine', 0.2);
        this.playTone(500, 0.1, 'sine', 0.15);
        setTimeout(() => this.playTone(350, 0.1, 'sine', 0.1), 100);
        break;
        
      case 'grow':
        this.playTone(300, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(400, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(500, 0.15, 'sine', 0.3), 200);
        break;
        
      case 'merge':
        this.playTone(400, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.3), 80);
        setTimeout(() => this.playTone(600, 0.15, 'sine', 0.4), 160);
        setTimeout(() => this.playTone(800, 0.2, 'sine', 0.3), 240);
        break;
        
      case 'unlock':
        this.playTone(400, 0.1, 'sine', 0.3);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(600, 0.1, 'sine', 0.3), 200);
        setTimeout(() => this.playTone(800, 0.3, 'sine', 0.4), 300);
        break;
        
      case 'click':
        this.playTone(600, 0.05, 'sine', 0.2);
        break;
        
      case 'locked':
        this.playTone(200, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(150, 0.15, 'square', 0.2), 100);
        break;
    }
  }
  
  private vibrate(type: SoundType): void {
    if (!navigator.vibrate || !this.hasUserInteracted) return;
    
    switch (type) {
      case 'plant':
        navigator.vibrate(10);
        break;
      case 'water':
        navigator.vibrate([5, 30, 5]);
        break;
      case 'grow':
        navigator.vibrate([10, 20, 10]);
        break;
      case 'merge':
        navigator.vibrate([15, 30, 15, 30, 20]);
        break;
      case 'unlock':
        navigator.vibrate([20, 50, 20, 50, 30, 50, 40]);
        break;
      case 'locked':
        navigator.vibrate([30, 50, 30]);
        break;
    }
  }
  
  private playTone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
  
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  public isEnabled(): boolean {
    return this.enabled;
  }
}
