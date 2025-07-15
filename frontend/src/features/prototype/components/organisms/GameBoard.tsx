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
import { Part as PartType, PartProperty as PropertyType } from '@/api/types';
import DebugInfo from '@/features/prototype/components/atoms/DebugInfo';
import GridLines from '@/features/prototype/components/atoms/GridLines';
import ModeToggleButton from '@/features/prototype/components/atoms/ModeToggleButton';
import Part from '@/features/prototype/components/atoms/Part';
import { ProjectContextMenu } from '@/features/prototype/components/atoms/ProjectContextMenu';
import SelectionRect from '@/features/prototype/components/atoms/SelectionRect';
import LeftSidebar from '@/features/prototype/components/molecules/LeftSidebar';
import PartCreateMenu from '@/features/prototype/components/molecules/PartCreateMenu';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import RoleMenu from '@/features/prototype/components/molecules/RoleMenu';
import ZoomToolbar from '@/features/prototype/components/molecules/ZoomToolbar';
import {
  GRID_SIZE,
  CANVAS_SIZE,
  MIN_SCALE,
  MAX_SCALE,
  DEFAULT_INITIAL_SCALE,
} from '@/features/prototype/constants/gameBoard';
import { DebugModeProvider } from '@/features/prototype/contexts/DebugModeContext';
import { useGrabbingCursor } from '@/features/prototype/hooks/useGrabbingCursor';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { useSelection } from '@/features/prototype/hooks/useSelection';
import { useSocket } from '@/features/prototype/hooks/useSocket';
import { AddPartProps, DeleteImageProps } from '@/features/prototype/type';
import { CursorInfo } from '@/features/prototype/types/cursor';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';
import {
  getImageFromIndexedDb,
  resetImageParamsInIndexedDb,
  saveImageToIndexedDb,
  updateImageParamsInIndexedDb,
} from '@/utils/db';

interface GameBoardProps {
  prototypeName: string;
  prototypeVersionNumber?: number;
  projectId: string;
  parts: PartType[];
  properties: PropertyType[];
  cursors: Record<string, CursorInfo>;
  gameBoardMode: GameBoardMode;
}

export default function GameBoard({
  prototypeName,
  prototypeVersionNumber,
  projectId,
  parts,
  properties,
  cursors,
  gameBoardMode,
}: GameBoardProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const [viewportSize, setViewportSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const { fetchImage, deleteImage } = useImages();
  const { dispatch } = usePartReducer();
  const { measureOperation } = usePerformanceTracker();
  const [images, setImages] = useState<Record<string, string>>({});

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuPartId, setContextMenuPartId] = useState<number | null>(
    null
  );

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

  const CAMERA_MARGIN = 300;
  const constrainCamera = useCallback(
    (x: number, y: number, scale: number) => {
      let constrainedX = x;
      let constrainedY = y;

      // -500~+500の範囲でカメラを動かせるように制約を調整
      const minX = -CAMERA_MARGIN;
      const maxX =
        canvasSize.width * scale - viewportSize.width + CAMERA_MARGIN;
      const minY = -CAMERA_MARGIN;
      const maxY =
        canvasSize.height * scale - viewportSize.height + CAMERA_MARGIN;

      if (canvasSize.width * scale > viewportSize.width) {
        constrainedX = Math.max(minX, constrainedX);
        constrainedX = Math.min(maxX, constrainedX);
      } else {
        constrainedX = (canvasSize.width * scale - viewportSize.width) / 2;
      }

      if (canvasSize.height * scale > viewportSize.height) {
        constrainedY = Math.max(minY, constrainedY);
        constrainedY = Math.min(maxY, constrainedY);
      } else {
        constrainedY = (canvasSize.height * scale - viewportSize.height) / 2;
      }

      return {
        x: constrainedX,
        y: constrainedY,
        scale,
      };
    },
    [viewportSize, canvasSize]
  );

  // 全パーツの平均センター位置を計算する関数
  const calculateAveragePartsCenter = useCallback((parts: PartType[]) => {
    if (parts.length === 0) return null;

    const totalCenterX = parts.reduce((sum, part) => {
      return sum + (part.position.x + part.width / 2);
    }, 0);

    const totalCenterY = parts.reduce((sum, part) => {
      return sum + (part.position.y + part.height / 2);
    }, 0);

    return {
      x: totalCenterX / parts.length,
      y: totalCenterY / parts.length,
    };
  }, []);

  // 初期カメラ位置を計算する関数
  const calculateInitialCameraPosition = useCallback(
    (averageCenter: { x: number; y: number }) => {
      // カメラの中央が全パーツの平均センターになるようにカメラの左上位置を計算
      const targetX =
        averageCenter.x * DEFAULT_INITIAL_SCALE - viewportSize.width / 2;
      const targetY =
        averageCenter.y * DEFAULT_INITIAL_SCALE - viewportSize.height / 2;

      return constrainCamera(targetX, targetY, DEFAULT_INITIAL_SCALE);
    },
    [viewportSize, constrainCamera]
  );

  // 全パーツの平均センター位置を計算（useMemo で最初の一回だけ計算）
  const averagePartsCenter = useMemo(() => {
    return calculateAveragePartsCenter(parts);
  }, [parts, calculateAveragePartsCenter]);

  const initialCamera = useMemo(() => {
    if (!averagePartsCenter) {
      // パーツがない場合はキャンバス中央を表示
      return {
        x: centerCoords.x * DEFAULT_INITIAL_SCALE - viewportSize.width / 2,
        y: centerCoords.y * DEFAULT_INITIAL_SCALE - viewportSize.height / 2,
        scale: DEFAULT_INITIAL_SCALE,
      };
    }

    return calculateInitialCameraPosition(averagePartsCenter);
  }, [
    averagePartsCenter,
    centerCoords,
    viewportSize,
    calculateInitialCameraPosition,
  ]);

  // 初期カメラ位置が変更された場合（partsが読み込まれた場合など）にカメラを更新
  // ただし、一度初期化されたら以降は自動更新しない
  const [camera, setCamera] = useState(() => initialCamera);
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (!hasInitialized || parts.length === 0) {
      setCamera(initialCamera);
      if (parts.length > 0) {
        setHasInitialized(true);
      }
    }
  }, [initialCamera, hasInitialized, parts.length]);

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
    // macOSトラックパッドの二本指移動でパン、Ctrlキー押下時はズーム
    if (!e.evt.ctrlKey && !e.evt.metaKey) {
      // パン（カメラ移動）
      const { deltaX, deltaY } = e.evt;
      setCamera((prev) => {
        const newX = prev.x + deltaX;
        const newY = prev.y + deltaY;
        return constrainCamera(newX, newY, prev.scale);
      });
      return;
    }
    // ズーム（従来通り）
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
        // HTML/CSSベースのメニューなので画面座標を使用
        setMenuPosition({
          x: pointerPosition.x + 5,
          y: pointerPosition.y + 5,
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

  /**
   * コンテキストメニューのアイテム定義
   */
  const getContextMenuItems = useCallback(() => [
    {
      id: 'frontmost',
      text: '最前面に移動',
      action: () => handleChangePartOrder('frontmost'),
    },
    {
      id: 'front',
      text: '前面に移動',
      action: () => handleChangePartOrder('front'),
    },
    {
      id: 'back',
      text: '背面に移動',
      action: () => handleChangePartOrder('back'),
    },
    {
      id: 'backmost',
      text: '最背面に移動',
      action: () => handleChangePartOrder('backmost'),
    },
  ], [handleChangePartOrder]);

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setContextMenuPartId(null);
  }, []);

  const handlePartDragStart = (
    e: Konva.KonvaEventObject<DragEvent>,
    partId: number
  ) => {
    if (gameBoardMode === GameBoardMode.PREVIEW) return;
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
    if (gameBoardMode === GameBoardMode.PREVIEW) return;

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
    // 矩形選択中の場合は背景クリックを無効化
    if (isSelectionInProgress()) {
      return;
    }
    // 矩形選択完了直後の場合は背景クリックを無効化
    if (isJustFinishedSelection()) {
      return;
    }
    // パーツの選択を解除
    setSelectedPartIds([]);
  };

  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      measureOperation('Part Addition', () => {
        setSelectedPartIds([]);

        dispatch({
          type: 'ADD_PART',
          payload: { part, properties },
        });
      });
    },
    [dispatch, measureOperation]
  );

  const handleDeleteImage = useCallback(
    async ({
      imageId,
      prototypeId,
      partId,
      side,
      emitUpdate,
    }: DeleteImageProps) => {
      updateImageParamsInIndexedDb(imageId, true, new Date());
      await deleteImage(imageId, { prototypeId, partId, side, emitUpdate });
    },
    [deleteImage]
  );

  const handleDeletePart = useCallback(async () => {
    if (selectedPartIds.length === 0) return;

    const deleteImagePromises = selectedPartIds
      .map((partId) => {
        const selectedPart = parts.find((p) => p.id === partId);
        const partProperties = properties.filter((p) => p.partId === partId);
        if (!selectedPart?.prototypeId) return [];
        return partProperties
          .filter((property) => property.imageId)
          .map((property) =>
            handleDeleteImage({
              imageId: property.imageId!,
              prototypeId: selectedPart.prototypeId,
              partId,
              side: property.side,
              emitUpdate: 'false',
            })
          );
      })
      .flat();

    await Promise.all(deleteImagePromises);

    selectedPartIds.forEach((partId) => {
      dispatch({ type: 'DELETE_PART', payload: { partId } });
    });
    setSelectedPartIds([]);
  }, [handleDeleteImage, parts, properties, dispatch, selectedPartIds]);

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
    if (gameBoardMode !== GameBoardMode.CREATE) return;
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
  }, [handleDeletePart, gameBoardMode]);

  useEffect(() => {
    let urlsToRevoke: string[] = [];

    const loadImages = async () => {
      const uniqueImageIds = Array.from(
        new Set(properties.map((property) => property.imageId).filter(Boolean))
      ) as string[];

      const imageResults = await Promise.all(
        uniqueImageIds.map(async (imageId) => {
          await resetImageParamsInIndexedDb(imageId);
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

  const { socket } = useSocket();

  // 選択機能
  const {
    isSelectionMode,
    selectionRect,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    toggleMode,
    isSelectionInProgress,
    isJustFinishedSelection,
  } = useSelection();

  // Stage全体のクリックイベントハンドラー
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // 矩形選択中の場合はStageクリックを無効化
      if (isSelectionInProgress()) {
        return;
      }
      if (showContextMenu) {
        if (!e.target.hasName('context-menu-component')) {
          handleCloseContextMenu();
        }
      }
    },
    [showContextMenu, handleCloseContextMenu, isSelectionInProgress]
  );

  const { isGrabbing, eventHandlers: grabbingHandlers } = useGrabbingCursor();

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

  useEffect(() => {
    // パーツ追加時に自分の追加したパーツを選択状態にする
    const handleAddPartResponse = (data: { partId: number }) => {
      setSelectedPartIds([data.partId]);
    };
    if (!socket) return;
    socket.on('ADD_PART_RESPONSE', handleAddPartResponse);
    return () => {
      socket.off('ADD_PART_RESPONSE', handleAddPartResponse);
    };
  }, [socket]);

  return (
    <DebugModeProvider>
      <ModeToggleButton
        isSelectionMode={isSelectionMode}
        onToggle={toggleMode}
      />
      <Stage
        width={viewportSize.width}
        height={viewportSize.height}
        ref={stageRef}
        onWheel={handleWheel}
        onClick={handleStageClick}
        {...grabbingHandlers}
        style={{
          cursor: isSelectionMode
            ? 'default'
            : isGrabbing
              ? 'grabbing'
              : 'grab',
        }}
      >
        <Layer>
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
              fill={gameBoardMode === GameBoardMode.PLAY ? '#fff' : '#f5f5f5'}
              draggable={!isSelectionMode}
              onDragMove={handleDragMove}
              onClick={handleBackgroundClick}
              // 矩形選択用イベントを背景Rectに直接バインド
              {...(isSelectionMode
                ? {
                    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) =>
                      handleSelectionStart(e, camera),
                    onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) =>
                      handleSelectionMove(e, camera),
                    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) =>
                      handleSelectionEnd(e, parts, setSelectedPartIds),
                  }
                : {})}
            />
            {/* 背景グリッド */}
            {gameBoardMode === GameBoardMode.CREATE && (
              <GridLines
                camera={camera}
                viewportSize={viewportSize}
                gridSize={GRID_SIZE}
              />
            )}

            {/* パーツの表示 */}
            {[...parts]
              .sort((a, b) => a.order - b.order)
              .map((part) => {
                const partProperties = properties.filter(
                  (p) => p.partId === part.id
                );
                const filteredImages = filteredImagesMap[part.id] || [];
                const isActive = selectedPartIds.includes(part.id);
                return (
                  <Part
                    key={part.id}
                    part={part}
                    properties={partProperties}
                    images={filteredImages}
                    gameBoardMode={gameBoardMode}
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

            {/* 選択モード時の矩形選択表示 */}
            <SelectionRect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              visible={isSelectionMode && selectionRect.visible}
            />
          </Group>
        </Layer>
      </Stage>

      <LeftSidebar
        prototypeName={prototypeName}
        gameBoardMode={gameBoardMode}
        projectId={projectId}
      />

      {gameBoardMode === GameBoardMode.CREATE && (
        <>
          {/* ロールメニュー */}
          <RoleMenu projectId={projectId} />
          {/* フローティングパーツ作成メニュー */}
          <PartCreateMenu
            onAddPart={handleAddPart}
            camera={camera}
            viewportSize={viewportSize}
            parts={parts} // 追加
          />

          {/* プロパティサイドバー */}
          {selectedPartIds.length === 1 && (
            <PartPropertySidebar
              selectedPartId={selectedPartIds[0]}
              parts={parts}
              properties={properties}
              onAddPart={handleAddPart}
              onDeletePart={handleDeletePart}
              onDeleteImage={handleDeleteImage}
            />
          )}
        </>
      )}
      <ZoomToolbar
        zoomIn={handleZoomIn}
        zoomOut={handleZoomOut}
        canZoomIn={camera.scale < MAX_SCALE}
        canZoomOut={camera.scale > MIN_SCALE}
        zoomLevel={camera.scale}
      />

      <DebugInfo
        camera={camera}
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber ?? 0}
        projectId={projectId}
        mode={gameBoardMode}
        parts={parts}
        properties={properties}
        cursors={cursors}
        selectedPartIds={selectedPartIds}
      />

      {/* コンテキストメニュー */}
      <ProjectContextMenu
        visible={showContextMenu && contextMenuPartId !== null}
        position={menuPosition}
        onClose={handleCloseContextMenu}
        items={getContextMenuItems()}
      />
    </DebugModeProvider>
  );
}
