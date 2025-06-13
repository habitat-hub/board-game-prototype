import { createContext, ReactNode } from 'react';

// プロトタイプIDコンテキスト型
interface PrototypeIdContextType {
  // プロトタイプID
  prototypeId: string;
}

// プロトタイプIDコンテキスト
export const PrototypeIdContext = createContext<PrototypeIdContextType | null>(
  null
);

// プロトタイプIDプロバイダー
export const PrototypeIdProvider = ({
  children,
  prototypeId,
}: {
  children: ReactNode;
  prototypeId: string;
}) => {
  return (
    <PrototypeIdContext.Provider
      value={{
        prototypeId,
      }}
    >
      {children}
    </PrototypeIdContext.Provider>
  );
};
