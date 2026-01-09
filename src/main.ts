import './styles/main.css';
import { Game } from './game/Game';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the game
  const game = new Game();
  
  // Expose for debugging
  (window as any).game = game;
  
  console.log('🌻 Cozy Garden loaded!');
});
