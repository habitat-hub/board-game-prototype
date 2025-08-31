import dotenv from 'dotenv';
import http from 'http';
import { Server, Socket } from 'socket.io';
import type { DisconnectReason } from 'socket.io';

import app from './app';
import sequelize from './models';
import { setupAssociations } from './database/associations';
import handlePrototype from './socket/prototypeHandler';
import handleProject from './socket/projectHandler';
import { COMMON_SOCKET_EVENT } from './constants/socket';

dotenv.config();

setupAssociations();

const PORT = 8080;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'DELETE'],
  },
});

app.set('io', io);

io.on('connection', (socket: Socket) => {
  handlePrototype(socket, io);
  handleProject(socket, io);

  socket.on(COMMON_SOCKET_EVENT.DISCONNECT, (reason: DisconnectReason) => {
    console.log('ユーザーが切断しました：' + reason);
  });
});

sequelize
  .sync()
  .then(async () => {
    console.log('✅ Database connected successfully');

    try {
      const { initializeDatabaseIfNeeded } = await import(
        './database/initializer'
      );
      await initializeDatabaseIfNeeded();
      console.log('🚀 Server is ready to accept connections');

      server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Socket.IO is ready for real-time connections`);
        if (process.env.NODE_ENV === 'development') {
          console.log(
            `API Documentation available at: http://localhost:${PORT}/api-docs`
          );
        }
      });
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  });
