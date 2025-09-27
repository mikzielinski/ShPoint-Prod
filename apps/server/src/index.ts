// apps/server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";

// Extend Express Request interface
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string | null;
      role: string;
      status: string;
      suspendedUntil: Date | null;
      username: string | null;
      invitationsLimit: number;
    }
  }
}
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { sendInvitationEmail, testEmailConfiguration } from "./email.js";

const prisma = new PrismaClient();

// --- ENV ---
const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5174";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "fallback-client-id";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "fallback-client-secret";

// CORS allowed origins
const ALLOWED_ORIGINS = [
  CLIENT_ORIGIN,
  "https://shpoint.netlify.app", // Netlify production
  "https://sh-point-prod-client.vercel.app", // Vercel production (if used)
  "https://sh-point-prod-client-cbvhr7v70-mikolajs-projects-bd5e358a.vercel.app", // New Vercel URL
  "http://localhost:5173", // Vite dev server
  "http://localhost:5174", // Alternative dev port
];

// Debug log
console.log("🔍 Environment variables:");
console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", GOOGLE_CLIENT_SECRET ? "***SET***" : "NOT SET");
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ?? "https://shpoint.netlify.app/backend-auth/google/callback";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "dev_dev_dev_change_me";
const ADMIN_EMAILS =
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

// --- APP ---
export const app = express();

// Trust proxy for Render (needed for secure cookies)
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Static files - try production paths first, then fallback to development paths
const charactersAssetsPath = fs.existsSync(path.join(process.cwd(), 'characters_assets')) 
  ? path.join(process.cwd(), 'characters_assets')
  : path.join(process.cwd(), '../client/characters_assets');
const setsPath = fs.existsSync(path.join(process.cwd(), 'public/images/sets'))
  ? path.join(process.cwd(), 'public/images/sets')
  : path.join(process.cwd(), '../client/public/images/sets');

app.use('/characters', express.static(charactersAssetsPath));
app.use('/sets', express.static(setsPath));

// express-session (compatible with Passport)
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "none", // Cross-origin (Netlify -> Render)
      secure: true, // Wymagane dla sameSite: "none"
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
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
        if (!email) return done(null, false, { message: "Email not provided by Google" });

        // Check if email is in allowed list
        const allowedEmail = await prisma.allowedEmail.findUnique({
          where: { email, isActive: true }
        });

        if (!allowedEmail) {
          return done(null, false, { message: "Email not authorized. Please contact administrator." });
        }

        const name = profile.displayName || null;
        const image = (profile.photos?.[0]?.value as string | undefined) || null;

        // upsert po emailu
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            ...(name ? { name } : {}),
            image: image ?? null,
            lastLoginAt: new Date(),
          },
          create: {
            email,
            name,
            image,
            role: allowedEmail.role,
            invitedBy: allowedEmail.invitedBy,
            invitedAt: allowedEmail.createdAt,
            lastLoginAt: new Date(),
            invitationsLimit: setInvitationLimits({ role: allowedEmail.role }),
          },
        });

        // Mark invitation as used if it hasn't been used yet
        if (!allowedEmail.usedAt) {
          await prisma.allowedEmail.update({
            where: { id: allowedEmail.id },
            data: { usedAt: new Date() }
          });
        }

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
    username: u.username ?? null,
    role: u.role,
    status: u.status,
    image: u.image ?? null,
    avatarUrl: u.avatarUrl ?? null,
    suspendedUntil: u.suspendedUntil ?? null,
    invitationsSent: u.invitationsSent ?? 0,
    invitationsLimit: u.invitationsLimit ?? 0,
  };
}

// Function to get invitation limits from system settings
async function getInvitationLimit(role: string): Promise<number> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: `invitation_limit_${role.toLowerCase()}` }
    });
    
    if (setting) {
      return parseInt(setting.value) || 0;
    }
    
    // Default limits if not set in system settings
    const defaultLimits = {
      admin: 100,
      editor: 10,
      user: 3,
    };
    
    return defaultLimits[role.toLowerCase() as keyof typeof defaultLimits] || 0;
  } catch (error) {
    console.error('Error getting invitation limit:', error);
    return 0;
  }
}

// Function to set invitation limits based on user role (legacy)
function setInvitationLimits(user: any) {
  const limits = {
    ADMIN: 100,    // Admins can send unlimited invitations
    EDITOR: 10,    // Editors can send 10 invitations
    USER: 3,       // Regular users can send 3 invitations
  };
  
  return limits[user.role as keyof typeof limits] || 0;
}


// ===== Health
app.get("/health", (_req, res) => res.json({ ok: true, version: "v1.2.18" }));

// ===== Seed endpoint for production
app.post("/api/seed", async (req, res) => {
  try {
    console.log('🌱 Running seed on production...');
    
    // Add admin user to allowed emails
    await prisma.allowedEmail.upsert({
      where: { email: 'mikzielinski@gmail.com' },
      update: {},
      create: {
        email: 'mikzielinski@gmail.com',
        role: 'ADMIN',
        isActive: true
      }
    });
    
    console.log('✅ Seed completed successfully');
    res.json({ ok: true, message: "Seed completed successfully" });
  } catch (error) {
    console.error('❌ Seed failed:', error);
    res.status(500).json({ ok: false, error: "Seed failed" });
  }
});

// ===== AUTH
// start
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// callback (działa dla obu: direct i proxy)
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `https://shpoint.netlify.app/unauthorized` }),
  (req, res) => {
    // express-session automatically handles session management with Passport
    console.log('🔍 Google OAuth callback - user:', req.user?.email);
    console.log('🔍 Google OAuth callback - session:', req.session?.id);
    console.log('🔍 Google OAuth callback - cookies:', req.headers.cookie);
    console.log('🔍 Google OAuth callback - origin:', req.get('origin'));
    
    // Zapisuj sesję przed redirectem - ważne dla Safari
    req.session.save(() => {
      res.redirect(`https://shpoint.netlify.app/builder`);
    });
  }
);

// status dla frontu (czy zalogowany)
app.get("/auth/status", (req, res) => {
  // @ts-ignore
  const u = req.user;
  if (!u) return res.json({ ok: true, authenticated: false, user: null });
  res.json({ ok: true, authenticated: true, user: publicUser(u) });
});

// wylogowanie
app.post("/auth/logout", (req, res, next) => {
  // Passport 0.7 => logout(callback)
  req.logout?.((err) => {
    if (err) return next(err);
    // express-session: destroy session
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.json({ ok: true });
    });
  });
});


// prosty profil (przykład API chronionego)
// Middleware to automatically update user status when suspension ends
async function updateUserStatusIfNeeded(req: Request, res: Response, next: NextFunction) {
  try {
    // @ts-ignore
    const user = req.user;
    if (user && user.status === 'SUSPENDED' && user.suspendedUntil) {
      const now = new Date();
      const suspendedUntil = new Date(user.suspendedUntil);
      
      // If suspension has ended, update user status
      if (now >= suspendedUntil) {
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            status: 'ACTIVE',
            suspendedUntil: null,
            suspendedReason: null,
            suspendedBy: null,
            suspendedAt: null
          }
        });
        
        // Update the user object in the request
        // @ts-ignore
        req.user = await prisma.user.findUnique({
          where: { id: user.id }
        });
      }
    }
    next();
  } catch (error) {
    console.error('Error updating user status:', error);
    next();
  }
}

app.get("/api/me", ensureAuth, updateUserStatusIfNeeded, (req, res) => {
  // @ts-ignore
  res.json({ ok: true, user: publicUser(req.user) });
});

// ===== COLLECTIONS API
// GET /api/collections — lista kolekcji usera
app.get("/api/collections", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const collections = await prisma.collection.findMany({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            cardId: true,
            status: true,
            notes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ ok: true, collections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch collections" });
  }
});

// POST /api/collections — utwórz kolekcję
app.post("/api/collections", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { title } = req.body;
    
    const collection = await prisma.collection.create({
      data: {
        userId,
        title: title || null,
      },
      include: {
        items: true,
      },
    });
    
    res.json({ ok: true, collection });
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ ok: false, error: "Failed to create collection" });
  }
});

// GET /api/collections/:id/items — elementy kolekcji
app.get("/api/collections/:id/items", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    
    const collection = await prisma.collection.findFirst({
      where: { id, userId },
      include: {
        items: true,
      },
    });
    
    if (!collection) {
      return res.status(404).json({ ok: false, error: "Collection not found" });
    }
    
    res.json({ ok: true, items: collection.items });
  } catch (error) {
    console.error("Error fetching collection items:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch collection items" });
  }
});

// POST /api/collections/:id/items — dodaj/zmień element
app.post("/api/collections/:id/items", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { cardId, status, notes } = req.body;
    
    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: { id, userId },
    });
    
    if (!collection) {
      return res.status(404).json({ ok: false, error: "Collection not found" });
    }
    
    // Upsert item
    const item = await prisma.collectionItem.upsert({
      where: {
        collectionId_cardId: {
          collectionId: id,
          cardId,
        },
      },
      update: {
        status: status || "OWNED",
        notes: notes || null,
      },
      create: {
        collectionId: id,
        cardId,
        status: status || "OWNED",
        notes: notes || null,
      },
    });
    
    res.json({ ok: true, item });
  } catch (error) {
    console.error("Error updating collection item:", error);
    res.status(500).json({ ok: false, error: "Failed to update collection item" });
  }
});

// DELETE /api/collections/:id/items/:itemId — usuń element
app.delete("/api/collections/:id/items/:itemId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id, itemId } = req.params;
    
    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: { id, userId },
    });
    
    if (!collection) {
      return res.status(404).json({ ok: false, error: "Collection not found" });
    }
    
    await prisma.collectionItem.delete({
      where: { id: itemId },
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting collection item:", error);
    res.status(500).json({ ok: false, error: "Failed to delete collection item" });
  }
});

// ===== SHATTERPOINT COLLECTIONS API

// GET /api/shatterpoint/characters — get user's character collection
app.get("/api/shatterpoint/characters", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    // @ts-ignore
    const userEmail = req.user.email;
    console.log("🔍 Fetching character collections for user:", userId, "email:", userEmail);
    
    const characterCollections = await prisma.characterCollection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    
    console.log("📊 Found character collections:", characterCollections.length);
    if (characterCollections.length > 0) {
      console.log("✅ First collection:", characterCollections[0]);
    } else {
      console.log("❌ No collections found for user ID:", userId);
    }
    
    const response = { ok: true, collections: characterCollections };
    console.log("📤 Response size:", JSON.stringify(response).length, "bytes");
    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching character collections:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch character collections" });
  }
});

// POST /api/shatterpoint/characters — add character to collection
app.post("/api/shatterpoint/characters", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { characterId, status, notes } = req.body;
    
    console.log("Adding character to collection:", { userId, characterId, status, notes });
    
    if (!characterId) {
      console.log("Error: characterId is required");
      return res.status(400).json({ ok: false, error: "characterId is required" });
    }
    
    // Convert status to boolean fields
    const statusData = {
      isOwned: status === 'OWNED' || status === 'PAINTED' || !status, // Default to owned
      isPainted: status === 'PAINTED',
      isWishlist: status === 'WISHLIST',
      isSold: status === 'SOLD',
      isFavorite: status === 'FAVORITE',
    };
    
    const collection = await prisma.characterCollection.upsert({
      where: {
        userId_characterId: {
          userId,
          characterId,
        },
      },
      update: {
        ...statusData,
        notes: notes || null,
      },
      create: {
        userId,
        characterId,
        ...statusData,
        notes: notes || null,
      },
    });
    
    console.log("Character collection created/updated:", collection);
    res.json({ ok: true, collection });
  } catch (error) {
    console.error("Error updating character collection:", error);
    res.status(500).json({ ok: false, error: "Failed to update character collection" });
  }
});

// DELETE /api/shatterpoint/characters/:characterId — remove character from collection
app.delete("/api/shatterpoint/characters/:characterId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { characterId } = req.params;
    
    await prisma.characterCollection.deleteMany({
      where: { userId, characterId },
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error removing character from collection:", error);
    res.status(500).json({ ok: false, error: "Failed to remove character from collection" });
  }
});

// PATCH /api/shatterpoint/characters/:collectionId — update character collection status
app.patch("/api/shatterpoint/characters/:collectionId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { collectionId } = req.params;
    const { status } = req.body;
    
    if (!status || !['OWNED', 'PAINTED', 'WISHLIST', 'SOLD', 'FAVORITE'].includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid status provided" });
    }
    
    // Convert status to boolean fields
    const statusData = {
      isOwned: status === 'OWNED' || status === 'PAINTED',
      isPainted: status === 'PAINTED',
      isWishlist: status === 'WISHLIST',
      isSold: status === 'SOLD',
      isFavorite: status === 'FAVORITE',
    };
    
    const updatedCollection = await prisma.characterCollection.update({
      where: { 
        id: collectionId,
        userId: userId // Ensure user owns this collection item
      },
      data: statusData,
    });
    
    res.json({ ok: true, collection: updatedCollection });
  } catch (error) {
    console.error("Error updating character collection status:", error);
    res.status(500).json({ ok: false, error: "Failed to update character collection status" });
  }
});

// PATCH /api/shatterpoint/characters/:collectionId/stats — update character stats
app.patch("/api/shatterpoint/characters/:collectionId/stats", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { collectionId } = req.params;
    const { kills, deaths } = req.body;
    
    // Validate that at least one stat is provided
    if (kills === undefined && deaths === undefined) {
      return res.status(400).json({ ok: false, error: "At least one stat (kills, deaths) must be provided" });
    }
    
    // Validate values are non-negative integers
    if (kills !== undefined && (kills < 0 || !Number.isInteger(kills))) {
      return res.status(400).json({ ok: false, error: "Kills must be a non-negative integer" });
    }
    if (deaths !== undefined && (deaths < 0 || !Number.isInteger(deaths))) {
      return res.status(400).json({ ok: false, error: "Deaths must be a non-negative integer" });
    }
    
    // Build update object with only provided fields
    const updateData: any = {};
    if (kills !== undefined) updateData.kills = kills;
    if (deaths !== undefined) updateData.deaths = deaths;
    
    const updatedCollection = await prisma.characterCollection.update({
      where: { 
        id: collectionId,
        userId: userId // Ensure user owns this collection item
      },
      data: updateData
    });
    
    res.json({ ok: true, collection: updatedCollection });
  } catch (error) {
    console.error("Error updating character stats:", error);
    res.status(500).json({ ok: false, error: "Failed to update character stats" });
  }
});

// GET /api/shatterpoint/sets — get user's set collection
app.get("/api/shatterpoint/sets", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const setCollections = await prisma.setCollection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    
    res.json({ ok: true, collections: setCollections });
  } catch (error) {
    console.error("Error fetching set collections:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch set collections" });
  }
});

// POST /api/shatterpoint/sets — add set to collection
app.post("/api/shatterpoint/sets", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { setId, status, isOwned, isPainted, isWishlist, isSold, isFavorite, notes } = req.body;
    
    if (!setId) {
      return res.status(400).json({ ok: false, error: "setId is required" });
    }
    
    // Use boolean fields if provided, otherwise convert status
    const statusData = {
      isOwned: isOwned !== undefined ? isOwned : (status === 'OWNED' || status === 'PAINTED' || !status),
      isPainted: isPainted !== undefined ? isPainted : (status === 'PAINTED'),
      isWishlist: isWishlist !== undefined ? isWishlist : (status === 'WISHLIST'),
      isSold: isSold !== undefined ? isSold : (status === 'SOLD'),
      isFavorite: isFavorite !== undefined ? isFavorite : (status === 'FAVORITE'),
    };
    
    const collection = await prisma.setCollection.upsert({
      where: {
        userId_setId: {
          userId,
          setId,
        },
      },
      update: {
        ...statusData,
        notes: notes || null,
      },
      create: {
        userId,
        setId,
        ...statusData,
        notes: notes || null,
      },
    });
    
    res.json({ ok: true, collection });
  } catch (error) {
    console.error("Error updating set collection:", error);
    res.status(500).json({ ok: false, error: "Failed to update set collection" });
  }
});

// PATCH /api/shatterpoint/sets/:setId — update set status
app.patch("/api/shatterpoint/sets/:setId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { setId } = req.params;
    const { status, isOwned, isPainted, isWishlist, isSold, isFavorite, notes } = req.body;
    
    // Use boolean fields if provided, otherwise convert status
    const statusData = {
      isOwned: isOwned !== undefined ? isOwned : (status === 'OWNED' || status === 'PAINTED'),
      isPainted: isPainted !== undefined ? isPainted : (status === 'PAINTED'),
      isWishlist: isWishlist !== undefined ? isWishlist : (status === 'WISHLIST'),
      isSold: isSold !== undefined ? isSold : (status === 'SOLD'),
      isFavorite: isFavorite !== undefined ? isFavorite : (status === 'FAVORITE'),
    };
    
    const collection = await prisma.setCollection.updateMany({
      where: { userId, setId },
      data: {
        ...statusData,
        notes: notes || null,
      },
    });
    
    if (collection.count === 0) {
      return res.status(404).json({ ok: false, error: "Set not found in collection" });
    }
    
    res.json({ ok: true, collection });
  } catch (error) {
    console.error("Error updating set status:", error);
    res.status(500).json({ ok: false, error: "Failed to update set status" });
  }
});

// DELETE /api/shatterpoint/sets/:setId — remove set from collection
app.delete("/api/shatterpoint/sets/:setId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { setId } = req.params;
    
    await prisma.setCollection.deleteMany({
      where: { userId, setId },
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error removing set from collection:", error);
    res.status(500).json({ ok: false, error: "Failed to remove set from collection" });
  }
});


// GET /api/shatterpoint/stats — get collection statistics
app.get("/api/shatterpoint/stats", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    // Get character collections
    const characterCollections = await prisma.characterCollection.findMany({
      where: { userId },
    });
    
    // Get set collections
    const setCollections = await prisma.setCollection.findMany({
      where: { userId },
    });
    
    // Get mission collections
    const missionCollections = await prisma.missionCollection.findMany({
      where: { userId },
    });
    
    // TODO: Add logic to calculate statistics based on character data
    // This would require reading the character data and grouping by faction, era, etc.
    
    res.json({ 
      ok: true, 
      stats: {
        characters: {
          total: characterCollections.length,
          owned: characterCollections.filter(c => c.isOwned).length,
          painted: characterCollections.filter(c => c.isPainted).length,
          wishlist: characterCollections.filter(c => c.isWishlist).length,
        },
        sets: {
          total: setCollections.length,
          owned: setCollections.filter(c => c.isOwned).length,
          painted: setCollections.filter(c => c.isPainted).length,
          wishlist: setCollections.filter(c => c.isWishlist).length,
        },
        missions: {
          total: missionCollections.length,
          owned: missionCollections.filter(c => c.isOwned).length,
          completed: missionCollections.filter(c => c.isCompleted).length,
          wishlist: missionCollections.filter(c => c.isWishlist).length,
        }
      }
    });
  } catch (error) {
    console.error("Error fetching collection stats:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch collection stats" });
  }
});

// ===== CHARACTERS API
// GET /characters/:id/data.json — dane postaci z naprawionymi ścieżkami portretów
app.get("/characters/:id/data.json", async (req, res) => {
  try {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    // Try production path first, then fallback to development path
    let dataPath = path.join(process.cwd(), `characters_assets/${id}/data.json`);
    if (!fs.existsSync(dataPath)) {
      dataPath = path.join(process.cwd(), `../client/characters_assets/${id}/data.json`);
    }
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ ok: false, error: "Character data not found" });
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Fix portrait paths to use full backend URLs
    if (data.portrait && typeof data.portrait === 'string') {
      if (data.portrait.startsWith('/characters/')) {
        data.portrait = `https://shpoint-prod.onrender.com${data.portrait}`;
      } else if (data.portrait.includes('shatterpointdb.com')) {
        // Replace shatterpointdb.com URLs with our backend URLs
        data.portrait = `https://shpoint-prod.onrender.com/characters/${id}/portrait.png`;
      }
    }
    
    // Fix image paths if they exist
    if (data.image && typeof data.image === 'string') {
      if (data.image.startsWith('/characters/')) {
        data.image = `https://shpoint-prod.onrender.com${data.image}`;
      } else if (data.image.includes('shatterpointdb.com')) {
        // Replace shatterpointdb.com URLs with our backend URLs
        data.image = `https://shpoint-prod.onrender.com/characters/${id}/portrait.png`;
      }
    }
    
    res.json(data);
  } catch (error) {
    console.error(`Error loading character data for ${req.params.id}:`, error);
    res.status(500).json({ ok: false, error: "Failed to load character data" });
  }
});

// GET /characters/:id/stance.json — dane stance postaci
app.get("/characters/:id/stance.json", async (req, res) => {
  try {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    // Try production path first, then fallback to development path
    let stancePath = path.join(process.cwd(), `characters_assets/${id}/stance.json`);
    if (!fs.existsSync(stancePath)) {
      stancePath = path.join(process.cwd(), `../client/characters_assets/${id}/stance.json`);
    }
    
    if (!fs.existsSync(stancePath)) {
      return res.status(404).json({ ok: false, error: "Character stance not found" });
    }
    
    const data = JSON.parse(fs.readFileSync(stancePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error(`Error loading character stance for ${req.params.id}:`, error);
    res.status(500).json({ ok: false, error: "Failed to load character stance" });
  }
});

// GET /api/characters — publiczny katalog kart/misji
app.get("/api/characters", async (req, res) => {
  try {
    // Read the real character data from the client's public folder
    const fs = await import('fs');
    const path = await import('path');
    
    // Use unified character data source with period/era information
    // Try production path first, then fallback to development path
    let charactersPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(charactersPath)) {
      charactersPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    const charactersData = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
    
    // Merge with additional data from individual files if available
    const enrichedCharacters = charactersData.map((char: any) => {
      try {
        let dataPath = path.join(process.cwd(), `characters_assets/${char.id}/data.json`);
        if (!fs.existsSync(dataPath)) {
          dataPath = path.join(process.cwd(), `../client/characters_assets/${char.id}/data.json`);
        }
        if (fs.existsSync(dataPath)) {
          const fullData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          console.log(`✅ Loaded data for ${char.id}:`, { image: fullData.image, portrait: fullData.portrait });
          return { ...char, ...fullData }; // Merge unified data with detailed data
        } else {
          console.log(`❌ No data.json found for ${char.id} at paths:`, [
            path.join(process.cwd(), `characters_assets/${char.id}/data.json`),
            path.join(process.cwd(), `../client/characters_assets/${char.id}/data.json`)
          ]);
        }
        return char; // Use unified data only if no detailed data
      } catch (error) {
        console.warn(`Could not load detailed data for character ${char.id}:`, error);
        return char; // Fallback to unified data only
      }
    });
    
    // Add period/era information to characters if missing and normalize new fields
    const finalCharacters = enrichedCharacters.map((char: any) => {
      // Use period from data if available, otherwise fallback to name-based detection
      const normalizedChar = {
        ...char,
        // Ensure default values for new fields
        characterNames: char.characterNames || char.name,
        boxSetCode: char.boxSetCode || char.set_code || null,
        point_cost: char.point_cost || char.pc || 0,
        force: char.force || 0,
        stamina: char.stamina || 0,
        durability: char.durability || 0,
        number_of_characters: char.number_of_characters || 1,
        // Map legacy fields to new structure
        squad_points: char.squad_points || char.sp || 0,
        unit_type: char.unit_type || char.role || 'Primary',
        // Map image fields - use portrait if image is not available
        image: (() => {
          const result = char.image || char.portrait || null;
          if (char.id === '104th-wolfpack-troopers') {
            console.log(`🔍 Image mapping for ${char.id}:`, { 
              originalImage: char.image, 
              originalPortrait: char.portrait, 
              result 
            });
          }
          return result;
        })(),
        // Ensure period is array
        period: char.period ? (Array.isArray(char.period) ? char.period : [char.period]) : []
      };
      
      if (normalizedChar.period.length > 0) {
        return normalizedChar;
      }
      
      // Fallback: determine era from character name (matching official ShatterpointDB)
      const nameLower = normalizedChar.name.toLowerCase();
      const eras: string[] = [];
      
      // Clone Wars Era
      if (nameLower.includes('clone') || nameLower.includes('anakin') || nameLower.includes('obi-wan') || 
          nameLower.includes('ahsoka') || nameLower.includes('padawan') || nameLower.includes('jedi master') ||
          nameLower.includes('count dooku') || nameLower.includes('general grievous') || nameLower.includes('magnaguard') ||
          nameLower.includes('b1') || nameLower.includes('b2') || nameLower.includes('barriss') ||
          nameLower.includes('luminara') || nameLower.includes('plo koon') || nameLower.includes('mace windu') ||
          nameLower.includes('commander cody') || nameLower.includes('commander wolffe') || nameLower.includes('commander ponds') ||
          nameLower.includes('arf') || nameLower.includes('cad bane') || nameLower.includes('aurra sing') ||
          nameLower.includes('queen padmé') || nameLower.includes('sabé') || nameLower.includes('handmaiden') ||
          nameLower.includes('mother talzin') || nameLower.includes('savage opress') || nameLower.includes('nightsister') ||
          nameLower.includes('jango fett') || nameLower.includes('kalani') || nameLower.includes('kraken')) {
        eras.push("Clone Wars");
      }
      
      // Galactic Civil War Era
      if (nameLower.includes('luke') || nameLower.includes('leia') || nameLower.includes('han') || 
          nameLower.includes('vader') || nameLower.includes('rebel') || nameLower.includes('stormtrooper') ||
          nameLower.includes('c-3po') || nameLower.includes('r2-d2') || nameLower.includes('lando') ||
          nameLower.includes('boushh') || nameLower.includes('jedi knight luke') || nameLower.includes('freedom fighter')) {
        eras.push("Galactic Civil War");
      }
      
      // Reign of the Empire Era
      if (nameLower.includes('imperial') || nameLower.includes('death trooper') || nameLower.includes('shoretrooper') || 
          nameLower.includes('snowtrooper') || nameLower.includes('grand inquisitor') || nameLower.includes('third sister') ||
          nameLower.includes('fifth brother') || nameLower.includes('fourth sister') || nameLower.includes('moff gideon') ||
          nameLower.includes('dark trooper') || nameLower.includes('commander iden') || nameLower.includes('inferno squad') ||
          nameLower.includes('imperial special forces') || nameLower.includes('gideon hask') || nameLower.includes('del meeko') ||
          nameLower.includes('isb agents') || nameLower.includes('es-04') || nameLower.includes('agent kallus') ||
          nameLower.includes('grand admiral thrawn') || nameLower.includes('general veers') || nameLower.includes('elite squad') ||
          nameLower.includes('ct-9904') || nameLower.includes('director krennic')) {
        eras.push("Reign of the Empire");
      }
      
      // The New Republic Era
      if (nameLower.includes('mandalorian') || nameLower.includes('mando') || nameLower.includes('bo-katan') || 
          nameLower.includes('the armorer') || nameLower.includes('paz vizsla') || nameLower.includes('covert mandalorian') ||
          nameLower.includes('boba fett') || nameLower.includes('dengar') || nameLower.includes('greef karga') ||
          nameLower.includes('ig-11') || nameLower.includes('ig-88b') || nameLower.includes('bossk') ||
          nameLower.includes('clone sergeant hunter') || nameLower.includes('wrecker') || nameLower.includes('omega') ||
          nameLower.includes('crosshair') || nameLower.includes('echo') || nameLower.includes('tech') ||
          nameLower.includes('kanan') || nameLower.includes('ezra') || nameLower.includes('zeb') ||
          nameLower.includes('sabine') || nameLower.includes('chopper') || nameLower.includes('hera') ||
          nameLower.includes('spectre') || nameLower.includes('captain cassian') || nameLower.includes('k-2so') ||
          nameLower.includes('jyn erso') || nameLower.includes('bodhi rook') || nameLower.includes('baze malbus') ||
          nameLower.includes('chirrut imwe') || nameLower.includes('rebel pathfinders') || nameLower.includes('rebel commandos') ||
          nameLower.includes('death trooper specialist') || nameLower.includes('death troopers') || nameLower.includes('nossor ri') ||
          nameLower.includes('riff tamson') || nameLower.includes('aqua droids') || nameLower.includes('rc-1138') ||
          nameLower.includes('rc-1140') || nameLower.includes('sev') || nameLower.includes('scorch') ||
          nameLower.includes('jedi master shaak ti') || nameLower.includes('padawan learners') || nameLower.includes('jedi master kit fisto') ||
          nameLower.includes('nahdar vebb') || nameLower.includes('cc-3714') || nameLower.includes('fil\'s clones') ||
          nameLower.includes('shoretroopers')) {
        eras.push("The New Republic");
      }
      
      // Endor/Rebellion Era (Ewoks)
      if (nameLower.includes('ewok') || nameLower.includes('wicket') || nameLower.includes('paploo') || 
          nameLower.includes('logray') || nameLower.includes('chief chirpa') || nameLower.includes('ewok trappers') ||
          nameLower.includes('ewok hunters') || nameLower.includes('ewok traps')) {
        eras.push("Galactic Civil War"); // Ewoks are part of the Galactic Civil War era
      }
      
      // Return character with period information and normalized fields
      return {
        ...normalizedChar,
        period: eras.length > 0 ? eras : ["Unknown Era"]
      };
    });
    
    // Simple ability parser for server-side use
    const parseLegacyAbilities = (abilities: any[]): any[] => {
      if (!Array.isArray(abilities)) return [];
      
      const result: any[] = [];
      let index = 0;
      
      for (const ability of abilities) {
        if (ability.text && typeof ability.text === 'string') {
          // Split long text into individual abilities
          const abilityTexts = ability.text.split(/(?=[A-Z][a-z]+ [A-Z])/).filter((t: string) => t.trim().length > 10);
          
          for (const text of abilityTexts) {
            const cleanText = text.trim();
            if (!cleanText) continue;
            
            // Extract name (first few words)
            const nameMatch = cleanText.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
            const name = nameMatch ? nameMatch[1] : `Ability ${index + 1}`;
            
            // Detect ability type
            let type = 'Innate';
            let symbol = 'l'; // l - Innate
            let forceCost = 0;
            
            if (cleanText.toLowerCase().includes('after') || cleanText.toLowerCase().includes('when')) {
              type = 'Reactive';
              symbol = 'i'; // i - Reactive
              forceCost = 1;
            } else if (cleanText.toLowerCase().includes('may use this ability') || cleanText.toLowerCase().includes('action:')) {
              type = 'Active';
              symbol = 'j'; // j - Active
              forceCost = 1;
            } else if (cleanText.toLowerCase().includes('tactic') || cleanText.toLowerCase().includes('allied')) {
              type = 'Tactic';
              symbol = 'k'; // k - Tactic
              forceCost = 0;
            } else if (cleanText.toLowerCase().includes('identity') || cleanText.toLowerCase().includes('unique to primary')) {
              type = 'Identity';
              symbol = 'm'; // m - Identity
              forceCost = 0;
            }
            
            result.push({
              id: `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index}`,
              type,
              symbol,
              name,
              description: cleanText,
              forceCost,
              trigger: type === 'Reactive' ? 'after_attack_targeting_unit' : type === 'Active' ? 'on_activation' : 'always',
              isAction: false,
              tags: cleanText.toLowerCase().includes('force') ? ['Force'] : []
            });
            
            index++;
          }
        }
      }
      
      return result;
    };
    
    const parseAbilityText = (text: string): any[] => {
      if (!text || typeof text !== 'string') return [];
      return parseLegacyAbilities([{ text }]);
    };
    
    // Transform the data to match the expected format
    const transformedCharacters = finalCharacters.map((char: any) => {
      // Determine if this is a Primary character (uses SP) or other (uses PC)
      const isPrimary = char.unit_type === 'Primary';
      
      // Use structured abilities if available, otherwise parse legacy abilities
      let structuredAbilities = [];
      
      if (char.structuredAbilities && Array.isArray(char.structuredAbilities)) {
        // Use pre-structured abilities from data.json
        structuredAbilities = char.structuredAbilities;
      } else if (char.abilities && Array.isArray(char.abilities)) {
        // Check if abilities already have structured format
        const firstAbility = char.abilities[0];
        if (firstAbility && typeof firstAbility === 'object' && firstAbility.id && firstAbility.type && firstAbility.name) {
          // Abilities already have structured format
          structuredAbilities = char.abilities;
        } else {
          // Parse legacy abilities array
          try {
            structuredAbilities = parseLegacyAbilities(char.abilities);
          } catch (error) {
            console.warn(`Failed to parse abilities for character ${char.id}:`, error);
          }
        }
      } else if (char.abilities && typeof char.abilities === 'string') {
        // Parse legacy ability text
        try {
          structuredAbilities = parseAbilityText(char.abilities);
        } catch (error) {
          console.warn(`Failed to parse ability text for character ${char.id}:`, error);
        }
      }
      
      return {
        id: char.id,
        name: char.name,
        characterNames: char.characterNames || char.name,
        boxSetCode: char.boxSetCode || char.set_code || null,
        role: char.unit_type || char.role,
        faction: char.factions && char.factions.length > 0 ? char.factions.join(', ') : 'Unknown',
        portrait: `https://shpoint-prod.onrender.com/characters/${char.id}/portrait.png`,
        image: char.image || char.portrait || `https://shpoint-prod.onrender.com/characters/${char.id}/portrait.png`,
        tags: char.factions || [],
        sp: isPrimary ? (char.squad_points || char.sp) : null,
        pc: !isPrimary ? (char.squad_points || char.pc) : null,
        squad_points: char.squad_points || char.sp || 0,
        unit_type: char.unit_type || char.role || 'Primary',
        point_cost: char.point_cost || char.pc || 0,
        force: char.force || 0,
        stamina: char.stamina || 0,
        durability: char.durability || 0,
        number_of_characters: char.number_of_characters || 1,
        era: char.period || ["Unknown Era"],
        period: char.period || ["Unknown Era"],
        factions: char.factions || [],
        abilities: structuredAbilities, // New structured abilities
        structuredAbilities: structuredAbilities, // Same as abilities for compatibility
        legacyAbilities: char.abilities // Keep legacy for backward compatibility
      };
    });

    res.json({ 
      ok: true, 
      items: transformedCharacters,
      total: transformedCharacters.length 
    });
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch characters" });
  }
});

// DELETE /api/characters/:id — delete character from JSON files (Admin/Editor only)
app.delete("/api/characters/:id", ensureAuth, async (req, res) => {
  try {
    console.log('DELETE /api/characters/:id called');
    // @ts-ignore
    const user = req.user;
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }
    
    // Check if user has permission (Admin or Editor)
    if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
      console.log('Insufficient permissions for user:', user?.email);
      return res.status(403).json({ ok: false, error: 'Insufficient permissions' });
    }
    
    const characterId = req.params.id;
    console.log('Deleting character:', characterId);
    const fs = await import('fs');
    const path = await import('path');
    
    // Remove from characters_unified.json
    let charactersUnifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(charactersUnifiedPath)) {
      charactersUnifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    if (fs.existsSync(charactersUnifiedPath)) {
      const charactersData = JSON.parse(fs.readFileSync(charactersUnifiedPath, 'utf8'));
      const filteredCharacters = charactersData.filter((char: any) => char.id !== characterId);
      fs.writeFileSync(charactersUnifiedPath, JSON.stringify(filteredCharacters, null, 2));
    }
    
    // Remove from src/data/characters.json
    let charactersDataPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(charactersDataPath)) {
      charactersDataPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    if (fs.existsSync(charactersDataPath)) {
      const charactersData = JSON.parse(fs.readFileSync(charactersDataPath, 'utf8'));
      const filteredCharacters = charactersData.filter((char: any) => char.id !== characterId);
      fs.writeFileSync(charactersDataPath, JSON.stringify(filteredCharacters, null, 2));
    }
    
    // Remove from characters_assets/index.json
    let indexPath = path.join(process.cwd(), 'characters_assets/index.json');
    if (!fs.existsSync(indexPath)) {
      indexPath = path.join(process.cwd(), '../client/characters_assets/index.json');
    }
    if (fs.existsSync(indexPath)) {
      const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
      const filteredIndex = indexData.filter((char: any) => char.id !== characterId);
      fs.writeFileSync(indexPath, JSON.stringify(filteredIndex, null, 2));
    }
    
    // Remove character directory and files
    let characterDir = path.join(process.cwd(), `characters_assets/${characterId}`);
    if (!fs.existsSync(characterDir)) {
      characterDir = path.join(process.cwd(), `../client/characters_assets/${characterId}`);
    }
    if (fs.existsSync(characterDir)) {
      fs.rmSync(characterDir, { recursive: true, force: true });
    }
    
    res.json({ 
      ok: true, 
      message: 'Character deleted successfully',
      characterId: characterId
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete character' });
  }
});

// PUT /api/characters/:id — update character data in JSON files (Admin/Editor only)
app.put("/api/characters/:id", ensureAuth, async (req, res) => {
  try {
    console.log('PUT /api/characters/:id called');
    // @ts-ignore
    const user = req.user;
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // Check if user has permission (Admin or Editor)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      console.log('Access denied: User does not have permission');
      return res.status(403).json({ ok: false, error: 'Access denied. Admin or Editor role required.' });
    }
    
    const characterId = req.params.id;
    const characterData = req.body;
    
    console.log('Updating character:', characterId);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Update characters_unified.json
    let charactersUnifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(charactersUnifiedPath)) {
      charactersUnifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    if (fs.existsSync(charactersUnifiedPath)) {
      const charactersData = JSON.parse(fs.readFileSync(charactersUnifiedPath, 'utf8'));
      const characterIndex = charactersData.findIndex((char: any) => char.id === characterId);
      
      if (characterIndex !== -1) {
        // Update existing character
        charactersData[characterIndex] = { ...charactersData[characterIndex], ...characterData };
        fs.writeFileSync(charactersUnifiedPath, JSON.stringify(charactersData, null, 2));
        console.log('Updated character in characters_unified.json');
      } else {
        // Add new character
        charactersData.push(characterData);
        fs.writeFileSync(charactersUnifiedPath, JSON.stringify(charactersData, null, 2));
        console.log('Added new character to characters_unified.json');
      }
    }
    
    // Update src/data/characters.json
    let charactersDataPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(charactersDataPath)) {
      charactersDataPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    if (fs.existsSync(charactersDataPath)) {
      const charactersData = JSON.parse(fs.readFileSync(charactersDataPath, 'utf8'));
      const characterIndex = charactersData.findIndex((char: any) => char.id === characterId);
      
      if (characterIndex !== -1) {
        charactersData[characterIndex] = { ...charactersData[characterIndex], ...characterData };
        fs.writeFileSync(charactersDataPath, JSON.stringify(charactersData, null, 2));
        console.log('Updated character in src/data/characters.json');
      } else {
        charactersData.push(characterData);
        fs.writeFileSync(charactersDataPath, JSON.stringify(charactersData, null, 2));
        console.log('Added new character to src/data/characters.json');
      }
    }
    
    // Update individual character data file if it exists
    let individualDataPath = path.join(process.cwd(), `characters_assets/${characterId}/data.json`);
    if (!fs.existsSync(individualDataPath)) {
      individualDataPath = path.join(process.cwd(), `../client/characters_assets/${characterId}/data.json`);
    }
    const individualDir = path.dirname(individualDataPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(individualDir)) {
      fs.mkdirSync(individualDir, { recursive: true });
    }
    
    fs.writeFileSync(individualDataPath, JSON.stringify(characterData, null, 2));
    console.log('Updated individual character data file');
    
    res.json({ 
      ok: true, 
      message: 'Character updated successfully',
      characterId: characterId
    });
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ ok: false, error: 'Failed to update character' });
  }
});

// PUT /api/characters/:id/stance — update character stance data (Admin/Editor only)
app.put("/api/characters/:id/stance", ensureAuth, async (req, res) => {
  try {
    console.log('PUT /api/characters/:id/stance called');
    // @ts-ignore
    const user = req.user;
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // Check if user has permission (Admin or Editor)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      console.log('Access denied: User does not have permission');
      return res.status(403).json({ ok: false, error: 'Access denied. Admin or Editor role required.' });
    }
    
    const characterId = req.params.id;
    const stanceData = req.body;
    
    console.log('Updating stance for character:', characterId);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Update individual character stance file
    let stancePath = path.join(process.cwd(), `characters_assets/${characterId}/stance.json`);
    if (!fs.existsSync(stancePath)) {
      stancePath = path.join(process.cwd(), `../client/characters_assets/${characterId}/stance.json`);
    }
    const stanceDir = path.dirname(stancePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(stanceDir)) {
      fs.mkdirSync(stanceDir, { recursive: true });
    }
    
    fs.writeFileSync(stancePath, JSON.stringify(stanceData, null, 2));
    console.log('Updated stance file for character:', characterId);
    
    res.json({ 
      ok: true, 
      message: 'Stance updated successfully',
      characterId: characterId
    });
  } catch (error) {
    console.error('Error updating stance:', error);
    res.status(500).json({ ok: false, error: 'Failed to update stance' });
  }
});

// GET /api/characters/:id — get individual character details
app.get("/api/characters/:id", async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const characterId = req.params.id;
    let characterDataPath = path.join(process.cwd(), `characters_assets/${characterId}/data.json`);
    if (!fs.existsSync(characterDataPath)) {
      characterDataPath = path.join(process.cwd(), `../client/characters_assets/${characterId}/data.json`);
    }
    
    if (!fs.existsSync(characterDataPath)) {
      return res.status(404).json({ ok: false, error: "Character not found" });
    }
    
    const characterData = JSON.parse(fs.readFileSync(characterDataPath, 'utf8'));
    
    // Fix portrait paths to use full backend URLs
    if (characterData.portrait && typeof characterData.portrait === 'string') {
      if (characterData.portrait.startsWith('/characters/')) {
        characterData.portrait = `https://shpoint-prod.onrender.com${characterData.portrait}`;
      }
    }
    
    // Fix image paths if they exist
    if (characterData.image && typeof characterData.image === 'string') {
      if (characterData.image.startsWith('/characters/')) {
        characterData.image = `https://shpoint-prod.onrender.com${characterData.image}`;
      }
    }
    
    res.json({ 
      ok: true, 
      character: characterData
    });
  } catch (error) {
    console.error("Error fetching character details:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch character details" });
  }
});

// ===== SHATTERPOINT STRIKE TEAMS API =====

// GET /api/shatterpoint/strike-teams — get user's strike teams
app.get("/api/shatterpoint/strike-teams", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { type } = req.query; // MY_TEAMS or DREAM_TEAMS
    
    const whereClause: any = { userId };
    if (type && ['MY_TEAMS', 'DREAM_TEAMS'].includes(type as string)) {
      whereClause.type = type;
    }
    
    const strikeTeams = await prisma.strikeTeam.findMany({
      where: whereClause,
      include: {
        characters: {
          orderBy: { order: 'asc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ ok: true, strikeTeams });
  } catch (error) {
    console.error("Error fetching strike teams:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch strike teams" });
  }
});

// POST /api/shatterpoint/strike-teams — create new strike team
app.post("/api/shatterpoint/strike-teams", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { name, type, description, squad1Name, squad2Name, characters } = req.body;
    
    if (!name) {
      return res.status(400).json({ ok: false, error: "Team name is required" });
    }
    
    if (!type || !['MY_TEAMS', 'DREAM_TEAMS'].includes(type)) {
      return res.status(400).json({ ok: false, error: "Invalid team type" });
    }
    
    // Validate characters array (should have 6 characters: 2 squads of 3 each)
    if (!characters || characters.length !== 6) {
      return res.status(400).json({ ok: false, error: "Strike team must have exactly 6 characters (2 squads of 3)" });
    }
    
                // Validate roles: each squad should have 1 Primary, 1 Secondary, 1 Supporting
                const squad1 = characters.slice(0, 3);
                const squad2 = characters.slice(3, 6);
                
                const validateSquad = (squad: any[], squadName: string) => {
                  const roles = squad.map(c => c.role);
                  const primaryCount = roles.filter(r => r === 'PRIMARY').length;
                  const secondaryCount = roles.filter(r => r === 'SECONDARY').length;
                  const supportCount = roles.filter(r => r === 'SUPPORT').length;
                  
                  if (primaryCount !== 1) {
                    throw new Error(`${squadName} must have exactly 1 Primary character (found ${primaryCount})`);
                  }
                  if (secondaryCount !== 1) {
                    throw new Error(`${squadName} must have exactly 1 Secondary character (found ${secondaryCount})`);
                  }
                  if (supportCount !== 1) {
                    throw new Error(`${squadName} must have exactly 1 Support character (found ${supportCount})`);
                  }
                  
                  // Check for duplicate character IDs within the squad
                  const characterIds = squad.map(c => c.characterId);
                  const uniqueIds = new Set(characterIds);
                  if (uniqueIds.size !== characterIds.length) {
                    throw new Error(`${squadName} cannot have duplicate characters`);
                  }
                };
                
                validateSquad(squad1, 'Squad 1');
                validateSquad(squad2, 'Squad 2');
    
    // Check for duplicate characters across the entire strike team
    const allCharacterIds = characters.map((c: { characterId: string }) => c.characterId);
    const uniqueTeamIds = new Set(allCharacterIds);
    if (uniqueTeamIds.size !== allCharacterIds.length) {
      throw new Error("Strike team cannot have duplicate characters across squads");
    }
    
    // Load character data for characterName and unitCount
    const fs = await import('fs');
    const path = await import('path');
    let charactersDataPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(charactersDataPath)) {
      charactersDataPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    const charactersData = JSON.parse(fs.readFileSync(charactersDataPath, 'utf8'));
    
    // Create strike team with characters in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const strikeTeam = await tx.strikeTeam.create({
        data: {
          userId,
          name,
          type,
          description: description || null,
          squad1Name: squad1Name || "Squad 1",
          squad2Name: squad2Name || "Squad 2"
        }
      });
      
      // Add characters to the team
      const teamCharacters = await Promise.all(
        characters.map((char: any, index: number) => {
          // Find character data to get characterName and unitCount
          const characterData = charactersData.find((c: any) => c.id === char.characterId);
          
          return tx.strikeTeamCharacter.create({
            data: {
              strikeTeamId: strikeTeam.id,
              characterId: char.characterId,
              characterName: characterData?.characterName || characterData?.name || char.characterId,
              unitCount: characterData?.unitCount || (char.role === 'SUPPORT' ? 2 : 1),
              role: char.role,
              order: index
            }
          });
        })
      );
      
      return { strikeTeam, characters: teamCharacters };
    });
    
    res.json({ ok: true, strikeTeam: result.strikeTeam });
  } catch (error) {
    console.error("Error creating strike team:", error);
    res.status(500).json({ ok: false, error: error instanceof Error ? error.message : "Failed to create strike team" });
  }
});

// PUT /api/shatterpoint/strike-teams/:id — update strike team
app.put("/api/shatterpoint/strike-teams/:id", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, characters } = req.body;
    
    // Validate characters array
    if (characters && characters.length !== 6) {
      return res.status(400).json({ ok: false, error: "Strike team must have exactly 6 characters (2 squads of 3)" });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // Update strike team
      const updatedTeam = await tx.strikeTeam.update({
        where: { id, userId },
        data: {
          name: name || undefined,
          description: description !== undefined ? description : undefined
        }
      });
      
      // Update characters if provided
      if (characters) {
        // Delete existing characters
        await tx.strikeTeamCharacter.deleteMany({
          where: { strikeTeamId: id }
        });
        
        // Add new characters
        await Promise.all(
          characters.map((char: any, index: number) =>
            tx.strikeTeamCharacter.create({
              data: {
                strikeTeamId: id,
                characterId: char.characterId,
                role: char.role,
                order: index
              }
            })
          )
        );
      }
      
      return updatedTeam;
    });
    
    res.json({ ok: true, strikeTeam: result });
  } catch (error) {
    console.error("Error updating strike team:", error);
    res.status(500).json({ ok: false, error: "Failed to update strike team" });
  }
});

// DELETE /api/shatterpoint/strike-teams/:id — delete strike team
app.delete("/api/shatterpoint/strike-teams/:id", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    
    await prisma.strikeTeam.delete({
      where: { id, userId }
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting strike team:", error);
    res.status(500).json({ ok: false, error: "Failed to delete strike team" });
  }
});

// PATCH /api/shatterpoint/strike-teams/:id/stats — update strike team stats
app.patch("/api/shatterpoint/strike-teams/:id/stats", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { wins, losses, draws } = req.body;
    
    // Validate that at least one stat is provided
    if (wins === undefined && losses === undefined && draws === undefined) {
      return res.status(400).json({ ok: false, error: "At least one stat (wins, losses, draws) must be provided" });
    }
    
    // Validate values are non-negative integers
    if (wins !== undefined && (wins < 0 || !Number.isInteger(wins))) {
      return res.status(400).json({ ok: false, error: "Wins must be a non-negative integer" });
    }
    if (losses !== undefined && (losses < 0 || !Number.isInteger(losses))) {
      return res.status(400).json({ ok: false, error: "Losses must be a non-negative integer" });
    }
    if (draws !== undefined && (draws < 0 || !Number.isInteger(draws))) {
      return res.status(400).json({ ok: false, error: "Draws must be a non-negative integer" });
    }
    
    // Build update object with only provided fields
    const updateData: any = {};
    if (wins !== undefined) updateData.wins = wins;
    if (losses !== undefined) updateData.losses = losses;
    if (draws !== undefined) updateData.draws = draws;
    
    const updatedTeam = await prisma.strikeTeam.update({
      where: { id, userId },
      data: updateData,
      include: {
        characters: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    res.json({ ok: true, strikeTeam: updatedTeam });
  } catch (error) {
    console.error("Error updating strike team stats:", error);
    res.status(500).json({ ok: false, error: "Failed to update strike team stats" });
  }
});

// PATCH /api/shatterpoint/strike-teams/:id/publish — toggle publication status
app.patch("/api/shatterpoint/strike-teams/:id/publish", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { isPublished } = req.body;
    
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({ ok: false, error: "isPublished must be a boolean value" });
    }
    
    const updatedTeam = await prisma.strikeTeam.update({
      where: { id, userId },
      data: { isPublished },
      include: {
        characters: {
          orderBy: { order: 'asc' }
        }
      }
    });
    
    res.json({ ok: true, strikeTeam: updatedTeam });
  } catch (error) {
    console.error("Error updating strike team publication status:", error);
    res.status(500).json({ ok: false, error: "Failed to update strike team publication status" });
  }
});

// GET /api/shatterpoint/strike-teams/public — get all published strike teams
app.get("/api/shatterpoint/strike-teams/public", async (req, res) => {
  try {
    const publishedTeams = await prisma.strikeTeam.findMany({
      where: { isPublished: true },
      include: {
        characters: {
          orderBy: { order: 'asc' }
        },
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            image: true
          }
        }
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    res.json({ ok: true, strikeTeams: publishedTeams });
  } catch (error) {
    console.error("Error fetching published strike teams:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch published strike teams" });
  }
});

// ===== MISSION COLLECTION ENDPOINTS =====

// GET /api/shatterpoint/missions — get user's mission collection
app.get("/api/shatterpoint/missions", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const missionCollections = await prisma.missionCollection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('GET mission collections for user:', userId);
    console.log('Found mission collections:', missionCollections);
    console.log('First collection structure:', missionCollections[0]);
    console.log('Response object keys:', Object.keys({ ok: true, missionCollections }));
    console.log('Response object:', { ok: true, missionCollections });
    
    res.json({ ok: true, missionCollections });
  } catch (error) {
    console.error("Error fetching mission collections:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch mission collections" });
  }
});

// POST /api/shatterpoint/missions — add mission to collection
app.post("/api/shatterpoint/missions", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { missionId, isOwned, isCompleted, isWishlist, isLocked, isFavorite, notes } = req.body;
    
    if (!missionId) {
      return res.status(400).json({ ok: false, error: "Mission ID is required" });
    }
    
    console.log('POST mission collection:', { userId, missionId, isOwned, isCompleted, isWishlist, isLocked, isFavorite, notes });
    
    const missionCollection = await prisma.missionCollection.upsert({
      where: {
        userId_missionId: { userId, missionId }
      },
      update: {
        ...(isOwned !== undefined && { isOwned }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(isWishlist !== undefined && { isWishlist }),
        ...(isLocked !== undefined && { isLocked }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(notes !== undefined && { notes })
      },
      create: {
        userId,
        missionId,
        isOwned: isOwned || false,
        isCompleted: isCompleted || false,
        isWishlist: isWishlist || false,
        isLocked: isLocked || false,
        isFavorite: isFavorite || false,
        notes: notes || null
      }
    });
    
    console.log('Created/updated mission collection:', missionCollection);
    res.json({ ok: true, missionCollection });
  } catch (error) {
    console.error("Error creating mission collection:", error);
    res.status(500).json({ ok: false, error: "Failed to create mission collection" });
  }
});

// PATCH /api/shatterpoint/missions/:missionId — update mission collection
app.patch("/api/shatterpoint/missions/:missionId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { missionId } = req.params;
    const { isOwned, isCompleted, isWishlist, isLocked, isFavorite, notes } = req.body;
    
    console.log('PATCH mission collection:', { userId, missionId, isOwned, isCompleted, isWishlist, isLocked, isFavorite, notes });
    
    const missionCollection = await prisma.missionCollection.upsert({
      where: { 
        userId_missionId: { userId, missionId }
      },
      update: {
        ...(isOwned !== undefined && { isOwned }),
        ...(isCompleted !== undefined && { isCompleted }),
        ...(isWishlist !== undefined && { isWishlist }),
        ...(isLocked !== undefined && { isLocked }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(notes !== undefined && { notes }),
        ...(isCompleted && { completedAt: new Date() })
      },
      create: {
        userId,
        missionId,
        isOwned: isOwned || false,
        isCompleted: isCompleted || false,
        isWishlist: isWishlist || false,
        isLocked: isLocked || false,
        isFavorite: isFavorite || false,
        notes: notes || null,
        completedAt: isCompleted ? new Date() : null
      }
    });
    
    console.log('Updated/created mission collection:', missionCollection);
    res.json({ ok: true, missionCollection });
  } catch (error) {
    console.error("Error updating mission collection:", error);
    res.status(500).json({ ok: false, error: "Failed to update mission collection" });
  }
});

// DELETE /api/shatterpoint/missions/:missionId — remove mission from collection
app.delete("/api/shatterpoint/missions/:missionId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { missionId } = req.params;
    
    await prisma.missionCollection.delete({
      where: { 
        userId_missionId: { userId, missionId }
      }
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting mission collection:", error);
    res.status(500).json({ ok: false, error: "Failed to delete mission collection" });
  }
});

// ===== ADMIN ENDPOINTS
// Middleware to check if user is admin
const ensureAdmin = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ ok: false, error: 'Admin access required' });
  }
  next();
};

// Get all users (admin only)
app.get("/api/admin/users", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    console.log("Admin users endpoint called by:", req.user?.email);
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        invitedBy: true,
        invitedAt: true,
        suspendedUntil: true,
        suspendedReason: true,
        suspendedBy: true,
        suspendedAt: true,
        avatarUrl: true,
        image: true,
        _count: {
          select: {
            characterCollections: true,
            setCollections: true,
            missionCollections: true,
            strikeTeams: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log("Admin users found:", users.length, "users");
    console.log("First user:", users[0]);
    console.log("First user username field:", users[0]?.username);
    console.log("First user all fields:", Object.keys(users[0] || {}));
    res.json({ ok: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch users" });
  }
});

// Get all allowed emails (admin only)
app.get("/api/admin/allowed-emails", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const allowedEmails = await prisma.allowedEmail.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ ok: true, allowedEmails });
  } catch (error) {
    console.error("Error fetching allowed emails:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch allowed emails" });
  }
});

// Add allowed email (admin only)
app.post("/api/admin/allowed-emails", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    // @ts-ignore
    const adminId = req.user.id;
    const { email, role = 'USER' } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Valid email required' });
    }
    
    const allowedEmail = await prisma.allowedEmail.create({
      data: {
        email: email.toLowerCase().trim(),
        role,
        invitedBy: adminId
      }
    });
    
    res.json({ ok: true, allowedEmail });
  } catch (error: any) {
    console.error("Error adding allowed email:", error);
    if (error.code === 'P2002') {
      res.status(400).json({ ok: false, error: 'Email already exists' });
    } else {
      res.status(500).json({ ok: false, error: "Failed to add allowed email" });
    }
  }
});

// Remove allowed email (admin only)
app.delete("/api/admin/allowed-emails/:id", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.allowedEmail.delete({
      where: { id }
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error removing allowed email:", error);
    res.status(500).json({ ok: false, error: "Failed to remove allowed email" });
  }
});

// ===== ADMIN INVITATION SETTINGS ENDPOINTS =====

// Get invitation limits settings
app.get("/api/admin/invitation-limits", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          startsWith: 'invitation_limit_'
        }
      }
    });

    // Create object with role limits
    const limits = {
      admin: 100,
      editor: 10,
      user: 3,
    };

    settings.forEach(setting => {
      const role = setting.key.replace('invitation_limit_', '');
      if (role in limits) {
        limits[role as keyof typeof limits] = parseInt(setting.value) || 0;
      }
    });

    res.json({ ok: true, limits });
  } catch (error) {
    console.error("Error fetching invitation limits:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch invitation limits" });
  }
});

// Update invitation limits settings
app.patch("/api/admin/invitation-limits", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    // @ts-ignore
    const adminId = req.user.id;
    const { limits } = req.body;

    if (!limits || typeof limits !== 'object') {
      return res.status(400).json({ ok: false, error: 'Invalid limits data' });
    }

    const updates = [];
    
    for (const [role, limit] of Object.entries(limits)) {
      if (['admin', 'editor', 'user'].includes(role) && typeof limit === 'number' && limit >= 0) {
        const key = `invitation_limit_${role}`;
        
        const update = prisma.systemSettings.upsert({
          where: { key },
          update: { 
            value: limit.toString(),
            updatedBy: adminId
          },
          create: {
            key,
            value: limit.toString(),
            description: `Maximum invitations for ${role} role`,
            updatedBy: adminId
          }
        });
        
        updates.push(update);
      }
    }

    await Promise.all(updates);

    res.json({ ok: true, message: 'Invitation limits updated successfully' });
  } catch (error) {
    console.error("Error updating invitation limits:", error);
    res.status(500).json({ ok: false, error: "Failed to update invitation limits" });
  }
});

// Update all users' invitation limits based on new settings
app.post("/api/admin/update-user-limits", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: {
        key: {
          startsWith: 'invitation_limit_'
        }
      }
    });

    const limits = {
      ADMIN: 100,
      EDITOR: 10,
      USER: 3,
    };

    settings.forEach(setting => {
      const role = setting.key.replace('invitation_limit_', '').toUpperCase();
      if (role in limits) {
        limits[role as keyof typeof limits] = parseInt(setting.value) || 0;
      }
    });

    // Update all users with new limits
    const updates = Object.entries(limits).map(([role, limit]) =>
      prisma.user.updateMany({
        where: { role: role as any },
        data: { invitationsLimit: limit }
      })
    );

    await Promise.all(updates);

    res.json({ 
      ok: true, 
      message: 'User invitation limits updated successfully',
      updatedLimits: limits
    });
  } catch (error) {
    console.error("Error updating user limits:", error);
    res.status(500).json({ ok: false, error: "Failed to update user limits" });
  }
});

// ===== USER INVITATION ENDPOINTS =====

// Get user invitation limits and stats
app.get("/api/user/invitations", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }
    
    // Get current invitation count
    const invitationsSent = await prisma.allowedEmail.count({
      where: { invitedBy: user.id }
    });
    
    // Get remaining invitations
    const remainingInvitations = Math.max(0, user.invitationsLimit - invitationsSent);
    
    res.json({ 
      ok: true, 
      invitationsSent,
      invitationsLimit: user.invitationsLimit,
      remainingInvitations
    });
  } catch (error) {
    console.error("Error fetching user invitations:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch invitation data" });
  }
});

// Send invitation (regular users)
app.post("/api/user/invitations", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    const { email, role = 'USER' } = req.body;
    
    if (!user) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }
    
    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ ok: false, error: "Suspended users cannot send invitations" });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Valid email required' });
    }
    
    // Check if user has remaining invitations
    const invitationsSent = await prisma.allowedEmail.count({
      where: { invitedBy: user.id }
    });
    
    if (invitationsSent >= user.invitationsLimit) {
      return res.status(403).json({ ok: false, error: 'Invitation limit reached' });
    }
    
    // Check if email already exists
    const existingEmail = await prisma.allowedEmail.findUnique({
      where: { email }
    });
    
    if (existingEmail) {
      return res.status(400).json({ ok: false, error: 'Email already invited' });
    }
    
    // Create invitation
    const allowedEmail = await prisma.allowedEmail.create({
      data: {
        email: email.toLowerCase(),
        role,
        invitedBy: user.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
    
    // Send invitation email
    const emailResult = await sendInvitationEmail(
      email.toLowerCase(),
      user.username || user.name || user.email,
      user.email,
      role
    );
    
    if (!emailResult.success) {
      console.warn('⚠️  Failed to send invitation email:', emailResult.error);
      // Don't fail the request if email fails, just log it
    }
    
    res.json({ 
      ok: true, 
      invitation: allowedEmail,
      emailSent: emailResult.success,
      emailError: emailResult.error
    });
  } catch (error) {
    console.error("Error sending invitation:", error);
    res.status(500).json({ ok: false, error: "Failed to send invitation" });
  }
});

// Test email configuration (admin only)
app.get("/api/admin/test-email", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const result = await testEmailConfiguration();
    res.json({ ok: result.success, error: result.error });
  } catch (error) {
    console.error("Error testing email configuration:", error);
    res.status(500).json({ ok: false, error: "Failed to test email configuration" });
  }
});

// Update user role (admin only)
app.patch("/api/admin/users/:id/role", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['GUEST', 'USER', 'EDITOR', 'ADMIN'].includes(role)) {
      return res.status(400).json({ ok: false, error: 'Invalid role' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ ok: false, error: "Failed to update user role" });
  }
});

// Update user status (admin only)
app.patch("/api/admin/users/:id/status", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ ok: false, error: 'Invalid status' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ ok: false, error: "Failed to update user status" });
  }
});

// Delete user (admin only)
app.delete("/api/admin/users/:id", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // @ts-ignore
    if (req.user.id === id) {
      return res.status(400).json({ ok: false, error: 'Cannot delete your own account' });
    }
    
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ ok: false, error: "Failed to delete user" });
  }
});

// Suspend user for specified days (admin only)
app.patch("/api/admin/users/:id/suspend", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { days, reason } = req.body;
    
    if (!days || typeof days !== 'number' || days <= 0) {
      return res.status(400).json({ ok: false, error: "Invalid days parameter" });
    }
    
    if (days > 365) {
      return res.status(400).json({ ok: false, error: "Suspension cannot exceed 365 days" });
    }
    
    // @ts-ignore
    if (!req.user) {
      return res.status(401).json({ ok: false, error: 'User not authenticated' });
    }
    
    if (req.user.id === id) {
      return res.status(400).json({ ok: false, error: "Cannot suspend yourself" });
    }
    
    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        suspendedUntil,
        suspendedReason: reason || null,
        suspendedBy: req.user.id,
        suspendedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        suspendedUntil: true,
        suspendedReason: true,
        suspendedAt: true
      }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ ok: false, error: "Failed to suspend user" });
  }
});

// Unsuspend user (admin only)
app.patch("/api/admin/users/:id/unsuspend", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        suspendedUntil: null,
        suspendedReason: null,
        suspendedBy: null,
        suspendedAt: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        status: true
      }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error unsuspending user:", error);
    res.status(500).json({ ok: false, error: "Failed to unsuspend user" });
  }
});

// Update user avatar (authenticated users only)
app.patch("/api/user/avatar", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { avatarUrl } = req.body;
    
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      return res.status(400).json({ ok: false, error: 'Avatar URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(avatarUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid avatar URL format' });
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        role: true
      }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).json({ ok: false, error: "Failed to update avatar" });
  }
});

// Reset avatar to Google image (authenticated users only)
app.patch("/api/user/avatar/reset", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null }, // Reset to null so it uses Google image
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        role: true
      }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error resetting avatar:", error);
    res.status(500).json({ ok: false, error: "Failed to reset avatar" });
  }
});

// Save Google avatar as backup (authenticated users only)
app.patch("/api/user/save-google-avatar", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { imageUrl } = req.body;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ ok: false, error: 'Image URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid image URL format' });
    }
    
    // Only save if user doesn't have a custom avatarUrl
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });
    
    if (user?.avatarUrl) {
      // User already has custom avatar, don't overwrite
      return res.json({ ok: true, message: 'Custom avatar already exists' });
    }
    
    // Save Google image as backup avatar
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: imageUrl },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        role: true
      }
    });
    
    res.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Error saving Google avatar:", error);
    res.status(500).json({ ok: false, error: "Failed to save Google avatar" });
  }
});

// Admin endpoint to manually save Google avatar for any user
app.patch("/api/admin/users/:id/save-google-avatar", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const adminId = req.user.id;
    const userId = req.params.id;
    const { imageUrl } = req.body;
    
    // Check if user is admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true }
    });
    
    if (admin?.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ ok: false, error: 'Image URL is required' });
    }
    
    // Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid image URL format' });
    }
    
    // Save Google avatar as backup
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: imageUrl },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        role: true
      }
    });
    
    res.json({ ok: true, user: updatedUser, message: 'Google avatar saved as backup' });
  } catch (error) {
    console.error('Error saving Google avatar:', error);
    res.status(500).json({ ok: false, error: 'Failed to save Google avatar' });
  }
});

// Update username (authenticated users only)
app.patch("/api/user/username", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { username } = req.body;
    
    if (username !== null && (typeof username !== 'string' || username.trim().length === 0)) {
      return res.status(400).json({ ok: false, error: 'Username must be a non-empty string or null' });
    }
    
    // Check if username is already taken (if not null)
    if (username && username.trim()) {
      const existingUser = await prisma.user.findUnique({
        where: { username: username.trim() }
      });
      
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ ok: false, error: 'Username is already taken' });
      }
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { username: username ? username.trim() : null },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        avatarUrl: true,
        image: true,
        role: true
      }
    });
    
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error updating username:", error);
    res.status(500).json({ ok: false, error: "Failed to update username" });
  }
});

// Emergency endpoint to promote user to admin (temporary)
app.post("/api/admin/promote-to-admin", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { email } = req.body;
    
    // Check if user is trying to promote themselves or if email matches
    // @ts-ignore
    if (req.user.email === email || !email) {
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: 'ADMIN' }
      });
      
      res.json({ ok: true, user, message: 'Promoted to admin' });
    } else {
      // Promote specific email
      const user = await prisma.user.update({
        where: { email },
        data: { role: 'ADMIN' }
      });
      
      res.json({ ok: true, user, message: `${email} promoted to admin` });
    }
  } catch (error) {
    console.error("Error promoting user:", error);
    res.status(500).json({ ok: false, error: "Failed to promote user" });
  }
});

// Error handling middleware for authentication - must be after all routes
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message === "Email not authorized. Please contact administrator.") {
    return res.redirect(`${CLIENT_ORIGIN}/unauthorized`);
  }
  next(err);
});

// ===== CUSTOM MADE CARDS API =====

// GET /api/custom-cards — get user's custom cards
app.get("/api/custom-cards", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const customCards = await prisma.customMadeCard.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(customCards);
  } catch (error) {
    console.error("Error fetching custom cards:", error);
    res.status(500).json({ error: "Failed to fetch custom cards" });
  }
});

// POST /api/custom-cards — create new custom card
app.post("/api/custom-cards", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const {
      name,
      description,
      faction,
      unitType,
      squadPoints,
      stamina,
      durability,
      force,
      hanker,
      abilities,
      stances,
      portrait,
      status = 'DRAFT',
      isPublic = false
    } = req.body;

    if (!name || !faction || !unitType) {
      return res.status(400).json({ error: "Name, faction, and unit type are required" });
    }

    const customCard = await prisma.customMadeCard.create({
      data: {
        name,
        description,
        faction,
        unitType,
        squadPoints: squadPoints || 0,
        stamina: stamina || 0,
        durability: durability || 0,
        force: force || 0,
        hanker: hanker || 0,
        abilities: abilities || [],
        stances: stances || [],
        portrait,
        status,
        isPublic,
        authorId: userId
      }
    });

    res.json(customCard);
  } catch (error) {
    console.error("Error creating custom card:", error);
    res.status(500).json({ error: "Failed to create custom card" });
  }
});

// PUT /api/custom-cards/:id — update custom card
app.put("/api/custom-cards/:id", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.authorId;
    delete updateData.createdAt;
    updateData.updatedAt = new Date();

    const customCard = await prisma.customMadeCard.update({
      where: { 
        id,
        authorId: userId // Ensure user can only update their own cards
      },
      data: updateData
    });

    res.json(customCard);
  } catch (error) {
    console.error("Error updating custom card:", error);
    res.status(500).json({ error: "Failed to update custom card" });
  }
});

// DELETE /api/custom-cards/:id — delete custom card
app.delete("/api/custom-cards/:id", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.customMadeCard.delete({
      where: { 
        id,
        authorId: userId // Ensure user can only delete their own cards
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom card:", error);
    res.status(500).json({ error: "Failed to delete custom card" });
  }
});

// POST /api/custom-cards/:id/publish — publish custom card
app.post("/api/custom-cards/:id/publish", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    const customCard = await prisma.customMadeCard.update({
      where: { 
        id,
        authorId: userId // Ensure user can only publish their own cards
      },
      data: { 
        status: 'PUBLISHED',
        isPublic: true,
        updatedAt: new Date()
      }
    });

    res.json(customCard);
  } catch (error) {
    console.error("Error publishing custom card:", error);
    res.status(500).json({ error: "Failed to publish custom card" });
  }
});

// POST /api/custom-cards/:id/share — share custom card with another user
app.post("/api/custom-cards/:id/share", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const { sharedWithEmail } = req.body;

    if (!sharedWithEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find the user to share with
    const sharedWithUser = await prisma.user.findUnique({
      where: { email: sharedWithEmail.toLowerCase() }
    });

    if (!sharedWithUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (sharedWithUser.id === userId) {
      return res.status(400).json({ error: "Cannot share with yourself" });
    }

    // Check if card exists and belongs to user
    const customCard = await prisma.customMadeCard.findFirst({
      where: { 
        id,
        authorId: userId
      }
    });

    if (!customCard) {
      return res.status(404).json({ error: "Custom card not found" });
    }

    // Create share record
    const share = await prisma.customCardShare.create({
      data: {
        cardId: id,
        sharedWithId: sharedWithUser.id,
        accepted: false
      }
    });

    res.json({ success: true, share });
  } catch (error) {
    console.error("Error sharing custom card:", error);
    res.status(500).json({ error: "Failed to share custom card" });
  }
});

// GET /api/custom-cards/shared — get custom cards shared with user
app.get("/api/custom-cards/shared", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    
    const sharedCards = await prisma.customCardShare.findMany({
      where: { 
        sharedWithId: userId,
        accepted: true
      },
      include: {
        card: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sharedCards.map(share => ({
      ...share.card,
      sharedBy: share.card.author
    })));
  } catch (error) {
    console.error("Error fetching shared custom cards:", error);
    res.status(500).json({ error: "Failed to fetch shared custom cards" });
  }
});

// POST /api/custom-cards/:id/accept — accept shared custom card
app.post("/api/custom-cards/:id/accept", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    // Update share to accepted
    const share = await prisma.customCardShare.update({
      where: { 
        cardId_sharedWithId: {
          cardId: id,
          sharedWithId: userId
        }
      },
      data: { accepted: true }
    });

    // Add to user's collection
    await prisma.customCardCollection.create({
      data: {
        userId,
        cardId: id,
        isOwned: true
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error accepting shared custom card:", error);
    res.status(500).json({ error: "Failed to accept shared custom card" });
  }
});

// ===== start
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API listening on port ${PORT}`);
  console.log(`🌐 CORS allowed origins:`, ALLOWED_ORIGINS);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});