'use client';

import { throttle } from 'lodash';
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
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { useSocket } from '@/features/prototype/hooks/useSocket';
import { AddPartProps, Camera, PartHandle } from '@/features/prototype/type';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { useUser } from '@/hooks/useUser';

interface CanvasProps {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号
  prototypeVersionNumber?: string;
  // グループID
  groupId: string;
  // パーツ
  parts: PartType[];
  // パーツのプロパティ
  properties: PropertyType[];
  // プレイヤー
  players: Player[];
  // カーソル
  cursors: Record<string, CursorInfo>;
  // プロトタイプの種類
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

  const { user } = useUser();
  const { dispatch } = usePartReducer();
  const { socket } = useSocket();

  // メインビューのref
  const mainViewRef = useRef<HTMLDivElement>(null);
  // パーツのref
  const partRefs = useRef<{ [key: number]: React.RefObject<PartHandle> }>({});
  // カメラ
  const [camera, setCamera] = useState<Camera>({ x: -250, y: -750, zoom: 0.6 });
  // 乱数ツールを開いているか
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);
  // 選択中のパーツ
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  const { isDraggingCanvas, onWheel, onMouseDown, onMouseMove, onMouseUp } =
    useCanvasEvents({
      camera,
      setCamera,
      setSelectedPartId,
      parts,
      mainViewRef,
    });

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
        partRefs.current[cardId]?.current?.reverseCard(isNextFlipped, false);
      }
    );

    return () => {
      socket.off('FLIP_CARD');
    };
  }, [socket]);

  /**
   * パーツを追加
   * @param part - パーツ
   * @param properties - パーツのプロパティ
   */
  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      dispatch({ type: 'ADD_PART', payload: { part, properties } });
      setSelectedPartId(null);
    },
    [dispatch]
  );

  /**
   * パーツを削除
   */
  const handleDeletePart = useCallback(() => {
    if (!selectedPartId) return;

    dispatch({ type: 'DELETE_PART', payload: { partId: selectedPartId } });
    setSelectedPartId(null);
  }, [dispatch, selectedPartId]);

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

      if (e.key === 'Backspace') {
        handleDeletePart();
      }
    },
    [handleDeletePart]
  );
  // キーボードイベントの登録
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // カーソル位置の送信部分
  const throttledMouseMove = useMemo(
    () =>
      throttle((e: MouseEvent) => {
        if (!mainViewRef.current) return;

        const rect = mainViewRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 前回の位置
        const lastPosition = lastCursorPosition.current;

        // 前回の位置があり、かつ、前回の位置と現在の位置が5px以内の場合は更新しない
        if (
          lastPosition &&
          Math.abs(lastPosition.x - x) <= 20 &&
          Math.abs(lastPosition.y - y) <= 20
        ) {
          return;
        }

        lastCursorPosition.current = { x, y };
        socket.emit('UPDATE_CURSOR', {
          userId: user?.id || '',
          userName: user?.username || 'Nanashi-san',
          position: { x, y },
        });
      }, 100),
    [socket, user]
  );

  // マウス移動イベントの設定
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      throttledMouseMove(e);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      throttledMouseMove.cancel(); // throttleのクリーンアップ
    };
  }, [throttledMouseMove]);

  // 前回のカーソル位置を保持するためのref
  const lastCursorPosition = useRef<{ x: number; y: number } | null>(null);

  /**
   * マウスダウン時の処理
   * @param e - マウスイベント
   * @param partId - パーツID
   */
  const handleMouseDown = (e: React.MouseEvent, partId?: number) => {
    if (isMasterPreview) return;

    onMouseDown(e, partId);
  };

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
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <svg
            onWheel={onWheel}
            className="h-full w-full"
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => handleMouseDown(e)}
            style={{
              cursor: isDraggingCanvas
                ? 'grabbing'
                : isMasterPreview
                  ? 'not-allowed'
                  : 'grab',
              width: '2000px',
              height: '2000px',
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
                  if (!partRefs.current[part.id]) {
                    partRefs.current[part.id] = React.createRef<PartHandle>();
                  }

                  return (
                    <Part
                      key={part.id}
                      ref={partRefs.current[part.id]}
                      part={part}
                      properties={properties.filter(
                        (property) => property.partId === part.id
                      )}
                      players={players}
                      prototypeType={prototypeType}
                      isOtherPlayerCard={otherPlayerCards.includes(part.id)}
                      onMouseDown={(e) => handleMouseDown(e, part.id)}
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
            // 自分のカーソルは表示しない
            if (cursor.userId === user?.id) return null;

            // NOTE: カーソルの位置がズレてるから、微調整
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
        </div>
      </main>
      {/* ツールバー */}
      <ToolsBar
        zoomIn={() => {
          setCamera((camera) => ({ ...camera, zoom: camera.zoom + 0.1 }));
        }}
        zoomOut={() => {
          setCamera((camera) => ({ ...camera, zoom: camera.zoom - 0.1 }));
        }}
        canZoomIn={camera.zoom < 1}
        canZoomOut={camera.zoom > 0.4}
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
