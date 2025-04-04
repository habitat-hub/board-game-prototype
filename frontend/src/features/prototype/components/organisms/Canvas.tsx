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
  PartProperty,
} from '@/api/types';
import Part from '@/features/prototype/components/atoms/Part';
import RandomNumberTool from '@/features/prototype/components/atoms/RandomNumberTool';
import EditSidebars from '@/features/prototype/components/molecules/EditSidebars';
import PreviewSidebars from '@/features/prototype/components/molecules/PreviewSidebars';
import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { VERSION_NUMBER } from '@/features/prototype/const';
import { usePrototype } from '@/features/prototype/contexts/PrototypeContext';
import { useCanvasEvents } from '@/features/prototype/hooks/useCanvasEvents';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { AddPartProps, Camera, PartHandle } from '@/features/prototype/type';
import { useUser } from '@/hooks/useUser';

interface CanvasProps {
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  parts: PartType[];
  properties: PropertyType[];
  players: Player[];
  prototypeType: 'EDIT' | 'PREVIEW';
}

export default function Canvas({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  parts,
  properties,
  players,
  prototypeType,
}: CanvasProps) {
  // TODO: キャンバスの状態(パーツ選択中とか、パーツ作成中とか)を管理できるようにしたい（あった方が便利そう）
  // const [canvasState, setState] = useState<CanvasState>({
  //   mode: CanvasMode.None,
  // });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);
  const [selectedPart, setSelectedPart] = useState<PartType | null>(null);
  const [selectedPartProperties, setSelectedPartProperties] = useState<
    PartProperty[] | null
  >(null);

  const mainViewRef = useRef<HTMLDivElement>(null);
  const partRefs = useRef<{ [key: number]: React.RefObject<PartHandle> }>({});

  const { user } = useUser();
  const { dispatch } = usePartReducer();
  const { socket } = usePrototype();

  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      dispatch({ type: 'ADD_PART', payload: { part, properties } });
      setSelectedPart(null);
      setSelectedPartProperties(null);
    },
    [dispatch]
  );
  const handleDeletePart = useCallback(() => {
    if (!selectedPart) return;

    dispatch({ type: 'DELETE_PART', payload: { partId: selectedPart.id } });
    setSelectedPart(null);
    setSelectedPartProperties(null);
  }, [dispatch, selectedPart]);

  const isEdit = prototypeType === 'EDIT';
  const isPreview = prototypeType === 'PREVIEW';

  // マスタープレビューかどうかを判定
  const isMasterPreview =
    isPreview && prototypeVersionNumber === VERSION_NUMBER.MASTER;

  const { isDraggingCanvas, onWheel, onMouseDown, onMouseMove, onMouseUp } =
    useCanvasEvents({
      camera,
      setCamera,
      setSelectedPart,
      parts,
      mainViewRef,
    });
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, partId?: number) => {
      if (isMasterPreview) return;

      onMouseDown(e, partId);
    },
    [isMasterPreview, onMouseDown]
  );

  // 選択したパーツが更新されたら、最新化
  useEffect(() => {
    const part = parts.find((part) => part.id === selectedPart?.id);
    if (part) {
      setSelectedPart(part);
      const partProperties = properties.filter(
        (property) => property.partId === part.id
      );
      setSelectedPartProperties(partProperties);
    }
  }, [parts, properties, selectedPart?.id]);

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
                      isActive={selectedPart?.id === part.id}
                    />
                  );
                })}
            </g>
          </svg>
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
        canZoomIn={camera.zoom < 2}
        canZoomOut={camera.zoom > 0.5}
      />
      {/* サイドバー */}
      {isEdit && (
        <EditSidebars
          prototypeName={prototypeName}
          prototypeVersionNumber={prototypeVersionNumber}
          groupId={groupId}
          players={players}
          selectedPart={selectedPart}
          selectedPartProperties={selectedPartProperties}
          onAddPart={handleAddPart}
          onDeletePart={handleDeletePart}
          mainViewRef={mainViewRef}
        />
      )}
      {isPreview && (
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
