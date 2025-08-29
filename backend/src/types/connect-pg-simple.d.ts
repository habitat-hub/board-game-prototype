import session from 'express-session';

declare module 'connect-pg-simple' {
  export default function connectPgSimple(
    session: typeof session
  ): new (options: unknown) => session.Store;
}
