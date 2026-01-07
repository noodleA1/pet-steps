// Element types
export type ElementType = "fire" | "water" | "earth" | "air";

// Element effectiveness matrix (attacker -> defender -> multiplier)
export const ELEMENT_EFFECTIVENESS: Record<ElementType, Record<ElementType, number>> = {
  fire: { fire: 1, water: 0.5, earth: 1.5, air: 1 },
  water: { fire: 1.5, water: 1, earth: 0.5, air: 1 },
  earth: { fire: 0.5, water: 1.5, earth: 1, air: 0.5 },
  air: { fire: 1, water: 1, earth: 1.5, air: 1 },
};

// XP required for each level (RPG-style curve)
export function getXpForLevel(level: number): number {
  // Base XP starts at 5000 for level 1->2, increases exponentially
  const baseXp = 5000;
  const growthRate = 1.15;
  return Math.floor(baseXp * Math.pow(growthRate, level - 1));
}

// Get total XP needed to reach a level from level 1
export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXpForLevel(i);
  }
  return total;
}

// Evolution levels
export const EVOLUTION_LEVELS = [20, 40, 60, 80] as const;
export const BREEDING_LEVEL = 90;
export const RETIREMENT_LEVEL = 100;
export const EGG_HATCH_STEPS = 5000;
export const DAILY_BATTLE_LIMIT = 3;

// Battle energy system (Individual daily battles)
export const BATTLE_ENERGY = {
  maxEnergy: 5,
  rechargeTimeMinutes: 30, // 30 minutes per energy point
  bonusEnergyFromGoal: 2, // Bonus energy when hitting daily goal
} as const;

// Guild battle system (Separate from individual battles)
export const GUILD_BATTLE = {
  maxGuildEnergy: 3, // Guild battles per day during competition
  competitionDurationDays: 14, // Bi-weekly competitions
  guildsPerBracket: 5, // Number of guilds competing in each bracket
  pointsPerWin: 100, // Base points for winning a guild battle
  pointsPerLoss: 25, // Consolation points for participating
  rankBonusMultiplier: 0.2, // +20% points for beating higher ranked guild
  stepsPointsRatio: 10000, // 10,000 steps = 1 competition point
  matchmakingCooldown: 3, // Don't match same guild for 3 competitions
} as const;

// Guild competition bracket structure
export interface GuildBracket {
  id: string;
  competitionId: string;
  guilds: string[]; // Guild IDs in this bracket
  startDate: number;
  endDate: number;
}

// Guild battle result
export interface GuildBattleResult {
  id: string;
  competitionId: string;
  attackerGuildId: string;
  defenderGuildId: string;
  attackerMemberId: string;
  defenderMemberId: string;
  winnerId: string; // Member ID of winner
  winnerGuildId: string;
  pointsAwarded: number;
  timestamp: number;
}

// Guild competition leaderboard entry
export interface GuildLeaderboardEntry {
  guildId: string;
  guildName: string;
  totalSteps: number;
  stepsPoints: number;
  battleWins: number;
  battleLosses: number;
  battlePoints: number;
  totalPoints: number;
  rank: number;
  memberContributions: MemberContribution[];
}

// Individual member contribution to guild competition
export interface MemberContribution {
  memberId: string;
  memberName: string;
  steps: number;
  battleWins: number;
  battleLosses: number;
  pointsContributed: number;
}

// Daily/Weekly goals and rewards
export const STEP_GOALS = {
  dailyGoalBase: 5000, // Base daily goal (adjusted per user)
  weeklyGoalMultiplier: 5, // Weekly = daily * 5
  minDailyGoal: 3000,
  maxDailyGoal: 20000,
} as const;

// Consumable types
export type ConsumableType = "food" | "water" | "toy" | "treat" | "energy_boost";

export const CONSUMABLES = {
  food: {
    name: "Pet Food",
    effect: "hunger",
    amount: 30,
    icon: "fork.knife",
  },
  water: {
    name: "Fresh Water",
    effect: "thirst",
    amount: 30,
    icon: "drop.fill",
  },
  toy: {
    name: "Play Toy",
    effect: "happiness",
    amount: 20,
    icon: "gamecontroller.fill",
  },
  treat: {
    name: "Special Treat",
    effect: "all", // Restores all stats
    amount: 15,
    icon: "gift.fill",
  },
  energy_boost: {
    name: "Energy Boost",
    effect: "battle_energy",
    amount: 1,
    icon: "battery.100",
  },
} as const;

// Reward tiers for goals
export const GOAL_REWARDS = {
  daily: {
    consumables: ["food", "water", "toy"] as ConsumableType[],
    bonusEnergy: 1,
    xpBonus: 500,
  },
  weekly: {
    consumables: ["food", "water", "toy", "treat", "energy_boost"] as ConsumableType[],
    bonusEnergy: 3,
    xpBonus: 3000,
  },
  streak: {
    // Bonus for consecutive days
    multiplier: 0.1, // +10% rewards per day streak, max 7 days
    maxDays: 7,
  },
} as const;

// Subscription tiers
export type SubscriptionTier = "free" | "tier1" | "tier2" | "tier3";

export const SUBSCRIPTION_TIERS = {
  free: {
    name: "Free",
    price: 0,
    aiTokensPerMonth: 0,
    canGenerateAI: false,
    can3DGenerate: false,
    maxVideoAttempts: 0,
    maxImageRegens: 0,
  },
  tier1: {
    name: "Basic",
    price: 2,
    aiTokensPerMonth: 10,
    canGenerateAI: true,
    can3DGenerate: false,
    maxVideoAttempts: 1,
    maxImageRegens: 4, // On evolution only
  },
  tier2: {
    name: "Premium",
    price: 5,
    aiTokensPerMonth: 50,
    canGenerateAI: true,
    can3DGenerate: false,
    maxVideoAttempts: 3,
    maxImageRegens: 20,
  },
  tier3: {
    name: "Ultimate",
    price: 10,
    aiTokensPerMonth: 200,
    canGenerateAI: true,
    can3DGenerate: true,
    max3DGensPerMonth: 1,
    maxVideoAttempts: 10,
    maxImageRegens: 100,
  },
} as const;

// Token costs for AI operations
export const AI_TOKEN_COSTS = {
  text_to_image: 1,
  image_to_image: 1,
  image_to_video: 3,
  image_to_3d: 10,
} as const;

// Care degradation rates (per hour)
export const CARE_DEGRADATION = {
  happiness: 2, // -2 per hour
  hunger: 3, // -3 per hour
  thirst: 4, // -4 per hour
} as const;

// Stat modifiers based on care levels
export function getCareModifiers(happiness: number, hunger: number, thirst: number) {
  // Happiness affects attack (0-100 maps to 0.5-1.5 multiplier)
  const attackMod = 0.5 + (happiness / 100);
  // Hunger affects defense (0-100 maps to 0.5-1.0 multiplier)
  const defenseMod = 0.5 + (hunger / 200);
  // Thirst affects crit rate (0-100 maps to 0-0.1 bonus)
  const critMod = thirst / 1000;
  
  return { attackMod, defenseMod, critMod };
}

// Battle turn result
export interface BattleTurn {
  turn: number;
  attackerId: number;
  defenderId: number;
  damage: number;
  isCrit: boolean;
  attackerHealthAfter: number;
  defenderHealthAfter: number;
}

// Battle result
export interface BattleResult {
  winnerId: number;
  loserId: number;
  turns: BattleTurn[];
  totalDamageDealt: Record<number, number>;
}

// Template pet images (generated for free tier)
export const TEMPLATE_PET_IMAGES: Record<ElementType, string> = {
  fire: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/GcDnHLsYdzgyZFcR.png",
  water: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/HQiRFbuUNUoAVrXc.png",
  earth: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/ZpDkOliOzCsTJZCR.png",
  air: "https://files.manuscdn.com/user_upload_by_module/session_file/87407285/ZnOKNZXYLQMTCWnE.png",
};

// Template pets for free tier
export const TEMPLATE_PETS: Record<ElementType, Array<{ name: string; templateType: string; imageUrl: string }>> = {
  fire: [
    { name: "Ember Drake", templateType: "fire_drake", imageUrl: TEMPLATE_PET_IMAGES.fire },
  ],
  water: [
    { name: "Aqua Serpent", templateType: "water_serpent", imageUrl: TEMPLATE_PET_IMAGES.water },
  ],
  earth: [
    { name: "Stone Golem", templateType: "earth_golem", imageUrl: TEMPLATE_PET_IMAGES.earth },
  ],
  air: [
    { name: "Wind Spirit", templateType: "air_spirit", imageUrl: TEMPLATE_PET_IMAGES.air },
  ],
};

// Lineage node for ancestry tree
export interface LineageNode {
  petId: number;
  name: string;
  element: ElementType;
  secondaryElement?: ElementType;
  generation: number;
  imageUrl?: string;
  stats: {
    attack: number;
    defense: number;
    health: number;
  };
  parents?: {
    mom?: LineageNode;
    dad?: LineageNode;
  };
}

// Guild settings
export const GUILD_SETTINGS = {
  maxMembers: 50,
  competitionDurationDays: 14,
  minMembersForCompetition: 5,
} as const;

// Tutorial pet config
export const TUTORIAL_PET = {
  name: "Tutorial Companion",
  level: 99,
  stepsToRetirement: 10,
  element: "fire" as ElementType,
};

// ==================== EQUIPMENT SYSTEM ====================

// Equipment slot types
export type EquipmentSlot = "collar" | "armor" | "wristlets";

// Equipment rarity tiers
export type EquipmentRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

// Rarity configuration with stat ranges and drop rates
export const EQUIPMENT_RARITY: Record<EquipmentRarity, {
  name: string;
  color: string;
  statMultiplier: { min: number; max: number };
  dropRate: number; // Percentage chance (adds up to 100)
}> = {
  common: {
    name: "Common",
    color: "#9CA3AF", // Gray
    statMultiplier: { min: 1.0, max: 1.2 },
    dropRate: 50,
  },
  uncommon: {
    name: "Uncommon",
    color: "#22C55E", // Green
    statMultiplier: { min: 1.2, max: 1.5 },
    dropRate: 30,
  },
  rare: {
    name: "Rare",
    color: "#3B82F6", // Blue
    statMultiplier: { min: 1.5, max: 2.0 },
    dropRate: 13,
  },
  epic: {
    name: "Epic",
    color: "#A855F7", // Purple
    statMultiplier: { min: 2.0, max: 2.8 },
    dropRate: 5,
  },
  legendary: {
    name: "Legendary",
    color: "#F59E0B", // Gold/Orange
    statMultiplier: { min: 2.8, max: 4.0 },
    dropRate: 2,
  },
};

// Equipment slot configuration
export const EQUIPMENT_SLOTS: Record<EquipmentSlot, {
  name: string;
  stat: "health" | "attack" | "defense";
  baseStatRange: { min: number; max: number };
  icon: string;
  description: string;
}> = {
  collar: {
    name: "Collar",
    stat: "health",
    baseStatRange: { min: 50, max: 150 },
    icon: "circle.fill",
    description: "Increases maximum health",
  },
  armor: {
    name: "Armor",
    stat: "defense",
    baseStatRange: { min: 5, max: 20 },
    icon: "shield.fill",
    description: "Increases defense",
  },
  wristlets: {
    name: "Wristlets",
    stat: "attack",
    baseStatRange: { min: 5, max: 20 },
    icon: "bolt.fill",
    description: "Increases attack power",
  },
};

// Equipment interface
export interface Equipment {
  id: string;
  slot: EquipmentSlot;
  rarity: EquipmentRarity;
  name: string;
  statBonus: number;
  element?: ElementType; // Optional elemental affinity for bonus
  elementBonus?: number; // Extra bonus if pet matches element
  imageUrl?: string; // Generated image of the equipment
  createdAt: number;
}

// Generate procedural equipment name
export function generateEquipmentName(slot: EquipmentSlot, rarity: EquipmentRarity, element?: ElementType): string {
  const prefixes: Record<EquipmentRarity, string[]> = {
    common: ["Simple", "Basic", "Plain", "Worn"],
    uncommon: ["Sturdy", "Refined", "Quality", "Polished"],
    rare: ["Enchanted", "Mystic", "Arcane", "Blessed"],
    epic: ["Ancient", "Heroic", "Legendary", "Divine"],
    legendary: ["Mythical", "Godforged", "Celestial", "Primordial"],
  };
  
  const elementNames: Record<ElementType, string> = {
    fire: "Flame",
    water: "Tide",
    earth: "Stone",
    air: "Wind",
  };
  
  const slotNames: Record<EquipmentSlot, string[]> = {
    collar: ["Collar", "Necklace", "Choker", "Band"],
    armor: ["Armor", "Plate", "Guard", "Shell"],
    wristlets: ["Wristlets", "Bracers", "Cuffs", "Bands"],
  };
  
  const prefix = prefixes[rarity][Math.floor(Math.random() * prefixes[rarity].length)];
  const slotName = slotNames[slot][Math.floor(Math.random() * slotNames[slot].length)];
  
  if (element) {
    return `${prefix} ${elementNames[element]} ${slotName}`;
  }
  return `${prefix} ${slotName}`;
}

// Generate procedural equipment stats
export function generateEquipmentStats(slot: EquipmentSlot, rarity: EquipmentRarity): number {
  const slotConfig = EQUIPMENT_SLOTS[slot];
  const rarityConfig = EQUIPMENT_RARITY[rarity];
  
  // Base stat from slot range
  const baseMin = slotConfig.baseStatRange.min;
  const baseMax = slotConfig.baseStatRange.max;
  const baseStat = baseMin + Math.random() * (baseMax - baseMin);
  
  // Apply rarity multiplier
  const multiplierMin = rarityConfig.statMultiplier.min;
  const multiplierMax = rarityConfig.statMultiplier.max;
  const multiplier = multiplierMin + Math.random() * (multiplierMax - multiplierMin);
  
  return Math.floor(baseStat * multiplier);
}

// Roll for equipment rarity based on drop rates
export function rollEquipmentRarity(luckBonus: number = 0): EquipmentRarity {
  // Luck bonus shifts the roll towards higher rarities (0-50 range)
  const roll = Math.random() * 100 - Math.min(luckBonus, 50);
  
  let cumulative = 0;
  const rarities: EquipmentRarity[] = ["legendary", "epic", "rare", "uncommon", "common"];
  
  for (const rarity of rarities) {
    cumulative += EQUIPMENT_RARITY[rarity].dropRate;
    if (roll < cumulative) {
      return rarity;
    }
  }
  
  return "common";
}

// Generate a complete equipment item
export function generateEquipment(
  slot: EquipmentSlot,
  luckBonus: number = 0,
  forcedRarity?: EquipmentRarity,
  element?: ElementType
): Equipment {
  const rarity = forcedRarity || rollEquipmentRarity(luckBonus);
  const statBonus = generateEquipmentStats(slot, rarity);
  const name = generateEquipmentName(slot, rarity, element);
  
  // 30% chance for elemental affinity
  const hasElement = element || (Math.random() < 0.3);
  const equipElement = element || (hasElement ? (["fire", "water", "earth", "air"] as ElementType[])[Math.floor(Math.random() * 4)] : undefined);
  
  return {
    id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    slot,
    rarity,
    name,
    statBonus,
    element: equipElement,
    elementBonus: equipElement ? Math.floor(statBonus * 0.2) : undefined, // 20% bonus if element matches
    createdAt: Date.now(),
  };
}

// Competition reward tiers based on guild ranking
export const COMPETITION_REWARDS: Record<number, {
  equipmentSlots: EquipmentSlot[];
  guaranteedRarity?: EquipmentRarity;
  luckBonus: number;
  consumables: { type: ConsumableType; amount: number }[];
  aiTokens: number;
}> = {
  1: { // 1st place
    equipmentSlots: ["collar", "armor", "wristlets"],
    guaranteedRarity: "epic",
    luckBonus: 40,
    consumables: [
      { type: "treat", amount: 10 },
      { type: "energy_boost", amount: 5 },
    ],
    aiTokens: 20,
  },
  2: { // 2nd place
    equipmentSlots: ["collar", "armor"],
    guaranteedRarity: "rare",
    luckBonus: 30,
    consumables: [
      { type: "treat", amount: 5 },
      { type: "energy_boost", amount: 3 },
    ],
    aiTokens: 10,
  },
  3: { // 3rd place
    equipmentSlots: ["armor"],
    guaranteedRarity: "rare",
    luckBonus: 20,
    consumables: [
      { type: "treat", amount: 3 },
      { type: "energy_boost", amount: 2 },
    ],
    aiTokens: 5,
  },
  4: { // 4th place
    equipmentSlots: ["wristlets"],
    luckBonus: 10,
    consumables: [
      { type: "treat", amount: 2 },
      { type: "energy_boost", amount: 1 },
    ],
    aiTokens: 2,
  },
  5: { // 5th place
    equipmentSlots: ["collar"],
    luckBonus: 5,
    consumables: [
      { type: "treat", amount: 1 },
    ],
    aiTokens: 1,
  },
};
