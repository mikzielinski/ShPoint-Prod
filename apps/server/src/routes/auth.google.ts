// apps/server/src/routes/auth.google.ts
import type { FastifyPluginAsync } from "fastify";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { prisma } from "../prisma";
import { signInAndSetCookie } from "../auth/signUser";

const googleAuthRoutes: FastifyPluginAsync = async (app) => {
  const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5174";
  const PORT = Number(process.env.PORT ?? 3001);

  // Akceptujemy obie konwencje nazw zmiennych (GOOGLE_* i AUTH_GOOGLE_*)
  const GOOGLE_CLIENT_ID =
    process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "";
  const GOOGLE_CLIENT_SECRET =
    process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "";
  const GOOGLE_REDIRECT_URI =
    process.env.GOOGLE_REDIRECT_URI ||
    process.env.GOOGLE_CALLBACK_URL ||
    `http://localhost:${PORT}/auth/google/callback`;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    app.log.warn(
      "[auth.google] Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET (or AUTH_GOOGLE_ID/SECRET) in .env"
    );
  }

  const oauth = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  // GET /auth/google/start
  app.get("/google/start", async (req, reply) => {
    const state = crypto.randomBytes(16).toString("hex");
    const redirect = (req.query as any)?.redirect || "/login";

    reply.setCookie("g_state", state, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 5 * 60,
    });

    const statePayload = Buffer.from(
      JSON.stringify({ s: state, r: redirect }),
      "utf8"
    ).toString("base64url");

    const url = oauth.generateAuthUrl({
      access_type: "offline",
      scope: ["openid", "email", "profile"],
      prompt: "select_account",
      state: statePayload,
    });

    return reply.redirect(url);
  });

  // GET /auth/google/callback
  app.get("/google/callback", async (req, reply) => {
    try {
      const { code, state } = req.query as { code?: string; state?: string };
      if (!code || !state) {
        return reply.code(400).send({ error: "MISSING_CODE_OR_STATE" });
      }

      // verify state (CSRF)
      let parsed: { s?: string; r?: string } = {};
      try {
        parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      } catch {
        return reply.code(400).send({ error: "BAD_STATE" });
      }
      const cookieState = (req.cookies as any)?.g_state;
      if (!cookieState || cookieState !== parsed.s) {
        return reply.code(400).send({ error: "STATE_MISMATCH" });
      }
      reply.clearCookie("g_state", { path: "/" });

      // exchange code -> tokens
      const { tokens } = await oauth.getToken({
        code,
        redirect_uri: GOOGLE_REDIRECT_URI,
      });
      const idToken = tokens.id_token;
      if (!idToken) {
        return reply.code(400).send({ error: "MISSING_ID_TOKEN" });
      }

      // verify id_token
      const ticket = await oauth.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return reply.code(400).send({ error: "NO_EMAIL_FROM_GOOGLE" });
      }

      const email = payload.email;
      const displayName =
        payload.name ??
        (payload as any)?.given_name ??
        (payload as any)?.family_name ??
        null;
      const picture = payload.picture ?? null;

      // Upsert user (avatarUrl zamiast historycznego image)
      const user = await prisma.user.upsert({
        where: { email },
        update: { name: displayName, avatarUrl: picture },
        create: {
          email,
          name: displayName,
          avatarUrl: picture,
          role: "USER",
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
        },
      });

      // Cookie z JWT
      signInAndSetCookie(app, reply, user as any);

      // wróć do klienta; front na /login zrobi redirect wg roli
      const redirectTarget = parsed.r || "/login";
      return reply.redirect(`${CLIENT_URL}${redirectTarget}`);
    } catch (err: any) {
      app.log.error({ err }, "[auth.google] callback error");
      return reply
        .code(500)
        .send({ error: "GOOGLE_CALLBACK_ERROR", detail: err?.message });
    }
  });

  // GET /auth/logout
  app.get("/logout", async (_req, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.send({ ok: true });
  });
};

export default googleAuthRoutes;
