'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { AiOutlineTool } from 'react-icons/ai';

import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { Camera, CanvasMode, CanvasState } from '@/features/prototype/type';
import { needsParentUpdate } from '@/features/prototype/helpers/partHelper';
import Sidebars from '@/features/prototype/components/molecules/Sidebars';
import RandomNumberTool from '@/features/prototype/components/atoms/RandomNumberTool';
import Part from '@/features/prototype/components/atoms/Part';
import { PartHandle } from '@/features/prototype/components/atoms/Part';
import {
  PART_TYPE,
  PROTOTYPE_TYPE,
  VERSION_NUMBER,
} from '@/features/prototype/const';
import { Part as PartType, Player } from '@/types/models';

interface CanvasProps {
  prototypeName: string;
  prototypeVersionId: string;
  prototypeVersionNumber?: string;
  groupId: number;
  parts: PartType[];
  players: Player[];
  socket: Socket;
  prototypeType: typeof PROTOTYPE_TYPE.EDIT | typeof PROTOTYPE_TYPE.PREVIEW;
}

export default function Canvas({
  prototypeName,
  prototypeVersionId,
  prototypeVersionNumber,
  groupId,
  parts,
  players,
  socket,
  prototypeType,
}: CanvasProps) {
  const [canvasState, setState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [leftIsMinimized, setLeftIsMinimized] = useState(false);
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartType | null>(null);
  const [draggingPartId, setDraggingPartId] = useState<number | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const mainViewRef = useRef<HTMLDivElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const partRefs = useRef<{ [key: number]: React.RefObject<PartHandle> }>({});

  // マスタープレビューかどうかを判定
  const isMasterPreview =
    prototypeType === PROTOTYPE_TYPE.PREVIEW &&
    prototypeVersionNumber === VERSION_NUMBER.MASTER;

  // 選択したパーツが更新されたら、最新化
  useEffect(() => {
    const part = parts.find((part) => part.id === selectedPart?.id);
    if (part) {
      setSelectedPart(part);
    }
  }, [parts, selectedPart?.id]);

  /**
   * ズーム操作
   * @param e - ホイールイベント
   */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // TODO: スクロールの上限を決める
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
      zoom: camera.zoom,
    }));
  }, []);

  /**
   * パーツの追加
   * @param part - 追加するパーツ
   */
  const handleAddPart = useCallback(
    (
      part: Omit<
        PartType,
        'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
      >
    ) => {
      socket.emit('ADD_PART', { prototypeVersionId, part });

      setSelectedPart(null);
    },
    [prototypeVersionId, socket]
  );

  /**
   * パーツの更新
   * @param part - 更新するパーツ
   */
  const handleUpdatePart = useCallback(
    (partId: number, updatePart: Partial<PartType>, isFlipped?: boolean) => {
      socket.emit('UPDATE_PART', { prototypeVersionId, partId, updatePart });

      if ('isReversible' in updatePart && isFlipped) {
        socket.emit('FLIP_CARD', {
          prototypeVersionId: prototypeVersionId,
          cardId: partId,
          isNextFlipped: false,
        });
      }
    },
    [prototypeVersionId, socket]
  );

  /**
   * パーツの順番を変更
   * @param partId - パーツID
   * @param type - 移動方向
   */
  const handleChangeOrder = useCallback(
    (partId: number, type: string) => {
      socket.emit('CHANGE_ORDER', { prototypeVersionId, partId, type });
    },
    [prototypeVersionId, socket]
  );

  /**
   * マウスダウンイベントのハンドラー
   * @param e - マウスイベント
   * @param partId - パーツID（パーツからの呼び出し時のみ）
   */
  const handleMouseDown = (e: React.MouseEvent, partId?: number) => {
    if (isMasterPreview) return; // マスタープレビューの場合は操作を無効化

    if (partId !== undefined) {
      // パーツのドラッグ開始
      const part = parts.find((part) => part.id === partId) as PartType;
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect) return;

      setSelectedPart(part);
      setDraggingPartId(partId);

      const x =
        (e.clientX - rect.left) / camera.zoom - (part.position.x as number);
      const y =
        (e.clientY - rect.top) / camera.zoom - (part.position.y as number);
      setOffset({ x, y });
    } else if (e.target === e.currentTarget || e.target instanceof SVGElement) {
      // キャンバスの移動開始
      setIsDraggingCanvas(true);
      setDragStart({
        x: e.clientX - camera.x,
        y: e.clientY - camera.y,
      });
    }
  };

  /**
   * マウス移動イベントのハンドラー
   * @param e - マウス移動イベント
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingPartId !== null) {
      // パーツのドラッグ処理
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect) return;

      // マウス位置からパーツの新しい位置を計算
      const x = (e.clientX - rect.left) / camera.zoom - offset.x;
      const y = (e.clientY - rect.top) / camera.zoom - offset.y;

      handleUpdatePart(draggingPartId, { position: { x, y } });
    } else if (isDraggingCanvas) {
      // カメラの移動処理
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
      setSelectedPart(null);
    }
  };

  /**
   * マウスアップイベントのハンドラー
   */
  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggingPartId === null) {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    const rect = mainViewRef.current?.getBoundingClientRect();
    if (!rect) {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    const part = parts.find((part) => part.id === draggingPartId);
    if (!part || part.type !== PART_TYPE.CARD) {
      setDraggingPartId(null);
      setIsDraggingCanvas(false);
      return;
    }

    const newPosition = {
      x: (e.clientX - rect.left) / camera.zoom - offset.x,
      y: (e.clientY - rect.top) / camera.zoom - offset.y,
    };

    const { needsUpdate, parentPart } = needsParentUpdate(
      parts,
      part,
      newPosition
    );
    if (needsUpdate) {
      handleUpdatePart(draggingPartId, { parentId: parentPart?.id || null });
    }

    // カードの反転処理

    // 前の親は裏向き必須か
    const previousParentPart = parts.find((p) => p.id === part.parentId);
    const isPreviousParentReverseRequired =
      !!(previousParentPart?.type === PART_TYPE.DECK) &&
      !!previousParentPart.canReverseCardOnDeck;

    // 新しい親は裏向き必須か
    const isNextParentReverseRequired =
      !!(parentPart?.type === PART_TYPE.DECK) &&
      !!parentPart.canReverseCardOnDeck;

    if (isPreviousParentReverseRequired !== isNextParentReverseRequired) {
      socket.emit('FLIP_CARD', {
        prototypeVersionId,
        cardId: draggingPartId,
        isNextFlipped: !isPreviousParentReverseRequired,
      });
    }

    setDraggingPartId(null);
    setIsDraggingCanvas(false);
  };

  /**
   * パーツの削除
   */
  const handleDeletePart = useCallback(() => {
    if (!selectedPart) return;

    socket.emit('DELETE_PART', {
      prototypeVersionId,
      partId: selectedPart.id,
    });
    setSelectedPart(null);
  }, [prototypeVersionId, selectedPart, socket]);

  /**
   * キーボードイベントのハンドラー
   * @param e - キーボードイベント
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 入力要素にフォーカスがある場合は処理をスキップ
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      if (e.key === 'Backspace' && selectedPart) {
        handleDeletePart();
      }
    },
    [handleDeletePart, selectedPart]
  );

  // キーボードイベントの登録
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // ソケットイベントの購読
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
        // 該当するパーツのflip関数を呼び出し
        partRefs.current[cardId]?.current?.flip(isNextFlipped);
      }
    );

    return () => {
      socket.off('FLIP_CARD');
    };
  }, [socket]);

  return (
    <div className="flex h-full w-full">
      <main
        className={`h-full w-full ${
          isMasterPreview ? 'pointer-events-none' : ''
        }`}
        ref={mainViewRef}
      >
        <div
          className="h-full w-full touch-none"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            onWheel={handleWheel}
            className="h-full w-full"
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => handleMouseDown(e)}
            style={{
              cursor: isDraggingCanvas
                ? 'grabbing'
                : isMasterPreview
                ? 'not-allowed'
                : 'grab',
            }}
          >
            <g
              style={{
                transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`,
              }}
            >
              {[...parts]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((part) => {
                  if (!partRefs.current[part.id]) {
                    partRefs.current[part.id] = React.createRef<PartHandle>();
                  }

                  return (
                    <Part
                      key={part.id}
                      ref={partRefs.current[part.id]}
                      part={part}
                      onMouseDown={(e) => handleMouseDown(e, part.id)}
                      socket={socket}
                      onMoveOrder={({ partId, type }) => {
                        if (!isMasterPreview) {
                          handleChangeOrder(partId, type);
                        }
                      }}
                    />
                  );
                })}
            </g>
          </svg>
        </div>
      </main>
      {/* ツールバー */}
      <ToolsBar
        canvasState={canvasState}
        setCanvasState={(newState) => setState(newState)}
        zoomIn={() => {
          setCamera((camera) => ({ ...camera, zoom: camera.zoom + 0.1 }));
        }}
        zoomOut={() => {
          setCamera((camera) => ({ ...camera, zoom: camera.zoom - 0.1 }));
        }}
        canZoomIn={camera.zoom < 2}
        canZoomOut={camera.zoom > 0.5}
      />
      {/* サイドバー */}
      <Sidebars
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        leftIsMinimized={leftIsMinimized}
        setLeftIsMinimized={setLeftIsMinimized}
        groupId={groupId}
        players={players}
        selectedPart={selectedPart}
        onAddPart={handleAddPart}
        onDeletePart={handleDeletePart}
        updatePart={handleUpdatePart}
        mainViewRef={mainViewRef}
        prototypeType={prototypeType}
      />
      {/* 乱数ツールボタン */}
      <button
        onClick={() => setIsRandomToolOpen(!isRandomToolOpen)}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-2 rounded-full shadow-lg"
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
