import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma";

const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:5174";
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ?? `${SERVER_URL}/auth/google/callback`;

export default async function authGoogle(app: FastifyInstance, _opts: FastifyPluginOptions) {
  const oauth = new OAuth2Client({
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_CALLBACK_URL,
  });

  app.get("/google/start", async (_req, reply) => {
    const url = oauth.generateAuthUrl({
      access_type: "online",
      scope: ["openid", "email", "profile"],
      prompt: "consent",
    });
    return reply.redirect(url);
  });

  app.get("/google/callback", async (req, reply) => {
    const { code } = (req.query ?? {}) as { code?: string };
    if (!code) return reply.status(400).send({ error: "Missing code" });

    const { tokens } = await oauth.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) return reply.status(401).send({ error: "No id_token" });

    const ticket = await oauth.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.email) return reply.status(401).send({ error: "Email not provided" });

    const email = payload.email;
    const name = payload.name ?? null;
    const image = payload.picture ?? null;

    // 👇 zgodne z Twoim schematem (email, name, image). Bez avatarUrl/ googleId.
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, image },
      create: { email, name, image },
    });

    // Do JWT wyślemy 'avatarUrl' = user.image (front to pokazuje jako avatar)
    const token = app.jwt.sign(
      { id: user.id, email: user.email, name: user.name, avatarUrl: user.image ?? null },
      { expiresIn: "7d" }
    );

    reply
      .setCookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
      })
      .redirect(`${CLIENT_URL}/users`);
  });
}
