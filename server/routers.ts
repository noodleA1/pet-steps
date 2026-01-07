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
});

export type AppRouter = typeof appRouter;
