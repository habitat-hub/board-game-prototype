import express from 'express';
import http from 'http';
import cors from 'cors';

import env from './config/env';
import { setupSwagger } from './config/swagger';
import { setupSocket } from './config/socket';
import { connectDatabase } from './config/database';
import { setupSession } from './config/session';

import authRoutes from './routes/auth';
import prototypeRoutes from './routes/prototype';
import projectRoutes from './routes/project';
import userRoutes from './routes/user';
import imageRoutes from './routes/image';
import { errorHandler } from './middlewares/errorHandler';

const app = express();
const server = http.createServer(app);
const PORT = 8080;

console.log('Starting Board Game Prototype Server...');
console.log(`Environment: ${env.NODE_ENV}`);

setupSwagger(app);
setupSocket(server, app);
connectDatabase();

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

setupSession(app);

app.use('/auth', authRoutes);
app.use('/api/prototypes', prototypeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/images', imageRoutes);

app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Socket.IO is ready for real-time connections`);
  if (env.NODE_ENV === 'development') {
    console.log(
      `API Documentation available at: http://localhost:${PORT}/api-docs`
    );
  }
});
