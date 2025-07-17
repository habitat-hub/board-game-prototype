import { createContext, ReactNode, useContext } from 'react';
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

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
