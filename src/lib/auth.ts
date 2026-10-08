import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

const baseURL =
  process.env.BETTER_AUTH_URL ||
  "http://localhost:3000";

const trustedOrigins =
  process.env.NODE_ENV === "production"
    ? [baseURL]
    : ["http://localhost:3000"];

export const auth = betterAuth({
  baseURL,

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  secret: process.env.BETTER_AUTH_SECRET!,

  trustedOrigins,
});