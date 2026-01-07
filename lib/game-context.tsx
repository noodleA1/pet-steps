import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ElementType, TEMPLATE_PETS, getXpForLevel, EVOLUTION_LEVELS, RETIREMENT_LEVEL, BREEDING_LEVEL } from "@/shared/game-types";
import {
  checkPetCareNotifications,
  scheduleBattleEnergyAlerts,
  scheduleDailyGoalAlert,
  cancelPetCareNotifications,
  cancelBattleEnergyNotifications,
} from "@/lib/notification-manager";

// Types
export interface Pet {
  id: string;
  name: string;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  level: number;
  experience: number;
  attack: number;
  defense: number;
  health: number;
  maxHealth: number;
  critRate: number;
  happiness: number;
  hunger: number;
  thirst: number;
  lastFed: number;
  lastWatered: number;
  lastPlayed: number;
  evolutionStage: number;
  imageUrl?: string;
  image3dUrl?: string;
  victoryVideoUrl?: string;
  defeatVideoUrl?: string;
  killingBlowVideoUrl?: string;
  isEgg: boolean;
  eggStepsRequired: number;
  eggStepsProgress: number;
  parentMomId?: string;
  parentDadId?: string;
  generation: number;
  isTemplate: boolean;
  templateType?: string;
  isActive: boolean;
  isRetired: boolean;
  retiredAt?: number;
  createdAt: number;
}

export interface Egg {
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  generation: number;
  parentMomId: string;
  parentDadId: string;
  inheritedStats: {
    attack: number;
    defense: number;
    health: number;
  };
  // Tracked parent elements for free tier upgrade path
  trackedParentElements?: {
    mom: ElementType;
    dad: ElementType;
  };
}

export interface GameState {
  // User state
  tutorialCompleted: boolean;
  tutorialSteps: number;
  subscriptionTier: "free" | "tier1" | "tier2" | "tier3";
  aiTokens: number;
  totalSteps: number;
  todaySteps: number;
  dailyStepGoal: number;
  weeklyStepGoal: number;
  
  // Pet state
  activePet: Pet | null;
  retiredPets: Pet[];
  
  // Egg state
  egg: Egg | null;
  stepsToHatch: number;
  
  // Consumables
  consumables: {
    food: number;
    water: number;
    toy: number;
    treat: number;
    energy_boost: number;
  };
  
  // Battle state
  dailyBattlesUsed: number;
  lastBattleDate: string;
  battleEnergy: number;
  lastEnergyRecharge: number;
  
  // Goals and streaks
  dailyGoalMet: boolean;
  weeklyGoalMet: boolean;
  currentStreak: number;
  lastStreakDate: string;
  weeklyStepsProgress: number;
  
  // Guild state
  guildId?: string;
  
  // UI state
  showPaywall: boolean;
  showEvolution: boolean;
  showBreeding: boolean;
}

type GameAction =
  | { type: "SET_STATE"; payload: Partial<GameState> }
  | { type: "ADD_STEPS"; payload: number }
  | { type: "ADD_XP"; payload: number }
  | { type: "FEED_PET" }
  | { type: "WATER_PET" }
  | { type: "PLAY_WITH_PET" }
  | { type: "CREATE_PET"; payload: { element: ElementType; name: string; isTemplate: boolean; templateType?: string; imageUrl?: string } }
  | { type: "RETIRE_PET" }
  | { type: "EVOLVE_PET"; payload: { imageUrl?: string } }
  | { type: "COMPLETE_TUTORIAL" }
  | { type: "USE_BATTLE" }
  | { type: "ADD_CONSUMABLE"; payload: { type: "food" | "water" | "toy" | "treat" | "energy_boost"; amount: number } }
  | { type: "HATCH_EGG"; payload: { name: string; imageUrl?: string } }
  | { type: "BREED_PET"; payload: { partnerId: string; partnerElement: ElementType; partnerStats: { attack: number; defense: number; health: number } } }
  | { type: "UPDATE_CARE_LEVELS" }
  | { type: "USE_ENERGY" }
  | { type: "RECHARGE_ENERGY" }
  | { type: "CLAIM_DAILY_REWARD" }
  | { type: "CLAIM_WEEKLY_REWARD" }
  | { type: "CHECK_GOALS" };

const STORAGE_KEY = "petsteps_game_state";

const initialState: GameState = {
  tutorialCompleted: false,
  tutorialSteps: 0,
  subscriptionTier: "free",
  aiTokens: 0,
  totalSteps: 0,
  todaySteps: 0,
  dailyStepGoal: 5000,
  weeklyStepGoal: 35000,
  activePet: null,
  retiredPets: [],
  egg: null,
  stepsToHatch: 0,
  consumables: { food: 3, water: 3, toy: 1, treat: 0, energy_boost: 0 },
  dailyBattlesUsed: 0,
  lastBattleDate: "",
  battleEnergy: 5,
  lastEnergyRecharge: Date.now(),
  dailyGoalMet: false,
  weeklyGoalMet: false,
  currentStreak: 0,
  lastStreakDate: "",
  weeklyStepsProgress: 0,
  showPaywall: false,
  showEvolution: false,
  showBreeding: false,
};

function createTutorialPet(): Pet {
  return {
    id: "tutorial",
    name: "Tutorial Companion",
    primaryElement: "fire",
    level: 99,
    experience: 0,
    attack: 50,
    defense: 50,
    health: 100,
    maxHealth: 100,
    critRate: 0.1,
    happiness: 100,
    hunger: 100,
    thirst: 100,
    lastFed: Date.now(),
    lastWatered: Date.now(),
    lastPlayed: Date.now(),
    evolutionStage: 4,
    isEgg: false,
    eggStepsRequired: 0,
    eggStepsProgress: 0,
    generation: 1,
    isTemplate: true,
    templateType: "fire_phoenix",
    isActive: true,
    isRetired: false,
    createdAt: Date.now(),
  };
}

function createNewPet(element: ElementType, name: string, isTemplate: boolean, templateType?: string, imageUrl?: string): Pet {
  const baseStats = {
    fire: { attack: 15, defense: 8, health: 90 },
    water: { attack: 10, defense: 12, health: 100 },
    earth: { attack: 8, defense: 15, health: 110 },
    air: { attack: 12, defense: 10, health: 95 },
  };
  
  const stats = baseStats[element];
  const variance = () => Math.floor(Math.random() * 5) - 2;
  
  return {
    id: `pet_${Date.now()}`,
    name,
    primaryElement: element,
    level: 1,
    experience: 0,
    attack: stats.attack + variance(),
    defense: stats.defense + variance(),
    health: stats.health + variance(),
    maxHealth: stats.health + variance(),
    critRate: 0.05,
    happiness: 100,
    hunger: 100,
    thirst: 100,
    lastFed: Date.now(),
    lastWatered: Date.now(),
    lastPlayed: Date.now(),
    evolutionStage: 0,
    imageUrl,
    isEgg: false,
    eggStepsRequired: 0,
    eggStepsProgress: 0,
    generation: 1,
    isTemplate,
    templateType,
    isActive: true,
    isRetired: false,
    createdAt: Date.now(),
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_STATE":
      return { ...state, ...action.payload };
      
    case "ADD_STEPS": {
      const newTodaySteps = state.todaySteps + action.payload;
      const newTotalSteps = state.totalSteps + action.payload;
      
      // Handle tutorial
      if (!state.tutorialCompleted && state.activePet?.id === "tutorial") {
        const newTutorialSteps = state.tutorialSteps + action.payload;
        if (newTutorialSteps >= 10) {
          // Tutorial complete - retire tutorial pet and show paywall
          return {
            ...state,
            tutorialSteps: 10,
            todaySteps: newTodaySteps,
            totalSteps: newTotalSteps,
            activePet: state.activePet ? { ...state.activePet, level: 100, isRetired: true, retiredAt: Date.now() } : null,
            retiredPets: state.activePet ? [...state.retiredPets, { ...state.activePet, level: 100, isRetired: true, retiredAt: Date.now() }] : state.retiredPets,
            showPaywall: true,
          };
        }
        return { ...state, tutorialSteps: newTutorialSteps, todaySteps: newTodaySteps, totalSteps: newTotalSteps };
      }
      
      // Handle egg hatching
      if (state.activePet?.isEgg) {
        const newEggProgress = state.activePet.eggStepsProgress + action.payload;
        if (newEggProgress >= state.activePet.eggStepsRequired) {
          // Egg ready to hatch - will need user to name it
          return {
            ...state,
            todaySteps: newTodaySteps,
            totalSteps: newTotalSteps,
            activePet: { ...state.activePet, eggStepsProgress: state.activePet.eggStepsRequired },
          };
        }
        return {
          ...state,
          todaySteps: newTodaySteps,
          totalSteps: newTotalSteps,
          activePet: { ...state.activePet, eggStepsProgress: newEggProgress },
        };
      }
      
      return { ...state, todaySteps: newTodaySteps, totalSteps: newTotalSteps };
    }
    
    case "ADD_XP": {
      if (!state.activePet || state.activePet.isEgg || state.activePet.isRetired) return state;
      
      let newXp = state.activePet.experience + action.payload;
      let newLevel = state.activePet.level;
      let newEvolutionStage = state.activePet.evolutionStage;
      let showEvolution = false;
      let showBreeding = false;
      
      // Level up logic
      while (newLevel < RETIREMENT_LEVEL) {
        const xpNeeded = getXpForLevel(newLevel);
        if (newXp >= xpNeeded) {
          newXp -= xpNeeded;
          newLevel++;
          
          // Check for evolution
          const evolutionIndex = EVOLUTION_LEVELS.indexOf(newLevel as typeof EVOLUTION_LEVELS[number]);
          if (evolutionIndex !== -1 && newEvolutionStage < evolutionIndex + 1) {
            newEvolutionStage = evolutionIndex + 1;
            showEvolution = true;
          }
          
          // Check for breeding eligibility
          if (newLevel === BREEDING_LEVEL) {
            showBreeding = true;
          }
        } else {
          break;
        }
      }
      
      // Check for retirement
      if (newLevel >= RETIREMENT_LEVEL) {
        return {
          ...state,
          activePet: { ...state.activePet, level: RETIREMENT_LEVEL, experience: 0, isRetired: true, retiredAt: Date.now(), isActive: false },
          retiredPets: [...state.retiredPets, { ...state.activePet, level: RETIREMENT_LEVEL, experience: 0, isRetired: true, retiredAt: Date.now(), isActive: false }],
          showPaywall: true,
        };
      }
      
      return {
        ...state,
        activePet: { ...state.activePet, level: newLevel, experience: newXp, evolutionStage: newEvolutionStage },
        showEvolution,
        showBreeding: showBreeding || state.showBreeding,
      };
    }
    
    case "FEED_PET": {
      if (!state.activePet || state.consumables.food <= 0) return state;
      return {
        ...state,
        activePet: {
          ...state.activePet,
          hunger: Math.min(100, state.activePet.hunger + 30),
          lastFed: Date.now(),
        },
        consumables: { ...state.consumables, food: state.consumables.food - 1 },
      };
    }
    
    case "WATER_PET": {
      if (!state.activePet || state.consumables.water <= 0) return state;
      return {
        ...state,
        activePet: {
          ...state.activePet,
          thirst: Math.min(100, state.activePet.thirst + 30),
          lastWatered: Date.now(),
        },
        consumables: { ...state.consumables, water: state.consumables.water - 1 },
      };
    }
    
    case "PLAY_WITH_PET": {
      if (!state.activePet) return state;
      return {
        ...state,
        activePet: {
          ...state.activePet,
          happiness: Math.min(100, state.activePet.happiness + 20),
          lastPlayed: Date.now(),
        },
      };
    }
    
    case "CREATE_PET": {
      const newPet = createNewPet(
        action.payload.element,
        action.payload.name,
        action.payload.isTemplate,
        action.payload.templateType,
        action.payload.imageUrl
      );
      return {
        ...state,
        activePet: newPet,
        tutorialCompleted: true,
        showPaywall: false,
      };
    }
    
    case "RETIRE_PET": {
      if (!state.activePet) return state;
      return {
        ...state,
        activePet: null,
        retiredPets: [...state.retiredPets, { ...state.activePet, isRetired: true, retiredAt: Date.now(), isActive: false }],
        showPaywall: true,
      };
    }
    
    case "EVOLVE_PET": {
      if (!state.activePet) return state;
      const isFreeUser = state.subscriptionTier === "free";
      
      // Boost stats on evolution (ALL users get stat boost)
      const attackBoost = Math.floor(state.activePet.attack * 0.15);
      const defenseBoost = Math.floor(state.activePet.defense * 0.15);
      const healthBoost = Math.floor(state.activePet.maxHealth * 0.1);
      
      // FREE TIER: Only stat boost, NO visual evolution
      // Pet stays as base form even at level 99 (funny strong baby)
      // PAID TIER: Stat boost + visual evolution (new image)
      const newEvolutionStage = isFreeUser 
        ? state.activePet.evolutionStage // Stay at same visual stage
        : state.activePet.evolutionStage + 1; // Visual evolution
      
      return {
        ...state,
        activePet: {
          ...state.activePet,
          attack: state.activePet.attack + attackBoost,
          defense: state.activePet.defense + defenseBoost,
          maxHealth: state.activePet.maxHealth + healthBoost,
          health: state.activePet.maxHealth + healthBoost,
          evolutionStage: newEvolutionStage,
          // Free tier: keep original image, Paid tier: update to evolved image
          imageUrl: isFreeUser ? state.activePet.imageUrl : (action.payload.imageUrl || state.activePet.imageUrl),
        },
        showEvolution: false,
      };
    }
    
    case "COMPLETE_TUTORIAL":
      return { ...state, tutorialCompleted: true };
      
    case "USE_BATTLE": {
      const today = new Date().toDateString();
      const battlesUsed = state.lastBattleDate === today ? state.dailyBattlesUsed + 1 : 1;
      return {
        ...state,
        dailyBattlesUsed: battlesUsed,
        lastBattleDate: today,
      };
    }
    
    case "ADD_CONSUMABLE":
      return {
        ...state,
        consumables: {
          ...state.consumables,
          [action.payload.type]: state.consumables[action.payload.type] + action.payload.amount,
        },
      };
      
    case "HATCH_EGG": {
      if (!state.activePet?.isEgg) return state;
      return {
        ...state,
        activePet: {
          ...state.activePet,
          isEgg: false,
          name: action.payload.name,
          imageUrl: action.payload.imageUrl,
        },
      };
    }
    
    case "UPDATE_CARE_LEVELS": {
      if (!state.activePet || state.activePet.isEgg) return state;
      
      const now = Date.now();
      const hoursSinceLastFed = (now - state.activePet.lastFed) / (1000 * 60 * 60);
      const hoursSinceLastWatered = (now - state.activePet.lastWatered) / (1000 * 60 * 60);
      const hoursSinceLastPlayed = (now - state.activePet.lastPlayed) / (1000 * 60 * 60);
      
      const newHunger = Math.max(0, 100 - Math.floor(hoursSinceLastFed * 3));
      const newThirst = Math.max(0, 100 - Math.floor(hoursSinceLastWatered * 4));
      const newHappiness = Math.max(0, 100 - Math.floor(hoursSinceLastPlayed * 2));
      
      return {
        ...state,
        activePet: {
          ...state.activePet,
          hunger: newHunger,
          thirst: newThirst,
          happiness: newHappiness,
        },
      };
    }
    
    case "BREED_PET": {
      if (!state.activePet || state.activePet.level < BREEDING_LEVEL) return state;
      
      const mom = state.activePet;
      const { partnerId, partnerElement, partnerStats } = action.payload;
      const isFreeUser = state.subscriptionTier === "free";
      
      // Calculate inherited stats (20% from each parent)
      const inheritedAttack = Math.floor((mom.attack * 0.2) + (partnerStats.attack * 0.2));
      const inheritedDefense = Math.floor((mom.defense * 0.2) + (partnerStats.defense * 0.2));
      const inheritedHealth = Math.floor((mom.maxHealth * 0.2) + (partnerStats.health * 0.2));
      
      // Determine secondary element - FREE TIER: track parent elements but no battle benefits
      // Parents are always tracked for potential future paid upgrade
      const secondaryElement = partnerElement !== mom.primaryElement ? partnerElement : undefined;
      
      const newEgg: Egg = {
        primaryElement: mom.primaryElement,
        // Free tier: still track secondary element for lineage, but no battle bonuses
        // When user upgrades, they can regenerate pet with full elemental benefits
        secondaryElement: isFreeUser ? undefined : secondaryElement,
        generation: mom.generation + 1,
        parentMomId: mom.id,
        parentDadId: partnerId,
        inheritedStats: {
          attack: inheritedAttack,
          defense: inheritedDefense,
          health: inheritedHealth,
        },
        // Store parent elements for potential upgrade (free tier can upgrade later)
        trackedParentElements: {
          mom: mom.primaryElement,
          dad: partnerElement,
        },
      };
      
      // Retire the mother
      return {
        ...state,
        activePet: null,
        retiredPets: [...state.retiredPets, { ...mom, isRetired: true, retiredAt: Date.now(), isActive: false }],
        egg: newEgg,
        stepsToHatch: 5000, // EGG_HATCH_STEPS
      };
    }
    
    case "USE_ENERGY": {
      if (state.battleEnergy <= 0) return state;
      return {
        ...state,
        battleEnergy: state.battleEnergy - 1,
      };
    }
    
    case "RECHARGE_ENERGY": {
      const now = Date.now();
      const minutesSinceLastRecharge = (now - state.lastEnergyRecharge) / (1000 * 60);
      const energyToAdd = Math.floor(minutesSinceLastRecharge / 30); // 30 min per energy
      
      if (energyToAdd <= 0) return state;
      
      const newEnergy = Math.min(5, state.battleEnergy + energyToAdd);
      return {
        ...state,
        battleEnergy: newEnergy,
        lastEnergyRecharge: now,
      };
    }
    
    case "CHECK_GOALS": {
      const dailyMet = state.todaySteps >= state.dailyStepGoal;
      const weeklyMet = state.weeklyStepsProgress >= state.weeklyStepGoal;
      
      // Update streak
      const today = new Date().toDateString();
      let newStreak = state.currentStreak;
      if (dailyMet && state.lastStreakDate !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (state.lastStreakDate === yesterday) {
          newStreak = Math.min(7, state.currentStreak + 1);
        } else if (state.lastStreakDate !== today) {
          newStreak = 1;
        }
      }
      
      return {
        ...state,
        dailyGoalMet: dailyMet,
        weeklyGoalMet: weeklyMet,
        currentStreak: newStreak,
        lastStreakDate: dailyMet ? today : state.lastStreakDate,
      };
    }
    
    case "CLAIM_DAILY_REWARD": {
      if (!state.dailyGoalMet) return state;
      
      const streakMultiplier = 1 + (state.currentStreak * 0.1);
      const baseReward = 1;
      const reward = Math.floor(baseReward * streakMultiplier);
      
      return {
        ...state,
        consumables: {
          ...state.consumables,
          food: state.consumables.food + reward,
          water: state.consumables.water + reward,
          toy: state.consumables.toy + Math.floor(reward / 2),
        },
        battleEnergy: Math.min(5, state.battleEnergy + 1),
        dailyGoalMet: false, // Reset after claiming
      };
    }
    
    case "CLAIM_WEEKLY_REWARD": {
      if (!state.weeklyGoalMet) return state;
      
      return {
        ...state,
        consumables: {
          ...state.consumables,
          food: state.consumables.food + 5,
          water: state.consumables.water + 5,
          toy: state.consumables.toy + 3,
          treat: state.consumables.treat + 2,
          energy_boost: state.consumables.energy_boost + 1,
        },
        battleEnergy: 5, // Full refill
        weeklyGoalMet: false, // Reset after claiming
        weeklyStepsProgress: 0, // Reset weekly progress
      };
    }
    
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  startTutorial: () => void;
  addSteps: (steps: number) => void;
  feedPet: () => void;
  waterPet: () => void;
  playWithPet: () => void;
  createPet: (element: ElementType, name: string, isTemplate: boolean, templateType?: string, imageUrl?: string) => void;
  evolvePet: (imageUrl?: string) => void;
  canBattle: () => boolean;
  useBattle: () => void;
  breedPet: (partnerId: string, partnerElement: ElementType, partnerStats: { attack: number; defense: number; health: number }) => void;
  useEnergy: () => boolean;
  rechargeEnergy: () => void;
  checkGoals: () => void;
  claimDailyReward: () => void;
  claimWeeklyReward: () => void;
  getEnergyRechargeTime: () => number;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  // Load state from storage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          dispatch({ type: "SET_STATE", payload: parsed });
        }
      } catch (error) {
        console.error("Failed to load game state:", error);
      }
    };
    loadState();
  }, []);
  
  // Save state to storage on change
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save game state:", error);
      }
    };
    saveState();
  }, [state]);
  
  // Update care levels periodically and check for notifications
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "UPDATE_CARE_LEVELS" });
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);
  
  // Check pet care notifications when care levels change
  useEffect(() => {
    if (state.activePet && !state.activePet.isEgg && !state.activePet.isRetired) {
      checkPetCareNotifications({
        hunger: state.activePet.hunger,
        thirst: state.activePet.thirst,
        happiness: state.activePet.happiness,
        name: state.activePet.name,
      });
    }
  }, [state.activePet?.hunger, state.activePet?.thirst, state.activePet?.happiness]);
  
  // Schedule battle energy notifications
  useEffect(() => {
    scheduleBattleEnergyAlerts({
      currentEnergy: state.battleEnergy,
      maxEnergy: 5,
      lastRechargeTime: state.lastEnergyRecharge,
      rechargeMinutes: 30,
    });
  }, [state.battleEnergy]);
  
  // Schedule daily goal reminders
  useEffect(() => {
    scheduleDailyGoalAlert({
      currentSteps: state.todaySteps,
      goalSteps: state.dailyStepGoal,
    });
  }, [state.todaySteps, state.dailyStepGoal]);
  
  const startTutorial = () => {
    const tutorialPet = createTutorialPet();
    dispatch({ type: "SET_STATE", payload: { activePet: tutorialPet, tutorialSteps: 0 } });
  };
  
  const addSteps = (steps: number) => {
    dispatch({ type: "ADD_STEPS", payload: steps });
    // Convert steps to XP (1 step = 1 XP)
    if (state.activePet && !state.activePet.isEgg && !state.activePet.isRetired) {
      dispatch({ type: "ADD_XP", payload: steps });
    }
  };
  
  const feedPet = () => {
    dispatch({ type: "FEED_PET" });
    cancelPetCareNotifications(); // Cancel pending care notifications
  };
  const waterPet = () => {
    dispatch({ type: "WATER_PET" });
    cancelPetCareNotifications();
  };
  const playWithPet = () => {
    dispatch({ type: "PLAY_WITH_PET" });
    cancelPetCareNotifications();
  };
  
  const createPet = (element: ElementType, name: string, isTemplate: boolean, templateType?: string, imageUrl?: string) => {
    dispatch({ type: "CREATE_PET", payload: { element, name, isTemplate, templateType, imageUrl } });
  };
  
  const evolvePet = (imageUrl?: string) => {
    dispatch({ type: "EVOLVE_PET", payload: { imageUrl } });
  };
  
  const canBattle = () => {
    const today = new Date().toDateString();
    if (state.lastBattleDate !== today) return true;
    return state.dailyBattlesUsed < 3;
  };
  
  const useBattle = () => dispatch({ type: "USE_BATTLE" });
  
  const breedPet = (partnerId: string, partnerElement: ElementType, partnerStats: { attack: number; defense: number; health: number }) => {
    dispatch({ type: "BREED_PET", payload: { partnerId, partnerElement, partnerStats } });
  };
  
  const useEnergy = () => {
    if (state.battleEnergy <= 0) return false;
    dispatch({ type: "USE_ENERGY" });
    return true;
  };
  
  const rechargeEnergy = () => dispatch({ type: "RECHARGE_ENERGY" });
  const checkGoals = () => dispatch({ type: "CHECK_GOALS" });
  const claimDailyReward = () => dispatch({ type: "CLAIM_DAILY_REWARD" });
  const claimWeeklyReward = () => dispatch({ type: "CLAIM_WEEKLY_REWARD" });
  
  const getEnergyRechargeTime = () => {
    if (state.battleEnergy >= 5) return 0;
    const now = Date.now();
    const minutesSinceLastRecharge = (now - state.lastEnergyRecharge) / (1000 * 60);
    const minutesUntilNext = 30 - (minutesSinceLastRecharge % 30);
    return Math.ceil(minutesUntilNext);
  };
  
  // Periodically recharge energy and check goals
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: "RECHARGE_ENERGY" });
      dispatch({ type: "CHECK_GOALS" });
    }, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);
  
  return (
    <GameContext.Provider value={{
      state,
      dispatch,
      startTutorial,
      addSteps,
      feedPet,
      waterPet,
      playWithPet,
      createPet,
      evolvePet,
      canBattle,
      useBattle,
      breedPet,
      useEnergy,
      rechargeEnergy,
      checkGoals,
      claimDailyReward,
      claimWeeklyReward,
      getEnergyRechargeTime,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
