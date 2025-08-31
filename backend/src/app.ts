import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import pgSession from 'connect-pg-simple';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { execSync } from 'child_process';
import path from 'path';

import { swaggerSchemas } from './swagger-schemas';
import authRoutes from './routes/auth';
import prototypeRoutes from './routes/prototype';
import projectRoutes from './routes/project';
import userRoutes from './routes/user';
import imageRoutes from './routes/image';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

if (process.env.NODE_ENV === 'development') {
  if (!process.env.SKIP_SWAGGER) {
    try {
      execSync('npm run generate-swagger', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });
      execSync('npm run generate-api-types', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
      });
    } catch (error) {
      console.error('Failed to generate Swagger schemas:', error);
    }
  } else {
    console.log('SKIP_SWAGGER set: skipping swagger generation');
  }

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Board Game Prototype API',
        version: '1.0.0',
        description: `
## 概要
このAPIは、ボードゲームプロトタイプの作成と管理を行うためのものです。

## 認証
- 基本的にAPIエンドポイントは認証が必要です
- アプリケーションを起動し、Google OAuth2.0を使用した認証を行なってください（Swagger UIでは認証ができません）
- 認証後、Cookieにセッション情報が保存されます
`,
      },
      ...swaggerSchemas,
    },
    apis: ['./src/routes/*.ts'],
  };
  const swaggerSpec = swaggerJsdoc(options);
  fs.writeFileSync(
    './swagger-output.json',
    JSON.stringify(swaggerSpec, null, 2)
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

const PostgresStore = pgSession(session);
const sessionStore =
  process.env.NODE_ENV === 'test'
    ? new session.MemoryStore()
    : new PostgresStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true,
      });

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'test-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.FRONTEND_DOMAIN,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CALLBACK_URL
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const { default: UserModel } = await import('./models/User');
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
          done(err as Error, undefined);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, (user as { id: number }).id);
});
passport.deserializeUser(async (id: number, done) => {
  try {
    const { default: UserModel } = await import('./models/User');
    const user = await UserModel.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err as Error, undefined);
  }
});

app.use('/auth', authRoutes);
app.use('/api/prototypes', prototypeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);

app.use(errorHandler);

export default app;
