// クライアントサイドレンダリングを有効化
'use client';

import Konva from 'konva';
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Stage, Layer, Group, Rect } from 'react-konva';

import { useImages } from '@/api/hooks/useImages';
import {
  Part as PartType,
  PartProperty as PropertyType,
  Player,
} from '@/api/types';
import DebugInfo from '@/features/prototype/components/atoms/DebugInfo';
import GridLines from '@/features/prototype/components/atoms/GridLines';
import Part2 from '@/features/prototype/components/atoms/Part2';
import EditSidebars from '@/features/prototype/components/molecules/EditSidebars';
import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { DebugModeProvider } from '@/features/prototype/contexts/DebugModeContext';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { AddPartProps } from '@/features/prototype/type';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { getImageFromIndexedDb, saveImageToIndexedDb } from '@/utils/db';

const GRID_SIZE = 50;
const CANVAS_SIZE = 5000;
const MIN_SCALE = 0.18;
const MAX_SCALE = 8;

interface GameBoardProps {
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  parts: PartType[];
  properties: PropertyType[];
  players: Player[];
  cursors: Record<string, CursorInfo>;
  prototypeType: 'EDIT' | 'PREVIEW';
}

export default function GameBoard({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  parts,
  properties,
  players,
  cursors,
  prototypeType,
}: GameBoardProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { fetchImage } = useImages();
  const { dispatch } = usePartReducer();
  const [images, setImages] = useState<Record<string, string>[]>([]);

  // マスタープレビューかどうか
  const isMasterPreview =
    prototypeType === 'PREVIEW' && prototypeVersionNumber === 'MASTER';

  // 固定キャンバスサイズを使用 - 再作成を防ぐためにメモ化
  const canvasSize = useMemo(
    () => ({
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
    }),
    []
  );

  const centerCoords = useMemo(
    () => ({
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
    }),
    [canvasSize]
  );

  const initialCameraPosition = useMemo(() => {
    return {
      x: centerCoords.x - viewportSize.width / 2 / 0.5,
      y: centerCoords.y - viewportSize.height / 2 / 0.5,
      scale: 0.5,
    };
  }, [centerCoords, viewportSize]);

  const [camera, setCamera] = useState(initialCameraPosition);

  const constrainCamera = useCallback(
    (x: number, y: number, scale: number) => {
      let constrainedX = x;
      let constrainedY = y;

      const scaledCanvasWidth = canvasSize.width * scale;
      const scaledCanvasHeight = canvasSize.height * scale;

      if (scaledCanvasWidth > viewportSize.width) {
        constrainedX = Math.max(0, constrainedX);
        constrainedX = Math.min(
          scaledCanvasWidth - viewportSize.width,
          constrainedX
        );
      } else {
        constrainedX = (scaledCanvasWidth - viewportSize.width) / 2;
      }

      if (scaledCanvasHeight > viewportSize.height) {
        constrainedY = Math.max(0, constrainedY);
        constrainedY = Math.min(
          scaledCanvasHeight - viewportSize.height,
          constrainedY
        );
      } else {
        constrainedY = (scaledCanvasHeight - viewportSize.height) / 2;
      }

      return {
        x: constrainedX,
        y: constrainedY,
        scale,
      };
    },
    [viewportSize, canvasSize]
  );

  useEffect(() => {
    const handleResize = () => {
      const newViewportSize = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      setViewportSize(newViewportSize);

      setCamera((prev) => constrainCamera(prev.x, prev.y, prev.scale));
    };
    window.addEventListener('resize', handleResize);

    setCamera((prev) => constrainCamera(prev.x, prev.y, prev.scale));

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [constrainCamera]);
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const oldScale = camera.scale;
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x + camera.x) / oldScale,
      y: (pointer.y + camera.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale =
      direction > 0
        ? Math.min(oldScale * scaleBy, MAX_SCALE)
        : Math.max(oldScale / scaleBy, MIN_SCALE);
    const newX = mousePointTo.x * newScale - pointer.x;
    const newY = mousePointTo.y * newScale - pointer.y;

    setCamera(constrainCamera(newX, newY, newScale));
  };
  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const { movementX, movementY } = e.evt;
    setCamera((prev) => {
      const newX = prev.x - movementX;
      const newY = prev.y - movementY;

      return constrainCamera(newX, newY, prev.scale);
    });
    // ドラッグノードの位置をリセットして固定状態を維持
    e.target.position({ x: 0, y: 0 });
  };

  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  // Store original positions of parts for multi-drag
  const originalPositionsRef = useRef<Record<number, { x: number; y: number }>>(
    {}
  );

  const handlePartClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    partId: number
  ) => {
    e.cancelBubble = true;
    // Shift+Click for multi-selection
    const isShift = (e.evt as MouseEvent).shiftKey;
    setSelectedPartIds((prev) => {
      if (isShift) {
        // Toggle selection of partId
        if (prev.includes(partId)) {
          return prev.filter((id) => id !== partId);
        } else {
          return [...prev, partId];
        }
      }
      // Single selection
      return [partId];
    });
  };

  // パーツのドラッグ開始時に選択状態を維持し、元位置を記録
  const handlePartDragStart = (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => {
    e.cancelBubble = true;
    // 保持すべき選択状態
    const newSelected = selectedPartIds.includes(partId)
      ? selectedPartIds
      : [partId];
    setSelectedPartIds(newSelected);
    // 各パーツの元の位置を記録
    originalPositionsRef.current = {};
    newSelected.forEach((id) => {
      const p = parts.find((pt) => pt.id === id);
      if (p) {
        originalPositionsRef.current[id] = {
          x: p.position.x,
          y: p.position.y,
        };
      }
    });
  };

  // パーツのドラッグ移動時に全選択パーツをリアルタイム移動（キャンバス内に収める）
  const handlePartDragMove = (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => {
    const originals = originalPositionsRef.current;
    const orig = originals[partId];
    if (!orig) return;
    const pos = e.target.position();

    const targetPart = parts.find((p) => p.id === partId);
    if (!targetPart) return;

    const offsetX = targetPart.width / 2;
    const dx = pos.x - offsetX - orig.x;
    const dy = pos.y - orig.y;
    const stage = stageRef.current;
    if (!stage) return;

    // キャンバス境界内に収まるように制限
    const constrainWithinCanvas = (
      partObject: PartType,
      baseX: number,
      baseY: number,
      deltaX: number,
      deltaY: number
    ) => {
      // パーツのサイズを考慮した制約 (Konvaでの表示時は中心を基準にしているため、その点を考慮)
      const newX = baseX + deltaX;
      const newY = baseY + deltaY;

      // パーツの両端がキャンバス内に収まるように制約
      // Part2コンポーネントではx座標が part.position.x + offsetX として設定されるため、
      // 実際の表示位置はここで計算した値に offsetX を加えた位置になる
      return {
        x: Math.max(0, Math.min(CANVAS_SIZE - partObject.width, newX)),
        y: Math.max(0, Math.min(CANVAS_SIZE - partObject.height, newY)),
      };
    };

    // 制約を適用した差分計算（メインのドラッグ対象パーツ基準）
    const constrainedPos = constrainWithinCanvas(
      targetPart,
      orig.x,
      orig.y,
      dx,
      dy
    );
    const constrainedDx = constrainedPos.x - orig.x;
    const constrainedDy = constrainedPos.y - orig.y;

    // 全選択パーツを同じ差分で移動（ドラッグ中に視覚的に）
    selectedPartIds.forEach((id) => {
      if (id === partId) return;
      const node = stage.findOne(`.part-${id}`) as Konva.Node;
      const origPos = originals[id];
      if (node && origPos) {
        // 他の選択パーツも元の位置から同じ差分(dx, dy)分だけ移動させる
        const otherPart = parts.find((p) => p.id === id);
        if (otherPart) {
          const otherOffsetX = otherPart.width / 2;

          // 各パーツにも同じ制約を適用
          const otherConstrainedPos = constrainWithinCanvas(
            otherPart,
            origPos.x,
            origPos.y,
            constrainedDx,
            constrainedDy
          );

          // パーツの中心位置を調整して設定（Konvaでの表示基準に合わせる）
          node.position({
            x: otherConstrainedPos.x + otherOffsetX,
            y: otherConstrainedPos.y,
          });
        }
      }
    });

    // メインのドラッグ対象のパーツも境界内に制約（Konvaの位置設定方法に合わせる）
    e.target.position({
      x: constrainedPos.x + offsetX,
      y: constrainedPos.y,
    });

    stage.batchDraw();
  };

  // パーツのドラッグ終了時に全選択パーツを移動（キャンバス内に収める）
  const handlePartDragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => {
    // マスタープレビューの場合は何もしない
    if (isMasterPreview) return;
    const position = e.target.position();
    const originals = originalPositionsRef.current;
    const orig = originals[partId];
    if (!orig) return;

    const targetPart = parts.find((p) => p.id === partId);
    if (!targetPart) return;

    const offsetX = targetPart.width / 2;
    const dx = position.x - offsetX - orig.x;
    const dy = position.y - orig.y;

    // キャンバス境界内に収まるように制限する関数
    const constrainWithinCanvas = (
      partObject: PartType,
      baseX: number,
      baseY: number,
      deltaX: number,
      deltaY: number
    ) => {
      // パーツのサイズを考慮した制約 (Konvaでの表示時は中心を基準にしているため、その点を考慮)
      const newX = baseX + deltaX;
      const newY = baseY + deltaY;

      // パーツの両端がキャンバス内に収まるように制約
      // Part2コンポーネントではx座標が part.position.x + offsetX として設定されるため、
      // 実際の表示位置はここで計算した値に offsetX を加えた位置になる
      return {
        x: Math.max(0, Math.min(CANVAS_SIZE - partObject.width, newX)),
        y: Math.max(0, Math.min(CANVAS_SIZE - partObject.height, newY)),
      };
    };

    // 制約を適用した差分計算（メインのドラッグ対象パーツ基準）
    const constrainedPos = constrainWithinCanvas(
      targetPart,
      orig.x,
      orig.y,
      dx,
      dy
    );
    const constrainedDx = constrainedPos.x - orig.x;
    const constrainedDy = constrainedPos.y - orig.y;

    // 全選択パーツを同じ差分で更新（各パーツは個別に境界制約を適用）
    Object.entries(originals).forEach(([idStr, { x, y }]) => {
      const id = Number(idStr);
      const part = parts.find((p) => p.id === id);
      if (!part) return;

      // パーツごとに制約を適用
      const partConstrainedPos = constrainWithinCanvas(
        part,
        x,
        y,
        constrainedDx,
        constrainedDy
      );

      dispatch({
        type: 'UPDATE_PART',
        payload: {
          partId: id,
          updatePart: {
            position: {
              x: Math.round(partConstrainedPos.x),
              y: Math.round(partConstrainedPos.y),
            },
          },
        },
      });
    });

    // 記録をクリア
    originalPositionsRef.current = {};
  };

  // 背景クリック時に選択解除
  const handleBackgroundClick = () => {
    setSelectedPartIds([]);
  };

  // パーツを追加するハンドラー
  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      // パーツ追加前に既存の選択をクリアする
      setSelectedPartIds([]);

      // カメラの中央座標を計算
      const cameraCenterX = (camera.x + viewportSize.width / 2) / camera.scale;
      const cameraCenterY = (camera.y + viewportSize.height / 2) / camera.scale;

      // キャンバス内に収まるように位置を調整
      // 中心座標から半分ずつ取る形で初期位置を決定
      // Part2コンポーネントでは x={part.position.x + part.width / 2} という形で表示されるため、
      // 実際の表示位置を考慮して位置を決定する
      const constrainedX = Math.max(
        0,
        Math.min(
          CANVAS_SIZE - part.width,
          Math.round(cameraCenterX - part.width / 2)
        )
      );
      const constrainedY = Math.max(
        0,
        Math.min(
          CANVAS_SIZE - part.height,
          Math.round(cameraCenterY - part.height / 2)
        )
      );

      // パーツの位置をカメラの中央に設定（キャンバス内に収める）
      const partWithCenteredPosition = {
        ...part,
        position: {
          x: constrainedX,
          y: constrainedY,
        },
      };

      dispatch({
        type: 'ADD_PART',
        payload: { part: partWithCenteredPosition, properties },
      });
    },
    [dispatch, camera, viewportSize]
  );

  // パーツを削除するハンドラー
  const handleDeletePart = useCallback(() => {
    if (selectedPartIds.length === 0) return;
    // Delete each selected part
    selectedPartIds.forEach((partId) => {
      dispatch({ type: 'DELETE_PART', payload: { partId } });
    });
    // Clear selection after deletion
    setSelectedPartIds([]);
  }, [dispatch, selectedPartIds]);

  // ズームイン・アウト用のハンドラー
  const handleZoomIn = useCallback(() => {
    const scaleBy = 1.1; // ズームの増分
    const oldScale = camera.scale;
    const newScale = Math.min(oldScale * scaleBy, MAX_SCALE);

    // ビューポートの中心を基準にズーム
    const viewportCenterX = viewportSize.width / 2;
    const viewportCenterY = viewportSize.height / 2;

    const mousePointTo = {
      x: (viewportCenterX + camera.x) / oldScale,
      y: (viewportCenterY + camera.y) / oldScale,
    };

    const newX = mousePointTo.x * newScale - viewportCenterX;
    const newY = mousePointTo.y * newScale - viewportCenterY;

    setCamera(constrainCamera(newX, newY, newScale));
  }, [camera, viewportSize, constrainCamera]);

  const handleZoomOut = useCallback(() => {
    const scaleBy = 1.1; // ズームの増分
    const oldScale = camera.scale;
    const newScale = Math.max(oldScale / scaleBy, MIN_SCALE);

    // ビューポートの中心を基準にズーム
    const viewportCenterX = viewportSize.width / 2;
    const viewportCenterY = viewportSize.height / 2;

    const mousePointTo = {
      x: (viewportCenterX + camera.x) / oldScale,
      y: (viewportCenterY + camera.y) / oldScale,
    };

    const newX = mousePointTo.x * newScale - viewportCenterX;
    const newY = mousePointTo.y * newScale - viewportCenterY;

    setCamera(constrainCamera(newX, newY, newScale));
  }, [camera, viewportSize, constrainCamera]);

  // ショートカットキー Delete / Backspace でパーツ削除
  useEffect(() => {
    if (prototypeType !== 'EDIT') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // フォーカスのある入力要素を除外
        const active = document.activeElement;
        const tag = active && (active.tagName || '').toUpperCase();
        if (
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          active?.hasAttribute('contenteditable')
        )
          return;
        e.preventDefault();
        handleDeletePart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleDeletePart, prototypeType]);

  // 画像をIndexedDBから取得する処理
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

  return (
    <DebugModeProvider>
      <Stage
        width={viewportSize.width}
        height={viewportSize.height}
        ref={stageRef}
        onWheel={handleWheel}
      >
        <Layer>
          {/* カメラグループ: パン/ズームを有効化 */}
          <Group
            id="camera"
            x={-camera.x}
            y={-camera.y}
            scaleX={camera.scale}
            scaleY={camera.scale}
          >
            {/* 背景パンエリア */}
            <Rect
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
              fill="#f5f5f5"
              draggable
              onDragMove={handleDragMove}
              onClick={handleBackgroundClick}
            />
            {/* 背景グリッド */}
            <GridLines
              camera={camera}
              viewportSize={viewportSize}
              gridSize={GRID_SIZE}
            />

            {/* パーツの表示（orderが大きいほど後で描画=前面に表示） */}
            {[...parts]
              .sort((a, b) => {
                // 数値型のorderを持つ場合はその値でソート
                // 持たない場合は0としてソート
                const orderA = typeof a.order === 'number' ? a.order : 0;
                const orderB = typeof b.order === 'number' ? b.order : 0;

                // orderが同じ場合は、updatedAtで比較（新しいものが前面に来るように降順）
                if (orderA === orderB) {
                  // 新しい日付の方が大きな値になるため、降順にするにはb - a
                  return (
                    new Date(b.updatedAt).getTime() -
                    new Date(a.updatedAt).getTime()
                  );
                }
                return orderA - orderB; // 昇順でソート（小さい値から大きい値へ）
              })
              .map((part) => {
                const partProperties = properties.filter(
                  (p) => p.partId === part.id
                );
                const filteredImages = getFilteredImages(
                  partProperties,
                  images
                );
                return (
                  <Part2
                    key={part.id}
                    part={part}
                    properties={partProperties}
                    players={players}
                    images={filteredImages}
                    prototypeType={prototypeType}
                    isActive={selectedPartIds.includes(part.id)}
                    onClick={(e) => handlePartClick(e, part.id)}
                    onDragStart={(e) =>
                      isMasterPreview ? null : handlePartDragStart(e, part.id)
                    }
                    onDragMove={(e) => handlePartDragMove(e, part.id)}
                    onDragEnd={(e, partId) => handlePartDragEnd(e, partId)}
                  />
                );
              })}
          </Group>
        </Layer>
      </Stage>

      {/* サイドバー */}
      {prototypeType === 'EDIT' && (
        <EditSidebars
          prototypeName={prototypeName}
          groupId={groupId}
          players={players}
          selectedPartIds={selectedPartIds}
          parts={parts}
          properties={properties}
          onAddPart={handleAddPart}
          onDeletePart={handleDeletePart}
        />
      )}

      {/* ツールバー */}
      <ToolsBar
        zoomIn={handleZoomIn}
        zoomOut={handleZoomOut}
        canZoomIn={camera.scale < MAX_SCALE}
        canZoomOut={camera.scale > MIN_SCALE}
        zoomLevel={camera.scale}
      />

      <DebugInfo
        camera={camera}
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        groupId={groupId}
        prototypeType={prototypeType}
        parts={parts}
        properties={properties}
        players={players}
        cursors={cursors}
        selectedPartIds={selectedPartIds}
      />
    </DebugModeProvider>
  );
}
