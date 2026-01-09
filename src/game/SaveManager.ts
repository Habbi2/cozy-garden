import { GameState } from './types';

const SAVE_KEY = 'cozy_garden_save_v1';

export class SaveManager {
  public save(state: GameState): void {
    try {
      const json = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, json);
    } catch (e) {
      console.warn('Failed to save game:', e);
    }
  }
  
  public load(): GameState | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;
      
      const state = JSON.parse(json) as GameState;
      return this.validateState(state) ? state : null;
    } catch (e) {
      console.warn('Failed to load save:', e);
      return null;
    }
  }
  
  public clear(): void {
    localStorage.removeItem(SAVE_KEY);
  }
  
  private validateState(state: any): state is GameState {
    // Basic validation
    return (
      state &&
      typeof state.currentZoneId === 'string' &&
      Array.isArray(state.zones) &&
      typeof state.water === 'number' &&
      state.farmer &&
      typeof state.farmer.position === 'object'
    );
  }
}
