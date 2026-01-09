// ===== Plant Personality System =====
// Cosmetic-only traits that give each plant unique character

export type PersonalityTrait = 
  | 'cheerful'    // Bouncy, happy reactions
  | 'bashful'     // Shy, gentle movements  
  | 'dramatic'    // Big reactions, flair
  | 'zen'         // Calm, slow movements
  | 'curious'     // Perky, attentive
  | 'mysterious'  // Subtle, enigmatic
  | 'sleepy'      // Drowsy, slow
  | 'energetic';  // Fast, excited

export interface PersonalityConfig {
  trait: PersonalityTrait;
  harvestEmojis: string[];      // Reaction emojis on harvest
  idleWobble: 'bounce' | 'sway' | 'pulse' | 'none';
  wobbleSpeed: number;          // 0.5 = slow, 1 = normal, 1.5 = fast
  flavorText: string;           // Bio description
}

export const PERSONALITIES: Record<PersonalityTrait, PersonalityConfig> = {
  cheerful: {
    trait: 'cheerful',
    harvestEmojis: ['✨', '🎉', '💖', '😊'],
    idleWobble: 'bounce',
    wobbleSpeed: 1.2,
    flavorText: 'Always looking on the bright side!'
  },
  bashful: {
    trait: 'bashful',
    harvestEmojis: ['💕', '☺️', '🌸', '💗'],
    idleWobble: 'sway',
    wobbleSpeed: 0.7,
    flavorText: 'A little shy, but full of love.'
  },
  dramatic: {
    trait: 'dramatic',
    harvestEmojis: ['🌟', '💫', '👑', '🎭'],
    idleWobble: 'pulse',
    wobbleSpeed: 1.0,
    flavorText: 'Every moment is a performance!'
  },
  zen: {
    trait: 'zen',
    harvestEmojis: ['🧘', '☮️', '🍃', '💚'],
    idleWobble: 'sway',
    wobbleSpeed: 0.5,
    flavorText: 'At peace with the garden.'
  },
  curious: {
    trait: 'curious',
    harvestEmojis: ['✨', '👀', '💡', '🔍'],
    idleWobble: 'bounce',
    wobbleSpeed: 1.3,
    flavorText: 'Always wondering what\'s next!'
  },
  mysterious: {
    trait: 'mysterious',
    harvestEmojis: ['🌙', '✨', '🔮', '💜'],
    idleWobble: 'pulse',
    wobbleSpeed: 0.6,
    flavorText: 'Holds secrets of the garden...'
  },
  sleepy: {
    trait: 'sleepy',
    harvestEmojis: ['💤', '😴', '🌙', '☁️'],
    idleWobble: 'none',
    wobbleSpeed: 0.4,
    flavorText: 'Dreaming of sunny days...'
  },
  energetic: {
    trait: 'energetic',
    harvestEmojis: ['⚡', '🎊', '💥', '🌈'],
    idleWobble: 'bounce',
    wobbleSpeed: 1.5,
    flavorText: 'Can\'t sit still!'
  }
};

// Seed-weighted personality distribution
// Each seed type has weighted chances for each trait
type TraitWeight = { trait: PersonalityTrait; weight: number };

const SEED_PERSONALITY_WEIGHTS: Record<string, TraitWeight[]> = {
  sprout: [
    { trait: 'cheerful', weight: 30 },
    { trait: 'bashful', weight: 20 },
    { trait: 'dramatic', weight: 15 },
    { trait: 'zen', weight: 10 },
    { trait: 'curious', weight: 15 },
    { trait: 'mysterious', weight: 3 },
    { trait: 'sleepy', weight: 4 },
    { trait: 'energetic', weight: 3 }
  ],
  acorn: [
    { trait: 'cheerful', weight: 15 },
    { trait: 'bashful', weight: 10 },
    { trait: 'dramatic', weight: 10 },
    { trait: 'zen', weight: 25 },
    { trait: 'curious', weight: 20 },
    { trait: 'mysterious', weight: 10 },
    { trait: 'sleepy', weight: 5 },
    { trait: 'energetic', weight: 5 }
  ],
  bean: [
    { trait: 'cheerful', weight: 20 },
    { trait: 'bashful', weight: 10 },
    { trait: 'dramatic', weight: 25 },
    { trait: 'zen', weight: 5 },
    { trait: 'curious', weight: 25 },
    { trait: 'mysterious', weight: 5 },
    { trait: 'sleepy', weight: 3 },
    { trait: 'energetic', weight: 7 }
  ],
  bulb: [
    { trait: 'cheerful', weight: 15 },
    { trait: 'bashful', weight: 25 },
    { trait: 'dramatic', weight: 10 },
    { trait: 'zen', weight: 15 },
    { trait: 'curious', weight: 15 },
    { trait: 'mysterious', weight: 10 },
    { trait: 'sleepy', weight: 7 },
    { trait: 'energetic', weight: 3 }
  ],
  spore: [
    { trait: 'cheerful', weight: 5 },
    { trait: 'bashful', weight: 15 },
    { trait: 'dramatic', weight: 20 },
    { trait: 'zen', weight: 10 },
    { trait: 'curious', weight: 15 },
    { trait: 'mysterious', weight: 30 },
    { trait: 'sleepy', weight: 3 },
    { trait: 'energetic', weight: 2 }
  ],
  cactus: [
    { trait: 'cheerful', weight: 10 },
    { trait: 'bashful', weight: 10 },
    { trait: 'dramatic', weight: 15 },
    { trait: 'zen', weight: 30 },
    { trait: 'curious', weight: 10 },
    { trait: 'mysterious', weight: 15 },
    { trait: 'sleepy', weight: 5 },
    { trait: 'energetic', weight: 5 }
  ]
};

// Default weights if seed type not found
const DEFAULT_WEIGHTS: TraitWeight[] = [
  { trait: 'cheerful', weight: 15 },
  { trait: 'bashful', weight: 15 },
  { trait: 'dramatic', weight: 15 },
  { trait: 'zen', weight: 10 },
  { trait: 'curious', weight: 15 },
  { trait: 'mysterious', weight: 10 },
  { trait: 'sleepy', weight: 10 },
  { trait: 'energetic', weight: 10 }
];

/**
 * Get a random personality trait based on seed type
 */
export function getRandomPersonality(seedId: string): PersonalityTrait {
  const weights = SEED_PERSONALITY_WEIGHTS[seedId] || DEFAULT_WEIGHTS;
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  
  let random = Math.random() * totalWeight;
  
  for (const { trait, weight } of weights) {
    random -= weight;
    if (random <= 0) {
      return trait;
    }
  }
  
  // Fallback
  return 'cheerful';
}

/**
 * Get the personality config for a trait
 */
export function getPersonalityConfig(trait: PersonalityTrait): PersonalityConfig {
  return PERSONALITIES[trait];
}

/**
 * Get a random harvest reaction emoji for a personality
 */
export function getHarvestReaction(trait: PersonalityTrait): string {
  const config = PERSONALITIES[trait];
  const emojis = config.harvestEmojis;
  return emojis[Math.floor(Math.random() * emojis.length)];
}
