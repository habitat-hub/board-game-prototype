import React, { useCallback, useMemo } from 'react';
import { MdFormatAlignLeft, MdFormatAlignCenter, MdFormatAlignRight, MdVerticalAlignTop, MdVerticalAlignCenter, MdVerticalAlignBottom } from 'react-icons/md';

import { Part } from '@/api/types';
import PartPropertyMenuButton from '@/features/prototype/components/atoms/PartPropertyMenuButton';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { calculateAlignmentInfo, getAlignmentUpdates, AlignmentType } from '@/features/prototype/utils/alignment';

interface PartPropertyMenuMultiProps {
  selectedParts: Part[];
  hidden: boolean;
}

export default function PartPropertyMenuMulti({ selectedParts, hidden }: PartPropertyMenuMultiProps) {
  const { dispatch } = usePartReducer();

  const alignInfo = useMemo(() => calculateAlignmentInfo(selectedParts), [selectedParts]);

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

  return (
    <div className="flex flex-col gap-2" style={{ display: hidden ? 'none' : 'flex' }}>
      <p className="text-kibako-white">整列</p>
      <div className="grid grid-cols-3 gap-2">
        <PartPropertyMenuButton
          text="左揃え"
          icon={<MdFormatAlignLeft className="h-3 w-3" />}
          onClick={handleAlignLeft}
          disabled={alignInfo?.isLeft}
        />
        <PartPropertyMenuButton
          text="左右中央"
          icon={<MdFormatAlignCenter className="h-3 w-3" />}
          onClick={handleAlignHCenter}
          disabled={alignInfo?.isHCenter}
        />
        <PartPropertyMenuButton
          text="右揃え"
          icon={<MdFormatAlignRight className="h-3 w-3" />}
          onClick={handleAlignRight}
          disabled={alignInfo?.isRight}
        />
        <PartPropertyMenuButton
          text="上揃え"
          icon={<MdVerticalAlignTop className="h-3 w-3" />}
          onClick={handleAlignTop}
          disabled={alignInfo?.isTop}
        />
        <PartPropertyMenuButton
          text="上下中央"
          icon={<MdVerticalAlignCenter className="h-3 w-3" />}
          onClick={handleAlignVCenter}
          disabled={alignInfo?.isVCenter}
        />
        <PartPropertyMenuButton
          text="下揃え"
          icon={<MdVerticalAlignBottom className="h-3 w-3" />}
          onClick={handleAlignBottom}
          disabled={alignInfo?.isBottom}
        />
      </div>
    </div>
  );
}

