// apps/server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import path from "path";

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

// Static files
app.use('/characters', express.static(path.join(process.cwd(), '../client/characters_assets')));

// express-session (compatible with Passport)
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // w dev nie ustawiamy secure, żeby działało na http
      // secure: process.env.NODE_ENV === "production",
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
    // express-session automatically handles session management with Passport
    res.redirect(`${CLIENT_ORIGIN}/characters`);
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
app.get("/api/me", ensureAuth, (req, res) => {
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

// ===== CHARACTERS API
// GET /api/characters — publiczny katalog kart/misji
app.get("/api/characters", async (req, res) => {
  try {
    // Read the real character data from the client's public folder
    const fs = await import('fs');
    const path = await import('path');
    
            const charactersPath = path.join(process.cwd(), '../client/characters_assets/index.json');
    const charactersIndex = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));
    
    // Read individual character data files for complete information
    const charactersData = charactersIndex.map((char: any) => {
      try {
        const dataPath = path.join(process.cwd(), `../client/characters_assets/${char.id}/data.json`);
        const fullData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return { ...char, ...fullData }; // Merge index data with full data
      } catch (error) {
        console.warn(`Could not load data for character ${char.id}:`, error);
        return char; // Fallback to index data only
      }
    });
    
    // Helper function to determine era from character name (matching official ShatterpointDB)
    const getCharacterEra = (name: string): string => {
      const nameLower = name.toLowerCase();
      
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
        return "Clone Wars";
      }
      
      // Galactic Civil War Era
      if (nameLower.includes('luke') || nameLower.includes('leia') || nameLower.includes('han') || 
          nameLower.includes('vader') || nameLower.includes('rebel') || nameLower.includes('stormtrooper') ||
          nameLower.includes('c-3po') || nameLower.includes('r2-d2') || nameLower.includes('lando') ||
          nameLower.includes('boushh') || nameLower.includes('jedi knight luke') || nameLower.includes('freedom fighter')) {
        return "Galactic Civil War";
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
        return "Reign of the Empire";
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
          nameLower.includes('chirrut imwe') || nameLower.includes('rebel pathfinders') || nameLower.includes('death trooper specialist') ||
          nameLower.includes('death troopers') || nameLower.includes('nossor ri') || nameLower.includes('riff tamson') ||
          nameLower.includes('aqua droids') || nameLower.includes('rc-1138') || nameLower.includes('rc-1140') ||
          nameLower.includes('sev') || nameLower.includes('scorch') || nameLower.includes('jedi master shaak ti') ||
          nameLower.includes('padawan learners') || nameLower.includes('jedi master kit fisto') || nameLower.includes('nahdar vebb') ||
          nameLower.includes('cc-3714') || nameLower.includes('fil\'s clones') || nameLower.includes('shoretroopers')) {
        return "The New Republic";
      }
      
      // Endor/Rebellion Era (Ewoks)
      if (nameLower.includes('ewok') || nameLower.includes('wicket') || nameLower.includes('paploo') || 
          nameLower.includes('logray') || nameLower.includes('chief chirpa') || nameLower.includes('ewok trappers') ||
          nameLower.includes('ewok hunters') || nameLower.includes('ewok traps')) {
        return "Galactic Civil War"; // Ewoks are part of the Galactic Civil War era
      }
      
      return "Unknown Era";
    };

    // Transform the data to match the expected format
    const transformedCharacters = charactersData.map((char: any) => {
      // Determine if this is a Primary character (uses SP) or other (uses PC)
      const isPrimary = char.unit_type === 'Primary';
      
      return {
        id: char.id,
        name: char.name,
        role: char.unit_type,
        faction: char.factions && char.factions.length > 0 ? char.factions.join(', ') : 'Unknown',
        portrait: `/characters/${char.id}/portrait.png`,
        tags: char.factions || [],
        sp: isPrimary ? char.squad_points : null,
        pc: !isPrimary ? char.squad_points : null,
        force: char.force || 0,
        stamina: char.stamina || 0,
        durability: char.durability || 0,
        era: getCharacterEra(char.name)
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

// GET /api/characters/:id — get individual character details
app.get("/api/characters/:id", async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const characterId = req.params.id;
    const characterDataPath = path.join(process.cwd(), `../client/public/characters/${characterId}/data.json`);
    
    if (!fs.existsSync(characterDataPath)) {
      return res.status(404).json({ ok: false, error: "Character not found" });
    }
    
    const characterData = JSON.parse(fs.readFileSync(characterDataPath, 'utf8'));
    
    res.json({ 
      ok: true, 
      character: characterData
    });
  } catch (error) {
    console.error("Error fetching character details:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch character details" });
  }
});

// ===== start
app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
  console.log(`CORS -> ${CLIENT_ORIGIN}`);
});