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

  // カードの反転
  socket.on('FLIP_CARD', ({ cardId, isNextFlipped }) => {
    io.emit('FLIP_CARD', { cardId, isNextFlipped });
  });

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

  // カードの移動(親パーツの変更)
  socket.on('UPDATE_CARD_PARENT', ({ cardId, nextParentId }) => {
    const card = parts.find((part) => part.id === cardId);
    card.parentId = nextParentId || null;
    io.emit('UPDATE_PARTS', parts);
  });

  function shuffleDeck(cards) {
    const originalOrders = cards.map((card) => card.order);
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    cards.forEach((card, index) => {
      card.order = originalOrders[index];
    });
  }

  // 山札のシャッフル
  socket.on('SHUFFLE_DECK', ({ deckId }) => {
    const cardsOnDeck = parts.filter((part) => part.parentId === deckId);
    shuffleDeck(cardsOnDeck);

    io.emit('UPDATE_PARTS', parts);
  });

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
