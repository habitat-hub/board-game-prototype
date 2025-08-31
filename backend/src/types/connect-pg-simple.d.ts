/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'connect-pg-simple' {
  export default function connectPgSimple(
    session: typeof import('express-session')
  ): any;
}
