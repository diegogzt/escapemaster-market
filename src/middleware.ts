
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Middleware now simply passes through as admin has been extracted
  return next();
});
