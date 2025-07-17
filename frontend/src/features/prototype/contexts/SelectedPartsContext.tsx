import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface SelectedPartsContextType {
  /** 選択されたパーツIDの配列 */
  selectedPartIds: number[];
  /** パーツを選択する */
  selectPart: (partId: number) => void;
  /** パーツの選択を解除する */
  deselectPart: (partId: number) => void;
  /** パーツの選択状態を切り替える */
  togglePartSelection: (partId: number) => void;
  /** 複数のパーツを選択する */
  selectMultipleParts: (partIds: number[]) => void;
  /** すべての選択を解除する */
  clearSelection: () => void;
  /** パーツが選択されているかどうかを判定する */
  isPartSelected: (partId: number) => boolean;
}

const SelectedPartsContext = createContext<
  SelectedPartsContextType | undefined
>(undefined);

export const SelectedPartsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);

  // パーツを選択する
  const selectPart = useCallback((partId: number) => {
    setSelectedPartIds((prev) => {
      if (prev.includes(partId)) return prev;
      return [...prev, partId];
    });
  }, []);

  // パーツの選択を解除する
  const deselectPart = useCallback((partId: number) => {
    setSelectedPartIds((prev) => prev.filter((id) => id !== partId));
  }, []);

  // パーツの選択状態を切り替える
  const togglePartSelection = useCallback((partId: number) => {
    setSelectedPartIds((prev) => {
      if (prev.includes(partId)) {
        return prev.filter((id) => id !== partId);
      }
      return [...prev, partId];
    });
  }, []);

  // 複数のパーツを選択する
  const selectMultipleParts = useCallback((partIds: number[]) => {
    setSelectedPartIds(partIds);
  }, []);

  // すべての選択を解除する
  const clearSelection = useCallback(() => {
    setSelectedPartIds([]);
  }, []);

  // パーツが選択されているかどうかを判定する
  const isPartSelected = useCallback(
    (partId: number) => selectedPartIds.includes(partId),
    [selectedPartIds]
  );

  return (
    <SelectedPartsContext.Provider
      value={{
        selectedPartIds,
        selectPart,
        deselectPart,
        togglePartSelection,
        selectMultipleParts,
        clearSelection,
        isPartSelected,
      }}
    >
      {children}
    </SelectedPartsContext.Provider>
  );
};

export const useSelectedParts = (): SelectedPartsContextType => {
  const context = useContext(SelectedPartsContext);
  if (context === undefined) {
    throw new Error(
      'useSelectedParts must be used within a SelectedPartsProvider'
    );
  }
  return context;
};
