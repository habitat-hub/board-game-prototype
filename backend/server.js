const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});
const PORT = 8080;

// プロトタイプルートをインポート
const prototypeRoutes = require('./routes/prototype');

// CORSを有効にする
app.use(cors());

// JSONボディのパースを有効にする
app.use(express.json());

// ルートを使用
app.use('/api/prototypes', prototypeRoutes);

// Socket.IOの設定
let parts = [];

io.on('connection', (socket) => {
  console.log('a user connected');

  // クライアントに現在のパーツを送信
  socket.emit('UPDATE_PARTS', parts);

  // 新しいパーツの追加
  socket.on('ADD_PART', (part) => {
    parts.push(part);
    io.emit('UPDATE_PARTS', parts);
  });

  // パーツの移動
  socket.on('MOVE_PART', ({ id, position }) => {
    const part = parts.find((c) => c.id === id);
    if (part) {
      part.position = position;
      io.emit('UPDATE_PARTS', parts);
    }
  });

  // カードの移動(手札に関わるカード)
  socket.on(
    'MOVE_CARD_RELATE_TO_HAND',
    ({ cardId, nextHandId, previousHandIds }) => {
      const nextHand = parts.find((part) => part.id === nextHandId);
      if (nextHand) {
        nextHand.cardIds = [...nextHand.cardIds, cardId];
      }
      const previousHands = parts.filter((part) =>
        previousHandIds.includes(part.id)
      );
      previousHands.forEach((hand) => {
        hand.cardIds = hand.cardIds.filter((id) => id !== cardId);
      });
      io.emit('UPDATE_PARTS', parts);
    }
  );

  // カードの移動(山札に関わるカード)
  socket.on(
    'MOVE_CARD_RELATE_TO_DECK',
    ({ cardId, nextDeckId, previousDeckIds }) => {
      const nextDeck = parts.find((part) => part.id === nextDeckId);
      if (nextDeck) {
        nextDeck.cardIds = [...nextDeck.cardIds, cardId];
      }
      const previousDecks = parts.filter((part) =>
        previousDeckIds.includes(part.id)
      );
      previousDecks.forEach((deck) => {
        deck.cardIds = deck.cardIds.filter((id) => id !== cardId);
      });
      io.emit('UPDATE_PARTS', parts);
    }
  );

  // パーツの更新
  socket.on('UPDATE_PART', (updatedPart) => {
    const index = parts.findIndex((part) => part.id === updatedPart.id);
    if (index !== -1) {
      parts[index] = updatedPart;
      io.emit('UPDATE_PARTS', parts);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// サーバーを起動
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
