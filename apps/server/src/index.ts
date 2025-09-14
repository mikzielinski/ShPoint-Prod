// apps/server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cookieSession from "cookie-session";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// --- ENV ---
const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5174";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:3001/auth/google/callback";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev_dev_dev_change_me";
const ADMIN_EMAILS =
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

// --- APP ---
export const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// cookie-session (UWAGA: tu nie ma .regenerate / .destroy!)
app.use(
  cookieSession({
    name: "sid",
    secret: SESSION_SECRET,
    httpOnly: true,
    sameSite: "lax",
    // w dev nie ustawiamy secure, żeby działało na http
    // secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
);

// --- PASSPORT ---
app.use(passport.initialize());
app.use(passport.session());

// w sesji trzymaj tylko id
passport.serializeUser((user: any, done) => done(null, { id: user.id }));
passport.deserializeUser(async (obj: any, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: obj?.id } });
    done(null, user || false);
  } catch (e) {
    done(e as any);
  }
});

// Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    // verify/callback
    async (_accessToken: string, _refreshToken: string, profile: Profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase().trim() || null;
        if (!email) return done(new Error("Email not provided by Google"));

        const name = profile.displayName || null;
        const image = (profile.photos?.[0]?.value as string | undefined) || null;

        // upsert po emailu
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            ...(name ? { name } : {}),
            image: image ?? null,
          },
          create: {
            email,
            name,
            image,
            // rola bazowa USER – podniesiemy na ADMIN, jeśli email na liście
            role: "USER",
          },
        });

        // jeśli na liście adminów, podnieś raz (bez zapętlenia)
        if (ADMIN_EMAILS.includes(user.email) && user.role !== "ADMIN") {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
          });
          user.role = "ADMIN";
        }

        return done(null, user);
      } catch (err) {
        return done(err as any);
      }
    }
  )
);

// ===== Helpers
function ensureAuth(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  if (req.user) return next();
  return res.status(401).json({ ok: false, error: "unauthorized" });
}
function publicUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role,
    image: u.image ?? null,
  };
}

// ===== Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// ===== AUTH
// start
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// callback
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login?error=oauth_failed" }),
  (req, res) => {
    // cookie-session -> po prostu ustaw dane w sesji (tu trzyma to Passport, ale dla jasności)
    // @ts-ignore
    req.session = { ...(req.session || {}), userId: (req.user as any)?.id };
    res.redirect(`${CLIENT_ORIGIN}/characters`);
  }
);

// status dla frontu (czy zalogowany)
app.get("/auth/status", (req, res) => {
  // @ts-ignore
  const u = req.user;
  if (!u) return res.json({ ok: true, user: null });
  res.json({ ok: true, user: publicUser(u) });
});

// wylogowanie
app.post("/auth/logout", (req, res, next) => {
  // Passport 0.7 => logout(callback)
  req.logout?.((err) => {
    if (err) return next(err);
    // cookie-session: wyczyść sesję
    // @ts-ignore
    req.session = null;
    res.json({ ok: true });
  });
});

// prosty profil (przykład API chronionego)
app.get("/api/me", ensureAuth, (req, res) => {
  // @ts-ignore
  res.json({ ok: true, user: publicUser(req.user) });
});

// ===== start
app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
  console.log(`CORS -> ${CLIENT_ORIGIN}`);
});