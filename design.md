# PetSteps - Mobile App Interface Design

## Overview
PetSteps is a pet step tracking RPG where users walk to level up AI-generated pets, evolve them through breeding, battle other players, and join walking guilds for competitions. The app combines fitness motivation with Tamagotchi-style pet care and RPG battle mechanics.

---

## Screen List

### 1. Tutorial/Onboarding Screens
- **Welcome Screen** - App introduction with "Start Journey" button
- **Tutorial Pet Screen** - Level 99 template pet with 10 steps to retirement
- **Retirement Screen** - Pet retirement celebration and transition to paywall
- **Paywall Screen** - Free tier (template pets) vs Premium (AI generation)

### 2. Main Tab Screens
- **Home/Pet Screen** - Main pet view with stats, care, and interactions
- **Steps Screen** - Step tracking dashboard with daily/weekly goals
- **Battle Screen** - Matchmaking and battle interface
- **Guild Screen** - Walking group management and competitions
- **Profile Screen** - User stats, subscription, and settings

### 3. Secondary Screens
- **Pet Creation Screen** - Element selection (free) or AI generation (premium)
- **Evolution Screen** - Image-to-image evolution at levels 20/40/60/80
- **Breeding Screen** - Partner selection at level 90
- **Egg Hatching Screen** - Egg progress and hatching animation
- **Battle Arena Screen** - Turn-based auto-battle view
- **Guild Battle Screen** - Weekly guild competition view
- **Shop/Subscription Screen** - Token purchase and tier management
- **Pet Customization Screen** - Regenerate image, videos, 3D model

---

## Primary Content and Functionality

### Home/Pet Screen
- **Pet Display**: Large animated pet image (2D or 3D if premium)
- **Stats Bar**: Level, XP progress, Attack/Defense/Health
- **Care Meters**: Happiness (❤️), Hunger (🍖), Thirst (💧)
- **Quick Actions**: Feed, Water, Play buttons
- **Pet Info Card**: Element type(s), generation, parent lineage
- **Evolution Badge**: Shows next evolution level milestone

### Steps Screen
- **Today's Steps**: Large number display with circular progress
- **Weekly Graph**: 7-day step history bar chart
- **XP Earned**: Steps converted to experience points
- **Goal Progress**: Dynamic daily goal based on user tier
- **Consumables Earned**: Items unlocked from walking

### Battle Screen
- **Battle Queue**: "Find Match" button with estimated wait
- **Daily Battles**: X/3 battles remaining today
- **Recent Battles**: Win/loss history with opponent info
- **Battle Preview**: Shows opponent pet before accepting

### Guild Screen
- **Guild Info**: Name, member count, weekly steps total
- **Member List**: Ranked by weekly contribution
- **Competition Status**: Current/upcoming guild battles
- **Guild Chat**: Simple message board
- **Join/Create**: Guild discovery and creation

### Profile Screen
- **User Stats**: Total steps, battles won, pets retired
- **Subscription Tier**: Current plan with upgrade option
- **Token Balance**: Available AI generation tokens
- **Settings**: Notifications, health app permissions
- **Pet History**: Gallery of retired pets

---

## Key User Flows

### Flow 1: New User Tutorial
1. User opens app → Welcome Screen
2. Tap "Start Journey" → Tutorial Pet Screen (Level 99 pet)
3. Walk 10 steps → Pet reaches Level 100
4. Retirement animation plays → Retirement Screen
5. Tap "Continue" → Paywall Screen
6. Choose Free (template) or Premium (AI) → Pet Creation

### Flow 2: Daily Pet Care
1. User opens app → Home/Pet Screen
2. Check care meters (happiness/hunger/thirst)
3. If low, tap Feed/Water/Play buttons
4. Walk throughout day → Steps sync automatically
5. Pet gains XP → Level up notifications
6. Unlock consumables from walking milestones

### Flow 3: Evolution (Levels 20/40/60/80)
1. Pet reaches evolution level → Evolution notification
2. Tap "Evolve" → Evolution Screen
3. (Premium) Enter evolution prompt: "Add wings", "Make fiercer"
4. AI generates evolved image → Preview
5. Confirm or regenerate (costs tokens) → Evolution complete

### Flow 4: Breeding (Level 90)
1. Pet reaches Level 90 → Breeding unlocked notification
2. Go to Breeding Screen → Browse eligible partners
3. Select partner → Confirm breeding
4. Egg appears → Walk to hatch (separate step counter)
5. Egg hatches → New pet with inherited stats/elements

### Flow 5: Battle
1. Go to Battle Screen → Tap "Find Match"
2. Matchmaking finds opponent → Battle Preview
3. Accept battle → Battle Arena Screen
4. Auto-battle plays turn by turn
5. Winner: Victory video plays → XP/rewards
6. Loser: Defeat video plays → Consolation XP

### Flow 6: Guild Competition
1. Join or create guild → Guild Screen
2. Walk during competition week → Steps contribute
3. Guild battles auto-scheduled → Battle Arena
4. End of week → Rankings revealed
5. Top guilds get rewards → Distributed to members

---

## Color Choices

### Primary Palette
- **Primary**: `#6366F1` (Indigo) - Main accent, buttons, highlights
- **Secondary**: `#8B5CF6` (Purple) - Secondary actions, gradients
- **Success**: `#22C55E` (Green) - Health, positive stats, victories
- **Warning**: `#F59E0B` (Amber) - Hunger meter, caution states
- **Error**: `#EF4444` (Red) - Low health, defeats, critical alerts

### Element Colors
- **Fire**: `#F97316` (Orange) - Fire element pets
- **Water**: `#3B82F6` (Blue) - Water element pets
- **Earth**: `#84CC16` (Lime) - Earth element pets
- **Air**: `#06B6D4` (Cyan) - Air element pets

### UI Colors
- **Background Light**: `#FAFAFA` - Main background
- **Background Dark**: `#0F0F0F` - Dark mode background
- **Surface Light**: `#FFFFFF` - Cards, elevated surfaces
- **Surface Dark**: `#1A1A1A` - Dark mode surfaces
- **Muted Light**: `#71717A` - Secondary text
- **Muted Dark**: `#A1A1AA` - Dark mode secondary text

---

## Component Specifications

### Pet Card (Home Screen)
- Full-width card with rounded corners (16px)
- Pet image: 280x280px centered
- Stats displayed as horizontal progress bars
- Care meters as circular gauges below image

### Battle Card
- Horizontal layout: Your pet vs Opponent pet
- Pet images: 120x120px each
- Health bars above each pet
- Turn indicator in center

### Step Counter Widget
- Large circular progress indicator
- Step count in center (bold, 48px)
- Goal text below (muted, 14px)
- Animated fill on step updates

### Guild Member Row
- Avatar (40x40), Name, Weekly Steps, Rank badge
- Tap to view member's pet

---

## Navigation Structure

```
Tab Bar (5 tabs)
├── Home (house icon)
│   ├── Pet View
│   ├── Evolution Modal
│   └── Breeding Modal
├── Steps (footprints icon)
│   └── Step Dashboard
├── Battle (swords icon)
│   ├── Matchmaking
│   └── Battle Arena
├── Guild (users icon)
│   ├── Guild Home
│   ├── Competition
│   └── Guild Search
└── Profile (person icon)
    ├── Stats
    ├── Subscription
    └── Settings
```

---

## Responsive Considerations

- **Portrait only** - Optimized for one-handed use
- **Safe areas** - Respect notch and home indicator
- **Touch targets** - Minimum 44x44pt for all interactive elements
- **Bottom sheet modals** - For secondary actions (evolution, breeding)
- **Pull to refresh** - On Steps and Guild screens

---

## Animation Guidelines

- **Pet idle**: Subtle breathing/floating animation
- **Level up**: Particle burst + scale bounce
- **Evolution**: Morph transition with glow effect
- **Battle hits**: Shake + flash on damage
- **Victory/Defeat**: Full-screen video overlay
