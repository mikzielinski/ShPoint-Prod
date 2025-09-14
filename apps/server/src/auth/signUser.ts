// apps/server/src/auth/signUser.ts
import type { FastifyInstance, FastifyReply } from "fastify";
import type { User } from "@prisma/client";

/**
 * JWT payload trzymany w ciasteczku `token` (fastify-jwt czyta je wg index.ts).
 */
export type JwtUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: "USER" | "EDITOR" | "ADMIN";
};

/**
 * Prosty parser "7d" | "24h" | "3600" -> sekundy.
 */
function parseDurationToSeconds(v: string | undefined, fallbackSeconds: number): number {
  if (!v) return fallbackSeconds;
  const raw = v.trim();
  const num = Number(raw);
  if (!Number.isNaN(num)) return Math.max(0, Math.floor(num)); // podano sekundy

  const m = /^(\d+)\s*(s|m|h|d)$/i.exec(raw);
  if (!m) return fallbackSeconds;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return n * mult;
}

/**
 * Podpisuje token JWT zawierający także `role`.
 * Używa fastify-jwt skonfigurowanego w index.ts (sekret + cookieName=token).
 */
export function signUser(app: FastifyInstance, user: User): string {
  const payload: JwtUser = {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role as "USER" | "ADMIN",
  };

  const expiresIn = process.env.JWT_EXPIRES_IN || "7d"; // np. "7d" | "24h" | "3600"
  return app.jwt.sign(payload, { expiresIn });
}

/**
 * Ustawia httpOnly cookie `token` z JWT. Zgodne z konfiguracją fastify-jwt (cookieName: 'token').
 */
export function setAuthCookie(reply: FastifyReply, token: string): void {
  const secure = process.env.NODE_ENV === "production";
  // Domyślnie maxAge zgodny z 7 dniami (jak expiresIn).
  const defaultMaxAge = 7 * 24 * 3600;
  const maxAge = parseDurationToSeconds(process.env.JWT_COOKIE_MAX_AGE, defaultMaxAge);

  reply.setCookie("token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge, // sekundy
  });
}

/**
 * Czyści cookie sesyjne.
 */
export function clearAuthCookie(reply: FastifyReply): void {
  reply.clearCookie("token", { path: "/" });
}

/**
 * Wygodny helper do logowania: podpisuje użytkownika i od razu ustawia cookie.
 */
export function signInAndSetCookie(app: FastifyInstance, reply: FastifyReply, user: User): string {
  const token = signUser(app, user);
  setAuthCookie(reply, token);
  return token;
}
