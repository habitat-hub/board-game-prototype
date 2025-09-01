import type { Server as HttpServer } from 'http';
import type { Express } from 'express';
import { Server, Socket } from 'socket.io';

import env from './env';
import handlePrototype from '../socket/prototypeHandler';
import handleProject from '../socket/projectHandler';
import { COMMON_SOCKET_EVENT } from '../constants/socket';

export function setupSocket(server: HttpServer, app: Express) {
  const io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST', 'DELETE'],
    },
  });

  app.set('io', io);

  io.on('connection', (socket: Socket) => {
    handlePrototype(socket, io);
    handleProject(socket, io);

    socket.on(COMMON_SOCKET_EVENT.DISCONNECT, (reason) => {
      console.log('ユーザーが切断しました：' + reason);
    });
  });

  return io;
}
