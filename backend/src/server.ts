import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import fs from 'fs';

dotenv.config();

import sequelize from './models';
import UserModel from './models/User';
import authRoutes from './routes/auth';
import prototypeRoutes from './routes/prototype';
import userRoutes from './routes/user';
import handlePrototype from './socket/prototypeHandler';

const app = express();
const server = http.createServer(app);
const PORT = 8080;

// 開発環境でのみSwagger UIを有効にする
if (process.env.NODE_ENV === 'development') {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Board Game Prototype API',
        version: '1.0.0',
      },
    },
    apis: ['./src/routes/*.ts'], // JSDocコメントを含むファイルのパス
  };
  const swaggerSpec = swaggerJsdoc(options);
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

// データベース接続
sequelize.sync().then(() => {
  console.log('Database connected');
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

// セッション設定
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
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

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});
passport.deserializeUser((id: number | number, done) => {
  UserModel.findByPk(id).then((user) => {
    done(null, user);
  });
});

// ルーティング設定
app.use('/auth', authRoutes);
app.use('/api/prototypes', prototypeRoutes);
app.use('/api/users', userRoutes);

// Socket.io接続
io.on('connection', (socket: Socket) => {
  handlePrototype(socket, io);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
