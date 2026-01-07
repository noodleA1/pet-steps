import { describe, it, expect } from "vitest";
import {
  getXpForLevel,
  getTotalXpForLevel,
  ELEMENT_EFFECTIVENESS,
  getCareModifiers,
  EVOLUTION_LEVELS,
  RETIREMENT_LEVEL,
  BREEDING_LEVEL,
  EGG_HATCH_STEPS,
  SUBSCRIPTION_TIERS,
  AI_TOKEN_COSTS,
  TEMPLATE_PETS,
  type ElementType,
} from "../shared/game-types";

describe("XP Calculation", () => {
  it("should calculate XP required for level 1->2", () => {
    const xp = getXpForLevel(1);
    expect(xp).toBe(5000); // Base XP for level 1->2
  });

  it("should increase XP requirements exponentially", () => {
    const xpLevel2 = getXpForLevel(2);
    const xpLevel10 = getXpForLevel(10);
    const xpLevel50 = getXpForLevel(50);
    
    expect(xpLevel10).toBeGreaterThan(xpLevel2);
    expect(xpLevel50).toBeGreaterThan(xpLevel10);
  });

  it("should calculate total XP for reaching a level", () => {
    const totalXpLevel1 = getTotalXpForLevel(1);
    const totalXpLevel5 = getTotalXpForLevel(5);
    
    expect(totalXpLevel1).toBe(0);
    expect(totalXpLevel5).toBeGreaterThan(0);
  });
});

describe("Element System", () => {
  it("should have fire weak against water", () => {
    expect(ELEMENT_EFFECTIVENESS.fire.water).toBe(0.5);
  });

  it("should have water weak against earth", () => {
    expect(ELEMENT_EFFECTIVENESS.water.earth).toBe(0.5);
  });

  it("should have earth weak against fire and air", () => {
    expect(ELEMENT_EFFECTIVENESS.earth.fire).toBe(0.5);
    expect(ELEMENT_EFFECTIVENESS.earth.air).toBe(0.5);
  });

  it("should have fire strong against earth", () => {
    expect(ELEMENT_EFFECTIVENESS.fire.earth).toBe(1.5);
  });

  it("should have water strong against fire", () => {
    expect(ELEMENT_EFFECTIVENESS.water.fire).toBe(1.5);
  });

  it("should have all four elements defined", () => {
    const elements: ElementType[] = ["fire", "water", "earth", "air"];
    elements.forEach(element => {
      expect(ELEMENT_EFFECTIVENESS[element]).toBeDefined();
    });
  });
});

describe("Care Modifiers", () => {
  it("should return max modifiers at 100% care levels", () => {
    const { attackMod, defenseMod, critMod } = getCareModifiers(100, 100, 100);
    
    expect(attackMod).toBe(1.5); // 0.5 + (100/100)
    expect(defenseMod).toBe(1.0); // 0.5 + (100/200)
    expect(critMod).toBe(0.1); // 100/1000
  });

  it("should return min modifiers at 0% care levels", () => {
    const { attackMod, defenseMod, critMod } = getCareModifiers(0, 0, 0);
    
    expect(attackMod).toBe(0.5);
    expect(defenseMod).toBe(0.5);
    expect(critMod).toBe(0);
  });

  it("should return mid modifiers at 50% care levels", () => {
    const { attackMod, defenseMod, critMod } = getCareModifiers(50, 50, 50);
    
    expect(attackMod).toBe(1.0); // 0.5 + (50/100)
    expect(defenseMod).toBe(0.75); // 0.5 + (50/200)
    expect(critMod).toBe(0.05); // 50/1000
  });
});

describe("Game Constants", () => {
  it("should have correct evolution levels", () => {
    expect(EVOLUTION_LEVELS).toEqual([20, 40, 60, 80]);
  });

  it("should have retirement at level 100", () => {
    expect(RETIREMENT_LEVEL).toBe(100);
  });

  it("should have breeding available at level 90", () => {
    expect(BREEDING_LEVEL).toBe(90);
  });

  it("should require steps to hatch egg", () => {
    expect(EGG_HATCH_STEPS).toBeGreaterThan(0);
  });
});

describe("Subscription Tiers", () => {
  it("should have free tier with no AI generation", () => {
    expect(SUBSCRIPTION_TIERS.free.canGenerateAI).toBe(false);
    expect(SUBSCRIPTION_TIERS.free.price).toBe(0);
    expect(SUBSCRIPTION_TIERS.free.aiTokensPerMonth).toBe(0);
  });

  it("should have tier1 with AI generation", () => {
    expect(SUBSCRIPTION_TIERS.tier1.canGenerateAI).toBe(true);
    expect(SUBSCRIPTION_TIERS.tier1.price).toBe(2);
    expect(SUBSCRIPTION_TIERS.tier1.aiTokensPerMonth).toBe(10);
  });

  it("should have tier2 with more tokens", () => {
    expect(SUBSCRIPTION_TIERS.tier2.canGenerateAI).toBe(true);
    expect(SUBSCRIPTION_TIERS.tier2.aiTokensPerMonth).toBeGreaterThan(SUBSCRIPTION_TIERS.tier1.aiTokensPerMonth);
  });

  it("should have tier3 with 3D generation", () => {
    expect(SUBSCRIPTION_TIERS.tier3.can3DGenerate).toBe(true);
    expect(SUBSCRIPTION_TIERS.tier3.aiTokensPerMonth).toBeGreaterThan(SUBSCRIPTION_TIERS.tier2.aiTokensPerMonth);
  });
});

describe("AI Token Costs", () => {
  it("should have correct costs for different generation types", () => {
    expect(AI_TOKEN_COSTS.text_to_image).toBe(1);
    expect(AI_TOKEN_COSTS.image_to_image).toBe(1);
    expect(AI_TOKEN_COSTS.image_to_video).toBe(3);
    expect(AI_TOKEN_COSTS.image_to_3d).toBe(10);
  });
});

describe("Template Pets", () => {
  it("should have templates for all four elements", () => {
    expect(TEMPLATE_PETS.fire).toBeDefined();
    expect(TEMPLATE_PETS.water).toBeDefined();
    expect(TEMPLATE_PETS.earth).toBeDefined();
    expect(TEMPLATE_PETS.air).toBeDefined();
  });

  it("should have at least one template per element", () => {
    expect(TEMPLATE_PETS.fire.length).toBeGreaterThan(0);
    expect(TEMPLATE_PETS.water.length).toBeGreaterThan(0);
    expect(TEMPLATE_PETS.earth.length).toBeGreaterThan(0);
    expect(TEMPLATE_PETS.air.length).toBeGreaterThan(0);
  });

  it("should have name and templateType for each template", () => {
    const fireTemplate = TEMPLATE_PETS.fire[0];
    expect(fireTemplate.name).toBeDefined();
    expect(fireTemplate.templateType).toBeDefined();
  });
});
