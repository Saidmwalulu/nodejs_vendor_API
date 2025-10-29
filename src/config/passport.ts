import { Express } from "express";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../utils/prisma";
import { User } from "@prisma/client";
import { thirtyDaysFromNow } from "../utils/date";
import { CALLBACK_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  NODE_ENV,SECRET_KEY } from "../utils/env";
import { refreshTokenSignOptions, signToken } from "../utils/jwt";

const passportConfig = (app: Express) => {
  app.use(
    session({
      secret: SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // prevent JS access to cookie
        secure: NODE_ENV === "production", // only HTTPS in production
        sameSite: "lax", // helps prevent CSRF
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          //google info saved in database
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("No email found from Google"), false);
          }

          let user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email: email,
                photo: profile.photos?.[0]?.value ?? null,
                verified: true,
              },
            });
          }
          //create a session
          const session = await prisma.session.create({
            data: {
              userId: user.id,
              userAgent: req.get("user-agent") ?? null,
              expiresAt: thirtyDaysFromNow(),
            },
          });

          //create tokens now
          const accessJwt = signToken({
            userId: user.id,
            sessionId: session.id,
          });
          const refreshJwt = signToken(
            { sessionId: session.id },
            refreshTokenSignOptions
          );

          //attack token
          req.authTokens = { accessToken: accessJwt, refreshToken: refreshJwt };

          return done(null, user);
        } catch (error) {
          console.error("Google oauth error", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};

export default passportConfig;
