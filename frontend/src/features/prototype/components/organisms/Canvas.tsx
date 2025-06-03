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

import { useImages } from '@/api/hooks/useImages';
import {
  Part as PartType,
  PartProperty as PropertyType,
  Player,
} from '@/api/types';
import Part from '@/features/prototype/components/atoms/Part';
import RandomNumberTool from '@/features/prototype/components/atoms/RandomNumberTool';
import { Cursor } from '@/features/prototype/components/Cursor';
import PartCreateSidebar from '@/features/prototype/components/molecules/PartCreateSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import PreviewSidebars from '@/features/prototype/components/molecules/PreviewSidebars';
import ShortcutHelpPanel from '@/features/prototype/components/molecules/ShortcutHelpPanel';
import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { VERSION_NUMBER } from '@/features/prototype/const';
import { useCanvasEvents } from '@/features/prototype/hooks/useCanvasEvents';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { useSocket } from '@/features/prototype/hooks/useSocket';
import { AddPartProps, Camera, PartHandle } from '@/features/prototype/type';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { useUser } from '@/hooks/useUser';
import { saveImageToIndexedDb, getImageFromIndexedDb } from '@/utils/db';

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

  // TODO: IndexedDBに保存した画像のうち、使われていないものはどこかのタイミングで削除したい
  // 画像クリアのタイミングでリアルタイムに行う必要はない。
  // 「使われていないもの」の判断基準が難しいので、まずはIndexedDBに保存することを優先する。

  const { user } = useUser();
  const { dispatch } = usePartReducer();
  const { socket } = useSocket();
  const { fetchImage } = useImages();

  // メインビューのref
  const mainViewRef = useRef<HTMLDivElement>(null);
  // パーツのref
  const partRefs = useRef<{ [key: number]: React.RefObject<PartHandle> }>({});
  // カメラ
  const [camera, setCamera] = useState<Camera>({ x: -200, y: -500, zoom: 0.5 });
  // 乱数ツールを開いているか
  const [isRandomToolOpen, setIsRandomToolOpen] = useState(false);
  // 選択中のパーツ
  const [selectedPartId, setSelectedPartId] = useState<number | null>(null);
  // 表示対象の画像
  const [images, setImages] = useState<Record<string, string>[]>([]);

  // 複数選択中のパーツID配列
  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  const {
    isDraggingCanvas,
    relatedDraggingPartIds,
    onWheel,
    onCanvasMouseDown,
    onPartMouseDown,
    onMouseMove,
    onMouseUp,
  } = useCanvasEvents({
    camera,
    setCamera,
    setSelectedPartId,
    selectedPartId,
    selectedPartIds,
    setSelectedPartIds,
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
    setSelectedPartIds([]);
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

    // ADD_PARTレスポンスのリスナーを追加
    socket.on('ADD_PART_RESPONSE', ({ partId }: { partId: number }) => {
      if (partId) {
        // 新しいパーツが追加された場合は、既存の選択をクリアして新しいパーツのみを選択
        setSelectedPartId(partId);
        setSelectedPartIds([partId]);
      }
    });

    return () => {
      socket.off('FLIP_CARD');
      socket.off('ADD_PART_RESPONSE');
    };
  }, [socket, parts]);

  /**
   * 画像をIndexedDBから取得し、キャッシュがない場合はS3から取得してIndexedDBに保存
   */
  useEffect(() => {
    let urlsToRevoke: string[] = []; // クリーンアップ用のURLリスト

    const loadImages = async () => {
      // property.imageIdが存在するものだけを抽出し、重複を除去
      const uniqueImageIds = Array.from(
        new Set(properties.map((property) => property.imageId).filter(Boolean))
      ) as string[];

      // IndexedDBやS3から画像を取得し、URLを生成
      const imageResults = await Promise.all(
        uniqueImageIds.map(async (imageId) => {
          const cachedImage = await getImageFromIndexedDb(imageId);
          if (cachedImage) {
            const url = URL.createObjectURL(cachedImage);
            return { imageId, url };
          } else {
            const s3ImageBlob = await fetchImage(imageId);
            await saveImageToIndexedDb(imageId, s3ImageBlob);
            const url = URL.createObjectURL(s3ImageBlob);
            return { imageId, url };
          }
        })
      );

      // 画像データをステートに保存
      const newImages = imageResults.map(({ imageId, url }) => ({
        [imageId]: url,
      }));
      setImages(newImages);

      // クリーンアップ用のURLリストを更新
      urlsToRevoke = imageResults.map(({ url }) => url);
    };

    loadImages();

    // クリーンアップ処理で画像のURLを解放
    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fetchImage, properties]);

  /**
   * propertiesに紐づく画像を取得
   * @param filteredProperties
   * @param images
   * @returns
   */
  const getFilteredImages = (
    filteredProperties: PropertyType[],
    images: Record<string, string>[]
  ): Record<string, string>[] => {
    return filteredProperties.reduce<Record<string, string>[]>(
      (acc, filteredProperty) => {
        const imageId = filteredProperty.imageId;
        if (!imageId) return acc;

        const targetImage = images.find((image) => image[imageId]);
        if (targetImage) {
          acc.push({ [imageId]: targetImage[imageId] });
        }

        return acc;
      },
      []
    );
  };

  /**
   * パーツを追加
   * @param part - パーツ
   * @param properties - パーツのプロパティ
   */
  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      // パーツ追加前に既存の選択をクリアする準備
      // 注意: dispatch後のADD_PART_RESPONSEイベントで新しいパーツが選択される
      setSelectedPartIds([]);
      dispatch({ type: 'ADD_PART', payload: { part, properties } });
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
   * キャンバスに関するマウスダウンイベントのハンドラー
   * @param e - マウスイベント
   */
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    onCanvasMouseDown(e);
  };

  /**
   * パーツに関するマウスダウンイベントのハンドラー
   * @param e - マウスイベント
   * @param partId - パーツID
   */
  const handlePartMouseDown = (e: React.MouseEvent, partId: number) => {
    if (isMasterPreview) return;

    onPartMouseDown(e, partId);
  };

  return (
    <div className="flex h-full w-full">
      <main className="h-full w-full" ref={mainViewRef}>
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
            onMouseDown={handleCanvasMouseDown}
            style={{
              cursor: isDraggingCanvas ? 'grabbing' : 'grab',
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
                  // 該当するpropertiesをフィルタリング
                  const filteredProperties = properties.filter(
                    (property) => property.partId === part.id
                  );
                  // 該当するimagesをフィルタリング
                  const filteredImages = getFilteredImages(
                    filteredProperties,
                    images
                  );
                  return (
                    <Part
                      key={part.id}
                      ref={partRefs.current[part.id]}
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
                      isActive={
                        selectedPartId === part.id ||
                        selectedPartIds.includes(part.id) ||
                        relatedDraggingPartIds.includes(part.id)
                      }
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
          setCamera((camera) => {
            // 最大値を1.0（100%）に制限
            const newZoom = camera.zoom + 0.1;
            return { ...camera, zoom: newZoom > 1.0 ? 1.0 : newZoom };
          });
        }}
        zoomOut={() => {
          setCamera((camera) => {
            // 最小値を0.4（40%）に制限
            const newZoom = camera.zoom - 0.1;
            return { ...camera, zoom: newZoom < 0.4 ? 0.4 : newZoom };
          });
        }}
        canZoomIn={camera.zoom < 1}
        canZoomOut={camera.zoom > 0.4}
        zoomLevel={camera.zoom}
      />
      {/* サイドバー */}
      {prototypeType === 'EDIT' && (
        <>
          {/* Left Sidebar */}
          <PartCreateSidebar
            prototypeName={prototypeName}
            groupId={groupId}
            players={players}
            onAddPart={handleAddPart}
          />

          {/* ショートカットヘルプパネル */}
          <ShortcutHelpPanel
            shortcuts={[
              {
                id: 'multi-select',
                key: 'Shift + クリック',
                description: '複数のパーツを選択できます',
              },
              {
                id: 'delete',
                key: 'Delete / Backspace',
                description: '選択中のパーツを削除します',
              },
            ]}
          />

          {/* Right Sidebar */}
          {selectedPartIds.length === 1 && (
            <PartPropertySidebar
              players={players}
              selectedPartId={selectedPartIds[0]}
              parts={parts}
              properties={properties}
              onAddPart={handleAddPart}
              onDeletePart={handleDeletePart}
            />
          )}
        </>
      )}
      {prototypeType === 'PREVIEW' && (
        <PreviewSidebars
          prototypeName={prototypeName}
          prototypeVersionNumber={prototypeVersionNumber}
          isMasterPreview={isMasterPreview}
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
