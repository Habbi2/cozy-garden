# 🌻 Cozy Garden V2 - Implementation Plan

## Vision
Transform from simple plant-and-wait into an engaging ecosystem where **positioning matters**, **combos reward skill**, and **animal visitors** create dynamic gameplay moments—all while staying cozy.

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Weeds? | ❌ No - keeps "no fail state" |
| Sound? | ⏸️ Mechanics first, music later |
| Visitor frequency | Every 45-60 seconds |
| Offline visitors? | ❌ No - rewards active play |

---

## Phase 1: Core Mechanic Improvements

### 1.1 Harvest System ✅
- [x] Tap max-stage plant → harvest animation
- [x] Clear tile + award Garden Points
- [x] Add `gardenPoints` to GameState
- [x] Display Garden Points in UI (bottom bar)
- [x] Save/load garden points (via existing SaveManager)
- [x] Harvest effect (pop animation + floating +points)

### 1.2 Combo Watering ✅
- [x] Track watering timestamps
- [x] Detect 3+ waters within 2 seconds
- [x] Apply +50% growth boost to combo'd plants
- [x] Visual: "Combo x3!" floating text
- [x] Visual: Fire emoji on combo plants
- [ ] Sound: Rising chime pitch for each combo plant

### 1.3 Plant Neighbors Bonus ✅
- [x] Calculate adjacent same-family plants
- [x] Apply +25% points bonus per neighbor on harvest
- [ ] Visual: Subtle glow between friendly neighbors
- [ ] Apply +25% growth speed per neighbor

### 1.4 Golden Seeds ✅
- [x] 10% chance on planting → golden seed
- [x] Golden plants: +50% growth speed
- [x] Golden plants: worth 2x Garden Points on harvest
- [x] Visual: Golden shimmer effect (CSS animation)
- [x] Track `isGolden` in PlantData

---

## Phase 2: Farmer Becomes Useful

### 2.1 Farmer Proximity Boost ✅
- [x] Plants within 1 tile of farmer → +50% growth
- [x] Calculate distance in Zone.updateGrowth()
- [ ] Visual: Soft glow aura around farmer
- [ ] Aura pulses gently

### 2.2 Tap-to-Call Farmer ✅
- [x] Tap farmer → auto-water nearby plants
- [x] Farmer waves acknowledgment
- [x] Update Farmer.ts with callTo(position) method
- [x] Farmer walks to position with animation

### 2.3 Farmer Auto-Water ✅
- [x] Every 15 seconds, farmer waters 1 nearby unwatered plant
- [x] "Nearby" = within 1 tile of farmer position
- [x] Farmer does watering animation
- [x] Water drop effect on plant
- [x] Doesn't consume player's water resource

### 2.4 Farmer Speech Bubbles ✅
- [x] Random cute messages on events
- [x] Messages: "So pretty!", "Growing nicely~", "Wow!", etc.
- [x] Show above farmer head
- [x] Auto-dismiss after 2 seconds
- [x] Different messages for: plant, water, grow, harvest, combo, golden

---

## Phase 3: Visitor System

### 3.1 Visitor Framework ✅
- [x] Create Visitor.ts class
- [x] Visitor spawns from screen edge
- [x] Walks/flies to random tile
- [x] Stays 15-20 seconds
- [x] Applies ability while present
- [x] Leaves with animation
- [x] Max 1 visitor at a time

### 3.2 Visitor Spawn Logic ✅
- [x] Base: 1 visitor every 45-60 seconds
- [x] Bonus: reduce interval per max-stage plant on grid
- [x] Only spawn during active play (not offline)
- [x] Announcement popup when visitor arrives

### 3.3 Butterfly 🦋 (Starter Visitor) ✅
- [x] Unlocked from start
- [x] Flies to a random tile
- [x] Nearby plants get +50% growth boost
- [x] Fluttering idle animation
- [x] Flies away gracefully

### 3.4 Bee 🐝 ✅
- [x] Available from start (weighted lower)
- [x] Buzzes around grid
- [x] Refills water instantly
- [x] Buzzing animation (side to side)

### 3.5 Rabbit 🐰 ✅
- [x] Available from start (weighted lower)
- [x] Hops to tile
- [x] Instantly advances 1 random plant's growth
- [x] Hopping animation

### 3.6 Bluebird 🐦 ✅
- [x] Available from start (weighted lower)
- [x] Lands on grid
- [x] Next harvest worth 2x points
- [x] Flies away

### 3.7 Future Visitors (Not Implemented Yet) ⬜

### 3.8 Visitor UI ⬜
- [ ] Visitor enters from random screen edge
- [ ] Small icon shows current visitor + ability
- [ ] Timer or visual hint for departure
- [ ] Celebration effect when visitor helps

---

## Phase 4: Progression System

### 4.1 Unlock Framework ⬜
- [ ] Track unlocked visitors in state
- [ ] Track unlocked cosmetics in state
- [ ] Check unlock conditions on point gain
- [ ] Show unlock celebration

### 4.2 Unlock Milestones ⬜
| Points | Unlock | Type |
|--------|--------|------|
| 0 | 🦋 Butterfly | Visitor (starter) |
| 50 | 🐝 Bee | Visitor |
| 100 | 👒 Straw Hat | Farmer cosmetic |
| 200 | 🐱 Cat | Visitor |
| 350 | 🌱 Fertile Soil | Tile upgrade |
| 500 | 🐦 Bird | Visitor |
| 750 | 💧 Water Well | Tile upgrade |
| 1000 | 🐿️ Squirrel | Visitor |

### 4.3 Tile Upgrades ⬜
- [ ] Fertile Soil: +25% growth on this tile (costs 20 pts)
- [ ] Water Well: Plants stay watered 2x longer (costs 30 pts)
- [ ] Long-press tile to upgrade (if unlocked + affordable)
- [ ] Visual indicator for upgraded tiles

### 4.4 Farmer Cosmetics ⬜
- [ ] Straw Hat: Visual only, shows on farmer
- [ ] Future: More hats, tools, outfits
- [ ] Settings menu to equip

---

## Phase 5: Visual Polish

### 5.1 Responsive Fixes ⬜
- [ ] Test 320px (small phone)
- [ ] Test 375px (iPhone SE)
- [ ] Test 414px (iPhone Plus)
- [ ] Test 768px (tablet)
- [ ] Test 1920px (desktop)
- [ ] Ensure 44px minimum touch targets

### 5.2 Plant Animations ⬜
- [ ] Wiggle when watered
- [ ] Pop/bounce on stage up
- [ ] Permanent sparkle on max-stage
- [ ] Golden shimmer for golden plants

### 5.3 Farmer Aura ⬜
- [ ] Circular glow showing boost zone
- [ ] Gentle pulse animation
- [ ] Fades at edges

### 5.4 Visitor Animations ⬜
- [ ] Entry from screen edge
- [ ] Idle animations per visitor type
- [ ] Exit animations
- [ ] Ability activation effect

### 5.5 Ambient Particles ⬜
- [ ] Floating pollen/dust (CSS only)
- [ ] Respect prefers-reduced-motion
- [ ] Light on GPU

---

## Phase 6: Data & Polish

### 6.1 Stats Tracking ⬜
- [ ] Total plants harvested
- [ ] Highest combo achieved
- [ ] Total visitors attracted
- [ ] Total Garden Points earned (lifetime)
- [ ] Time played

### 6.2 Final Balance ⬜
- [ ] Test growth speeds feel good
- [ ] Test combo timing window
- [ ] Test visitor frequency
- [ ] Test point economy

---

## Implementation Order

| Priority | Task | Est. Time |
|----------|------|-----------|
| 🔴 1 | Harvest system + Garden Points | 30 min |
| 🔴 2 | Farmer proximity boost | 20 min |
| 🔴 3 | Tap-to-call farmer | 20 min |
| 🔴 4 | Farmer auto-water | 20 min |
| 🔴 5 | Combo watering | 30 min |
| 🟡 6 | Plant neighbors bonus | 20 min |
| 🟡 7 | Golden seeds | 20 min |
| 🟡 8 | Visitor framework | 40 min |
| 🟡 9 | Butterfly visitor | 20 min |
| 🟢 10 | Additional visitors | 40 min |
| 🟢 11 | Progression/unlocks | 30 min |
| 🟢 12 | Visual polish | 30 min |

---

## Current Status

**Phase:** 1 - Core Mechanics  
**Current Task:** 1.1 Harvest System  
**Last Updated:** January 8, 2026
