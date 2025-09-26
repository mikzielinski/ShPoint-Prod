// apps/server/src/jwt.ts
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET || "fallback-secret-for-development";

export function signUser(payload: { id: string; email?: string | null; name?: string | null }) {
  return jwt.sign(payload, secret, { expiresIn: "7d" });
}

export function verifyToken<T = any>(token: string): T | null {
  try {
    return jwt.verify(token, secret) as T;
  } catch {
    return null;
  }
}