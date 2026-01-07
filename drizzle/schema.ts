import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  // Step tracking
  totalSteps: int("totalSteps").default(0).notNull(),
  dailyStepGoal: int("dailyStepGoal").default(5000).notNull(),
  weeklyStepGoal: int("weeklyStepGoal").default(35000).notNull(),
  // Tutorial state
  tutorialCompleted: boolean("tutorialCompleted").default(false).notNull(),
  // Subscription
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "tier1", "tier2", "tier3"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  // AI tokens
  aiTokens: int("aiTokens").default(0).notNull(),
  // Guild
  guildId: int("guildId"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pets table - stores all pet data
 */
export const pets = mysqlTable("pets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  // Elements (can have 1 or 2 from breeding)
  primaryElement: mysqlEnum("primaryElement", ["fire", "water", "earth", "air"]).notNull(),
  secondaryElement: mysqlEnum("secondaryElement", ["fire", "water", "earth", "air"]),
  // Level and XP
  level: int("level").default(1).notNull(),
  experience: int("experience").default(0).notNull(),
  // Stats
  attack: int("attack").default(10).notNull(),
  defense: int("defense").default(10).notNull(),
  health: int("health").default(100).notNull(),
  maxHealth: int("maxHealth").default(100).notNull(),
  critRate: float("critRate").default(0.05).notNull(),
  // Care meters (0-100)
  happiness: int("happiness").default(100).notNull(),
  hunger: int("hunger").default(100).notNull(),
  thirst: int("thirst").default(100).notNull(),
  // Last care times
  lastFed: timestamp("lastFed").defaultNow().notNull(),
  lastWatered: timestamp("lastWatered").defaultNow().notNull(),
  lastPlayed: timestamp("lastPlayed").defaultNow().notNull(),
  // Evolution
  evolutionStage: int("evolutionStage").default(0).notNull(), // 0-4 (evolves at 20,40,60,80)
  // Images and media
  imageUrl: text("imageUrl"),
  image3dUrl: text("image3dUrl"),
  victoryVideoUrl: text("victoryVideoUrl"),
  defeatVideoUrl: text("defeatVideoUrl"),
  killingBlowVideoUrl: text("killingBlowVideoUrl"),
  // Breeding
  isEgg: boolean("isEgg").default(false).notNull(),
  eggStepsRequired: int("eggStepsRequired").default(0),
  eggStepsProgress: int("eggStepsProgress").default(0),
  parentMomId: int("parentMomId"),
  parentDadId: int("parentDadId"),
  // Lineage tracking
  generation: int("generation").default(1).notNull(), // 1 = first gen, increments with breeding
  lineageJson: json("lineageJson"), // Full ancestry tree for quick access
  // Template or AI generated
  isTemplate: boolean("isTemplate").default(true).notNull(),
  templateType: varchar("templateType", { length: 50 }), // fire_dragon, water_serpent, etc.
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isRetired: boolean("isRetired").default(false).notNull(),
  retiredAt: timestamp("retiredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

/**
 * Battles table - stores battle history
 */
export const battles = mysqlTable("battles", {
  id: int("id").autoincrement().primaryKey(),
  // Participants
  challengerId: int("challengerId").notNull(), // user id
  challengerPetId: int("challengerPetId").notNull(),
  defenderId: int("defenderId").notNull(), // user id
  defenderPetId: int("defenderPetId").notNull(),
  // Result
  winnerId: int("winnerId"), // user id of winner
  winnerPetId: int("winnerPetId"),
  // Battle log (JSON array of turns)
  battleLog: json("battleLog"),
  // Type
  battleType: mysqlEnum("battleType", ["ranked", "guild", "friendly"]).default("ranked").notNull(),
  guildBattleId: int("guildBattleId"), // if part of guild competition
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});

export type Battle = typeof battles.$inferSelect;
export type InsertBattle = typeof battles.$inferInsert;

/**
 * Guilds table - walking groups
 */
export const guilds = mysqlTable("guilds", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  leaderId: int("leaderId").notNull(), // user id of guild leader
  // Stats
  totalSteps: int("totalSteps").default(0).notNull(),
  weeklySteps: int("weeklySteps").default(0).notNull(),
  memberCount: int("memberCount").default(1).notNull(),
  // Competition
  competitionPoints: int("competitionPoints").default(0).notNull(),
  competitionRank: int("competitionRank"),
  // Settings
  isPublic: boolean("isPublic").default(true).notNull(),
  maxMembers: int("maxMembers").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = typeof guilds.$inferInsert;

/**
 * Guild members - tracks membership and contributions
 */
export const guildMembers = mysqlTable("guildMembers", {
  id: int("id").autoincrement().primaryKey(),
  guildId: int("guildId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["leader", "officer", "member"]).default("member").notNull(),
  weeklySteps: int("weeklySteps").default(0).notNull(),
  totalContributedSteps: int("totalContributedSteps").default(0).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GuildMember = typeof guildMembers.$inferSelect;
export type InsertGuildMember = typeof guildMembers.$inferInsert;

/**
 * Guild competitions - bi-weekly events
 */
export const guildCompetitions = mysqlTable("guildCompetitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  status: mysqlEnum("status", ["upcoming", "active", "completed"]).default("upcoming").notNull(),
  // Results stored as JSON: [{guildId, steps, battlePoints, rank}]
  results: json("results"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GuildCompetition = typeof guildCompetitions.$inferSelect;
export type InsertGuildCompetition = typeof guildCompetitions.$inferInsert;

/**
 * Breeding requests - for finding breeding partners
 */
export const breedingRequests = mysqlTable("breedingRequests", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(), // user id
  requesterPetId: int("requesterPetId").notNull(),
  // If accepted
  partnerId: int("partnerId"), // user id
  partnerPetId: int("partnerPetId"),
  // Status
  status: mysqlEnum("status", ["open", "pending", "accepted", "completed", "cancelled"]).default("open").notNull(),
  // Result
  offspringPetId: int("offspringPetId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BreedingRequest = typeof breedingRequests.$inferSelect;
export type InsertBreedingRequest = typeof breedingRequests.$inferInsert;

/**
 * Step logs - daily step tracking
 */
export const stepLogs = mysqlTable("stepLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  steps: int("steps").default(0).notNull(),
  source: mysqlEnum("source", ["healthkit", "googlefit", "manual"]).default("manual").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StepLog = typeof stepLogs.$inferSelect;
export type InsertStepLog = typeof stepLogs.$inferInsert;

/**
 * AI generation logs - track token usage
 */
export const aiGenerationLogs = mysqlTable("aiGenerationLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  petId: int("petId"),
  generationType: mysqlEnum("generationType", ["text_to_image", "image_to_image", "image_to_video", "image_to_3d"]).notNull(),
  prompt: text("prompt"),
  inputImageUrl: text("inputImageUrl"),
  outputUrl: text("outputUrl"),
  tokensUsed: int("tokensUsed").default(1).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiGenerationLog = typeof aiGenerationLogs.$inferSelect;
export type InsertAiGenerationLog = typeof aiGenerationLogs.$inferInsert;

/**
 * Consumables - items earned from walking
 */
export const consumables = mysqlTable("consumables", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["food", "water", "toy", "treat"]).notNull(),
  quantity: int("quantity").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consumable = typeof consumables.$inferSelect;
export type InsertConsumable = typeof consumables.$inferInsert;

/**
 * Daily battle tracking
 */
export const dailyBattles = mysqlTable("dailyBattles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: timestamp("date").notNull(),
  battlesUsed: int("battlesUsed").default(0).notNull(),
  maxBattles: int("maxBattles").default(3).notNull(),
});

export type DailyBattle = typeof dailyBattles.$inferSelect;
export type InsertDailyBattle = typeof dailyBattles.$inferInsert;
