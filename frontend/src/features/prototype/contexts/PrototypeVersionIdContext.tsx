import { createContext, ReactNode } from 'react';

// プロトタイプバージョンIDコンテキスト型
interface PrototypeVersionIdContextType {
  // プロトタイプバージョンID
  prototypeVersionId: string;
}

// プロトタイプバージョンIDコンテキスト
export const PrototypeVersionIdContext =
  createContext<PrototypeVersionIdContextType | null>(null);

// プロトタイプバージョンIDプロバイダー
export const PrototypeVersionIdProvider = ({
  children,
  prototypeVersionId,
}: {
  children: ReactNode;
  prototypeVersionId: string;
}) => {
  return (
    <PrototypeVersionIdContext.Provider
      value={{
        prototypeVersionId,
      }}
    >
      {children}
    </PrototypeVersionIdContext.Provider>
  );
};
