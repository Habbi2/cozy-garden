// ===== Botanical Pun Name Generator =====
// Generates cute plant-themed names based on seed type

type NamePool = {
  prefixes: string[];
  suffixes: string[];
  standalone: string[];
};

const SEED_NAMES: Record<string, NamePool> = {
  sprout: {
    prefixes: ['Petal', 'Bloom', 'Flora', 'Blossom', 'Daisy', 'Rose', 'Lily', 'Violet', 'Iris', 'Poppy'],
    suffixes: ['belle', 'ina', 'ette', 'anne', 'ia'],
    standalone: [
      'Petunia', 'Rosie', 'Lily', 'Violet', 'Daisy Mae', 'Blossom',
      'Flora', 'Petal', 'Buttercup', 'Clover', 'Iris', 'Jasmine',
      'Tulip', 'Dahlia', 'Zinnia', 'Magnolia', 'Camellia', 'Azalea',
      'Daffodil', 'Marigold', 'Primrose', 'Heather', 'Holly', 'Ivy',
      'Fern', 'Sage', 'Laurel', 'Lavender', 'Hyacinth', 'Wisteria'
    ]
  },
  acorn: {
    prefixes: ['Oak', 'Elm', 'Ash', 'Birch', 'Maple', 'Pine', 'Cedar', 'Willow', 'Alder', 'Rowan'],
    suffixes: ['ley', 'wood', 'ton', 'bert', 'son'],
    standalone: [
      'Oakley', 'Woody', 'Maple', 'Birch', 'Willow', 'Ashton',
      'Cedar', 'Forrest', 'Sylvan', 'Arbor', 'Linden', 'Rowan',
      'Alder', 'Aspen', 'Briar', 'Grove', 'Thorn', 'Branch',
      'Timber', 'Acorn Jr.', 'Nutkin', 'Oaksworth', 'Sir Bark',
      'Twiggy', 'Pinecone', 'Elmsworth', 'Sequoia', 'Redwood'
    ]
  },
  bean: {
    prefixes: ['Bean', 'Vine', 'Pepper', 'Gourd', 'Melon', 'Squash', 'Pea', 'Pod'],
    suffixes: ['sley', 'kins', 'worth', 'ton', 'o'],
    standalone: [
      'Jack', 'Beansley', 'Vinny', 'Pepper', 'Gourdian',
      'Melonie', 'Squashley', 'Peabody', 'Lima', 'Fava',
      'String Bean', 'Snapdragon', 'Pumpkin', 'Butternut',
      'Zucchini', 'Cucumber', 'Pickle', 'Gherkin', 'Jalapeño',
      'Cayenne', 'Paprika', 'Chili', 'Climbing Jack', 'Bean Sprout',
      'Sir Climbs-a-Lot', 'Tendril', 'Curly', 'Twister'
    ]
  },
  bulb: {
    prefixes: ['Onion', 'Garlic', 'Tulip', 'Carrot', 'Beet', 'Radish', 'Turnip', 'Potato'],
    suffixes: ['sworth', 'ton', 'kins', 'bert', 'ia'],
    standalone: [
      'Sir Onion', 'Garth', 'Tulip', 'Lotus', 'Bulba',
      'Carrot Top', 'Beets', 'Radley', 'Turnsworth', 'Tater',
      'Spud', 'Ginger', 'Shallot', 'Leek', 'Chive',
      'Scallion', 'Pearl', 'Root', 'Digby', 'Earthling',
      'Underground', 'Rootsworth', 'Sir Digs-a-Lot', 'Muddy',
      'Buried Treasure', 'Daffodilia', 'Hyacinthia', 'Croakus'
    ]
  },
  spore: {
    prefixes: ['Shroom', 'Fungi', 'Myco', 'Spore', 'Cap', 'Gill', 'Moss', 'Lichen'],
    suffixes: ['ling', 'bert', 'wick', 'shade', 'wood'],
    standalone: [
      'Fungus', 'Shroom', 'Truffle', 'Portia', 'Chanty',
      'Morel', 'Shiitake', 'Enoki', 'Porcini', 'Cremini',
      'Button', 'Toadstool', 'Sporeling', 'Mycelium', 'Mildew',
      'Shadowcap', 'Nightshade', 'Gloomkin', 'Duskbell', 'Mistling',
      'Whisper', 'Murk', 'Twilight', 'Eclipse', 'Phantom',
      'Spectre', 'Umbra', 'Nocturne', 'Vesper'
    ]
  },
  cactus: {
    prefixes: ['Spike', 'Prickle', 'Sandy', 'Desert', 'Dune', 'Succul', 'Agave', 'Aloe'],
    suffixes: ['o', 'ita', 'sworth', 'ton', 'y'],
    standalone: [
      'Spike', 'Sandy', 'Prickles', 'Aloe', 'Vera',
      'Cactus Jack', 'Needles', 'Thorny', 'Dusty', 'Sunny',
      'Sunburst', 'Oasis', 'Mirage', 'Sahara', 'Mojave',
      'Sedona', 'Arizona', 'Saguaro', 'Agave', 'Yucca',
      'Jade', 'Succulent Steve', 'Prickly Pete', 'Sandy Cheeks',
      'Dryden', 'Arid', 'Solaris', 'Blaze', 'Scorchy'
    ]
  }
};

// Default names for unknown seed types
const DEFAULT_NAMES: NamePool = {
  prefixes: ['Plant', 'Leaf', 'Green', 'Sprout', 'Bud', 'Stem', 'Root', 'Seed'],
  suffixes: ['y', 'ie', 'ling', 'kins', 'bert'],
  standalone: [
    'Planty', 'Leafy', 'Greenie', 'Sprouty', 'Buddy',
    'Stemmy', 'Rooty', 'Seedling', 'Little One', 'Garden Friend',
    'Chlorophyll', 'Photon', 'Sunbeam', 'Dewdrop', 'Rainfall'
  ]
};

/**
 * Generate a random name for a plant based on its seed type
 */
export function generatePlantName(seedId: string): string {
  const pool = SEED_NAMES[seedId] || DEFAULT_NAMES;
  
  // 70% chance for standalone name, 30% for combo
  if (Math.random() < 0.7) {
    return pool.standalone[Math.floor(Math.random() * pool.standalone.length)];
  } else {
    const prefix = pool.prefixes[Math.floor(Math.random() * pool.prefixes.length)];
    const suffix = pool.suffixes[Math.floor(Math.random() * pool.suffixes.length)];
    return prefix + suffix;
  }
}

/**
 * Get all possible names for a seed type (for validation/testing)
 */
export function getAllPossibleNames(seedId: string): string[] {
  const pool = SEED_NAMES[seedId] || DEFAULT_NAMES;
  const names: string[] = [...pool.standalone];
  
  // Add all prefix+suffix combinations
  for (const prefix of pool.prefixes) {
    for (const suffix of pool.suffixes) {
      names.push(prefix + suffix);
    }
  }
  
  return names;
}
