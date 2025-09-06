import React, { useCallback, useMemo } from 'react';
import {
  LuAlignStartHorizontal,
  LuAlignCenterHorizontal,
  LuAlignEndHorizontal,
  LuAlignStartVertical,
  LuAlignCenterVertical,
  LuAlignEndVertical,
  LuShuffle,
} from 'react-icons/lu';

import { Part } from '@/api/types';
import PartPropertyMenuButton from '@/features/prototype/components/atoms/PartPropertyMenuButton';
import { usePartOverlayMessage } from '@/features/prototype/contexts/PartOverlayMessageContext';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { calculateAlignmentInfo, getAlignmentUpdates, AlignmentType } from '@/features/prototype/utils/alignment';

interface PartPropertyMenuMultiProps {
  selectedParts: Part[];
  hidden: boolean;
}

export default function PartPropertyMenuMulti({ selectedParts, hidden }: PartPropertyMenuMultiProps) {
  const { dispatch } = usePartReducer();
  const { selectMultipleParts } = useSelectedParts();
  const { runShuffleEffect } = usePartOverlayMessage();

  const alignInfo = useMemo(() => calculateAlignmentInfo(selectedParts), [selectedParts]);
  const cardParts = useMemo(() => selectedParts.filter((p) => p.type === 'card'), [selectedParts]);
  const showActionSection = cardParts.length >= 2;

  const alignParts = useCallback(
    (type: AlignmentType): void => {
      if (!alignInfo) return;
      const updates = getAlignmentUpdates(type, selectedParts, alignInfo);
      if (updates.length === 0) return;
      dispatch({ type: 'UPDATE_PARTS', payload: { updates } });
    },
    [alignInfo, selectedParts, dispatch],
  );

  const handleAlignLeft = useCallback(() => alignParts('left'), [alignParts]);
  const handleAlignRight = useCallback(() => alignParts('right'), [alignParts]);
  const handleAlignHCenter = useCallback(() => alignParts('hCenter'), [alignParts]);
  const handleAlignTop = useCallback(() => alignParts('top'), [alignParts]);
  const handleAlignBottom = useCallback(() => alignParts('bottom'), [alignParts]);
  const handleAlignVCenter = useCallback(() => alignParts('vCenter'), [alignParts]);

  const handleShuffleCards = useCallback(() => {
    if (cardParts.length < 2) return;
    const ids = cardParts.map((p) => p.id);
    selectMultipleParts(ids);
    // Visual feedback like deck: show overlay texts on the cards
    runShuffleEffect(ids);
    const info = calculateAlignmentInfo(cardParts);
    if (!info) return;

    // Shuffle target parts themselves (not only their order values)
    const shuffledParts = [...cardParts].sort(() => Math.random() - 0.5);

    // Ensure unique z-orders to actually change draw order even if current orders are duplicated.
    // Keep them roughly around current range by starting from the minimum order and adding a tiny step.
    const minOrder = Math.min(...cardParts.map((p) => p.order));
    const step = 0.001; // small step to avoid big jumps vs other parts

    const updates = shuffledParts.map((p, index) => ({
      partId: p.id,
      updatePart: {
        position: {
          ...p.position,
          x: Math.round(info.centerX - p.width / 2),
          y: Math.round(info.centerY - p.height / 2),
        },
        frontSide: 'back' as const,
        order: minOrder + index * step,
      },
    }));
    dispatch({ type: 'UPDATE_PARTS', payload: { updates } });
  }, [cardParts, selectMultipleParts, dispatch, runShuffleEffect]);

  return (
    <div className="flex flex-col gap-2" style={{ display: hidden ? 'none' : 'flex' }}>
      {showActionSection && (
        <>
          <p className="text-kibako-white">アクション</p>
          <div className="grid grid-cols-1 gap-2">
            <PartPropertyMenuButton
              text="カードをシャッフル"
              ariaLabel="カードをシャッフル"
              icon={<LuShuffle className="h-5 w-5" />}
              onClick={handleShuffleCards}
            />
          </div>
        </>
      )}
      <p className="text-kibako-white">整列</p>
      <div className="grid grid-cols-3 gap-2">
        <PartPropertyMenuButton
          text=""
          ariaLabel="水平: 左揃え"
          title="左揃え（水平）"
          icon={<LuAlignStartVertical className="h-5 w-5" />}
          onClick={handleAlignLeft}
          disabled={alignInfo?.isLeft}
        />
        <PartPropertyMenuButton
          text=""
          ariaLabel="水平: 中央揃え"
          title="中央揃え（水平）"
          icon={<LuAlignCenterVertical className="h-5 w-5" />}
          onClick={handleAlignHCenter}
          disabled={alignInfo?.isHCenter}
        />
        <PartPropertyMenuButton
          text=""
          ariaLabel="水平: 右揃え"
          title="右揃え（水平）"
          icon={<LuAlignEndVertical className="h-5 w-5" />}
          onClick={handleAlignRight}
          disabled={alignInfo?.isRight}
        />
        <PartPropertyMenuButton
          text=""
          ariaLabel="垂直: 上揃え"
          title="上揃え（垂直）"
          icon={<LuAlignStartHorizontal className="h-5 w-5" />}
          onClick={handleAlignTop}
          disabled={alignInfo?.isTop}
        />
        <PartPropertyMenuButton
          text=""
          ariaLabel="垂直: 中央揃え"
          title="中央揃え（垂直）"
          icon={<LuAlignCenterHorizontal className="h-5 w-5" />}
          onClick={handleAlignVCenter}
          disabled={alignInfo?.isVCenter}
        />
        <PartPropertyMenuButton
          text=""
          ariaLabel="垂直: 下揃え"
          title="下揃え（垂直）"
          icon={<LuAlignEndHorizontal className="h-5 w-5" />}
          onClick={handleAlignBottom}
          disabled={alignInfo?.isBottom}
        />
      </div>
    </div>
  );
}
