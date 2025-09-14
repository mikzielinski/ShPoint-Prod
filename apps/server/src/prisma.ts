// apps/server/src/prisma.ts
import { PrismaClient } from "../generated/prisma";

const logLevels: ("query" | "error" | "warn" | "info")[] =
  process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

declare global {
  // eslint-disable-next-line no-var
  var __PRISMA__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__PRISMA__ ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__PRISMA__ = prisma;
}
