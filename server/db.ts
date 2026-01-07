import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ============ GAME-SPECIFIC IMPORTS ============
import { and, desc, sql, gte } from "drizzle-orm";
import {
  pets,
  battles,
  guilds,
  guildMembers,
  breedingRequests,
  stepLogs,
  aiGenerationLogs,
  consumables,
  dailyBattles,
  type Pet,
  type InsertPet,
  type Battle,
  type InsertBattle,
  type Guild,
  type InsertGuild,
  type GuildMember,
  type StepLog,
} from "../drizzle/schema";
import { getXpForLevel, CARE_DEGRADATION, type LineageNode, type ElementType } from "../shared/game-types";

// ============ USER OPERATIONS ============

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.id, userId));
  return result[0] || null;
}

export async function updateUserSteps(userId: number, steps: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    totalSteps: sql`${users.totalSteps} + ${steps}`,
  }).where(eq(users.id, userId));
}

export async function updateUserTutorialComplete(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ tutorialCompleted: true }).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, tier: "free" | "tier1" | "tier2" | "tier3", expiresAt?: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    subscriptionTier: tier,
    subscriptionExpiresAt: expiresAt,
  }).where(eq(users.id, userId));
}

export async function updateUserTokens(userId: number, tokens: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    aiTokens: sql`${users.aiTokens} + ${tokens}`,
  }).where(eq(users.id, userId));
}

// ============ PET OPERATIONS ============

export async function getActivePet(userId: number): Promise<Pet | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pets)
    .where(and(eq(pets.userId, userId), eq(pets.isActive, true), eq(pets.isRetired, false)))
    .limit(1);
  return result[0] || null;
}

export async function getPetById(petId: number): Promise<Pet | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pets).where(eq(pets.id, petId));
  return result[0] || null;
}

export async function getUserPets(userId: number): Promise<Pet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pets)
    .where(eq(pets.userId, userId))
    .orderBy(desc(pets.createdAt));
}

export async function getRetiredPets(userId: number): Promise<Pet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pets)
    .where(and(eq(pets.userId, userId), eq(pets.isRetired, true)))
    .orderBy(desc(pets.retiredAt));
}

export async function createPet(data: InsertPet): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pets).values(data);
  return Number(result[0].insertId);
}

export async function updatePet(petId: number, data: Partial<InsertPet>) {
  const db = await getDb();
  if (!db) return;
  await db.update(pets).set(data).where(eq(pets.id, petId));
}

export async function addPetExperience(petId: number, xp: number): Promise<{ leveledUp: boolean; newLevel: number }> {
  const db = await getDb();
  if (!db) return { leveledUp: false, newLevel: 0 };
  
  const pet = await getPetById(petId);
  if (!pet) return { leveledUp: false, newLevel: 0 };
  
  let newXp = pet.experience + xp;
  let newLevel = pet.level;
  let leveledUp = false;
  
  while (newLevel < 100) {
    const xpNeeded = getXpForLevel(newLevel);
    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel++;
      leveledUp = true;
    } else {
      break;
    }
  }
  
  await db.update(pets).set({
    experience: newXp,
    level: newLevel,
  }).where(eq(pets.id, petId));
  
  return { leveledUp, newLevel };
}

export async function retirePet(petId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(pets).set({
    isActive: false,
    isRetired: true,
    retiredAt: new Date(),
  }).where(eq(pets.id, petId));
}

export async function updatePetCare(petId: number, type: "happiness" | "hunger" | "thirst", amount: number) {
  const db = await getDb();
  if (!db) return;
  
  const field = type === "happiness" ? pets.happiness : type === "hunger" ? pets.hunger : pets.thirst;
  
  await db.update(pets).set({
    [type]: sql`LEAST(100, ${field} + ${amount})`,
    [type === "happiness" ? "lastPlayed" : type === "hunger" ? "lastFed" : "lastWatered"]: new Date(),
  }).where(eq(pets.id, petId));
}

export async function degradePetCare(petId: number) {
  const db = await getDb();
  if (!db) return;
  
  const pet = await getPetById(petId);
  if (!pet) return;
  
  const now = new Date();
  const hoursSinceLastFed = (now.getTime() - new Date(pet.lastFed).getTime()) / (1000 * 60 * 60);
  const hoursSinceLastWatered = (now.getTime() - new Date(pet.lastWatered).getTime()) / (1000 * 60 * 60);
  const hoursSinceLastPlayed = (now.getTime() - new Date(pet.lastPlayed).getTime()) / (1000 * 60 * 60);
  
  const newHunger = Math.max(0, 100 - Math.floor(hoursSinceLastFed * CARE_DEGRADATION.hunger));
  const newThirst = Math.max(0, 100 - Math.floor(hoursSinceLastWatered * CARE_DEGRADATION.thirst));
  const newHappiness = Math.max(0, 100 - Math.floor(hoursSinceLastPlayed * CARE_DEGRADATION.happiness));
  
  await db.update(pets).set({
    hunger: newHunger,
    thirst: newThirst,
    happiness: newHappiness,
  }).where(eq(pets.id, petId));
}

// ============ LINEAGE OPERATIONS ============

export async function getPetLineage(petId: number, depth: number = 3): Promise<LineageNode | null> {
  const pet = await getPetById(petId);
  if (!pet) return null;
  
  const node: LineageNode = {
    petId: pet.id,
    name: pet.name,
    element: pet.primaryElement as ElementType,
    secondaryElement: pet.secondaryElement as ElementType | undefined,
    generation: pet.generation,
    imageUrl: pet.imageUrl || undefined,
    stats: {
      attack: pet.attack,
      defense: pet.defense,
      health: pet.maxHealth,
    },
  };
  
  if (depth > 0 && (pet.parentMomId || pet.parentDadId)) {
    node.parents = {};
    if (pet.parentMomId) {
      node.parents.mom = await getPetLineage(pet.parentMomId, depth - 1) || undefined;
    }
    if (pet.parentDadId) {
      node.parents.dad = await getPetLineage(pet.parentDadId, depth - 1) || undefined;
    }
  }
  
  return node;
}

// ============ STEP LOG OPERATIONS ============

export async function logSteps(userId: number, steps: number, source: "healthkit" | "googlefit" | "manual" = "manual") {
  const db = await getDb();
  if (!db) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existing = await db.select().from(stepLogs)
    .where(and(eq(stepLogs.userId, userId), eq(stepLogs.date, today)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(stepLogs).set({
      steps: sql`${stepLogs.steps} + ${steps}`,
    }).where(eq(stepLogs.id, existing[0].id));
  } else {
    await db.insert(stepLogs).values({
      userId,
      date: today,
      steps,
      source,
    });
  }
}

export async function getStepHistory(userId: number, days: number = 7): Promise<StepLog[]> {
  const db = await getDb();
  if (!db) return [];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  return db.select().from(stepLogs)
    .where(and(eq(stepLogs.userId, userId), gte(stepLogs.date, startDate)))
    .orderBy(desc(stepLogs.date));
}

export async function getTodaySteps(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await db.select().from(stepLogs)
    .where(and(eq(stepLogs.userId, userId), eq(stepLogs.date, today)))
    .limit(1);
  
  return result[0]?.steps || 0;
}

// ============ BATTLE OPERATIONS ============

export async function createBattle(data: InsertBattle): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(battles).values(data);
  return Number(result[0].insertId);
}

export async function getBattleById(battleId: number): Promise<Battle | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(battles).where(eq(battles.id, battleId));
  return result[0] || null;
}

export async function getUserBattleHistory(userId: number, limit: number = 10): Promise<Battle[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(battles)
    .where(sql`${battles.challengerId} = ${userId} OR ${battles.defenderId} = ${userId}`)
    .orderBy(desc(battles.startedAt))
    .limit(limit);
}

export async function getDailyBattleCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await db.select().from(dailyBattles)
    .where(and(eq(dailyBattles.userId, userId), eq(dailyBattles.date, today)))
    .limit(1);
  
  return result[0]?.battlesUsed || 0;
}

export async function incrementDailyBattles(userId: number) {
  const db = await getDb();
  if (!db) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const existing = await db.select().from(dailyBattles)
    .where(and(eq(dailyBattles.userId, userId), eq(dailyBattles.date, today)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(dailyBattles).set({
      battlesUsed: sql`${dailyBattles.battlesUsed} + 1`,
    }).where(eq(dailyBattles.id, existing[0].id));
  } else {
    await db.insert(dailyBattles).values({
      userId,
      date: today,
      battlesUsed: 1,
    });
  }
}

// ============ GUILD OPERATIONS ============

export async function createGuild(data: InsertGuild): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(guilds).values(data);
  return Number(result[0].insertId);
}

export async function getGuildById(guildId: number): Promise<Guild | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(guilds).where(eq(guilds.id, guildId));
  return result[0] || null;
}

export async function getGuildMembers(guildId: number): Promise<GuildMember[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guildMembers)
    .where(eq(guildMembers.guildId, guildId))
    .orderBy(desc(guildMembers.weeklySteps));
}

export async function joinGuild(userId: number, guildId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(guildMembers).values({
    guildId,
    userId,
    role: "member",
  });
  
  await db.update(guilds).set({
    memberCount: sql`${guilds.memberCount} + 1`,
  }).where(eq(guilds.id, guildId));
  
  await db.update(users).set({ guildId }).where(eq(users.id, userId));
}

export async function leaveGuild(userId: number, guildId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, userId)));
  
  await db.update(guilds).set({
    memberCount: sql`${guilds.memberCount} - 1`,
  }).where(eq(guilds.id, guildId));
  
  await db.update(users).set({ guildId: null }).where(eq(users.id, userId));
}

export async function getPublicGuilds(limit: number = 20): Promise<Guild[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(guilds)
    .where(eq(guilds.isPublic, true))
    .orderBy(desc(guilds.memberCount))
    .limit(limit);
}

// ============ BREEDING OPERATIONS ============

export async function getEligibleBreedingPartners(userId: number): Promise<Pet[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(pets)
    .where(and(
      sql`${pets.userId} != ${userId}`,
      gte(pets.level, 90),
      eq(pets.isActive, true),
      eq(pets.isRetired, false),
      eq(pets.isEgg, false)
    ))
    .limit(50);
}

export async function createBreedingRequest(requesterId: number, requesterPetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(breedingRequests).values({
    requesterId,
    requesterPetId,
    status: "open",
  });
  return Number(result[0].insertId);
}

// ============ AI GENERATION LOGS ============

export async function logAiGeneration(
  userId: number,
  petId: number | null,
  type: "text_to_image" | "image_to_image" | "image_to_video" | "image_to_3d",
  prompt: string,
  tokensUsed: number
) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(aiGenerationLogs).values({
    userId,
    petId,
    generationType: type,
    prompt,
    tokensUsed,
    status: "pending",
  });
}

// ============ CONSUMABLES ============

export async function getUserConsumables(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(consumables).where(eq(consumables.userId, userId));
}

export async function addConsumable(userId: number, type: "food" | "water" | "toy" | "treat", quantity: number) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await db.select().from(consumables)
    .where(and(eq(consumables.userId, userId), eq(consumables.type, type)))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(consumables).set({
      quantity: sql`${consumables.quantity} + ${quantity}`,
    }).where(eq(consumables.id, existing[0].id));
  } else {
    await db.insert(consumables).values({
      userId,
      type,
      quantity,
    });
  }
}

export async function useConsumable(userId: number, type: "food" | "water" | "toy" | "treat"): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const existing = await db.select().from(consumables)
    .where(and(eq(consumables.userId, userId), eq(consumables.type, type), sql`${consumables.quantity} > 0`))
    .limit(1);
  
  if (existing.length === 0) return false;
  
  await db.update(consumables).set({
    quantity: sql`${consumables.quantity} - 1`,
  }).where(eq(consumables.id, existing[0].id));
  
  return true;
}
