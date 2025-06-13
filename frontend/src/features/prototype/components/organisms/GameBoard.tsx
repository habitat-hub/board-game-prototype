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
import { KonvaPartContextMenu } from '@/features/prototype/components/atoms/KonvaPartContextMenu';
import Part2 from '@/features/prototype/components/atoms/Part2';
import LeftSidebar from '@/features/prototype/components/molecules/LeftSidebar';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import ShortcutHelpPanel from '@/features/prototype/components/molecules/ShortcutHelpPanel';
import ToolsBar from '@/features/prototype/components/molecules/ToolBar';
import { VERSION_NUMBER } from '@/features/prototype/const';
import { DebugModeProvider } from '@/features/prototype/contexts/DebugModeContext';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
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
  const { measureOperation } = usePerformanceTracker();
  const [images, setImages] = useState<Record<string, string>>({});

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuPartId, setContextMenuPartId] = useState<number | null>(
    null
  );

  const isMasterPreview =
    prototypeType === 'PREVIEW' &&
    prototypeVersionNumber === VERSION_NUMBER.MASTER;

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

  // 初期カメラ位置を計算する関数（初期描画時のpartsを使用）
  const calculateInitialCameraPosition = useCallback(
    (initialParts: PartType[]) => {
      const latestPart = initialParts.reduce(
        (latest, current) => {
          if (!latest) return current;
          return new Date(current.updatedAt) > new Date(latest.updatedAt)
            ? current
            : latest;
        },
        null as PartType | null
      );

      if (latestPart) {
        const partCenterX = latestPart.position.x + latestPart.width / 2;
        const partCenterY = latestPart.position.y + latestPart.height / 2;

        const scale = 0.5;

        // カメラの中央がパーツの中心になるようにカメラの左上位置を計算
        const targetX = partCenterX * scale - viewportSize.width / 2;
        const targetY = partCenterY * scale - viewportSize.height / 2;

        return constrainCamera(targetX, targetY, scale);
      }

      return {
        x: centerCoords.x * 0.5 - viewportSize.width / 2,
        y: centerCoords.y * 0.5 - viewportSize.height / 2,
        scale: 0.5,
      };
    },
    [centerCoords, viewportSize, constrainCamera]
  );

  // 初期カメラ位置を一度だけ計算
  const [camera, setCamera] = useState(() =>
    calculateInitialCameraPosition(parts)
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
    e.target.position({ x: 0, y: 0 });
  };

  const [selectedPartIds, setSelectedPartIds] = useState<number[]>([]);
  const originalPositionsRef = useRef<Record<number, { x: number; y: number }>>(
    {}
  );

  const toggleIdInArray = (arr: number[], id: number) =>
    arr.includes(id) ? arr.filter((v) => v !== id) : [...arr, id];

  const handlePartClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    partId: number
  ) => {
    e.cancelBubble = true;
    // 左クリックのみContextMenuを閉じる
    if ((e.evt as MouseEvent).button === 0) {
      handleCloseContextMenu();
    }
    const isShift = (e.evt as MouseEvent).shiftKey;
    setSelectedPartIds((prev) =>
      isShift ? toggleIdInArray(prev, partId) : [partId]
    );
  };

  const handlePartContextMenu = (
    e: Konva.KonvaEventObject<PointerEvent>,
    partId: number
  ) => {
    e.cancelBubble = true;
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (stage) {
      const pointerPosition = stage.getPointerPosition();
      if (pointerPosition) {
        // ポインター位置をカメラスケールで調整（カメラグループ内の実際の位置に変換）
        // +5 はメニューがポインターから少し右下にオフセットされるようにするための調整値
        const adjustedX = (pointerPosition.x + camera.x + 5) / camera.scale;
        const adjustedY = (pointerPosition.y + camera.y + 5) / camera.scale;

        setMenuPosition({
          x: adjustedX,
          y: adjustedY,
        });
      }
    }

    setContextMenuPartId(partId);
    setShowContextMenu(true);
  };

  const handleChangePartOrder = useCallback(
    (type: 'front' | 'back' | 'frontmost' | 'backmost') => {
      if (contextMenuPartId === null) return;
      dispatch({
        type: 'CHANGE_ORDER',
        payload: { partId: contextMenuPartId, type },
      });

      setShowContextMenu(false);
    },
    [contextMenuPartId, dispatch]
  );

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setContextMenuPartId(null);
  }, []);

  const handlePartDragStart = (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => {
    if (isMasterPreview) return;
    e.cancelBubble = true;
    const newSelected = selectedPartIds.includes(partId)
      ? selectedPartIds
      : [partId];
    setSelectedPartIds(newSelected);
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

    const constrainedPos = constrainWithinCanvas(
      targetPart,
      orig.x,
      orig.y,
      dx,
      dy
    );
    const constrainedDx = constrainedPos.x - orig.x;
    const constrainedDy = constrainedPos.y - orig.y;

    selectedPartIds.forEach((id) => {
      if (id === partId) return;
      const node = stage.findOne(`.part-${id}`) as Konva.Node;
      const origPos = originals[id];
      if (node && origPos) {
        const otherPart = parts.find((p) => p.id === id);
        if (otherPart) {
          const otherOffsetX = otherPart.width / 2;

          const otherConstrainedPos = constrainWithinCanvas(
            otherPart,
            origPos.x,
            origPos.y,
            constrainedDx,
            constrainedDy
          );

          node.position({
            x: otherConstrainedPos.x + otherOffsetX,
            y: otherConstrainedPos.y,
          });
        }
      }
    });

    e.target.position({
      x: constrainedPos.x + offsetX,
      y: constrainedPos.y,
    });

    stage.batchDraw();
  };

  const handlePartDragEnd = (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => {
    if (isMasterPreview) return;

    measureOperation('Part Drag Update', () => {
      const position = e.target.position();
      const originals = originalPositionsRef.current;
      const orig = originals[partId];
      if (!orig) return;

      const targetPart = parts.find((p) => p.id === partId);
      if (!targetPart) return;

      const offsetX = targetPart.width / 2;
      const dx = position.x - offsetX - orig.x;
      const dy = position.y - orig.y;

      const constrainedPos = constrainWithinCanvas(
        targetPart,
        orig.x,
        orig.y,
        dx,
        dy
      );
      const constrainedDx = constrainedPos.x - orig.x;
      const constrainedDy = constrainedPos.y - orig.y;

      Object.entries(originals).forEach(([idStr, { x, y }]) => {
        const id = Number(idStr);
        const part = parts.find((p) => p.id === id);
        if (!part) return;

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

      originalPositionsRef.current = {};
    });
  };

  const handleBackgroundClick = () => {
    setSelectedPartIds([]);
  };

  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      measureOperation('Part Addition', () => {
        setSelectedPartIds([]);

        const cameraCenterX =
          (camera.x + viewportSize.width / 2) / camera.scale;
        const cameraCenterY =
          (camera.y + viewportSize.height / 2) / camera.scale;

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
      });
    },
    [dispatch, camera, viewportSize, measureOperation]
  );

  const handleDeletePart = useCallback(() => {
    if (selectedPartIds.length === 0) return;
    selectedPartIds.forEach((partId) => {
      dispatch({ type: 'DELETE_PART', payload: { partId } });
    });
    setSelectedPartIds([]);
  }, [dispatch, selectedPartIds]);

  const handleZoomIn = useCallback(() => {
    const scaleBy = 1.1;
    const oldScale = camera.scale;
    const newScale = Math.min(oldScale * scaleBy, MAX_SCALE);

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
    const scaleBy = 1.1;
    const oldScale = camera.scale;
    const newScale = Math.max(oldScale / scaleBy, MIN_SCALE);

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

  useEffect(() => {
    if (prototypeType !== 'EDIT') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
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

  useEffect(() => {
    let urlsToRevoke: string[] = [];

    const loadImages = async () => {
      const uniqueImageIds = Array.from(
        new Set(properties.map((property) => property.imageId).filter(Boolean))
      ) as string[];

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

      const newImages: Record<string, string> = {};
      imageResults.forEach(({ imageId, url }) => {
        newImages[imageId] = url;
      });
      setImages(newImages);

      urlsToRevoke = imageResults.map(({ url }) => url);
    };

    loadImages();

    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fetchImage, properties]);

  // Stage全体のクリックイベントハンドラー
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (showContextMenu) {
        if (!e.target.hasName('context-menu-component')) {
          handleCloseContextMenu();
        }
      }
    },
    [showContextMenu, handleCloseContextMenu]
  );

  // パーツの位置をキャンバス内に制限する関数
  const constrainWithinCanvas = useCallback(
    (
      partObject: PartType,
      baseX: number,
      baseY: number,
      deltaX: number,
      deltaY: number
    ) => {
      const newX = baseX + deltaX;
      const newY = baseY + deltaY;

      return {
        x: Math.max(0, Math.min(CANVAS_SIZE - partObject.width, newX)),
        y: Math.max(0, Math.min(CANVAS_SIZE - partObject.height, newY)),
      };
    },
    []
  );

  // 画像IDからURLを取得して配列で返す関数をuseMemoで事前計算
  const filteredImagesMap = useMemo(() => {
    const map: Record<number, Record<string, string>[]> = {};
    parts.forEach((part) => {
      const partProperties = properties.filter((p) => p.partId === part.id);
      map[part.id] = partProperties.reduce<Record<string, string>[]>(
        (acc, filteredProperty) => {
          const imageId = filteredProperty.imageId;
          if (!imageId) return acc;
          const url = images[imageId];
          if (url) {
            acc.push({ [imageId]: url });
          }
          return acc;
        },
        []
      );
    });
    return map;
  }, [parts, properties, images]);

  return (
    <DebugModeProvider>
      <Stage
        width={viewportSize.width}
        height={viewportSize.height}
        ref={stageRef}
        onWheel={handleWheel}
        onClick={handleStageClick}
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
              .sort((a, b) => a.order - b.order)
              .map((part) => {
                const partProperties = properties.filter(
                  (p) => p.partId === part.id
                );
                const filteredImages = filteredImagesMap[part.id] || [];
                const isActive = selectedPartIds.includes(part.id);
                return (
                  <Part2
                    key={part.id}
                    part={part}
                    properties={partProperties}
                    players={players}
                    images={filteredImages}
                    prototypeType={prototypeType}
                    isActive={isActive}
                    isOtherPlayerCard={false}
                    onClick={(e) => handlePartClick(e, part.id)}
                    onDragStart={(e) => handlePartDragStart(e, part.id)}
                    onDragMove={(e) => handlePartDragMove(e, part.id)}
                    onDragEnd={(e, partId) => handlePartDragEnd(e, partId)}
                    onContextMenu={(e) => handlePartContextMenu(e, part.id)}
                  />
                );
              })}

            {/* コンテキストメニュー - カメラのスケールと位置を考慮してメニュー位置を設定 */}
            {showContextMenu && contextMenuPartId !== null && (
              <KonvaPartContextMenu
                visible={true}
                position={menuPosition}
                onClose={handleCloseContextMenu}
                onChangeOrder={handleChangePartOrder}
              />
            )}
          </Group>
        </Layer>
      </Stage>

      <LeftSidebar
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        prototypeType={prototypeType}
        isMasterPreview={isMasterPreview}
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

      {prototypeType === 'EDIT' && (
        <>
          {/* プロパティサイドバー */}
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
        prototypeVersionNumber={prototypeVersionNumber ?? ''}
        isMasterPreview={isMasterPreview}
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
