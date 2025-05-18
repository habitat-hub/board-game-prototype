import { useCallback, useEffect, useState } from 'react';

import { Part } from '@/api/types';

import { usePartReducer } from './usePartReducer';

interface UsePartSelectionProps {
  parts: Part[];
}

export const usePartSelection = ({ parts }: UsePartSelectionProps) => {
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const { dispatch } = usePartReducer();

  // 選択したパーツが更新されたら、最新化
  useEffect(() => {
    const selectedPart = parts.find((part) => part.id === selectedPartId);
    if (selectedPart) return;

    // 選択中のパーツが存在しない場合は、選択中のパーツを解除
    setSelectedPartId(null);
  }, [parts, selectedPartId]);

  const handleDeletePart = useCallback(() => {
    if (!selectedPartId) return;

    dispatch({ type: 'DELETE_PART', payload: { partId: selectedPartId } });
    setSelectedPartId(null);
  }, [dispatch, selectedPartId]);

  /**
   * キーボードイベントの設定 (Backspaceでパーツ削除)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力要素にフォーカスがある場合や選択パーツがない場合はスキップ
      const isFormElement = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement?.tagName || ''
      );

      if (isFormElement || !selectedPartId) return;

      if (e.key === 'Backspace') {
        handleDeletePart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeletePart, selectedPartId]);

  return {
    selectedPartId,
    setSelectedPartId,
    handleDeletePart,
  };
};
