import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const trustedOrigins = [
  "http://localhost:3000",

  process.env.BETTER_AUTH_URL,

  process.env.NEXT_PUBLIC_APP_URL,

  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined,
].filter(
  (origin): origin is string =>
    Boolean(origin)
);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  secret: process.env.BETTER_AUTH_SECRET!,

  trustedOrigins,
});