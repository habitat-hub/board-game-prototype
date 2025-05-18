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
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
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
  // TODO: キャンバスの状態(パーツ選択中とか、パーツ作成中とか)を管理できるようにしたい（あった方が便利そう）
  // const [canvasState, setState] = useState<CanvasState>({
  //   mode: CanvasMode.None,
  // });

  // TODO: IndexedDBに保存した画像のうち、使われていないものはどこかのタイミングで削除したい
  // 画像クリアのタイミングでリアルタイムに行う必要はない。
  // 「使われていないもの」の判断基準が難しいので、まずはIndexedDBに保存することを優先する。

  const { user } = useUser();
  const { dispatch } = usePartReducer();
  const { socket } = useSocket();

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

  const [camera, setCamera] = useState<Camera>({ x: -250, y: -750, zoom: 0.6 });
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);

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

  // 他のプレイヤーのカード
  const otherPlayerCards = useMemo(() => {
    if (!user) return [];

    // 自分以外が設定されているプレイヤー
    const playerIds = players
      .filter((player) => player.userId !== user.id)
      .map((player) => player.id);
    // 自分以外がオーナーの手札
    const otherPlayerHandIds = parts
      .filter(
        (part) =>
          part.type === 'hand' &&
          part.ownerId != null &&
          playerIds.includes(part.ownerId)
      )
      .map((part) => part.id);
    // 自分以外がオーナーのカード
    return parts
      .filter(
        (part) =>
          part.type === 'card' &&
          part.parentId != null &&
          otherPlayerHandIds.includes(part.parentId)
      )
      .map((part) => part.id);
  }, [parts, players, user]);

  // 選択したパーツが更新されたら、最新化
  useEffect(() => {
    const selectedPart = parts.find((part) => part.id === selectedPartId);
    if (selectedPart) return;

    // 選択中のパーツが存在しない場合は、選択中のパーツを解除
    setSelectedPartId(null);
  }, [parts, selectedPartId]);

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
  }, [socket, parts, partRefs]);

  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      dispatch({ type: 'ADD_PART', payload: { part, properties } });
    },
    [dispatch]
  );

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
        {/* 非表示エリアの背景 */}
        <rect
          x="-100000"
          y="-100000"
          width="200000"
          height="200000"
          fill="#e2e8f0"
          opacity="0.7"
        />
        {/* 非表示エリアの斜線 */}
        <pattern
          id="diagonalHatch"
          patternUnits="userSpaceOnUse"
          width="10"
          height="10"
        >
          <path
            d="M-1,1 l2,-2 M0,10 l10,-10 M9,11 l2,-2"
            stroke="#94a3b8"
            strokeWidth="1"
          />
        </pattern>
        <rect
          x="-100000"
          y="-100000"
          width="200000"
          height="200000"
          fill="url(#diagonalHatch)"
          opacity="0.3"
        />
        {/* 表示可能エリアの背景 */}
        <rect
          x="0"
          y="0"
          width="2000"
          height="2000"
          fill="#ffffff"
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="4"
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
          {[...parts]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((part) => {
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
                  isOtherPlayerCard={otherPlayerCards.includes(part.id)}
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
