import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";
import { 
  generateSafePetImage, 
  sanitizePrompt, 
  validateUploadedImage,
  enhanceUserPrompt,
  buildEnhancedPrompt,
  MAX_PROMPT_LENGTH,
} from "./content-moderation";
import { processPetImage } from "./background-removal";

// Element type validation
const elementSchema = z.enum(["fire", "water", "earth", "air"]);

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Basic image generation (kept for backwards compatibility)
  generateImage: publicProcedure
    .input(z.object({
      prompt: z.string(),
      referenceImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateImage({
        prompt: input.prompt,
        originalImages: input.referenceImageUrl ? [{ url: input.referenceImageUrl }] : undefined,
      });
      return { url: result.url };
    }),

  // Safe pet image generation with full moderation pipeline
  generateSafePetImage: publicProcedure
    .input(z.object({
      userPrompt: z.string().max(MAX_PROMPT_LENGTH),
      element: elementSchema,
      evolutionLevel: z.number().min(1).max(100),
      secondaryElement: elementSchema.optional(),
      referenceImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateSafePetImage({
        userPrompt: input.userPrompt,
        element: input.element,
        evolutionLevel: input.evolutionLevel,
        secondaryElement: input.secondaryElement,
        referenceImageUrl: input.referenceImageUrl,
      });
      
      // If successful and we have an image, process it (remove background)
      if (result.success && result.imageUrl) {
        const processed = await processPetImage(result.imageUrl);
        return {
          ...result,
          imageUrl: processed.processedUrl || result.imageUrl,
          originalImageUrl: processed.originalUrl,
        };
      }
      
      return result;
    }),

  // Validate a prompt before generation (for real-time feedback)
  validatePrompt: publicProcedure
    .input(z.object({
      prompt: z.string(),
    }))
    .query(({ input }) => {
      return sanitizePrompt(input.prompt);
    }),

  // Validate an uploaded image before using it
  validateUploadedImage: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      return validateUploadedImage(input.imageUrl);
    }),

  // Enhance a user's prompt with AI
  enhancePrompt: publicProcedure
    .input(z.object({
      userSuggestion: z.string().max(MAX_PROMPT_LENGTH),
      element: elementSchema,
      evolutionLevel: z.number().min(1).max(100),
    }))
    .mutation(async ({ input }) => {
      return enhanceUserPrompt(
        input.userSuggestion,
        input.element,
        input.evolutionLevel
      );
    }),

  // Get a preview of the enhanced prompt (without AI enhancement)
  previewEnhancedPrompt: publicProcedure
    .input(z.object({
      userPrompt: z.string().max(MAX_PROMPT_LENGTH),
      element: elementSchema,
      evolutionLevel: z.number().min(1).max(100),
      secondaryElement: elementSchema.optional(),
    }))
    .query(({ input }) => {
      const sanitized = sanitizePrompt(input.userPrompt);
      if (!sanitized.valid) {
        return { 
          valid: false, 
          error: sanitized.error,
          preview: null 
        };
      }
      
      const enhanced = buildEnhancedPrompt(
        sanitized.sanitized || "",
        input.element,
        input.evolutionLevel,
        input.secondaryElement
      );
      
      return {
        valid: true,
        preview: enhanced,
        error: null
      };
    }),

  // Process an existing image (remove background)
  processImage: publicProcedure
    .input(z.object({
      imageUrl: z.string(),
    }))
    .mutation(async ({ input }) => {
      return processPetImage(input.imageUrl);
    }),

  // Generate pet image with equipped items
  generateEquippedPetImage: publicProcedure
    .input(z.object({
      petImageUrl: z.string(),
      element: elementSchema,
      equippedItems: z.object({
        collar: z.object({
          name: z.string(),
          rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
          element: elementSchema.optional(),
        }).optional(),
        armor: z.object({
          name: z.string(),
          rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
          element: elementSchema.optional(),
        }).optional(),
        wristlets: z.object({
          name: z.string(),
          rarity: z.enum(["common", "uncommon", "rare", "epic", "legendary"]),
          element: elementSchema.optional(),
        }).optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      // Build equipment description for the prompt
      const equipmentDescriptions: string[] = [];
      
      const rarityAdjectives: Record<string, string> = {
        common: "simple",
        uncommon: "well-crafted",
        rare: "ornate",
        epic: "magnificent glowing",
        legendary: "legendary radiant",
      };
      
      const elementColors: Record<string, string> = {
        fire: "fiery red and orange",
        water: "ocean blue and teal",
        earth: "earthy brown and green",
        air: "ethereal white and purple",
      };
      
      if (input.equippedItems.collar) {
        const adj = rarityAdjectives[input.equippedItems.collar.rarity];
        const color = input.equippedItems.collar.element 
          ? elementColors[input.equippedItems.collar.element] 
          : "golden";
        equipmentDescriptions.push(`wearing a ${adj} ${color} collar around its neck`);
      }
      
      if (input.equippedItems.armor) {
        const adj = rarityAdjectives[input.equippedItems.armor.rarity];
        const color = input.equippedItems.armor.element 
          ? elementColors[input.equippedItems.armor.element] 
          : "silver";
        equipmentDescriptions.push(`wearing ${adj} ${color} body armor`);
      }
      
      if (input.equippedItems.wristlets) {
        const adj = rarityAdjectives[input.equippedItems.wristlets.rarity];
        const color = input.equippedItems.wristlets.element 
          ? elementColors[input.equippedItems.wristlets.element] 
          : "bronze";
        equipmentDescriptions.push(`with ${adj} ${color} wristlets on its front legs`);
      }
      
      if (equipmentDescriptions.length === 0) {
        return { 
          success: false, 
          error: "No equipment to visualize",
          imageUrl: input.petImageUrl 
        };
      }
      
      const equipmentPrompt = equipmentDescriptions.join(", ");
      const fullPrompt = `A fantasy creature ${equipmentPrompt}, maintaining the exact same creature design and pose, on a solid bright green (#00FF00) background, digital art, high quality, detailed equipment`;
      
      try {
        const result = await generateImage({
          prompt: fullPrompt,
          originalImages: [{ url: input.petImageUrl }],
        });
        
        // Process to remove background
        const processed = result.url ? await processPetImage(result.url) : { processedUrl: null, originalUrl: null };
        
        return {
          success: true,
          imageUrl: processed.processedUrl || result.url,
          originalImageUrl: result.url,
          equipmentDescription: equipmentPrompt,
        };
      } catch (error) {
        console.error("Equipment visualization failed:", error);
        return {
          success: false,
          error: "Failed to generate equipped pet image",
          imageUrl: input.petImageUrl,
        };
      }
    }),
});

export type AppRouter = typeof appRouter;
