declare module 'connect-pg-simple' {
  import { Store } from 'express-session';
  class PGStore extends Store {
    constructor(options?: Record<string, unknown>);
  }
  export default function connectPgSimple(
    session: typeof import('express-session')
  ): typeof PGStore;
}
