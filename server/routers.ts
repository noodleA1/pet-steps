import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { generateImage } from "./_core/imageGeneration";

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

  // Image generation for AI pets
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
});

export type AppRouter = typeof appRouter;
