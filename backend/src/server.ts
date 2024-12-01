import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';

dotenv.config();

import { shuffleDeck } from './helpers/prototypeHelper';
import { PART_TYPE } from './const';
import sequelize from './models';
import UserModel from './models/User';
import authRoutes from './routes/auth';
import prototypeRoutes from './routes/prototype';
import userRoutes from './routes/user';
import PartModel from './models/Part';
import PlayerModel from './models/Player';

const app = express();
const server = http.createServer(app);
const PORT = 8080;

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
  // プロトタイプ参加
  socket.on('JOIN_PROTOTYPE', async (prototypeId: number) => {
    const parts = await PartModel.findAll({ where: { prototypeId } });
    const players = await PlayerModel.findAll({
      where: { prototypeId },
    });

    socket.join(prototypeId.toString());
    socket.emit('UPDATE_PARTS', parts);
    socket.emit('UPDATE_PLAYERS', players);
  });

  // パーツ追加
  socket.on(
    'ADD_PART',
    async ({ prototypeId, part }: { prototypeId: number; part: PartModel }) => {
      await PartModel.create({
        ...part,
        prototypeId,
      });
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
    }
  );

  // カードを反転させる
  socket.on(
    'FLIP_CARD',
    async ({
      prototypeId,
      cardId,
      isNextFlipped,
    }: {
      prototypeId: number;
      cardId: number;
      isNextFlipped: boolean;
    }) => {
      await PartModel.update(
        { isFlipped: isNextFlipped },
        { where: { id: cardId } }
      );

      io.to(prototypeId.toString()).emit('FLIP_CARD', {
        cardId,
        isNextFlipped,
      });
    }
  );

  // パーツ移動
  socket.on(
    'MOVE_PART',
    async ({
      prototypeId,
      id,
      position,
    }: {
      prototypeId: number;
      id: number;
      position: { x: number; y: number };
    }) => {
      await PartModel.update({ position }, { where: { id, prototypeId } });
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
    }
  );

  // カードの親を更新
  socket.on(
    'UPDATE_CARD_PARENT',
    async ({
      prototypeId,
      cardId,
      nextParentId,
    }: {
      prototypeId: number;
      cardId: number;
      nextParentId?: number | null;
    }) => {
      await PartModel.update(
        { parentId: nextParentId || null },
        { where: { id: cardId, prototypeId } }
      );
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
    }
  );

  // カードをシャッフル
  socket.on(
    'SHUFFLE_DECK',
    async ({
      prototypeId,
      deckId,
    }: {
      prototypeId: number;
      deckId: number;
    }) => {
      const cardsOnDeck = await PartModel.findAll({
        where: { prototypeId, type: PART_TYPE.CARD, parentId: deckId },
      });
      await shuffleDeck(cardsOnDeck);
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
    }
  );

  // パーツ更新
  socket.on(
    'UPDATE_PART',
    async ({
      prototypeId,
      updatedPart,
    }: {
      prototypeId: number;
      updatedPart: PartModel;
    }) => {
      await PartModel.update(updatedPart, {
        where: { id: updatedPart.id, prototypeId },
      });
      const parts = await PartModel.findAll({ where: { prototypeId } });

      io.to(prototypeId.toString()).emit('UPDATE_PARTS', parts);
    }
  );

  // プレイヤーに紐づけるユーザーを更新
  socket.on(
    'UPDATE_PLAYER_USER',
    async ({
      prototypeId,
      playerId,
      userId,
    }: {
      prototypeId: number;
      playerId: number;
      userId: number | null;
    }) => {
      await PlayerModel.update({ userId }, { where: { id: playerId } });
      const players = await PlayerModel.findAll({
        where: { prototypeId },
      });

      io.to(prototypeId.toString()).emit('UPDATE_PLAYERS', players);
    }
  );

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
