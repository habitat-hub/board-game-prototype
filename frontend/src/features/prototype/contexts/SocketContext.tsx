import { createContext, ReactNode } from 'react';
import { Socket } from 'socket.io-client';

// ソケットコンテキスト型
interface SocketContextType {
  // ソケット
  socket: Socket;
}

// ソケットコンテキスト
export const SocketContext = createContext<SocketContextType | null>(null);

// ソケットプロバイダー
export const SocketProvider = ({
  children,
  socket,
}: {
  children: ReactNode;
  socket: Socket;
}) => {
  return (
    <SocketContext.Provider
      value={{
        socket,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
