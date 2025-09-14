// apps/server/src/auth.ts
import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import type { Request } from "express";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL,
} = process.env;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
  console.warn("[auth] Brak zmiennych GOOGLE_* – Google OAuth będzie wyłączony");
}

/**
 * Minimalna reprezentacja usera w sesji.
 * (Możesz potem podpiąć Prisma i zapisywać w bazie — tu zwracamy “profil” jak leci.)
 */
export type SessionUser = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  provider: "google";
  raw?: any;
};

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}

export function setupGoogleAuth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) return;

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (_req: Request, _accessToken, _refreshToken, profile: Profile, done) => {
        const primaryEmail =
          profile.emails?.find((e) => e.verified) ??
          profile.emails?.[0];

        const user: SessionUser = {
          id: profile.id,
          email: primaryEmail?.value,
          name: profile.displayName,
          picture: profile.photos?.[0]?.value,
          provider: "google",
          raw: {
            emails: profile.emails,
            photos: profile.photos,
          },
        };

        // Tu (opcjonalnie) zapis do DB lub “findOrCreate”.

        return done(null, user);
      }
    )
  );

  // Sesja – serializacja minimalna
  passport.serializeUser((user, done) => {
    done(null, user as SessionUser);
  });

  passport.deserializeUser((obj: any, done) => {
    done(null, obj as SessionUser);
  });
}

export { passport };