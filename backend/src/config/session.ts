import type { Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pgSession from 'connect-pg-simple';

import env from './env';
import UserModel from '../models/User';

export function setupSession(app: Express) {
  const PostgresStore = pgSession(session);
  const sessionStore = new PostgresStore({
    conObject: {
      connectionString: env.DATABASE_URL,
    },
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: sessionStore,
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        ...(env.NODE_ENV === 'production' && env.FRONTEND_DOMAIN
          ? { domain: env.FRONTEND_DOMAIN }
          : {}),
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await UserModel.findOne({
            where: { googleId: profile.id },
          });
          if (!user) {
            user = await UserModel.create({
              googleId: profile.id,
              username: profile.displayName,
            });
          }
          done(null, user);
        } catch (err) {
          done(err, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as UserModel).id);
  });
  passport.deserializeUser((id: number, done) => {
    UserModel.findByPk(id).then((user) => {
      done(null, user);
    });
  });
}
