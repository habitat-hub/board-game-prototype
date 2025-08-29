import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import type { DisconnectReason } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import type { OpenAPIV3 } from 'openapi-types';
import fs from 'fs';
import pgSession from 'connect-pg-simple';
import { swaggerSchemas } from './swagger-schemas';
import { execSync } from 'child_process';
import path from 'path';

dotenv.config();

import sequelize from './models';

// 関連付けを最初に設定（ルートインポート前に実行）
import { setupAssociations } from './database/associations';
setupAssociations();

import UserModel from './models/User';
import authRoutes from './routes/auth';
import prototypeRoutes from './routes/prototype';
import projectRoutes from './routes/project';
import userRoutes from './routes/user';
import imageRoutes from './routes/image';
import handlePrototype from './socket/prototypeHandler';
import handleProject from './socket/projectHandler';
import { COMMON_SOCKET_EVENT } from './constants/socket';

import { errorHandler } from './middlewares/errorHandler';

const app = express();
const server = http.createServer(app);
const PORT = 8080;

console.log('Starting Board Game Prototype Server...');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

// 開発環境でのみSwagger UIを有効にする
if (process.env.NODE_ENV === 'development') {
  // 一部の開発フローではSwagger生成をスキップできます
  if (!process.env.SKIP_SWAGGER) {
    // Swagger定義を生成
    try {
      console.log('Generating Swagger schemas...');
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
  const swaggerSpec: OpenAPIV3.Document = swaggerJsdoc(options);
  fs.writeFileSync(
    './swagger-output.json',
    JSON.stringify(swaggerSpec, null, 2)
  );

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Socket.ioの設定
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'DELETE'],
  },
});

app.set('io', io);

// データベース接続
sequelize
  .sync()
  .then(async () => {
    console.log('✅ Database connected successfully');

    // データベースの初期化が必要かチェックして実行
    try {
      const { initializeDatabaseIfNeeded } = await import(
        './database/initializer'
      );
      await initializeDatabaseIfNeeded();
      console.log('🚀 Server is ready to accept connections');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      process.exit(1); // データベース初期化に失敗した場合はアプリケーションを終了
    }
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1); // データベース接続に失敗した場合はアプリケーションを終了
  });

// CORS設定
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// JSONボディのパースを有効にする
app.use(express.json());

// セッションテーブルの作成
const PostgresStore = pgSession(session);
const sessionStore = new PostgresStore({
  conObject: {
    connectionString: process.env.DATABASE_URL,
  },
  createTableIfMissing: true,
});

// セッション設定
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      domain: process.env.FRONTEND_DOMAIN,
    },
  })
);

// Passport初期化
app.use(passport.initialize());
app.use(passport.session());

// Googleストラテジー設定
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserModel.findOne({ where: { googleId: profile.id } });
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
passport.deserializeUser((id: number | number, done) => {
  UserModel.findByPk(id).then((user) => {
    done(null, user);
  });
});

// ルーティング設定
app.use('/auth', authRoutes);
app.use('/api/prototypes', prototypeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);

// エラーハンドリングミドルウェアの適用
app.use(errorHandler);

io.on('connection', (socket: Socket) => {
  handlePrototype(socket, io);
  handleProject(socket, io);

  socket.on(COMMON_SOCKET_EVENT.DISCONNECT, (reason: DisconnectReason) => {
    console.log('ユーザーが切断しました：' + reason);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO is ready for real-time connections`);
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `API Documentation available at: http://localhost:${PORT}/api-docs`
    );
  }
});
