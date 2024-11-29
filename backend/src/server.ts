import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';
import { shuffleDeck } from './helpers/prototypeHelper';
import prototypeRoutes from './routes/prototype';
import { Card, Part, Prototype } from './type';
import { PART_TYPE } from './const';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});
const PORT = 8080;

// CORSを有効にする
app.use(cors());

// JSONボディのパースを有効にする
app.use(express.json());
app.use('/api/prototypes', prototypeRoutes);

export const prototypes: Prototype[] = [
  {
    id: 1,
    groupId: 1,
    name: 'プロトタイプ1',
    players: [{ id: '1-1', name: 'プレイヤー1' }],
    isPreview: true,
    parts: [],
  },
  {
    id: 2,
    name: 'プロトタイプ2',
    groupId: 2,
    players: [
      { id: '2-1', name: 'プレイヤー1' },
      { id: '2-2', name: 'プレイヤー2' },
    ],
    isPreview: true,
    parts: [],
  },
  {
    id: 3,
    name: 'プロトタイプ3',
    groupId: 1,
    players: [
      { id: '3-1', name: 'プレイヤー1' },
      { id: '3-2', name: 'プレイヤー2' },
    ],
    isPreview: false,
    parts: [],
  },
];

io.on('connection', (socket: Socket) => {
  socket.on('JOIN_PROTOTYPE', (prototypeId: number) => {
    if (!prototypes[prototypeId]) {
      return;
    }
    socket.join(prototypeId.toString());
    socket.emit('UPDATE_PARTS', prototypes[prototypeId].parts);
  });

  socket.on(
    'FLIP_CARD',
    ({
      prototypeId,
      cardId,
      isNextFlipped,
    }: {
      prototypeId: number;
      cardId: number;
      isNextFlipped: boolean;
    }) => {
      io.to(prototypeId.toString()).emit('FLIP_CARD', {
        cardId,
        isNextFlipped,
      });
    }
  );

  socket.on(
    'ADD_PART',
    ({ prototypeId, part }: { prototypeId: number; part: Part }) => {
      if (!prototypes[prototypeId]) {
        return;
      }

      prototypes[prototypeId].parts.push(part);
      io.to(prototypeId.toString()).emit(
        'UPDATE_PARTS',
        prototypes[prototypeId].parts
      );
    }
  );

  socket.on(
    'MOVE_PART',
    ({
      prototypeId,
      id,
      position,
    }: {
      prototypeId: number;
      id: number;
      position: { x: number; y: number };
    }) => {
      if (!prototypes[prototypeId]) {
        return;
      }

      const part = prototypes[prototypeId].parts.find((c) => c.id === id);
      if (part) {
        part.position = position;
        io.to(prototypeId.toString()).emit(
          'UPDATE_PARTS',
          prototypes[prototypeId].parts
        );
      }
    }
  );

  socket.on(
    'UPDATE_CARD_PARENT',
    ({
      prototypeId,
      cardId,
      nextParentId,
    }: {
      prototypeId: number;
      cardId: number;
      nextParentId?: number | null;
    }) => {
      if (!prototypes[prototypeId]) {
        return;
      }

      const card = prototypes[prototypeId].parts.find(
        (part) => part.id === cardId
      );
      if (card) {
        card.parentId = nextParentId || null;
        io.to(prototypeId.toString()).emit(
          'UPDATE_PARTS',
          prototypes[prototypeId].parts
        );
      }
    }
  );

  socket.on(
    'SHUFFLE_DECK',
    ({ prototypeId, deckId }: { prototypeId: number; deckId: number }) => {
      if (!prototypes[prototypeId]) {
        return;
      }

      const cardsOnDeck = prototypes[prototypeId].parts.filter(
        (part) => part.type === PART_TYPE.CARD && part.parentId === deckId
      );
      shuffleDeck(cardsOnDeck as Card[]);
      io.to(prototypeId.toString()).emit(
        'UPDATE_PARTS',
        prototypes[prototypeId].parts
      );
    }
  );

  socket.on(
    'UPDATE_PART',
    ({
      prototypeId,
      updatedPart,
    }: {
      prototypeId: number;
      updatedPart: Part;
    }) => {
      if (!prototypes[prototypeId]) {
        return;
      }

      const index = prototypes[prototypeId].parts.findIndex(
        (part) => part.id === updatedPart.id
      );
      if (index !== -1) {
        prototypes[prototypeId].parts[index] = updatedPart;
        io.to(prototypeId.toString()).emit(
          'UPDATE_PARTS',
          prototypes[prototypeId].parts
        );
      }
    }
  );

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
