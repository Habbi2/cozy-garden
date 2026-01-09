# 🌻 Cozy Garden Game - Project Plan

## Vision
A relaxed, cozy garden game where players plant seeds, water them, and watch them grow. No pressure, no fail states - just peaceful gardening that feels good.

**Core Values:**
- 100% free, instant play in browser
- No accounts, no installs
- So satisfying people share it naturally
- Tip jar only (later)

---

## Game Design Summary

### Core Loop
1. **Tap empty tile** → Plant a seed 🌱
2. **Tap plant** → Water it 💧
3. **Wait** → Plant grows automatically over time
4. **Drag plant onto same type** → Merge to skip waiting (optional)
5. **Enjoy** → Watch your garden flourish 🌸

### Key Mechanics

| Feature | Design |
|---------|--------|
| Growth | Auto over time + merge to speed up |
| Timing | Minutes while playing, slower while away |
| Farmer | Companion that wanders & reacts (doesn't control gameplay) |
| Interaction | Direct tap to plant/water, drag to merge |
| Plant sizes | Visual overflow only (big plants look big, don't block tiles) |
| Plant types | Different families (Flowers, Trees), same mechanics |
| Progression | Unlock new zones |
| Offline | Real growth + "Welcome back" summary |
| Sound | ASMR-like cozy sounds (crucial!) |
| Art | Emojis for V1, upgrade later |

### V1 Scope
- 5×5 main garden
- 2 plant families (Flowers, Trees)
- 2 zones (Main Garden, Greenhouse)
- Full sound design
- All devices (mobile, tablet, desktop)

---

## Plant Families

### 🌸 Flowers (Main Garden)
| Stage | Emoji | Name | Growth Time | Visual Size |
|-------|-------|------|-------------|-------------|
| 0 | 🌱 | Seedling | - | 1x |
| 1 | 🌿 | Sprout | 30s | 1x |
| 2 | 🌷 | Tulip | 1m | 1.2x |
| 3 | 🌸 | Blossom | 2m | 1.5x |
| 4 | 🌺 | Hibiscus | 4m | 1.8x |
| 5 | 💐 | Bouquet | 8m | 2.2x |

### 🌳 Trees (Greenhouse)
| Stage | Emoji | Name | Growth Time | Visual Size |
|-------|-------|------|-------------|-------------|
| 0 | 🌱 | Seed | - | 1x |
| 1 | 🌿 | Sapling | 45s | 1x |
| 2 | 🪴 | Potted | 2m | 1.3x |
| 3 | 🌲 | Pine | 4m | 1.6x |
| 4 | 🌳 | Oak | 8m | 2x |
| 5 | 🎄 | Grand Tree | 15m | 2.5x |

---

## Zones

### Zone 1: Main Garden 🏡
- **Unlock:** Available from start
- **Size:** 5×5 grid
- **Plants:** Flowers family
- **Vibe:** Sunny, colorful, welcoming

### Zone 2: Greenhouse 🌿
- **Unlock:** Grow 10 plants to max stage
- **Size:** 5×5 grid
- **Plants:** Trees family
- **Vibe:** Warm, humid, earthy

---

## Technical Architecture

```
src/
├── main.ts                 # Entry point
├── styles/
│   └── main.css           # All styling
├── game/
│   ├── config.ts          # Constants, plant data, zone data
│   ├── types.ts           # TypeScript interfaces
│   ├── Game.ts            # Main game controller
│   ├── Zone.ts            # Zone/grid management
│   ├── Plant.ts           # Plant entity
│   ├── Farmer.ts          # Companion AI
│   ├── SaveManager.ts     # Persistence & offline
│   └── SoundManager.ts    # Audio handling
├── ui/
│   ├── WelcomeBack.ts     # Return screen
│   └── Effects.ts         # Particles, animations
```

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] **1.1** Clean up old code
- [x] **1.2** Create config.ts with all game constants
- [x] **1.3** Create types.ts with interfaces
- [x] **1.4** Build index.html structure
- [x] **1.5** Create main.css with responsive grid

### Phase 2: Core Game ✅
- [x] **2.1** Implement Zone class (grid, tiles)
- [x] **2.2** Implement Plant class (stages, growth)
- [x] **2.3** Implement tap to plant seeds
- [x] **2.4** Implement tap to water plants
- [x] **2.5** Implement auto-growth timer
- [x] **2.6** Implement drag-to-merge

### Phase 3: Farmer Companion ✅
- [x] **3.1** Create Farmer class
- [x] **3.2** Implement idle wandering AI
- [x] **3.3** Add reaction animations (wave, celebrate)
- [x] **3.4** Farmer notices player actions

### Phase 4: Persistence ✅
- [x] **4.1** Implement SaveManager
- [x] **4.2** Auto-save on changes
- [x] **4.3** Calculate offline progress
- [x] **4.4** Create "Welcome Back" screen
- [x] **4.5** Show offline growth summary

### Phase 5: Sound Design ⬜
- [x] **5.1** Create SoundManager (placeholder tones)
- [ ] **5.2** Add planting sound (soft plop)
- [ ] **5.3** Add watering sound (gentle splash)
- [ ] **5.4** Add growth sound (magical chime)
- [ ] **5.5** Add merge sound (satisfying whoosh)
- [ ] **5.6** Add ambient background (birds, breeze)
- [ ] **5.7** Add farmer reactions (humming, happy sounds)

### Phase 6: Visual Polish ⬜
- [ ] **6.1** Plant growth animations
- [ ] **6.2** Visual overflow for big plants
- [ ] **6.3** Water droplet particles
- [ ] **6.4** Merge sparkle effects
- [ ] **6.5** Subtle tile hover effects
- [ ] **6.6** Farmer idle animation
- [ ] **6.7** Day/night ambient lighting (subtle)

### Phase 7: Progression ⬜
- [ ] **7.1** Track plants grown to max stage
- [ ] **7.2** Implement zone unlock condition
- [ ] **7.3** Create Greenhouse zone
- [ ] **7.4** Add zone switcher UI
- [ ] **7.5** Trees plant family

### Phase 8: Polish & Launch ⬜
- [ ] **8.1** Mobile touch optimization
- [ ] **8.2** Desktop hover states
- [ ] **8.3** Performance testing
- [ ] **8.4** Cross-browser testing
- [ ] **8.5** PWA setup (optional)
- [ ] **8.6** Final sound balancing
- [ ] **8.7** Soft launch for feedback

---

## Sound Asset List

| Action | Sound Type | Vibe |
|--------|------------|------|
| Plant seed | Soft "plop" | Satisfying, earthy |
| Water plant | Gentle splash | Refreshing, ASMR |
| Plant grows | Soft chime | Magical, rewarding |
| Merge plants | Whoosh + sparkle | Exciting but gentle |
| Zone unlock | Celebration jingle | Achievement! |
| Farmer walks | Soft footsteps | Barely noticeable |
| Farmer celebrates | Happy "yay!" | Cute, not annoying |
| Ambient | Birds, gentle breeze | Constant, peaceful |

---

## UI Layout

```
┌─────────────────────────────────────┐
│  [🏡 Garden] [🌿 Greenhouse🔒]      │  ← Zone tabs
├─────────────────────────────────────┤
│                                     │
│    ┌───┬───┬───┬───┬───┐           │
│    │   │ 🌷│   │   │   │           │
│    ├───┼───┼───┼───┼───┤           │
│    │🌱 │   │   │ 🌸│   │           │
│    ├───┼───┼───┼───┼───┤           │  ← 5x5 Grid
│    │   │   │🧑‍🌾│   │ 🌱│           │
│    ├───┼───┼───┼───┼───┤           │
│    │   │🌺 │   │   │   │           │
│    ├───┼───┼───┼───┼───┤           │
│    │   │   │ 🌷│   │   │           │
│    └───┴───┴───┴───┴───┘           │
│                                     │
├─────────────────────────────────────┤
│  🌱 Seeds: ∞    💧 Water: 8/8      │  ← Resources
│  Tap tile to plant • Drag to merge  │  ← Hint
└─────────────────────────────────────┘
```

---

## Timing Constants

```typescript
// Growth (while playing)
GROWTH_TICK = 1000           // Check every 1s
GROWTH_MULTIPLIER = 1.0      // Normal speed

// Growth (while away)
OFFLINE_MULTIPLIER = 0.3     // 30% speed offline
MAX_OFFLINE_HOURS = 8        // Cap at 8 hours

// Resources
WATER_MAX = 8
WATER_REGEN = 30000          // 1 water per 30s
SEEDS_UNLIMITED = true       // Always can plant

// Interactions
MERGE_DRAG_THRESHOLD = 20    // pixels before drag starts
```

---

## Notes & Ideas for Later

- Seasonal events (spring flowers, autumn leaves)
- Weather effects (rain waters all plants slowly)
- Rare/special plants from merging max-stage
- Garden decorations (benches, fountains)
- Multiple farmers to unlock
- Sharing screenshots of gardens
- Daily bonus for returning

---

## Current Status

**Phase:** 1 - Foundation  
**Last Updated:** January 8, 2026
