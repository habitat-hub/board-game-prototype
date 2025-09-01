import Konva from 'konva';
import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Stage, Layer, Group, Rect } from 'react-konva';

import { Part, PartProperty } from '@/api/types';
import GridLines from '@/features/prototype/components/atoms/GridLines';
import SelectionRect from '@/features/prototype/components/atoms/SelectionRect';
import PartOnGameBoard from '@/features/prototype/components/molecules/PartOnGameBoard';
import { GRID_SIZE } from '@/features/prototype/constants';
import { GameBoardMode } from '@/features/prototype/types';

/**
 * GameBoardCanvas
 * Stage/Layer/Group を描画するプレゼンテーション層。カメラ変換・背景・グリッド・
 * パーツ描画・選択矩形の表示と、各種イベントの委譲のみを担当する。
 */
interface GameBoardCanvasProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  viewportSize: { width: number; height: number };
  canvasSize: { width: number; height: number };
  camera: { x: number; y: number; scale: number };
  gameBoardMode: GameBoardMode;
  isSelectionMode: boolean;
  // CSS の cursor 型を使用して厳密化
  cursorStyle: CSSProperties['cursor'];
  grabbingHandlers: {
    // Pointer/Mouse 双方を許容
    onMouseDown?: (
      e: Konva.KonvaEventObject<MouseEvent | PointerEvent>
    ) => void;
    onMouseUp?: (
      e: Konva.KonvaEventObject<MouseEvent | PointerEvent>
    ) => void;
    onMouseLeave?: (
      e: Konva.KonvaEventObject<MouseEvent | PointerEvent>
    ) => void;
  };
  handleWheel: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  handleStageClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  // 外部からイベント無しでも呼べるようにオプショナルに
  handleCloseContextMenu: (e?: Konva.KonvaEventObject<MouseEvent>) => void;
  handleSelectionMove: (
    e: Konva.KonvaEventObject<MouseEvent | PointerEvent>,
    camera: { x: number; y: number; scale: number }
  ) => void;
  handleSelectionEnd: (
    e: Konva.KonvaEventObject<MouseEvent | PointerEvent>
  ) => void;
  handleDragMove: (e: Konva.KonvaEventObject<DragEvent>) => void;
  handleSelectionStart: (
    e: Konva.KonvaEventObject<MouseEvent | PointerEvent>,
    camera: { x: number; y: number; scale: number }
  ) => void;
  handleBackgroundClick: () => void;
  parts: Part[];
  propertiesMap: Map<number, PartProperty[]>;
  images: Record<string, string>;
  selectedPartIds: number[];
  selectedUsersByPart: Record<number, { userId: string; username: string }[]>;
  cardVisibilityMap: Map<number, boolean>;
  selfUser: { userId: string; username: string } | null;
  userRoles: Array<{
    userId: string;
    user: { id: string; username: string };
    roles: Array<{ name: string; description: string }>;
  }>;
  handlePartClick: (
    e: Konva.KonvaEventObject<MouseEvent>,
    partId: number
  ) => void;
  handlePartDragStart: (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => void;
  handlePartDragMove: (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => void;
  handlePartDragEnd: (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => void;
  handlePartContextMenu: (
    e: Konva.KonvaEventObject<PointerEvent>,
    partId: number
  ) => void;
  rectForSelection: {
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
  };
}

/**
 * キャンバスの描画とイベント委譲を行うコンポーネント。
 * 主要な責務は、カメラ変換、背景・グリッド表示、
 * パーツ描画、選択矩形の表示、および各種イベントの親への委譲。
 */
export default function GameBoardCanvas({
  stageRef,
  viewportSize,
  canvasSize,
  camera,
  gameBoardMode,
  isSelectionMode,
  cursorStyle,
  grabbingHandlers,
  handleWheel,
  handleStageClick,
  handleCloseContextMenu,
  handleSelectionMove,
  handleSelectionEnd,
  handleDragMove,
  handleSelectionStart,
  handleBackgroundClick,
  parts,
  propertiesMap,
  images,
  selectedPartIds,
  selectedUsersByPart,
  cardVisibilityMap,
  selfUser,
  userRoles,
  handlePartClick,
  handlePartDragStart,
  handlePartDragMove,
  handlePartDragEnd,
  handlePartContextMenu,
  rectForSelection,
}: GameBoardCanvasProps): React.ReactElement {
  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => a.order - b.order);
  }, [parts]);

  const filteredImagesMap = useMemo(() => {
    const map: Record<number, Record<string, string>[]> = {};
    parts.forEach((part) => {
      const partProperties = propertiesMap.get(part.id) || [];
      map[part.id] = partProperties.reduce<Record<string, string>[]>((acc, p) => {
        const imageId = p.imageId;
        if (!imageId) return acc;
        const url = images[imageId];
        if (url) {
          acc.push({ [imageId]: url });
        }
        return acc;
      }, []);
    });
    return map;
  }, [parts, propertiesMap, images]);

  return (
    <Stage
      width={viewportSize.width}
      height={viewportSize.height}
      ref={stageRef}
      onWheel={handleWheel}
      onClick={handleStageClick}
      onContextMenu={(e: Konva.KonvaEventObject<MouseEvent>) => {
        e.evt.preventDefault();
        handleCloseContextMenu(e);
      }}
      onMouseMove={(e: Konva.KonvaEventObject<MouseEvent>) =>
        handleSelectionMove(e, camera)
      }
      onPointerMove={(e: Konva.KonvaEventObject<PointerEvent>) =>
        handleSelectionMove(e, camera)
      }
      onMouseUp={(e: Konva.KonvaEventObject<MouseEvent>) => {
        handleSelectionEnd(e);
        grabbingHandlers.onMouseUp?.(e);
      }}
      onPointerUp={(e: Konva.KonvaEventObject<PointerEvent>) => {
        handleSelectionEnd(e);
        grabbingHandlers.onMouseUp?.(e);
      }}
      onMouseDown={grabbingHandlers.onMouseDown}
      onMouseLeave={grabbingHandlers.onMouseLeave}
      style={{ cursor: cursorStyle }}
    >
      <Layer>
        <Group
          id="camera"
          x={-camera.x}
          y={-camera.y}
          scaleX={camera.scale}
          scaleY={camera.scale}
        >
          <Rect
            x={0}
            y={0}
            width={canvasSize.width}
            height={canvasSize.height}
            fill={gameBoardMode === GameBoardMode.PLAY ? '#fff' : '#f5f5f5'}
            draggable={!isSelectionMode}
            onDragMove={handleDragMove}
            onClick={handleBackgroundClick}
            hitStrokeWidth={0}
            {...(isSelectionMode
              ? {
                  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) =>
                    handleSelectionStart(e, camera),
                  onPointerDown: (e: Konva.KonvaEventObject<PointerEvent>) =>
                    handleSelectionStart(e, camera),
                }
              : {})}
          />
          {gameBoardMode === GameBoardMode.CREATE && (
            <GridLines
              camera={camera}
              viewportSize={viewportSize}
              gridSize={GRID_SIZE}
            />
          )}
          {sortedParts.map((part) => {
            const partProperties = propertiesMap.get(part.id) || [];
            const filteredImages = filteredImagesMap[part.id] || [];
            const isActive = selectedPartIds.includes(part.id);
            const selectedBy = selectedUsersByPart[part.id] || [];
            const isOtherPlayerHandCard =
              part.type === 'card' && cardVisibilityMap.get(part.id) === false;
            return (
              <PartOnGameBoard
                key={part.id}
                part={part}
                properties={partProperties}
                images={filteredImages}
                gameBoardMode={gameBoardMode}
                isActive={isActive}
                selectedBy={selectedBy}
                selfUser={selfUser ?? undefined}
                isOtherPlayerHandCard={isOtherPlayerHandCard}
                userRoles={userRoles}
                onClick={(e) => handlePartClick(e, part.id)}
                onDragStart={(e) => handlePartDragStart(e, part.id)}
                onDragMove={(e) => handlePartDragMove(e, part.id)}
                onDragEnd={(e) => handlePartDragEnd(e, part.id)}
                onContextMenu={(e) => handlePartContextMenu(e, part.id)}
              />
            );
          })}
          <SelectionRect
            x={rectForSelection.x}
            y={rectForSelection.y}
            width={rectForSelection.width}
            height={rectForSelection.height}
            visible={isSelectionMode && rectForSelection.visible}
          />
        </Group>
      </Layer>
    </Stage>
  );
}
