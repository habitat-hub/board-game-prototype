import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

import { isInputFieldFocused } from '@/utils/inputFocus';

interface DebugModeContextType {
  showDebugInfo: boolean;
  toggleDebugInfo: () => void;
}

const DebugModeContext = createContext<DebugModeContextType | undefined>(
  undefined
);

export const DebugModeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // デバッグ情報の表示/非表示を切り替える
  const toggleDebugInfo = useCallback(() => {
    setShowDebugInfo((prev) => !prev);
  }, []);

  useEffect(() => {
    // キーボードイベントのリスナーを追加
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールドにフォーカスがある場合は無視
      if (isInputFieldFocused()) {
        return;
      }

      // Cmd+i または Ctrl+i でデバッグ情報の表示/非表示を切り替え
      if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
        e.preventDefault();
        toggleDebugInfo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleDebugInfo]);

  return (
    <DebugModeContext.Provider value={{ showDebugInfo, toggleDebugInfo }}>
      {children}
    </DebugModeContext.Provider>
  );
};

export const useDebugMode = (): DebugModeContextType => {
  const context = useContext(DebugModeContext);
  if (context === undefined) {
    throw new Error('useDebugMode must be used within a DebugModeProvider');
  }
  return context;
};
