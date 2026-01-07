# Project TODO

## Core Setup
- [x] Configure theme colors for pet elements and UI
- [x] Set up tab navigation with 5 tabs (Home, Steps, Battle, Guild, Profile)
- [x] Add icon mappings for all tab icons

## Database & Backend
- [ ] Create pets table schema
- [ ] Create battles table schema
- [ ] Create guilds and guild_members tables
- [ ] Create subscriptions and tokens tables
- [ ] Create breeding_requests table
- [ ] Create battle_videos table
- [ ] Set up tRPC routers for all features
- [ ] Run database migrations

## Tutorial Flow
- [x] Welcome/onboarding screen
- [x] Tutorial pet screen (Level 99 template pet)
- [x] 10-step tutorial progression
- [x] Retirement celebration screen
- [x] Paywall screen (Free vs Premium tiers)

## Pet System
- [x] Pet display component with stats
- [x] Care meters (happiness, hunger, thirst)
- [x] Care actions (feed, water, play)
- [x] Pet stat degradation over time (Tamagotchi-style)
- [x] Level up system with RPG XP curve
- [x] Evolution system at levels 20/40/60/80
- [x] Retirement at level 100

## Step Tracking
- [x] Apple HealthKit integration (expo-sensors pedometer)
- [x] Google Fit integration (expo-sensors pedometer)
- [ ] Step counter display
- [ ] Daily/weekly step goals (dynamic based on user)
- [ ] XP conversion from steps
- [ ] Consumable rewards from walking milestones

## Breeding System
- [x] Breeding eligibility at level 90
- [x] Partner selection screen
- [x] Element mixing logic
- [x] Stat inheritance (20% mom + 20% dad)
- [x] Egg creation and step-based hatching
- [x] Pet lineage tracking (full ancestry tree)
- [x] Public lineage profiles (viewable by guild/opponents)
- [x] Generation counter for breeding depth
- [x] Lineage stats inheritance visualization

## Battle System
- [x] Matchmaking algorithm
- [x] Turn-based auto-battle logic
- [x] Battle arena UI
- [x] Daily battle limit (3/day)
- [x] Battle history
- [ ] Victory/defeat video playback

## Guild System
- [x] Guild creation and joining
- [x] Guild member list with rankings
- [x] Weekly step aggregation
- [x] Bi-weekly guild competitions
- [ ] Guild battle matchmaking
- [ ] Competition rewards distribution

## AI Generation (Premium Features)
- [x] Text-to-image pet generation
- [x] Image-to-image evolution
- [ ] Image-to-video (victory/defeat/killing blow)
- [ ] Image-to-3D model (Tier 3 only)
- [ ] Content moderation for generated images
- [x] Token consumption tracking

## Subscription & Monetization
- [x] Free tier (template pets only)
- [x] Tier 1 (~$2/mo): Basic AI generation on evolution
- [x] Tier 2: More regenerations, multiple video attempts
- [x] Tier 3: Virtually unlimited + 1 3D gen/month
- [x] Token balance display
- [x] Subscription management UI
## UI/UX Polish
- [x] Generate custom app icon
- [ ] Pet idle animations
- [ ] Level up animations
- [ ] Battle animations
- [x] Dark mode support
- [x] Haptic feedback on actions

## Profile & Settings
- [x] User stats display
- [x] Pet history/gallery
- [x] Subscription status
- [ ] Health app permissions
- [ ] Notification settings


## Content Moderation & Safety
- [x] Prompt length limit to prevent jailbreaking (200 chars)
- [x] Blocked keywords filter for inappropriate content
- [x] Vision-based image approval (check generated images)
- [x] Image-to-image validation (reject humans/explicit uploads)
- [x] Friendly error messages for rejected content
- [x] No token charge for failed/rejected attempts
- [x] AI prompt enhancement with auto-cleanup

## Generation Quality
- [x] Element-aware prompt seeding (fire traits, water traits, etc.)
- [x] Evolution maturity guidance (level-based features)
- [x] User suggestion enhancement via AI
- [x] Background removal for pet images
- [ ] Lineage-aware generation (inherit parent visual traits)
