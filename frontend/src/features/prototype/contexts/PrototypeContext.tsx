import { createContext, useContext, ReactNode } from 'react';
import { Socket } from 'socket.io-client';

interface PrototypeContextType {
  // ソケット
  socket: Socket;
  // プロトタイプバージョンID
  prototypeVersionId: string;
}

const PrototypeContext = createContext<PrototypeContextType | null>(null);

interface PrototypeProviderProps {
  children: ReactNode;
  // ソケット
  socket: Socket;
  // プロトタイプバージョンID
  prototypeVersionId: string;
}

export const PrototypeProvider = ({
  children,
  socket,
  prototypeVersionId,
}: PrototypeProviderProps) => {
  return (
    <PrototypeContext.Provider
      value={{
        socket,
        prototypeVersionId,
      }}
    >
      {children}
    </PrototypeContext.Provider>
  );
};

export const usePrototype = () => {
  const context = useContext(PrototypeContext);
  if (!context) {
    throw new Error('usePrototype must be used within a PrototypeProvider');
  }
  return context;
};
