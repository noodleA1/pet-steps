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

// Template pets for free tier
export const TEMPLATE_PETS: Record<ElementType, Array<{ name: string; templateType: string }>> = {
  fire: [
    { name: "Ember Drake", templateType: "fire_drake" },
    { name: "Flame Fox", templateType: "fire_fox" },
    { name: "Blaze Phoenix", templateType: "fire_phoenix" },
  ],
  water: [
    { name: "Aqua Serpent", templateType: "water_serpent" },
    { name: "Tide Turtle", templateType: "water_turtle" },
    { name: "Storm Dolphin", templateType: "water_dolphin" },
  ],
  earth: [
    { name: "Stone Golem", templateType: "earth_golem" },
    { name: "Forest Bear", templateType: "earth_bear" },
    { name: "Crystal Rhino", templateType: "earth_rhino" },
  ],
  air: [
    { name: "Wind Eagle", templateType: "air_eagle" },
    { name: "Cloud Fairy", templateType: "air_fairy" },
    { name: "Storm Hawk", templateType: "air_hawk" },
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
