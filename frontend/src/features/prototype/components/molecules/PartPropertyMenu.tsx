/**
 * @page パーツ編集ページに表示するパーツのプロパティを編集するメニュー
 */

'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { IoMdMove } from 'react-icons/io';

import { Part } from '@/api/types';
import PartTypeIcon from '@/features/prototype/components/atoms/PartTypeIcon';
import useDraggablePartPropertyMenu from '@/features/prototype/hooks/useDraggablePartPropertyMenu';
import { DeleteImageProps, PartPropertyWithImage } from '@/features/prototype/types';
import { GameBoardMode } from '@/features/prototype/types';

import PartPropertyMenuMulti from './PartPropertyMenuMulti';
import PartPropertyMenuSingle from './PartPropertyMenuSingle';

// Props type for PartPropertyMenu
export type PartPropertyMenuProps = {
  // 選択中のパーツID
  selectedPartIds: number[];
  // パーツ
  parts: Part[];
  // パーツのプロパティ
  properties: PartPropertyWithImage[];
  // パーツを削除時の処理
  onDeletePart: () => void;
  // 画像をクリア時の処理
  onDeleteImage: ({
    imageId,
    prototypeId,
    partId,
    side,
    emitUpdate,
  }: DeleteImageProps) => void;
  // パーツ複製時の処理
  onDuplicatePart: () => void;
  // ゲームボードモード
  gameBoardMode: GameBoardMode;
};

export default function PartPropertyMenu({
  selectedPartIds,
  parts,
  properties,
  onDeletePart,
  onDeleteImage,
  onDuplicatePart,
  gameBoardMode,
}: PartPropertyMenuProps) {
  const selectedPartId = selectedPartIds[0];
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  useEffect(() => {
    if (selectedPartId !== undefined) {
      const found = parts.find((part) => part.id === selectedPartId) || null;
      setSelectedPart(found);
    }
  }, [selectedPartId, parts]);
  /** 複数選択中のパーツ一覧 */
  const selectedParts = useMemo<Part[]>(
    () => parts.filter((part) => selectedPartIds.includes(part.id)),
    [parts, selectedPartIds],
  );
  const multipleSelected = selectedPartIds.length > 1;
  const isPlayMode = gameBoardMode === GameBoardMode.PLAY;
  // Show menu when there is a selection and either:
  // - CREATE mode, or
  // - PLAY mode with multiple selection (hide for single select in PLAY mode)
  const showMenu =
    selectedPartIds.length > 0 &&
    (gameBoardMode === GameBoardMode.CREATE || (isPlayMode && multipleSelected));

  const {
    containerRef,
    position,
    isDragging,
    handleDragStart,
    clampToViewport,
  } = useDraggablePartPropertyMenu();

  // メニューが表示されるとき、または選択中パーツが変更されたときにクランプする
  const prevSelectedPartIdRef = useRef<number | undefined>(undefined);
  const prevShowMenuRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    // showMenu が false の場合は履歴だけ更新して終了
    if (!showMenu) {
      prevSelectedPartIdRef.current = selectedPartId;
      prevShowMenuRef.current = showMenu;
      return;
    }

    const becameVisible = prevShowMenuRef.current !== true;
    const selectedChanged =
      prevSelectedPartIdRef.current !== undefined &&
      prevSelectedPartIdRef.current !== selectedPartId;

    if (becameVisible || selectedChanged) {
      clampToViewport();
    }

    prevSelectedPartIdRef.current = selectedPartId;
    prevShowMenuRef.current = showMenu;
  }, [selectedPartId, showMenu, clampToViewport]);

  return (
    <div
      ref={containerRef}
      className={`flex w-[240px] flex-col rounded-lg shadow-lg bg-kibako-secondary/70 max-h-[80vh] text-xs ${
        isDragging ? 'opacity-95' : ''
      }`}
      style={{
        position: 'fixed',
        left: position ? `${position.x}px` : undefined,
        top: position ? `${position.y}px` : undefined,
        zIndex: 50,
        display: showMenu ? 'flex' : 'none',
      }}
    >
      <div
        className="relative rounded-t-lg bg-kibako-primary/70 text-kibako-white py-2 px-4 flex-shrink-0 cursor-move pr-8"
        // mouse
        onMouseDown={handleDragStart}
        // touch
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center select-none">
          {!multipleSelected && selectedPart && (
            <PartTypeIcon type={selectedPart.type} className="h-4 w-4 mr-2" />
          )}
          <span className="text-[12px] font-medium">プロパティ編集</span>
        </div>
        {/* fixed move icon at top-right of the header */}
        <IoMdMove
          className="h-4 w-4 absolute right-2 top-2 opacity-80"
          aria-hidden="true"
        />
      </div>
      <div className="flex flex-col gap-2 p-4 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <PartPropertyMenuMulti selectedParts={selectedParts} hidden={!multipleSelected} />
        <PartPropertyMenuSingle
          selectedPart={selectedPart}
          properties={properties}
          onDeletePart={onDeletePart}
          onDeleteImage={onDeleteImage}
          onDuplicatePart={onDuplicatePart}
          isPlayMode={isPlayMode}
          hidden={multipleSelected}
        />
      </div>
    </div>
  );
}
