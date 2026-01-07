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


## Visual Enhancements
- [x] Generate background images for main screens
- [x] Generate 4 template pet images (fire, water, earth, air)
- [ ] Apply backgrounds to improve visual appeal

## Safety Features
- [x] Add "Be aware of your surroundings" warning on step tracking
- [x] Show warning on app launch/resume (daily)

## Engagement Mechanics
- [x] Daily goal consumable rewards
- [x] Weekly goal consumable rewards
- [x] Battle energy system with recharge timer
- [x] Bonus battle energy rewards
- [x] Step milestone rewards (streak system)

## Free Tier Breeding
- [x] Free tier breeding without elemental benefits
- [x] Track parents for potential future paid upgrade
- [x] Allow paid upgrade to regenerate pet with elements

## Authentication
- [ ] Auth0 integration setup
- [ ] Apple OAuth login
- [ ] Google OAuth login
- [ ] Session persistence across app restarts


## Free Tier Evolution Restriction
- [x] Free tier gets stat boost only at evolution levels (no visual change)
- [x] Pet stays as base form even at level 99
- [x] Paid users get visual evolution + stat boost

## Green Screen Generation
- [x] Update AI prompts to use green screen (#00FF00) background
- [x] Update background removal to leverage green screen

## Template Pet Videos (ROADMAP - see docs/VIDEO_GENERATION_ROADMAP.md)
- [ ] Set up Replicate API integration
- [ ] Generate victory animations for 4 template pets
- [ ] Generate defeat animations for 4 template pets
- [ ] Generate killing blow animations for 4 template pets
- [ ] Implement video playback in battle screen

## GitHub Integration
- [x] Push project to new GitHub repository (https://github.com/noodleA1/pet-steps)


## Push Notifications
- [x] Set up expo-notifications infrastructure
- [x] Request notification permissions
- [x] Pet care reminders (hunger, thirst, happiness alerts)
- [x] Battle energy refill notifications
- [ ] Guild competition start/end announcements
- [x] Notification settings screen


## Guild Battle System
- [x] Separate guild battles from individual daily battles
- [x] Guild battle energy/cap (separate from daily battle energy)
- [x] Guild-vs-guild matchmaking (3-5 guilds per bracket)
- [x] Avoid repetition in guild matchmaking (cooldown system)
- [x] Guild leaderboard with individual contributions + guild totals
- [x] Battle points for guild competition (higher ranked = more points)
- [ ] Guild competition notifications (start/end/results)
