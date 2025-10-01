// apps/server/src/index.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
// import { User } from "@prisma/client";

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
    interface Request {
      apiToken?: {
        id: string;
        token: string;
        scopes: string[];
        expiresAt: Date;
        userId: string;
        user: User;
      };
    }
  }
}
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import { SessionData } from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import ExpressBrute from "express-brute";
import ExpressBruteRedis from "express-brute-redis";
import Joi from "joi";
import { sendInvitationEmail, testEmailConfiguration } from "./email.js";
import { logAuditEvent, getAuditLogs } from "./audit.js";
import { setupSwagger } from "./swagger.js";
import { 
  getCharacters, 
  getCharacterById, 
  getCharacterAbilities, 
  getCharacterStance,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getSets,
  getMissions
} from "./database-api.js";
import { 
  getComments, 
  createComment, 
  updateComment, 
  deleteComment, 
  likeComment 
} from "./comments-api.js";
import { 
  getInboxMessages, 
  markMessageAsRead, 
  markAllMessagesAsRead, 
  deleteMessage 
} from "./inbox-api.js";
import { 
  getChallenges, 
  createChallenge, 
  respondToChallenge, 
  cancelChallenge, 
  getAvailablePlayers 
} from "./challenges-api.js";
import { 
  getScheduledGames, 
  createScheduledGame, 
  updateScheduledGame, 
  addGameReminder,
  removeGameReminder,
  generateCalendarEvent,
  getPublicGames,
  createPublicGame
} from "./scheduled-games-api.js";
import { 
  getGameResults, 
  createGameResult, 
  updateGameResult, 
  deleteGameResult, 
  getPlayerStats 
} from "./game-results-api.js";
import { 
  logDiceRoll, 
  getDiceRolls, 
  logNodeActivation, 
  getNodeActivations, 
  updateNodeActivation, 
  deleteNodeActivation 
} from "./dice-and-nodes-api.js";
import { 
  exportGameLog, 
  exportGameLogByTurn 
} from "./game-export-api.js";
import { 
  createAccessRequest, 
  getAccessRequests, 
  updateAccessRequest, 
  deleteAccessRequest, 
  inviteUserFromRequest 
} from "./access-requests-api.js";
import {
  getUserApiTokens,
  createApiToken,
  updateApiToken,
  deleteApiToken,
  authenticateApiToken
} from "./api-tokens-api.js";

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
  "https://shpoint.org", // Custom domain
  "https://sh-point-prod-client.vercel.app", // Vercel production (if used)
  "https://sh-point-prod-client-cbvhr7v70-mikolajs-projects-bd5e358a.vercel.app", // New Vercel URL
  "http://localhost:5173", // Vite dev server
  "http://localhost:5174", // Alternative dev port
];

// Function to get frontend URL based on origin
function getFrontendUrl(origin?: string): string {
  if (!origin) return "https://shpoint.netlify.app"; // Default fallback
  
  // Map origins to frontend URLs
  const originMap: Record<string, string> = {
    "https://shpoint.org": "https://shpoint.org",
    "https://shpoint.netlify.app": "https://shpoint.netlify.app",
    "https://sh-point-prod-client.vercel.app": "https://sh-point-prod-client.vercel.app",
    "https://sh-point-prod-client-cbvhr7v70-mikolajs-projects-bd5e358a.vercel.app": "https://sh-point-prod-client-cbvhr7v70-mikolajs-projects-bd5e358a.vercel.app",
    "http://localhost:5173": "http://localhost:5173",
    "http://localhost:5174": "http://localhost:5174",
  };
  
  return originMap[origin] || "https://shpoint.netlify.app";
}

// Environment validation
const requiredEnvVars = [
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID', 
  'GOOGLE_CLIENT_SECRET',
  'DATABASE_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Validate SESSION_SECRET strength
const SESSION_SECRET = process.env.SESSION_SECRET!;
if (SESSION_SECRET.length < 32) {
  console.error("❌ SESSION_SECRET must be at least 32 characters long");
  process.exit(1);
}
if (SESSION_SECRET === "dev_dev_dev_change_me") {
  console.error("❌ SESSION_SECRET cannot be the default development value in production");
  process.exit(1);
}

// Debug log (secure)
console.log("🔍 Environment variables:");
console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET");
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ?? "https://shpoint.netlify.app/backend-auth/google/callback";

// Debug log for callback URL
console.log("🔍 GOOGLE_CALLBACK_URL:", GOOGLE_CALLBACK_URL);
const ADMIN_EMAILS =
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

// --- APP ---
export const app = express();

// Trust proxy for Render (needed for secure cookies)
app.set('trust proxy', 1);

// ===== ADVANCED DDoS PROTECTION =====

// 1. Basic Rate Limiting - Adjusted for normal users
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Allow 10 auth attempts per 15 minutes (was 3)
  message: { ok: false, error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: (req) => {
    // @ts-ignore
    return req.user && req.user.isTrusted;
  }
});

const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Very generous limit for API endpoints
  message: { ok: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // @ts-ignore
    return req.user && req.user.isTrusted;
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50000, // Extremely generous limit for development/deployment
  message: { ok: false, error: 'Rate limit exceeded, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip for public endpoints
    if (req.path === '/api/missions' || req.path === '/health' || req.path === '/unban' || req.path === '/debug/my-ip') {
      return true;
    }
    // @ts-ignore
    return req.user && req.user.isTrusted;
  }
});

// 2. Slow Down (progressive delays) - Very lenient
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 200, // Allow 200 requests per windowMs without delay
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 200;
  },
  maxDelayMs: 10000, // Reduced max delay from 20s to 10s
  skipSuccessfulRequests: true,
  skip: (req) => {
    // @ts-ignore
    return req.user && req.user.isTrusted;
  }
});

// 3. Brute Force Protection
let bruteForceStore;
try {
  // Check if Redis is available
  if (process.env.REDIS_URL && process.env.REDIS_URL !== 'localhost') {
    bruteForceStore = new ExpressBruteRedis({
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT || 6379,
      prefix: 'shpoint:bruteforce:'
    });
    console.log('✅ Redis brute force protection enabled');
  } else {
    throw new Error('Redis not configured');
  }
} catch (error) {
  console.warn('⚠️ Redis not available, using memory store for brute force protection');
  bruteForceStore = new ExpressBrute.MemoryStore();
}

const bruteForce = new ExpressBrute(bruteForceStore, {
  freeRetries: 20, // Very generous for development/deployment
  minWait: 30 * 1000, // Reduced to 30 seconds
  maxWait: 2 * 60 * 1000, // Reduced to 2 minutes
  lifetime: 24 * 60 * 60, // 24 hours
  refreshTimeoutOnRequest: false,
  handleStoreError: (error) => {
    console.warn('Brute force store error:', error.message);
    // Continue with memory store fallback
  }
});

// 4. Request size limiting
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Limit URL-encoded payload size

// 5. Apply protection layers
app.use(generalLimiter); // Apply to all requests first
// @ts-ignore
app.use(speedLimiter); // Then apply speed limiting
app.use('/auth/', strictLimiter); // Strict limits for auth

// Special exception for /api/user/me - very lenient rate limiting
app.use('/api/user/me', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Very high limit for user profile requests
  message: { ok: false, error: 'Too many user profile requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // @ts-ignore
    return req.user && req.user.isTrusted;
  }
}));

app.use('/api/', moderateLimiter); // Moderate limits for API

// 6. Brute force protection for specific endpoints - More lenient
const authBruteForce = new ExpressBrute(bruteForceStore, {
  freeRetries: 50, // Very generous for development/deployment
  minWait: 30 * 1000, // Reduced to 30 seconds
  maxWait: 2 * 60 * 1000, // Reduced to 2 minutes
  lifetime: 24 * 60 * 60, // 24 hours
});

// 7. Netlify CDN IP whitelist middleware
const netlifyIPs = [
  '104.23.209.126',
  '104.23.208.126', 
  '104.23.210.126',
  '104.23.211.126'
];

app.use('/auth/', (req, res, next) => {
  // Skip brute force protection for Netlify CDN IPs
  if (netlifyIPs.includes(req.ip)) {
    return next();
  }
  // @ts-ignore - ExpressBrute type compatibility issue
  return authBruteForce.prevent(req, res, next);
});

// 8. DDoS Detection and Monitoring - Adjusted thresholds
const suspiciousIPs = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();
const IP_THRESHOLD = 5000; // Extremely high threshold for development/deployment
const IP_BAN_DURATION = 1 * 60 * 1000; // Reduced to 1 minute

const ddosDetection = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = new Date();
  
  // Get trusted IPs from database
  let trustedIPs: string[] = ['127.0.0.1', '::1']; // Always trusted
  
  try {
    const dbTrustedIPs = await prisma.trustedIP.findMany({
      where: { isActive: true },
      select: { ip: true }
    });
    trustedIPs = [...trustedIPs, ...dbTrustedIPs.map(t => t.ip)];
  } catch (error) {
    console.warn('⚠️ Failed to load trusted IPs from database, using fallback list:', error.message);
    // Fallback to hardcoded list if database fails
    trustedIPs = [
      ...trustedIPs,
      '89.151.22.52', // User's IP - added to prevent accidental bans
      '172.71.150.50', // User's current IP from logs
      '172.71.151.92', // User's previous IP from logs
      '172.69.214.80', // User's latest IP from logs
      '172.71.151.7', // User's newest IP from logs
    ];
  }
  
  // Check if user is trusted (bypasses DDoS detection)
  // @ts-ignore
  if (req.user && req.user.isTrusted) {
    console.log('🛡️ Trusted user bypassing DDoS detection:', req.user.email);
    return next();
  }
  
  // Emergency unban endpoint - remove this after fixing
  if (req.path === '/unban' && req.method === 'POST') {
    suspiciousIPs.clear();
    console.log('🚨 Emergency unban executed - all IPs cleared');
    return res.json({ ok: true, message: 'All IPs unbanned' });
  }
  
  if (trustedIPs.includes(ip)) {
    return next(); // Skip DDoS detection for trusted IPs
  }
  
  // Clean old entries
  for (const [key, data] of suspiciousIPs.entries()) {
    if (now.getTime() - data.lastSeen.getTime() > IP_BAN_DURATION) {
      suspiciousIPs.delete(key);
    }
  }
  
  // Check if IP is already banned
  const ipData = suspiciousIPs.get(ip);
  if (ipData && now.getTime() - ipData.firstSeen.getTime() < IP_BAN_DURATION) {
    console.warn(`🚨 Banned IP attempting access: ${ip}`);
    return res.status(429).json({ 
      ok: false, 
      error: 'IP temporarily banned due to suspicious activity' 
    });
  }
  
  // Track request frequency
  if (!ipData) {
    suspiciousIPs.set(ip, { count: 1, firstSeen: now, lastSeen: now });
  } else {
    ipData.count++;
    ipData.lastSeen = now;
    
    // Check if IP is making too many requests
    const timeDiff = now.getTime() - ipData.firstSeen.getTime();
    const requestsPerMinute = (ipData.count / timeDiff) * 60000;
    
    if (requestsPerMinute > IP_THRESHOLD) {
      console.warn(`🚨 DDoS detected from IP: ${ip}, ${requestsPerMinute.toFixed(2)} req/min`);
      
      // Log the attack
      logAuditEvent({
        entityType: 'SECURITY' as any,
        entityId: ip,
        action: 'DDOS_DETECTED' as any,
        userId: null,
        description: `DDoS attack detected from ${ip}: ${requestsPerMinute.toFixed(2)} requests per minute`,
        changes: {
          before: null,
          after: { requestsPerMinute, count: ipData.count, duration: timeDiff }
        }
      }).catch(console.error);
      
      return res.status(429).json({ 
        ok: false, 
        error: 'Rate limit exceeded - suspicious activity detected' 
      });
    }
  }
  
  next();
};

// 8. Apply DDoS detection (with exceptions)
app.use((req, res, next) => {
  // Skip DDoS detection for static files and health checks
  if (req.path.startsWith('/characters/') || 
      req.path.startsWith('/public/') || 
      req.path === '/health' ||
      req.path === '/favicon.ico') {
    return next();
  }
  ddosDetection(req, res, next);
});

// Setup Swagger documentation (will be called after ensureApiAccess is defined)

app.use(helmet({ 
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
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
// @ts-ignore
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
// @ts-ignore
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Allow saving uninitialized sessions for Passport
    cookie: {
      httpOnly: true,
      sameSite: "none", // Cross-origin (Netlify -> Render)
      secure: true, // Wymagane dla sameSite: "none"
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// --- PASSPORT ---
// Middleware to authenticate Bearer tokens
const authenticateBearerToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    try {
      const apiToken = await (prisma as any).apiToken.findUnique({
        where: { token },
        include: {
          user: true
        }
      });
      
      if (apiToken && apiToken.isActive && (!apiToken.expiresAt || apiToken.expiresAt > new Date())) {
        // Update last used timestamp
        await (prisma as any).apiToken.update({
          where: { id: apiToken.id },
          data: { lastUsedAt: new Date() }
        });
        
        // Set user in request
        // @ts-ignore
        req.user = apiToken.user;
        return next();
      }
    } catch (error) {
      console.error('Bearer token authentication error:', error);
    }
  }
  
  // If no valid Bearer token, continue with session authentication
  next();
};

// @ts-ignore
app.use(passport.initialize());
// @ts-ignore
app.use(passport.session());

// Add Bearer token authentication middleware
app.use(authenticateBearerToken);

// w sesji trzymaj tylko id
passport.serializeUser((user: any, done) => {
  console.log('🔍 passport.serializeUser called with user:', user ? `${user.email} (${user.id})` : 'null');
  done(null, { id: user.id });
});
passport.deserializeUser(async (obj: any, done) => {
  try {
    console.log('🔍 passport.deserializeUser called with obj:', obj);
    if (!obj?.id) {
      console.log('🔍 No user ID in session object, returning false');
      return done(null, false);
    }
    
    const user = await prisma.user.findUnique({ where: { id: obj.id } });
    console.log('🔍 Deserialized user:', user ? `${user.email} (${user.id})` : 'null');
    done(null, user || false);
  } catch (e) {
    console.error('🔍 passport.deserializeUser error:', e);
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
        console.log('🔍 Google OAuth strategy - profile:', profile);
        const email = profile.emails?.[0]?.value?.toLowerCase().trim() || null;
        console.log('🔍 Google OAuth strategy - email:', email);
        if (!email) {
          console.log('🔍 Google OAuth strategy - no email found');
          return done(null, false, { message: "Email not provided by Google" });
        }

        // Check if email is in allowed list
        const allowedEmail = await prisma.allowedEmail.findUnique({
          where: { email, isActive: true }
        });

        console.log('🔍 Google OAuth strategy - allowedEmail:', allowedEmail);
        if (!allowedEmail) {
          console.log('🔍 Google OAuth strategy - email not authorized:', email);
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

// Middleware to authenticate Bearer token
function ensureBearerAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, error: 'Bearer token required' });
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  // Find token in database
  prisma.apiToken.findFirst({
    where: {
      token,
      isActive: true,
      expiresAt: { gt: new Date() }
    },
    include: {
      user: true
    }
  }).then(apiToken => {
    if (!apiToken) {
      return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
    }
    
    // Attach user to request
    req.user = apiToken.user;
    (req as any).apiToken = apiToken;
    next();
  }).catch(error => {
    console.error('Bearer auth error:', error);
    res.status(500).json({ ok: false, error: 'Authentication error' });
  });
}

// Middleware to check API scopes
function requireScope(requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiToken) {
      return res.status(401).json({ ok: false, error: 'API token required' });
    }
    
    const userScopes = req.apiToken.scopes || [];
    const hasRequiredScope = requiredScopes.some(scope => userScopes.includes(scope));
    
    if (!hasRequiredScope) {
      return res.status(403).json({ 
        ok: false, 
        error: `Insufficient permissions. Required: ${requiredScopes.join(' or ')}, Available: ${userScopes.join(', ')}` 
      });
    }
    
    next();
  };
}

function ensureAuth(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  console.log('🔍 ensureAuth - req.user:', req.user);
  // @ts-ignore
  console.log('🔍 ensureAuth - req.session:', req.session?.id);
  // @ts-ignore
  console.log('🔍 ensureAuth - req.session.passport:', (req.session as any)?.passport);
  // @ts-ignore
  console.log('🔍 ensureAuth - req.session keys:', Object.keys(req.session || {}));
  console.log('🔍 ensureAuth - cookies:', req.headers.cookie);
  
  // Debug Passport deserialization
  if ((req.session as any)?.passport?.user) {
    console.log('🔍 Passport user ID in session:', (req.session as any).passport.user.id);
  } else {
    console.log('🔍 No Passport user in session - deserialization may have failed');
  }
  
  // @ts-ignore
  if (req.user) {
    // Check if user is trusted (bypasses all security measures)
    const trustedEmails = [
      'mikzielinski@gmail.com' // Main developer - bypass all security
    ];
    
    // @ts-ignore
    if (trustedEmails.includes(req.user.email)) {
      console.log('🛡️ Trusted user detected, bypassing all security measures:', req.user.email);
      // @ts-ignore
      req.user.isTrusted = true;
    }
    
    return next();
  }
  return res.status(401).json({ ok: false, error: "unauthorized" });
}

// Middleware to bypass security for trusted users
function bypassSecurityForTrusted(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore
  if (req.user && req.user.isTrusted) {
    console.log('🛡️ Bypassing security for trusted user:', req.user.email);
    return next();
  }
  return next();
}

// Function to synchronize characters_unified.json with individual data.json files
async function syncCharactersUnified() {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Load current characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      console.warn('⚠️ characters_unified.json not found, skipping sync');
      return;
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    console.log(`🔄 Syncing ${unifiedData.length} characters in unified file...`);
    
    let updatedCount = 0;
    
    // Update each character with data from individual data.json files
    for (const char of unifiedData) {
      try {
        let dataPath = path.join(process.cwd(), `characters_assets/${char.id}/data.json`);
        if (!fs.existsSync(dataPath)) {
          dataPath = path.join(process.cwd(), `../client/characters_assets/${char.id}/data.json`);
        }
        
        if (fs.existsSync(dataPath)) {
          const individualData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          
          // Update unified data with individual data (prioritize individual data)
          const updatedChar = {
            ...char,
            ...individualData,
            // Keep unified-specific fields
            id: char.id,
            // Ensure arrays are properly handled
            factions: individualData.factions || char.factions || [],
            period: individualData.period || char.period || [],
            tags: individualData.tags || char.tags || []
          };
          
          // Update the character in unified array
          const charIndex = unifiedData.findIndex((c: any) => c.id === char.id);
          if (charIndex !== -1) {
            unifiedData[charIndex] = updatedChar;
            updatedCount++;
          }
        }
      } catch (error) {
        console.warn(`⚠️ Failed to sync character ${char.id}:`, error);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    console.log(`✅ Synchronized ${updatedCount} characters in unified file`);
    
  } catch (error) {
    console.error('❌ Failed to sync characters_unified.json:', error);
  }
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
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 version:
 *                   type: string
 *                   example: "v1.2.28"
 */
app.get("/health", (_req, res) => res.json({ ok: true, version: "v1.4.6" }));

// Debug endpoint to check database schema
app.get("/debug/schema", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'ScheduledGame' 
      ORDER BY ordinal_position;
    `;
    res.json({ ok: true, schema: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Debug endpoint to check migration status
app.get("/debug/migrations", async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 10;
    `;
    res.json({ ok: true, migrations: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Emergency endpoint to resolve failed migrations
app.post("/debug/resolve-migration", async (_req, res) => {
  try {
    // Mark the failed migration as resolved
    await prisma.$executeRaw`
      UPDATE _prisma_migrations 
      SET finished_at = NOW(), 
          logs = 'Resolved manually via debug endpoint'
      WHERE migration_name = '20251001105500_add_city_country_payment_to_scheduled_games' 
      AND finished_at IS NULL;
    `;
    res.json({ ok: true, message: 'Migration marked as resolved' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Debug endpoint to check your IP
app.get("/debug/my-ip", (req, res) => {
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  
  res.json({ 
    ok: true, 
    ip: ip,
    forwarded: forwarded,
    realIp: realIp,
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'x-client-ip': req.headers['x-client-ip'],
      'cf-connecting-ip': req.headers['cf-connecting-ip']
    }
  });
});

// Debug endpoint to check Google OAuth configuration
app.get("/debug/google-oauth", (req, res) => {
  res.json({
    ok: true,
    clientId: GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
    callbackUrl: GOOGLE_CALLBACK_URL,
    expectedCallbackUrl: 'https://shpoint.netlify.app/backend-auth/google/callback',
    directCallbackUrl: 'https://shpoint-prod.onrender.com/auth/google/callback'
  });
});

// Debug endpoint to check allowed emails
app.get("/debug/allowed-emails", async (req, res) => {
  try {
    const allowedEmails = await prisma.allowedEmail.findMany({
      where: { isActive: true },
      select: { email: true, createdAt: true }
    });
    res.json({
      ok: true,
      count: allowedEmails.length,
      emails: allowedEmails
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Debug endpoint to check trusted IPs
app.get("/debug/trusted-ips", async (req, res) => {
  try {
    const trustedIPs = await prisma.trustedIP.findMany({
      where: { isActive: true },
      select: { ip: true, description: true, createdAt: true }
    });
    res.json({
      ok: true,
      count: trustedIPs.length,
      ips: trustedIPs
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Endpoint to add trusted IP (admin only)
app.post("/debug/add-trusted-ip", ensureAuth, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { ip, description } = req.body;

    if (!userId || !ip) {
      return res.status(400).json({ ok: false, error: 'User ID and IP are required' });
    }

    const trustedIP = await prisma.trustedIP.create({
      data: {
        ip: ip.trim(),
        description: description || `Added by user ${userId}`,
        createdBy: userId
      }
    });

    res.json({
      ok: true,
      message: 'Trusted IP added successfully',
      trustedIP
    });
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ ok: false, error: 'IP already exists in trusted list' });
    } else {
      res.status(500).json({ ok: false, error: error.message });
    }
  }
});

// Test email configuration
app.get("/api/test-email", ensureAuth, async (req, res) => {
  try {
    const result = await testEmailConfiguration();
    res.json({ ok: true, result });
  } catch (error: any) {
    console.error('Email test error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Delete user by email (admin only) - for testing
  app.delete("/api/admin/users-by-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      console.log('🗑️  Deleting user by email:', email);
      
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      
      await prisma.user.delete({
        where: { email }
      });
      
      console.log('✅ User deleted:', email);
      res.json({ ok: true, message: `User ${email} deleted successfully` });
    } catch (error: any) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // Debug endpoint to remove email from allowedEmails (no auth required for testing)
  app.delete("/api/debug/remove-allowed-email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      console.log('🗑️  Removing allowed email:', email);
      
      const allowedEmail = await prisma.allowedEmail.findUnique({
        where: { email }
      });
      
      if (!allowedEmail) {
        return res.status(404).json({ ok: false, error: 'Allowed email not found' });
      }
      
      await prisma.allowedEmail.delete({
        where: { email }
      });
      
      console.log('✅ Allowed email removed:', email);
      res.json({ ok: true, message: `Allowed email ${email} removed successfully` });
    } catch (error: any) {
      console.error('❌ Error removing allowed email:', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  // Debug endpoint to change user role by email (no auth required for testing)
  app.patch("/api/debug/change-user-role/:email", async (req, res) => {
    try {
      const { email } = req.params;
      const { role } = req.body;
      
      console.log('🔄 Changing role for user:', email, 'to:', role);
      
      if (!['GUEST', 'USER', 'EDITOR', 'ADMIN', 'API_USER'].includes(role)) {
        return res.status(400).json({ ok: false, error: 'Invalid role' });
      }
      
      const user = await prisma.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        return res.status(404).json({ ok: false, error: 'User not found' });
      }
      
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { role }
      });
      
      console.log('✅ User role updated:', email, 'to', role);
      res.json({ ok: true, user: updatedUser });
    } catch (error: any) {
      console.error('❌ Error updating user role:', error);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

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
  (req, res, next) => {
    // Store the return URL in session if provided
    console.log('🔍 Google OAuth start - query:', req.query);
    console.log('🔍 Google OAuth start - returnTo:', req.query.returnTo);
    if (req.query.returnTo) {
      // @ts-ignore
      (req.session as any).returnTo = req.query.returnTo as string;
      console.log('🔍 Google OAuth start - stored returnTo in session:', req.query.returnTo);
    }
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

// callback (działa dla obu: direct i proxy)
app.get(
  "/auth/google/callback",
  (req, res, next) => {
    // Store origin for failure redirect
    (req as any).origin = req.get('origin');
    console.log('🔍 Google OAuth callback - query params:', req.query);
    console.log('🔍 Google OAuth callback - headers:', req.headers);
    next();
  },
  passport.authenticate("google", { failureRedirect: "/auth/google/failure" }),
  async (req, res) => {
    // express-session automatically handles session management with Passport
    console.log('🔍 Google OAuth callback - user:', req.user?.email);
    // @ts-ignore
    console.log('🔍 Google OAuth callback - session:', req.session?.id);
    console.log('🔍 Google OAuth callback - cookies:', req.headers.cookie);
    console.log('🔍 Google OAuth callback - origin:', req.get('origin'));
    
    // Log successful login
    if (req.user) {
      await logAuditEvent({
        entityType: 'USER',
        entityId: req.user.id,
        action: 'LOGIN',
        userId: req.user.id,
        description: `Google OAuth login successful: ${req.user.email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Zapisuj sesję przed redirectem - ważne dla Safari
    // @ts-ignore
    req.session.save(() => {
      // Check if there's a return URL in the session, otherwise default to home page
      // @ts-ignore
      const returnUrl = (req.session as any).returnTo || '/';
      const frontendUrl = getFrontendUrl(req.get('origin'));
      // @ts-ignore
      console.log('🔍 Google OAuth callback - returnTo from session:', (req.session as any).returnTo);
      console.log('🔍 Google OAuth callback - final returnUrl:', returnUrl);
      console.log('🔍 Google OAuth callback - frontend URL:', frontendUrl);
      console.log('🔍 Google OAuth callback - redirecting to:', `${frontendUrl}${returnUrl}`);
      res.redirect(`${frontendUrl}${returnUrl}`);
    });
  }
);

// Google OAuth failure redirect
app.get("/auth/google/failure", (req, res) => {
  const origin = (req as any).origin || req.get('origin');
  const frontendUrl = getFrontendUrl(origin);
  res.redirect(`${frontendUrl}/unauthorized`);
});

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
    // @ts-ignore
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
    if (user && user.id) {
      // Get full user object from database
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (fullUser && fullUser.status === 'SUSPENDED' && fullUser.suspendedUntil) {
        const now = new Date();
        const suspendedUntil = new Date(fullUser.suspendedUntil);
        
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
    }
    next();
  } catch (error) {
    console.error('Error updating user status:', error);
    next();
  }
}

// Debug endpoint to check session without auth
app.get("/api/debug-session", (req, res) => {
  console.log('🔍 Debug session endpoint called');
  console.log('🔍 req.user:', req.user);
  // @ts-ignore
  console.log('🔍 req.session:', req.session?.id);
  // @ts-ignore
  console.log('🔍 req.session.passport:', (req.session as any)?.passport);
  console.log('🔍 cookies:', req.headers.cookie);
  
  res.json({ 
    ok: true, 
    user: req.user || null,
    // @ts-ignore
    sessionId: req.session?.id || null,
    // @ts-ignore
    passport: (req.session as any)?.passport || null,
    cookies: req.headers.cookie || null
  });
});

/**
 * @swagger
 * /api/me:
 *   get:
 *     summary: Get current user information
 *     description: Returns the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/me", ensureAuth, updateUserStatusIfNeeded, async (req, res) => {
  // @ts-ignore
  const user = req.user;
  
  // Log user login/status check
  await logAuditEvent({
    entityType: 'USER',
    entityId: user.id,
    action: 'LOGIN',
    userId: user.id,
    description: `User status check: ${user.email}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.json({ ok: true, user: publicUser(user) });
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

// GET /characters/:id/portrait.png — portret postaci
app.get("/characters/:id/portrait.png", async (req, res) => {
  try {
    const { id } = req.params;
    const fs = await import('fs');
    const path = await import('path');
    
    // Try production path first, then fallback to development path
    let portraitPath = path.join(process.cwd(), `characters_assets/${id}/portrait.png`);
    if (!fs.existsSync(portraitPath)) {
      portraitPath = path.join(process.cwd(), `../client/characters_assets/${id}/portrait.png`);
    }
    
    if (!fs.existsSync(portraitPath)) {
      return res.status(404).json({ ok: false, error: "Character portrait not found" });
    }
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(portraitPath);
  } catch (error) {
    console.error(`Error loading character portrait for ${req.params.id}:`, error);
    res.status(500).json({ ok: false, error: "Failed to load character portrait" });
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
/**
 * @swagger
 * /api/characters:
 *   get:
 *     summary: Get all characters
 *     description: Returns a list of all available characters
 *     tags: [Characters]
 *     responses:
 *       200:
 *         description: List of characters retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Character'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

// POST /api/characters — create new character (Admin/Editor only)
app.post("/api/characters", ensureAuth, async (req, res) => {
  try {
    console.log('POST /api/characters called');
    // @ts-ignore
    const user = req.user;
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // Check if user has permission (Admin or Editor)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      console.log('Access denied: User does not have permission');
      return res.status(403).json({ ok: false, error: 'Access denied. Admin or Editor role required.' });
    }
    
    const characterData = req.body;
    console.log('Creating character with data:', characterData);
    
    // Validate required fields
    if (!characterData.name || !characterData.name.trim()) {
      return res.status(400).json({ ok: false, error: 'Character name is required' });
    }
    
    // Generate unique ID if not provided
    const id = characterData.id || `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Import fs and path
    const fs = await import('fs');
    const path = await import('path');
    
    // Create character directory
    const characterDir = path.join(process.cwd(), `characters_assets/${id}`);
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }
    
    // Prepare character data
    const newCharacter = {
      ...characterData,
      id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Write character data file
    const dataPath = path.join(characterDir, 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(newCharacter, null, 2));
    
    console.log('Character created successfully:', id);
    res.status(201).json({ ok: true, character: newCharacter });
    
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ ok: false, error: 'Failed to create character' });
  }
});

// POST /backend-api/characters — create new character for Netlify proxy (Admin/Editor only)
app.post("/backend-api/characters", ensureAuth, async (req, res) => {
  try {
    console.log('POST /backend-api/characters called');
    // @ts-ignore
    const user = req.user;
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // Check if user has permission (Admin or Editor)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      console.log('Access denied: User does not have permission');
      return res.status(403).json({ ok: false, error: 'Access denied. Admin or Editor role required.' });
    }
    
    const characterData = req.body;
    console.log('Creating character with data:', characterData);
    
    // Validate required fields
    if (!characterData.name || !characterData.name.trim()) {
      return res.status(400).json({ ok: false, error: 'Character name is required' });
    }
    
    // Generate unique ID if not provided
    const id = characterData.id || `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Import fs and path
    const fs = await import('fs');
    const path = await import('path');
    
    // Create character directory
    const characterDir = path.join(process.cwd(), `characters_assets/${id}`);
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }
    
    // Prepare character data
    const newCharacter = {
      ...characterData,
      id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Write character data file
    const dataPath = path.join(characterDir, 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(newCharacter, null, 2));
    
    console.log('Character created successfully:', id);
    res.status(201).json({ ok: true, character: newCharacter });
    
  } catch (error) {
    console.error('Error creating character:', error);
    res.status(500).json({ ok: false, error: 'Failed to create character' });
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
    
    // Get original data for audit logging
    let originalData: any = null;
    let originalDataPath = path.join(process.cwd(), `characters_assets/${characterId}/data.json`);
    if (!fs.existsSync(originalDataPath)) {
      originalDataPath = path.join(process.cwd(), `../client/characters_assets/${characterId}/data.json`);
    }
    if (fs.existsSync(originalDataPath)) {
      try {
        originalData = JSON.parse(fs.readFileSync(originalDataPath, 'utf8'));
      } catch (error) {
        console.log('Could not read original data for audit logging');
      }
    }
    
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
    
    // Log the character update
    const updatedData = characterData;
    await logAuditEvent({
      entityType: 'CHARACTER',
      entityId: characterId,
      action: 'UPDATE',
      userId: user.id,
      description: `Character ${characterId} updated by ${user.email}`,
      changes: {
        before: originalData,
        after: updatedData
      }
    });
    
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

// PUT /backend-api/characters/:id — update character data for Netlify proxy (Admin/Editor only)
app.put("/backend-api/characters/:id", ensureAuth, async (req, res) => {
  try {
    console.log('PUT /backend-api/characters/:id called');
    // @ts-ignore
    const user = req.user;
    console.log('User:', user?.email, 'Role:', user?.role);
    
    // Check if user has permission (Admin or Editor)
    if (!user || (user.role !== 'ADMIN' && user.role !== 'EDITOR')) {
      console.log('Access denied: User does not have permission');
      return res.status(403).json({ ok: false, error: 'Access denied. Admin or Editor role required.' });
    }
    
    const { id } = req.params;
    const characterData = req.body;
    
    console.log('Updating character:', id, 'with data:', characterData);
    
    // Validate required fields
    if (!characterData.name || !characterData.name.trim()) {
      return res.status(400).json({ ok: false, error: 'Character name is required' });
    }
    
    // Import fs and path
    const fs = await import('fs');
    const path = await import('path');
    
    // Try production path first, then fallback to development path
    let dataPath = path.join(process.cwd(), `characters_assets/${id}/data.json`);
    if (!fs.existsSync(dataPath)) {
      dataPath = path.join(process.cwd(), `../client/characters_assets/${id}/data.json`);
    }
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ ok: false, error: 'Character not found' });
    }
    
    // Read existing data
    const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Update with new data
    const updatedData = {
      ...existingData,
      ...characterData,
      id: id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Write back to file
    fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2));
    
    // Log the character update
    await logAuditEvent({
      entityType: 'CHARACTER',
      entityId: id,
      action: 'UPDATE',
      userId: user.id,
      description: `Character ${id} updated by ${user.email}`,
      changes: {
        before: existingData,
        after: updatedData
      }
    });
    
    console.log('Character updated successfully:', id);
    
    // Synchronize characters_unified.json with updated data
    await syncCharactersUnified();
    
    res.json({ ok: true, character: updatedData });
    
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ ok: false, error: 'Failed to update character' });
  }
});

// PUT /backend-api/characters/:id/stance — update character stance data for Netlify proxy (Admin/Editor only)
app.put("/backend-api/characters/:id/stance", ensureAuth, async (req, res) => {
  try {
    console.log('PUT /backend-api/characters/:id/stance called');
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
    
    // Synchronize characters_unified.json after stance update
    await syncCharactersUnified();
    
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
    
    // Synchronize characters_unified.json after stance update
    await syncCharactersUnified();
    
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

// POST /api/admin/sync-characters — manually sync characters_unified.json (Admin only)
app.post("/api/admin/sync-characters", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin permissions required' });
    }
    
    console.log('Manual character sync requested by:', user.email);
    await syncCharactersUnified();
    
    res.json({ ok: true, message: 'Characters synchronized successfully' });
  } catch (error) {
    console.error('Error during manual sync:', error);
    res.status(500).json({ ok: false, error: 'Failed to sync characters' });
  }
});

// GET /api/debug/check-ip — check what IP the server sees
app.get("/api/debug/check-ip", async (req, res) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const clientIP = req.ip || req.connection.remoteAddress || 
    (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
    (Array.isArray(realIp) ? realIp[0] : realIp);
  
  res.json({ 
    ok: true, 
    ip: clientIP,
    details: {
      req_ip: req.ip,
      connection_remoteAddress: req.connection.remoteAddress,
      x_forwarded_for: req.headers['x-forwarded-for'],
      x_real_ip: req.headers['x-real-ip']
    }
  });
});

// POST /api/debug/fix-factions — debug fix factions for trusted IPs only
app.post("/api/debug/fix-factions", async (req, res) => {
  try {
    const trustedIPs = ['89.151.22.52', '172.64.198.126', '172.71.151.174', '172.71.150.15', '162.158.102.247']; // Your IP and proxy IPs
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIP = req.ip || req.connection.remoteAddress || 
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
      (Array.isArray(realIp) ? realIp[0] : realIp);
    
    if (!trustedIPs.includes(clientIP)) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    
    console.log('🔧 Debug fix factions requested from trusted IP:', clientIP);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let fixedCount = 0;
    const errors: string[] = [];
    
    // Faction mapping based on character names and context
    const factionMap: { [key: string]: string[] } = {
      'rebel': ['Rebel Alliance'],
      'empire': ['Galactic Empire'],
      'republic': ['Galactic Republic'],
      'separatist': ['Separatist'],
      'mandalorian': ['Mandalorian'],
      'jedi': ['Jedi'],
      'sith': ['Sith'],
      'clone': ['Clone Trooper'],
      'droid': ['Droid'],
      'bounty': ['Bounty Hunter'],
      'scoundrel': ['Scoundrel'],
      'spy': ['Spy'],
      'trooper': ['Troopers'],
      'scout': ['Scout']
    };
    
    for (const char of unifiedData) {
      try {
        if (!char.factions || char.factions.length === 0 || char.factions.includes(null)) {
          const name = char.name?.toLowerCase() || '';
          const id = char.id?.toLowerCase() || '';
          
          let detectedFactions: string[] = [];
          
          // Check name and id for faction keywords
          for (const [keyword, factions] of Object.entries(factionMap)) {
            if (name.includes(keyword) || id.includes(keyword)) {
              detectedFactions.push(...factions);
            }
          }
          
          // Special cases
          if (name.includes('cassian') || name.includes('jyn') || name.includes('baze') || name.includes('chirrut') || name.includes('bodhi') || name.includes('k-2so')) {
            detectedFactions.push('Rebel Alliance');
          }
          
          if (detectedFactions.length > 0) {
            char.factions = [...new Set(detectedFactions)]; // Remove duplicates
            fixedCount++;
          }
        }
      } catch (error) {
        errors.push(`Failed to fix factions for ${char.id}: ${error}`);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    
    // Sync individual files
    await syncCharactersUnified();
    
    res.json({ 
      ok: true, 
      message: 'Missing factions fixed successfully',
      convertedCount: fixedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error fixing missing factions:', error);
    res.status(500).json({ ok: false, error: 'Failed to fix missing factions' });
  }
});

// POST /api/debug/fix-set-codes — debug fix set codes for trusted IPs only
app.post("/api/debug/fix-set-codes", async (req, res) => {
  try {
    const trustedIPs = ['89.151.22.52', '172.64.198.126', '172.71.151.174', '172.71.150.15', '162.158.102.247']; // Your IP and proxy IPs
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIP = req.ip || req.connection.remoteAddress || 
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
      (Array.isArray(realIp) ? realIp[0] : realIp);
    
    if (!trustedIPs.includes(clientIP)) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    
    console.log('🔧 Debug fix set codes requested from trusted IP:', clientIP);
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let fixedCount = 0;
    const errors: string[] = [];
    
    for (const char of unifiedData) {
      try {
        if (!char.set_code || char.set_code === null) {
          // Try to determine set code from character name/context
          const name = char.name?.toLowerCase() || '';
          
          if (name.includes('cassian') || name.includes('jyn') || name.includes('baze') || name.includes('chirrut') || name.includes('bodhi') || name.includes('k-2so')) {
            char.set_code = 'SWP24'; // Rogue One set
            fixedCount++;
          } else if (name.includes('rebel') && (name.includes('commando') || name.includes('pathfinder'))) {
            char.set_code = 'SWP24'; // Rogue One set
            fixedCount++;
          }
          // Add more set code mappings as needed
        }
      } catch (error) {
        errors.push(`Failed to fix set_code for ${char.id}: ${error}`);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    
    // Sync individual files
    await syncCharactersUnified();
    
    res.json({ 
      ok: true, 
      message: 'Missing set codes fixed successfully',
      convertedCount: fixedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error fixing missing set codes:', error);
    res.status(500).json({ ok: false, error: 'Failed to fix missing set codes' });
  }
});

// POST /api/debug/sync-characters — debug sync for trusted IPs only
app.post("/api/debug/sync-characters", async (req, res) => {
  try {
    const trustedIPs = ['89.151.22.52', '172.64.198.126', '172.71.151.174', '172.71.150.15', '162.158.102.247']; // Your IP and proxy IPs
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const clientIP = req.ip || req.connection.remoteAddress || 
      (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor) ||
      (Array.isArray(realIp) ? realIp[0] : realIp);
    
    console.log('🔍 Debug sync request - IP details:', {
      req_ip: req.ip,
      connection_remoteAddress: req.connection.remoteAddress,
      x_forwarded_for: req.headers['x-forwarded-for'],
      x_real_ip: req.headers['x-real-ip'],
      clientIP: clientIP,
      trustedIPs: trustedIPs
    });
    
    if (!trustedIPs.includes(clientIP)) {
      console.log('❌ Access denied for IP:', clientIP);
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    
    console.log('✅ Debug character sync requested from trusted IP:', clientIP);
    await syncCharactersUnified();
    
    res.json({ ok: true, message: 'Characters synchronized successfully via debug endpoint' });
  } catch (error) {
    console.error('Error during debug sync:', error);
    res.status(500).json({ ok: false, error: 'Failed to sync characters' });
  }
});

// ===== DATA CONVERSION TOOLS =====

// POST /api/admin/convert-legacy-abilities — convert old ability format to new structured format
app.post("/api/admin/convert-legacy-abilities", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin permissions required' });
    }
    
    console.log('Converting legacy abilities to structured format...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let convertedCount = 0;
    const errors: string[] = [];
    
    for (const char of unifiedData) {
      try {
        if (char.abilities && Array.isArray(char.abilities)) {
          const structuredAbilities = char.abilities.map((ability: any, index: number) => {
            // If already structured, skip
            if (ability.id && ability.type && ability.symbol) {
              return ability;
            }
            
            // Convert legacy format
            const structuredAbility = {
              id: ability.id || `${char.id}-ability-${index}`,
              type: ability.type || 'Active',
              symbol: ability.symbol || '↻',
              name: ability.title || ability.name || `Ability ${index + 1}`,
              description: ability.text || ability.description || '',
              forceCost: ability.forceCost || 0,
              damageCost: ability.damageCost || undefined,
              trigger: ability.trigger || 'on_activation',
              isAction: ability.isAction || false,
              tags: ability.tags || []
            };
            
            return structuredAbility;
          });
          
          char.structuredAbilities = structuredAbilities;
          convertedCount++;
        }
      } catch (error) {
        errors.push(`Failed to convert abilities for ${char.id}: ${error}`);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    
    // Sync individual files
    await syncCharactersUnified();
    
    res.json({ 
      ok: true, 
      message: 'Legacy abilities converted successfully',
      convertedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error converting legacy abilities:', error);
    res.status(500).json({ ok: false, error: 'Failed to convert legacy abilities' });
  }
});

// POST /api/admin/fix-missing-factions — add missing faction data
app.post("/api/admin/fix-missing-factions", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin permissions required' });
    }
    
    console.log('Fixing missing faction data...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let fixedCount = 0;
    const errors: string[] = [];
    
    // Faction mapping based on character names and context
    const factionMap: { [key: string]: string[] } = {
      'rebel': ['Rebel Alliance'],
      'empire': ['Galactic Empire'],
      'republic': ['Galactic Republic'],
      'separatist': ['Separatist'],
      'mandalorian': ['Mandalorian'],
      'jedi': ['Jedi'],
      'sith': ['Sith'],
      'clone': ['Clone Trooper'],
      'droid': ['Droid'],
      'bounty': ['Bounty Hunter'],
      'scoundrel': ['Scoundrel'],
      'spy': ['Spy'],
      'trooper': ['Troopers'],
      'scout': ['Scout']
    };
    
    for (const char of unifiedData) {
      try {
        if (!char.factions || char.factions.length === 0 || char.factions.includes(null)) {
          const name = char.name?.toLowerCase() || '';
          const id = char.id?.toLowerCase() || '';
          
          let detectedFactions: string[] = [];
          
          // Check name and id for faction keywords
          for (const [keyword, factions] of Object.entries(factionMap)) {
            if (name.includes(keyword) || id.includes(keyword)) {
              detectedFactions.push(...factions);
            }
          }
          
          // Special cases
          if (name.includes('cassian') || name.includes('jyn') || name.includes('baze') || name.includes('chirrut') || name.includes('bodhi')) {
            detectedFactions.push('Rebel Alliance');
          }
          
          if (detectedFactions.length > 0) {
            char.factions = [...new Set(detectedFactions)]; // Remove duplicates
            fixedCount++;
          }
        }
      } catch (error) {
        errors.push(`Failed to fix factions for ${char.id}: ${error}`);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    
    // Sync individual files
    await syncCharactersUnified();
    
    res.json({ 
      ok: true, 
      message: 'Missing factions fixed successfully',
      convertedCount: fixedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error fixing missing factions:', error);
    res.status(500).json({ ok: false, error: 'Failed to fix missing factions' });
  }
});

// POST /api/admin/fix-missing-set-codes — add missing set_code data
app.post("/api/admin/fix-missing-set-codes", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin permissions required' });
    }
    
    console.log('Fixing missing set_code data...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let fixedCount = 0;
    const errors: string[] = [];
    
    for (const char of unifiedData) {
      try {
        if (!char.set_code || char.set_code === null) {
          // Try to determine set code from character name/context
          const name = char.name?.toLowerCase() || '';
          
          if (name.includes('cassian') || name.includes('jyn') || name.includes('baze') || name.includes('chirrut') || name.includes('bodhi') || name.includes('k-2so')) {
            char.set_code = 'SWP24'; // Rogue One set
            fixedCount++;
          } else if (name.includes('rebel') && (name.includes('commando') || name.includes('pathfinder'))) {
            char.set_code = 'SWP24'; // Rogue One set
            fixedCount++;
          }
          // Add more set code mappings as needed
        }
      } catch (error) {
        errors.push(`Failed to fix set_code for ${char.id}: ${error}`);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    
    // Sync individual files
    await syncCharactersUnified();
    
    res.json({ 
      ok: true, 
      message: 'Missing set codes fixed successfully',
      convertedCount: fixedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error fixing missing set codes:', error);
    res.status(500).json({ ok: false, error: 'Failed to fix missing set codes' });
  }
});

// POST /api/admin/normalize-unit-types — normalize unit_type format
app.post("/api/admin/normalize-unit-types", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin permissions required' });
    }
    
    console.log('Normalizing unit_type format...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let normalizedCount = 0;
    const errors: string[] = [];
    
    for (const char of unifiedData) {
      try {
        if (char.unit_type) {
          // Convert string to array if needed
          if (typeof char.unit_type === 'string') {
            char.unit_type = [char.unit_type];
            normalizedCount++;
          } else if (Array.isArray(char.unit_type) && char.unit_type.length === 0) {
            // Set default if empty array
            char.unit_type = ['Primary'];
            normalizedCount++;
          }
        } else {
          // Set default if missing
          char.unit_type = ['Primary'];
          normalizedCount++;
        }
      } catch (error) {
        errors.push(`Failed to normalize unit_type for ${char.id}: ${error}`);
      }
    }
    
    // Write updated unified file
    fs.writeFileSync(unifiedPath, JSON.stringify(unifiedData, null, 2));
    
    // Sync individual files
    await syncCharactersUnified();
    
    res.json({ 
      ok: true, 
      message: 'Unit types normalized successfully',
      convertedCount: normalizedCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error normalizing unit types:', error);
    res.status(500).json({ ok: false, error: 'Failed to normalize unit types' });
  }
});

// POST /api/admin/add-missing-stance-files — create missing stance.json files
app.post("/api/admin/add-missing-stance-files", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin permissions required' });
    }
    
    console.log('Adding missing stance files...');
    
    const fs = await import('fs');
    const path = await import('path');
    
    // Load characters_unified.json
    let unifiedPath = path.join(process.cwd(), 'characters_assets/characters_unified.json');
    if (!fs.existsSync(unifiedPath)) {
      unifiedPath = path.join(process.cwd(), '../client/characters_assets/characters_unified.json');
    }
    
    if (!fs.existsSync(unifiedPath)) {
      return res.status(404).json({ ok: false, error: 'characters_unified.json not found' });
    }
    
    const unifiedData = JSON.parse(fs.readFileSync(unifiedPath, 'utf8'));
    let createdCount = 0;
    const errors: string[] = [];
    
    for (const char of unifiedData) {
      try {
        let stancePath = path.join(process.cwd(), `characters_assets/${char.id}/stance.json`);
        if (!fs.existsSync(stancePath)) {
          stancePath = path.join(process.cwd(), `../client/characters_assets/${char.id}/stance.json`);
        }
        
        if (!fs.existsSync(stancePath)) {
          // Create directory if it doesn't exist
          const stanceDir = path.dirname(stancePath);
          if (!fs.existsSync(stanceDir)) {
            fs.mkdirSync(stanceDir, { recursive: true });
          }
          
          // Create basic stance data
          const basicStance = {
            sides: [
              {
                name: "Side A",
                dice: [4, 3], // Default dice values
                expertise: [1, 2], // Default expertise values
                tree: {
                  nodes: [
                    { id: "start", x: 100, y: 50, type: "start" },
                    { id: "attack1", x: 200, y: 50, type: "attack" },
                    { id: "attack2", x: 300, y: 50, type: "attack" }
                  ],
                  edges: [
                    { from: "start", to: "attack1" },
                    { from: "attack1", to: "attack2" }
                  ]
                }
              }
            ]
          };
          
          fs.writeFileSync(stancePath, JSON.stringify(basicStance, null, 2));
          createdCount++;
        }
      } catch (error) {
        errors.push(`Failed to create stance file for ${char.id}: ${error}`);
      }
    }
    
    res.json({ 
      ok: true, 
      message: 'Missing stance files created successfully',
      convertedCount: createdCount,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Error creating missing stance files:', error);
    res.status(500).json({ ok: false, error: 'Failed to create missing stance files' });
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

// ===== FACTION MANAGEMENT API =====

// GET /api/factions — get all available factions
app.get("/api/factions", async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    const taxoPath = path.join(process.cwd(), 'shared/data/taxo.json');
    const taxoData = JSON.parse(fs.readFileSync(taxoPath, 'utf8'));
    
    res.json({ ok: true, factions: taxoData.knownFactions || [] });
  } catch (error) {
    console.error("Error fetching factions:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch factions" });
  }
});

// POST /api/factions — add new faction (Admin/Editor only)
app.post("/api/factions", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN' && user.role !== 'EDITOR') {
      return res.status(403).json({ ok: false, error: "Insufficient permissions" });
    }
    
    const { faction } = req.body;
    if (!faction || typeof faction !== 'string' || !faction.trim()) {
      return res.status(400).json({ ok: false, error: "Faction name is required" });
    }
    
    const fs = await import('fs');
    const path = await import('path');
    
    const taxoPath = path.join(process.cwd(), 'shared/data/taxo.json');
    const taxoData = JSON.parse(fs.readFileSync(taxoPath, 'utf8'));
    
    const factionName = faction.trim();
    
    // Check if faction already exists
    if (taxoData.knownFactions.includes(factionName)) {
      return res.status(400).json({ ok: false, error: "Faction already exists" });
    }
    
    // Add faction to the list
    taxoData.knownFactions.push(factionName);
    
    // Write back to file
    fs.writeFileSync(taxoPath, JSON.stringify(taxoData, null, 2));
    
    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'CREATE' as any,
      entityType: 'SYSTEM_SETTINGS' as any,
      entityId: 'faction',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ ok: true, faction: factionName });
  } catch (error) {
    console.error("Error adding faction:", error);
    res.status(500).json({ ok: false, error: "Failed to add faction" });
  }
});

// DELETE /api/factions/:faction — remove faction (Admin only)
app.delete("/api/factions/:faction", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: "Admin permissions required" });
    }
    
    const { faction } = req.params;
    if (!faction) {
      return res.status(400).json({ ok: false, error: "Faction name is required" });
    }
    
    const fs = await import('fs');
    const path = await import('path');
    
    const taxoPath = path.join(process.cwd(), 'shared/data/taxo.json');
    const taxoData = JSON.parse(fs.readFileSync(taxoPath, 'utf8'));
    
    // Check if faction exists
    const factionIndex = taxoData.knownFactions.indexOf(faction);
    if (factionIndex === -1) {
      return res.status(404).json({ ok: false, error: "Faction not found" });
    }
    
    // Remove faction from the list
    taxoData.knownFactions.splice(factionIndex, 1);
    
    // Write back to file
    fs.writeFileSync(taxoPath, JSON.stringify(taxoData, null, 2));
    
    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: 'DELETE' as any,
      entityType: 'SYSTEM_SETTINGS' as any,
      entityId: 'faction',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ ok: true, faction });
  } catch (error) {
    console.error("Error removing faction:", error);
    res.status(500).json({ ok: false, error: "Failed to remove faction" });
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

// GET /api/missions — get list of all available missions (public, no rate limit)
app.get("/api/missions", async (req, res) => {
  try {
    // Core missions only (4 from official core set)
    const missions = [
      { id: 'any', name: 'Any Mission', description: 'Player preference' },
      { id: 'sabotage-showdown', name: 'Sabotage Showdown', description: 'Core mission pack' },
      { id: 'shifting-priorities', name: 'Shifting Priorities', description: 'Core mission pack' },
      { id: 'first-contact', name: 'First Contact', description: 'Core mission pack' },
      { id: 'never-tell-me-the-odds', name: 'Never Tell Me the Odds', description: 'Core mission pack' }
    ];
    
    res.json({ ok: true, missions });
  } catch (error) {
    console.error("Error fetching missions:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch missions" });
  }
});

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

// Middleware to check if user has API access (ADMIN or API_USER)
const ensureApiAccess = (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const user = req.user;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'API_USER')) {
    return res.status(403).json({ ok: false, error: 'API access required' });
  }
  next();
};

// Add endpoint to check if user has API access
app.get("/api/check-api-access", ensureAuth, (req, res) => {
  // @ts-ignore
  const user = req.user;
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'API_USER';
  res.json({ 
    ok: true, 
    hasAccess, 
    user: { 
      id: user?.id, 
      email: user?.email, 
      role: user?.role 
    } 
  });
});

// API Token management endpoints
app.get("/api/admin/api-tokens", ensureAuth, ensureAdmin, async (req, res) => {
  try {
        const tokens = await (prisma as any).apiToken.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ ok: true, tokens });
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch API tokens" });
  }
});

app.post("/api/admin/api-tokens", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { userId, name, expiresAt } = req.body;
    // @ts-ignore
    const adminUser = req.user;
    
    // Generate a secure random token
    const token = `sp_${require('crypto').randomBytes(32).toString('hex')}`;
    
        const apiToken = await (prisma as any).apiToken.create({
      data: {
        name,
        token,
        userId,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    });
    
    // Log the creation
    await logAuditEvent({
      entityType: 'USER',
      entityId: userId,
      action: 'CREATE',
      userId: adminUser.id,
      description: `API token created for user: ${apiToken.user.email}`,
      changes: {
        tokenName: name,
        expiresAt: expiresAt
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ ok: true, token: apiToken });
  } catch (error) {
    console.error("Error creating API token:", error);
    res.status(500).json({ ok: false, error: "Failed to create API token" });
  }
});

app.delete("/api/admin/api-tokens/:id", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const adminUser = req.user;
    
        const apiToken = await (prisma as any).apiToken.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
    
    if (!apiToken) {
      return res.status(404).json({ ok: false, error: "API token not found" });
    }
    
        await (prisma as any).apiToken.delete({
      where: { id }
    });
    
    // Log the deletion
    await logAuditEvent({
      entityType: 'USER',
      entityId: apiToken.userId,
      action: 'DELETE',
      userId: adminUser.id,
      description: `API token deleted for user: ${apiToken.user.email}`,
      changes: {
        tokenName: apiToken.name
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ ok: true, message: "API token deleted successfully" });
  } catch (error) {
    console.error("Error deleting API token:", error);
    res.status(500).json({ ok: false, error: "Failed to delete API token" });
  }
});

// Setup Swagger documentation with API access protection
setupSwagger(app, ensureApiAccess);

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
    
    // Get full user object from database
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!fullUser) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    // Get current invitation count
    const invitationsSent = await prisma.allowedEmail.count({
      where: { invitedBy: user.id }
    });
    
    // Get remaining invitations
    const remainingInvitations = Math.max(0, fullUser.invitationsLimit - invitationsSent);
    
    res.json({ 
      ok: true, 
      invitationsSent,
      invitationsLimit: fullUser.invitationsLimit,
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
    
    // Get full user object from database
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!fullUser) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    // Check if user is suspended
    if (fullUser.status === 'SUSPENDED') {
      return res.status(403).json({ ok: false, error: "Suspended users cannot send invitations" });
    }
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ ok: false, error: 'Valid email required' });
    }
    
    // Check if user has remaining invitations
    const invitationsSent = await prisma.allowedEmail.count({
      where: { invitedBy: user.id }
    });
    
    if (invitationsSent >= fullUser.invitationsLimit) {
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
      fullUser.username || fullUser.name || fullUser.email,
      fullUser.email,
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

// Generate API token for API User (admin only)
app.post("/api/admin/users/:id/generate-token", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { id } = req.params;
    const { scopes, expiresInDays = 365 } = req.body;

    // Find the user
    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }

    if (targetUser.role !== 'API_USER') {
      return res.status(400).json({ ok: false, error: 'User must have API_USER role' });
    }

    // Generate token
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000));

    // Save token to database
    const apiToken = await prisma.apiToken.create({
      data: {
        name: `Token for ${targetUser.email}`,
        token,
        userId: targetUser.id,
        scopes: scopes || ['cards:read', 'missions:read', 'sets:read'],
        expiresAt
      } as any
    });

    // Log the action
    await logAuditEvent({
      entityType: 'API_TOKEN' as any,
      entityId: apiToken.id,
      action: 'CREATE',
      userId: user.id,
      description: `API token generated for ${targetUser.email} by ${user.email}`,
      changes: {
        before: null,
        after: {
          scopes: (apiToken as any).scopes,
          expiresAt: apiToken.expiresAt
        }
      }
    });

    res.json({
      ok: true,
      token: {
        id: apiToken.id,
        token: apiToken.token,
        scopes: (apiToken as any).scopes,
        expiresAt: apiToken.expiresAt,
        createdAt: apiToken.createdAt
      }
    });
  } catch (error) {
    console.error("Error generating API token:", error);
    res.status(500).json({ ok: false, error: "Failed to generate API token" });
  }
});

// Get API tokens for a user (admin only)
app.get("/api/admin/users/:id/tokens", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { id } = req.params;

    const tokens = await prisma.apiToken.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        scopes: true,
        expiresAt: true,
        createdAt: true,
        isActive: true
      } as any
    });

    res.json({ ok: true, tokens });
  } catch (error) {
    console.error("Error fetching API tokens:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch API tokens" });
  }
});

// Revoke API token (admin only)
app.delete("/api/admin/tokens/:tokenId", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ ok: false, error: 'Admin access required' });
    }

    const { tokenId } = req.params;

    const token = await prisma.apiToken.findUnique({
      where: { id: tokenId },
      include: { user: true }
    });

    if (!token) {
      return res.status(404).json({ ok: false, error: 'Token not found' });
    }

    await prisma.apiToken.update({
      where: { id: tokenId },
      data: { isActive: false }
    });

    // Log the action
    await logAuditEvent({
      entityType: 'API_TOKEN' as any,
      entityId: tokenId,
      action: 'DELETE',
      userId: user.id,
      description: `API token revoked for ${token.user.email} by ${user.email}`,
      changes: {
        before: { isActive: true },
        after: { isActive: false }
      }
    });

    res.json({ ok: true, message: 'Token revoked successfully' });
  } catch (error) {
    console.error("Error revoking API token:", error);
    res.status(500).json({ ok: false, error: "Failed to revoke API token" });
  }
});

// ===== API ENDPOINTS WITH BEARER AUTHENTICATION =====

// GET /api/v1/characters — get all characters (Bearer auth)
app.get("/api/v1/characters", ensureBearerAuth, requireScope(['cards:read']), async (req, res) => {
  try {
    // Simple implementation - return empty array for now
    res.json({ ok: true, items: [] });
  } catch (error) {
    console.error("Error fetching characters:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch characters" });
  }
});

// GET /api/v1/characters/:id — get specific character (Bearer auth)
app.get("/api/v1/characters/:id", ensureBearerAuth, requireScope(['cards:read']), async (req, res) => {
  try {
    const { id } = req.params;
    // Simple implementation - return 404 for now
    res.status(404).json({ ok: false, error: "Character not found" });
  } catch (error) {
    console.error("Error fetching character:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch character" });
  }
});

// GET /api/v1/missions — get all missions (Bearer auth)
app.get("/api/v1/missions", ensureBearerAuth, requireScope(['missions:read']), async (req, res) => {
  try {
    // Simple implementation - return empty array for now
    res.json({ ok: true, items: [] });
  } catch (error) {
    console.error("Error fetching missions:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch missions" });
  }
});

// GET /api/v1/sets — get all sets (Bearer auth)
app.get("/api/v1/sets", ensureBearerAuth, requireScope(['sets:read']), async (req, res) => {
  try {
    // Simple implementation - return empty array for now
    res.json({ ok: true, items: [] });
  } catch (error) {
    console.error("Error fetching sets:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch sets" });
  }
});

// POST /api/v1/characters — create character (Bearer auth, content:write)
app.post("/api/v1/characters", ensureBearerAuth, requireScope(['content:write']), async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    console.log('POST /api/v1/characters called by:', user?.email, 'Role:', user?.role);
    
    if (!['EDITOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ ok: false, error: 'Editor or Admin role required' });
    }

    const characterData = req.body;
    // Simple implementation - return the data for now
    res.json({ ok: true, character: characterData });
  } catch (error) {
    console.error("Error creating character:", error);
    res.status(500).json({ ok: false, error: "Failed to create character" });
  }
});

// PUT /api/v1/characters/:id — update character (Bearer auth, content:write)
app.put("/api/v1/characters/:id", ensureBearerAuth, requireScope(['content:write']), async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    console.log('PUT /api/v1/characters/:id called by:', user?.email, 'Role:', user?.role);
    
    if (!['EDITOR', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ ok: false, error: 'Editor or Admin role required' });
    }

    const { id } = req.params;
    const characterData = req.body;
    // Simple implementation - return the data for now
    res.json({ ok: true, character: { id, ...characterData } });
  } catch (error) {
    console.error("Error updating character:", error);
    res.status(500).json({ ok: false, error: "Failed to update character" });
  }
});

// GET /api/v1/users — get users (Bearer auth, users:read)
app.get("/api/v1/users", ensureBearerAuth, requireScope(['users:read']), async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    if (!['ADMIN'].includes(user.role)) {
      return res.status(403).json({ ok: false, error: 'Admin role required' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    res.json({ ok: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch users" });
  }
});

// Get current user's API tokens
app.get("/api/me/tokens", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const user = req.user;
    
    if (user.role !== 'API_USER') {
      return res.status(403).json({ ok: false, error: 'API_USER role required' });
    }

    const tokens = await prisma.apiToken.findMany({
      where: { 
        userId: user.id,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        scopes: true,
        expiresAt: true,
        createdAt: true
      } as any
    });

    res.json({ ok: true, tokens });
  } catch (error) {
    console.error("Error fetching user API tokens:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch API tokens" });
  }
});

// DDoS monitoring endpoint (admin only)
app.get("/api/admin/security/ddos", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const now = new Date();
    const activeThreats = Array.from(suspiciousIPs.entries())
      .filter(([ip, data]) => {
        const timeDiff = now.getTime() - data.firstSeen.getTime();
        const requestsPerMinute = (data.count / timeDiff) * 60000;
        return requestsPerMinute > IP_THRESHOLD * 0.5; // Show IPs with >50% of threshold
      })
      .map(([ip, data]) => {
        const timeDiff = now.getTime() - data.firstSeen.getTime();
        const requestsPerMinute = (data.count / timeDiff) * 60000;
        return {
          ip,
          count: data.count,
          requestsPerMinute: Math.round(requestsPerMinute * 100) / 100,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
          duration: Math.round(timeDiff / 1000), // seconds
          isBanned: timeDiff < IP_BAN_DURATION
        };
      })
      .sort((a, b) => b.requestsPerMinute - a.requestsPerMinute);

    res.json({
      ok: true,
      stats: {
        totalTrackedIPs: suspiciousIPs.size,
        activeThreats: activeThreats.length,
        threshold: IP_THRESHOLD,
        banDuration: IP_BAN_DURATION / 1000 / 60 // minutes
      },
      threats: activeThreats
    });
  } catch (error) {
    console.error("Error fetching DDoS stats:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch DDoS stats" });
  }
});

// Clear banned IPs (admin only)
app.delete("/api/admin/security/ddos/clear", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    suspiciousIPs.clear();
    res.json({ ok: true, message: "Cleared all tracked IPs" });
  } catch (error) {
    console.error("Error clearing DDoS data:", error);
    res.status(500).json({ ok: false, error: "Failed to clear DDoS data" });
  }
});

// Get security settings (admin only)
app.get("/api/admin/security/settings", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    res.json({
      ok: true,
      data: {
        rateLimits: {
          general: 500,
          auth: 10,
          api: 100
        },
        ddosThreshold: IP_THRESHOLD,
        banDuration: IP_BAN_DURATION / 1000 / 60, // minutes
        trustedIPs: ['127.0.0.1', '::1', '89.151.22.52']
      }
    });
  } catch (error) {
    console.error("Error fetching security settings:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch security settings" });
  }
});

// Update security settings (admin only)
app.put("/api/admin/security/settings", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { rateLimits, ddosThreshold, banDuration } = req.body;
    
    // Update settings (in a real app, you'd save these to database)
    if (ddosThreshold) {
      // IP_THRESHOLD = ddosThreshold;
    }
    if (banDuration) {
      // IP_BAN_DURATION = banDuration * 60 * 1000;
    }
    
    res.json({ ok: true, message: "Security settings updated" });
  } catch (error) {
    console.error("Error updating security settings:", error);
    res.status(500).json({ ok: false, error: "Failed to update security settings" });
  }
});

// Manage IP whitelist (admin only)
app.post("/api/admin/security/whitelist", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ ok: false, error: "IP address required" });
    }
    
    // Add IP to whitelist (in a real app, you'd save this to database)
    console.log(`🔒 Added IP to whitelist: ${ip}`);
    
    res.json({ ok: true, message: `IP ${ip} added to whitelist` });
  } catch (error) {
    console.error("Error adding IP to whitelist:", error);
    res.status(500).json({ ok: false, error: "Failed to add IP to whitelist" });
  }
});

// Remove IP from whitelist (admin only)
app.delete("/api/admin/security/whitelist", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { ip } = req.body;
    
    if (!ip) {
      return res.status(400).json({ ok: false, error: "IP address required" });
    }
    
    // Remove IP from whitelist (in a real app, you'd save this to database)
    console.log(`🔒 Removed IP from whitelist: ${ip}`);
    
    res.json({ ok: true, message: `IP ${ip} removed from whitelist` });
  } catch (error) {
    console.error("Error removing IP from whitelist:", error);
    res.status(500).json({ ok: false, error: "Failed to remove IP from whitelist" });
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

// Get audit logs (admin only)
/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Returns audit logs for system activities (admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *           enum: [USER, CARD, CHARACTER, MISSION, SET, STRIKE_TEAM, CUSTOM_CARD, COLLECTION, SYSTEM_SETTINGS]
 *         description: Filter by entity type
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Filter by entity ID
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, ROLE_CHANGE, STATUS_CHANGE, PUBLISH, UNPUBLISH, SHARE, UNSHARE]
 *         description: Filter by action type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 logs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden (not admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get("/api/admin/audit-logs", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { entityType, entityId, userId, action, limit = 100, offset = 0 } = req.query;
    
    const logs = await getAuditLogs({
      entityType: entityType as string,
      entityId: entityId as string,
      userId: userId as string,
      action: action as string,
      limit: Number(limit),
      offset: Number(offset),
    });
    
    res.json({ ok: true, logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ ok: false, error: "Failed to fetch audit logs" });
  }
});

// Update user role (admin only)
app.patch("/api/admin/users/:id/role", ensureAuth, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    // @ts-ignore
    const adminUser = req.user;
    
    if (!['GUEST', 'USER', 'EDITOR', 'ADMIN', 'API_USER'].includes(role)) {
      return res.status(400).json({ ok: false, error: 'Invalid role' });
    }
    
    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (!currentUser) {
      return res.status(404).json({ ok: false, error: 'User not found' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: { role }
    });
    
    // Log role change
    await logAuditEvent({
      entityType: 'USER',
      entityId: user.id,
      action: 'ROLE_CHANGE',
      userId: adminUser.id,
      description: `Role changed from ${currentUser.role} to ${role} for ${user.email}`,
      changes: {
        before: { role: currentUser.role },
        after: { role: role }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
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

// Update user avatar (for Netlify proxy - /backend-api/user/avatar)
app.patch("/backend-api/user/avatar", ensureAuth, async (req, res) => {
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

// Reset avatar to Google image (for Netlify proxy - /backend-api/user/avatar/reset)
app.patch("/backend-api/user/avatar/reset", ensureAuth, async (req, res) => {
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

// Update username (for Netlify proxy - /backend-api/user/username)
app.patch("/backend-api/user/username", ensureAuth, async (req, res) => {
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
        return res.status(400).json({ ok: false, error: 'Username already taken' });
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

// GET /backend-api/custom-cards — get user's custom cards for Netlify proxy
app.get("/backend-api/custom-cards", ensureAuth, async (req, res) => {
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

// POST /backend-api/custom-cards — create new custom card for Netlify proxy
app.post("/backend-api/custom-cards", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const {
      name,
      faction,
      unitType = 'PRIMARY',
      squadPoints = 0,
      stamina = 0,
      durability = 0,
      force = 0,
      hanker = 0,
      description,
      abilities,
      stances,
      portrait,
      status = 'DRAFT',
      isPublic = false
    } = req.body;

    const customCard = await prisma.customMadeCard.create({
      data: {
        name,
        faction,
        unitType,
        squadPoints: parseInt(squadPoints),
        stamina: parseInt(stamina),
        durability: parseInt(durability),
        force: parseInt(force),
        hanker: parseInt(hanker),
        description,
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

// PUT /backend-api/custom-cards/:id — update custom card for Netlify proxy
app.put("/backend-api/custom-cards/:id", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const customCard = await prisma.customMadeCard.update({
      where: {
        id,
        authorId: userId
      },
      data: updateData
    });

    res.json(customCard);
  } catch (error) {
    console.error("Error updating custom card:", error);
    res.status(500).json({ error: "Failed to update custom card" });
  }
});

// DELETE /backend-api/custom-cards/:id — delete custom card for Netlify proxy
app.delete("/backend-api/custom-cards/:id", ensureAuth, async (req, res) => {
  try {
    // @ts-ignore
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.customMadeCard.delete({
      where: {
        id,
        authorId: userId
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom card:", error);
    res.status(500).json({ error: "Failed to delete custom card" });
  }
});

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
});app.get("/api/debug/check-database", async (req, res) => {
  try {
    // Check if AuditLog table exists
    const auditLogs = await prisma.auditLog.findMany({ take: 1 });
    res.json({ 
      ok: true, 
      auditLogsExist: true,
      auditLogsCount: await prisma.auditLog.count(),
      message: "Database connection and AuditLog table working"
    });
  } catch (error) {
    res.json({ 
      ok: false, 
      auditLogsExist: false,
      error: error.message,
      message: "Database connection or AuditLog table issue"
    });
  }
});

app.get("/api/debug/check-user", async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.json({ ok: false, error: "Email parameter required" });
    }
    
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });
    
    const allowedEmail = await prisma.allowedEmail.findUnique({
      where: { email },
      select: { email: true, role: true, isActive: true }
    });
    
    res.json({ 
      ok: true, 
      user,
      allowedEmail,
      message: user ? `User found with role: ${user.role}` : "User not found"
    });
  } catch (error) {
    res.json({ 
      ok: false, 
      error: error.message,
      message: "Error checking user"
    });
  }
});

app.get("/api/debug/audit-logs", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const entityType = req.query.entityType as string;
    
    const where = entityType ? { entityType: entityType as any } : {};
    
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        action: true,
        description: true,
        createdAt: true,
        user: {
          select: { email: true, name: true }
        }
      }
    });
    
    const entityTypes = await prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: { entityType: true }
    });
    
    res.json({ 
      ok: true, 
      logs,
      entityTypes: entityTypes.map(et => ({ type: et.entityType, count: et._count.entityType })),
      total: logs.length,
      message: `Found ${logs.length} audit logs`
    });
  } catch (error: any) {
    console.error('Audit logs check failed:', error);
    res.status(500).json({ ok: false, error: error.message || "Audit logs check failed" });
  }
});

// ===== NEW DATABASE API ENDPOINTS (v2) =====

// Middleware to add user to request
const addUserToRequest = (req: Request, res: Response, next: NextFunction) => {
  if (req.user) {
    // Add user info to request for database API - keep original user object
    // but add it to a separate property for database API functions
    (req as any).dbUser = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    };
  }
  next();
};

// Middleware to authenticate either session or API token
const authenticateUserOrToken = async (req: Request, res: Response, next: NextFunction) => {
  // First try API token authentication
  await authenticateApiToken(req, res, (err?: any) => {
    if (err) return next(err);
    
    // If API token auth succeeded, continue
    if ((req as any).dbUser) {
      return next();
    }
    
    // Otherwise, try session authentication
    if (req.user) {
      (req as any).dbUser = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role
      };
    }
    
    next();
  });
};

// Characters API v2
app.get("/api/v2/characters", authenticateUserOrToken, requireScope(['read:characters']), getCharacters);
app.get("/api/v2/characters/:id", authenticateUserOrToken, requireScope(['read:characters']), getCharacterById);
app.get("/api/v2/characters/:id/abilities", authenticateUserOrToken, requireScope(['read:characters']), getCharacterAbilities);
app.get("/api/v2/characters/:id/stance", authenticateUserOrToken, requireScope(['read:characters']), getCharacterStance);
app.post("/api/v2/characters", authenticateUserOrToken, requireScope(['write:characters']), createCharacter);
app.put("/api/v2/characters/:id", authenticateUserOrToken, requireScope(['write:characters']), updateCharacter);
app.delete("/api/v2/characters/:id", authenticateUserOrToken, requireScope(['write:characters']), deleteCharacter);

// Sets API v2
app.get("/api/v2/sets", authenticateUserOrToken, requireScope(['read:sets']), getSets);

// Missions API v2
app.get("/api/v2/missions", authenticateUserOrToken, requireScope(['read:missions']), getMissions);

// ===== COMMENTS API =====
app.get("/api/v2/comments", getComments);
app.post("/api/v2/comments", ensureAuth, addUserToRequest, createComment);
app.put("/api/v2/comments/:id", ensureAuth, addUserToRequest, updateComment);
app.delete("/api/v2/comments/:id", ensureAuth, addUserToRequest, deleteComment);
app.post("/api/v2/comments/:id/like", ensureAuth, addUserToRequest, likeComment);

// ===== INBOX API =====
app.get("/api/v2/inbox", ensureAuth, addUserToRequest, getInboxMessages);
app.put("/api/v2/inbox/messages/:id/read", ensureAuth, addUserToRequest, markMessageAsRead);
app.put("/api/v2/inbox/messages/read-all", ensureAuth, addUserToRequest, markAllMessagesAsRead);
app.delete("/api/v2/inbox/messages/:id", ensureAuth, addUserToRequest, deleteMessage);

// ===== CHALLENGES API =====
app.get("/api/v2/challenges", ensureAuth, addUserToRequest, getChallenges);
app.post("/api/v2/challenges", ensureAuth, addUserToRequest, createChallenge);
app.put("/api/v2/challenges/:id/respond", ensureAuth, addUserToRequest, respondToChallenge);
app.put("/api/v2/challenges/:id/cancel", ensureAuth, addUserToRequest, cancelChallenge);
app.get("/api/v2/players/available", ensureAuth, addUserToRequest, getAvailablePlayers);

// ===== SCHEDULED GAMES API =====
app.get("/api/v2/scheduled-games", ensureAuth, addUserToRequest, getScheduledGames);
app.post("/api/v2/scheduled-games", ensureAuth, addUserToRequest, createScheduledGame);
app.put("/api/v2/scheduled-games/:id", ensureAuth, addUserToRequest, updateScheduledGame);
app.post("/api/v2/scheduled-games/:id/reminders", ensureAuth, addUserToRequest, addGameReminder);
app.delete("/api/v2/scheduled-games/:id/reminders/:reminderId", ensureAuth, addUserToRequest, removeGameReminder);
app.get("/api/v2/scheduled-games/:id/calendar", ensureAuth, addUserToRequest, generateCalendarEvent);

// ===== PUBLIC GAMES API =====
app.get("/api/v2/public-games", getPublicGames);
app.post("/api/v2/public-games", ensureAuth, addUserToRequest, createPublicGame);

// ===== GAME RESULTS API =====
app.get("/api/v2/game-results", authenticateUserOrToken, requireScope(['read:game-results']), getGameResults);
app.post("/api/v2/game-results", authenticateUserOrToken, requireScope(['write:game-results']), createGameResult);
app.put("/api/v2/game-results/:id", authenticateUserOrToken, requireScope(['write:game-results']), updateGameResult);
app.delete("/api/v2/game-results/:id", authenticateUserOrToken, requireScope(['delete:game-results']), deleteGameResult);
app.get("/api/v2/players/:playerId/stats", ensureAuth, addUserToRequest, getPlayerStats);

// ===== DICE ROLLS AND NODE ACTIVATION API =====
app.post("/api/v2/dice-rolls", ensureAuth, addUserToRequest, logDiceRoll);
app.get("/api/v2/dice-rolls", ensureAuth, addUserToRequest, getDiceRolls);
app.post("/api/v2/node-activations", ensureAuth, addUserToRequest, logNodeActivation);
app.get("/api/v2/node-activations", ensureAuth, addUserToRequest, getNodeActivations);
app.put("/api/v2/node-activations/:id", ensureAuth, addUserToRequest, updateNodeActivation);
app.delete("/api/v2/node-activations/:id", ensureAuth, addUserToRequest, deleteNodeActivation);

// ===== GAME EXPORT API =====
app.get("/api/v2/game-sessions/:gameSessionId/export", ensureAuth, addUserToRequest, exportGameLog);
app.get("/api/v2/game-sessions/:gameSessionId/turns/:turn/export", ensureAuth, addUserToRequest, exportGameLogByTurn);

// ===== ACCESS REQUESTS API =====
app.post("/api/v2/access-requests", createAccessRequest);
app.get("/api/v2/access-requests", ensureAuth, addUserToRequest, getAccessRequests);
app.put("/api/v2/access-requests/:id", ensureAuth, addUserToRequest, updateAccessRequest);
app.delete("/api/v2/access-requests/:id", ensureAuth, addUserToRequest, deleteAccessRequest);
app.post("/api/v2/access-requests/:id/invite", ensureAuth, addUserToRequest, inviteUserFromRequest);

// API Tokens endpoints
app.get("/api/v2/api-tokens", ensureAuth, addUserToRequest, getUserApiTokens);
app.post("/api/v2/api-tokens", ensureAuth, addUserToRequest, createApiToken);
app.put("/api/v2/api-tokens/:id", ensureAuth, addUserToRequest, updateApiToken);
app.delete("/api/v2/api-tokens/:id", ensureAuth, addUserToRequest, deleteApiToken);
