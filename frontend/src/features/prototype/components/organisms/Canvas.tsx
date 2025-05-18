'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AiOutlineTool } from 'react-icons/ai';

import {
  Part as PartType,
  PartProperty as PropertyType,
  Player,
} from '@/api/types';
import Part from '@/features/prototype/components/atoms/Part';
import RandomNumberTool from '@/features/prototype/components/atoms/RandomNumberTool';
import { Cursor } from '@/features/prototype/components/Cursor';
import EditSidebars from '@/features/prototype/components/molecules/EditSidebars';
import PreviewSidebars from '@/features/prototype/components/molecules/PreviewSidebars';
import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { VERSION_NUMBER } from '@/features/prototype/const';
import { useCanvasEvents } from '@/features/prototype/hooks/useCanvasEvents';
import { useCursorSync } from '@/features/prototype/hooks/useCursorSync';
import { useImageLoader } from '@/features/prototype/hooks/useImageLoader';
import { usePartDisplay } from '@/features/prototype/hooks/usePartDisplay';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePartSelection } from '@/features/prototype/hooks/usePartSelection';
import { useSocket } from '@/features/prototype/hooks/useSocket';
import { AddPartProps, Camera, PartHandle } from '@/features/prototype/type';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { useUser } from '@/hooks/useUser';

interface CanvasProps {
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  parts: PartType[];
  properties: PropertyType[];
  players: Player[];
  cursors: Record<string, CursorInfo>;
  prototypeType: 'EDIT' | 'PREVIEW';
}

export default function Canvas({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  parts,
  properties,
  players,
  cursors,
  prototypeType,
}: CanvasProps) {
  const { user } = useUser();
  const { dispatch } = usePartReducer();
  const { socket } = useSocket();
  const { selectedPartId, setSelectedPartId, handleDeletePart } =
    usePartSelection({ parts });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // パーツの参照を部品配列に基づいてメモ化
  const partRefsContainer = useRef<{
    [key: number]: React.RefObject<PartHandle>;
  }>({});
  const partRefs = useMemo(() => {
    const refs = partRefsContainer.current;

    // 存在しないパーツの参照を削除
    const currentPartIds = new Set(parts.map((part) => part.id));
    Object.keys(refs).forEach((id) => {
      const numId = Number(id);
      if (!currentPartIds.has(numId)) {
        delete refs[numId];
      }
    });

    // 新しいパーツの参照を作成
    parts.forEach((part) => {
      if (!refs[part.id]) {
        refs[part.id] = React.createRef<PartHandle>();
      }
    });

    return refs;
  }, [parts]);

  const [camera, setCamera] = useState<Camera>({ x: 0, y: -250, zoom: 0.4 });
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);

  // パーツ表示関連のカスタムフック
  const { sortedParts, isOtherPlayerCard } = usePartDisplay(parts, players);

  // カーソル同期のカスタムフックを使用
  useCursorSync({
    containerRef: canvasContainerRef,
    socket,
    user,
  });

  // 画像ローダーカスタムフック
  const { getFilteredImages } = useImageLoader(properties);

  const {
    isDraggingCanvas,
    onWheel,
    onCanvasMouseDown,
    onPartMouseDown,
    onMouseMove,
    onMouseUp,
  } = useCanvasEvents({
    camera,
    setCamera,
    setSelectedPartId,
    parts,
    canvasContainerRef,
  });

  const handleZoomIn = useCallback(() => {
    setCamera((prev) => {
      const newZoom = Math.min((Math.round(prev.zoom * 10) + 1) / 10, 1);
      return { ...prev, zoom: newZoom };
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setCamera((prev) => {
      const newZoom = Math.max((Math.round(prev.zoom * 10) - 1) / 10, 0.1);
      return { ...prev, zoom: newZoom };
    });
  }, []);

  // マスタープレビューかどうか
  const isMasterPreview =
    prototypeType === 'PREVIEW' &&
    prototypeVersionNumber === VERSION_NUMBER.MASTER;

  // ソケットイベントの定義
  useEffect(() => {
    socket.on(
      'FLIP_CARD',
      ({
        cardId,
        isNextFlipped,
      }: {
        cardId: number;
        isNextFlipped: boolean;
      }) => {
        // 該当するパーツのreverseCard関数を呼び出し
        partRefs[cardId]?.current?.reverseCard(isNextFlipped, false);
      }
    );

    // ADD_PARTレスポンスのリスナーを追加
    socket.on('ADD_PART_RESPONSE', ({ partId }: { partId: number }) => {
      if (partId) {
        setSelectedPartId(partId);
      }
    });

    return () => {
      socket.off('FLIP_CARD');
      socket.off('ADD_PART_RESPONSE');
    };
  }, [socket, parts, partRefs, setSelectedPartId]);

  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      dispatch({ type: 'ADD_PART', payload: { part, properties } });
    },
    [dispatch]
  );

  // マスタープレビュー時以外はパーツ選択を可能に
  const handlePartMouseDown = (e: React.MouseEvent, partId: number) => {
    if (!isMasterPreview) {
      onPartMouseDown(e, partId);
    }
  };

  // キャンバスのマウスダウンイベント
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    onCanvasMouseDown(e);
  };

  return (
    <div
      className="flex h-screen w-screen touch-none"
      ref={canvasContainerRef}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      <svg
        onWheel={onWheel}
        className="h-full w-full"
        onContextMenu={(e) => e.preventDefault()}
        onMouseDown={handleCanvasMouseDown}
        style={{
          cursor: isDraggingCanvas ? 'grabbing' : 'grab',
        }}
      >
        {/* 全体の背景 */}
        <rect
          x="-100000"
          y="-100000"
          width="200000"
          height="200000"
          fill="#ffffff"
        />
        {/* グリッドパターン */}
        <pattern
          id="grid"
          width="50"
          height="50"
          patternUnits="userSpaceOnUse"
        >
          <rect width="50" height="50" fill="none" stroke="#e2e8f0" strokeWidth="1" />
        </pattern>
        {/* 全体にグリッドを適用 */}
        <rect
          x="-100000"
          y="-100000"
          width="200000"
          height="200000"
          fill="url(#grid)"
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: 'center center',
          }}
        />
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {sortedParts.map((part) => {
            const filteredProperties = properties.filter(
              (property) => property.partId === part.id
            );
            const filteredImages = getFilteredImages(filteredProperties);
            return (
              <Part
                key={part.id}
                ref={partRefs[part.id]}
                part={part}
                properties={filteredProperties}
                images={filteredImages}
                players={players}
                prototypeType={prototypeType}
                isOtherPlayerCard={isOtherPlayerCard(part.id)}
                onMouseDown={(e) => handlePartMouseDown(e, part.id)}
                onMoveOrder={({
                  partId,
                  type,
                }: {
                  partId: number;
                  type: 'front' | 'back' | 'backmost' | 'frontmost';
                }) => {
                  if (isMasterPreview) return;

                  dispatch({
                    type: 'CHANGE_ORDER',
                    payload: { partId, type },
                  });
                }}
                isActive={selectedPartId === part.id}
              />
            );
          })}
        </g>
      </svg>

      {/* カーソルを表示 */}
      {Object.values(cursors).map((cursor) => {
        if (cursor.userId === user?.id) return null;

        const adjustedPosition = {
          x: cursor.position.x + 85,
          y: cursor.position.y + 35,
        };

        return (
          <Cursor
            key={cursor.userId}
            cursor={{
              ...cursor,
              position: adjustedPosition,
            }}
          />
        );
      })}

      {/* ツールバー */}
      <ToolsBar
        zoomIn={handleZoomIn}
        zoomOut={handleZoomOut}
        canZoomIn={camera.zoom < 1}
        canZoomOut={camera.zoom > 0.1}
        zoomLevel={camera.zoom}
      />

      {/* サイドバー */}
      {prototypeType === 'EDIT' && (
        <EditSidebars
          prototypeName={prototypeName}
          prototypeVersionNumber={prototypeVersionNumber}
          groupId={groupId}
          players={players}
          selectedPartId={selectedPartId}
          parts={parts}
          properties={properties}
          onAddPart={handleAddPart}
          onDeletePart={handleDeletePart}
        />
      )}

      {prototypeType === 'PREVIEW' && (
        <PreviewSidebars
          prototypeName={prototypeName}
          prototypeVersionNumber={prototypeVersionNumber}
          groupId={groupId}
          players={players}
        />
      )}

      {/* 乱数ツールボタン */}
      <button
        onClick={() => setIsRandomToolOpen(!isRandomToolOpen)}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-2 rounded-full shadow-lg"
        aria-label="乱数ツールを開く"
      >
        <AiOutlineTool size={30} />
      </button>

      {/* 乱数計算UI */}
      {isRandomToolOpen && (
        <RandomNumberTool onClose={() => setIsRandomToolOpen(false)} />
      )}
    </div>
  );
}
