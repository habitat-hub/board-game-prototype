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
import { Part, PartProperty } from '@/api/types';
import DebugInfo from '@/features/prototype/components/atoms/DebugInfo';
import GridLines from '@/features/prototype/components/atoms/GridLines';
import ModeToggleButton from '@/features/prototype/components/atoms/ModeToggleButton';
import { ProjectContextMenu } from '@/features/prototype/components/atoms/ProjectContextMenu';
import SelectionRect from '@/features/prototype/components/atoms/SelectionRect';
import LeftSidebar from '@/features/prototype/components/molecules/LeftSidebar';
import PartCreateMenu from '@/features/prototype/components/molecules/PartCreateMenu';
import PartOnGameBoard from '@/features/prototype/components/molecules/PartOnGameBoard';
import PartPropertySidebar from '@/features/prototype/components/molecules/PartPropertySidebar';
import PlaySidebar from '@/features/prototype/components/molecules/PlaySidebar';
import RoleMenu from '@/features/prototype/components/molecules/RoleMenu';
import ZoomToolbar from '@/features/prototype/components/molecules/ZoomToolbar';
import { GRID_SIZE } from '@/features/prototype/constants';
import { DebugModeProvider } from '@/features/prototype/contexts/DebugModeContext';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { useGameCamera } from '@/features/prototype/hooks/useGameCamera';
import { useGrabbingCursor } from '@/features/prototype/hooks/useGrabbingCursor';
import { useHandVisibility } from '@/features/prototype/hooks/useHandVisibility';
import { usePartDragSystem } from '@/features/prototype/hooks/usePartDragSystem';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { useSelection } from '@/features/prototype/hooks/useSelection';
import {
  AddPartProps,
  DeleteImageProps,
  CursorInfo,
  GameBoardMode,
} from '@/features/prototype/types';
import { useRoleManagement } from '@/features/role/hooks/useRoleManagement';
import {
  getImageFromIndexedDb,
  resetImageParamsInIndexedDb,
  revokeMultipleObjectURLsAndCleanCache,
  saveImageToIndexedDb,
  updateImageParamsInIndexedDb,
} from '@/utils/db';
import { isInputFieldFocused } from '@/utils/inputFocus';

interface GameBoardProps {
  prototypeName: string;
  projectId: string;
  partsMap: Map<number, Part>;
  propertiesMap: Map<number, PartProperty[]>;
  cursors: Record<string, CursorInfo>;
  gameBoardMode: GameBoardMode;
}

export default function GameBoard({
  prototypeName,
  projectId,
  partsMap,
  propertiesMap,
  cursors,
  gameBoardMode,
}: GameBoardProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  // 前回のレンダリング時の画像IDを保持するref
  const prevImageRef = useRef<string[]>([]);
  const { fetchImage, deleteImage } = useImages();
  const { dispatch } = usePartReducer();
  const { measureOperation } = usePerformanceTracker();
  const { isGrabbing, eventHandlers: grabbingHandlers } = useGrabbingCursor();

  const parts = useMemo(() => Array.from(partsMap.values()), [partsMap]);
  const properties = useMemo(
    () => Array.from(propertiesMap.values()).flat(),
    [propertiesMap]
  );
  // 手札の上のカードの表示制御
  const { cardVisibilityMap } = useHandVisibility(parts, gameBoardMode);
  // ロール管理情報を取得
  const { userRoles } = useRoleManagement(projectId);

  // 選択中のパーツ、および選択処理
  const {
    selectedPartIds,
    selectPart,
    selectMultipleParts,
    clearSelection,
    togglePartSelection,
  } = useSelectedParts();

  // カメラ機能
  const {
    canvasSize,
    viewportSize,
    camera,
    handleWheel,
    handleDragMove,
    handleZoomIn,
    handleZoomOut,
    canZoomIn,
    canZoomOut,
  } = useGameCamera({
    parts,
    stageRef,
  });
  // 複数パーツ選択機能
  const {
    isSelectionMode,
    rectForSelection,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    toggleMode,
    isSelectionInProgress,
    isJustFinishedSelection,
  } = useSelection();
  // ドラッグ機能
  const { handlePartDragStart, handlePartDragMove, handlePartDragEnd } =
    usePartDragSystem({
      parts,
      canvasSize,
      gameBoardMode,
      stageRef: stageRef as React.RefObject<Konva.Stage>,
    });

  const [images, setImages] = useState<Record<string, string>>({});
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuPartId, setContextMenuPartId] = useState<number | null>(
    null
  );
  // スペースキー押下しているか
  const [spacePressing, setSpacePressing] = useState(false);
  // 選択モードへの復帰が必要か
  const [needToReturnToSelectionMode, setNeedToReturnToSelectionMode] =
    useState(false);

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
    if (isShift) {
      togglePartSelection(partId);
    } else {
      selectMultipleParts([partId]);
    }
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
    (type: 'front' | 'back' | 'frontmost' | 'backmost', partId: number) => {
      dispatch({
        type: 'CHANGE_ORDER',
        payload: { partId, type },
      });

      setShowContextMenu(false);
    },
    [dispatch]
  );

  /**
   * コンテキストメニューのアイテム定義
   */
  const getContextMenuItems = useCallback(
    (partId: number) => [
      {
        id: 'frontmost',
        text: '最前面に移動',
        action: () => handleChangePartOrder('frontmost', partId),
      },
      {
        id: 'front',
        text: '前面に移動',
        action: () => handleChangePartOrder('front', partId),
      },
      {
        id: 'back',
        text: '背面に移動',
        action: () => handleChangePartOrder('back', partId),
      },
      {
        id: 'backmost',
        text: '最背面に移動',
        action: () => handleChangePartOrder('backmost', partId),
      },
    ],
    [handleChangePartOrder]
  );

  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
    setContextMenuPartId(null);
  }, []);

  const handleBackgroundClick = () => {
    // 矩形選択中の場合は背景クリックを無効化
    if (isSelectionInProgress) {
      return;
    }
    // 矩形選択完了直後の場合は背景クリックを無効化
    if (isJustFinishedSelection) {
      return;
    }
    // パーツの選択を解除
    clearSelection();
  };

  const handleAddPart = useCallback(
    ({ part, properties }: AddPartProps) => {
      measureOperation('Part Addition', () => {
        clearSelection();

        dispatch({
          type: 'ADD_PART',
          payload: { part, properties },
        });
      });
    },
    [clearSelection, dispatch, measureOperation]
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
    clearSelection();
  }, [
    selectedPartIds,
    clearSelection,
    parts,
    properties,
    handleDeleteImage,
    dispatch,
  ]);

  useEffect(() => {
    if (gameBoardMode !== GameBoardMode.CREATE) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isInputFieldFocused()) return;
        e.preventDefault();
        handleDeletePart();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [handleDeletePart, gameBoardMode]);

  // スペースキー検出とモード切り替え
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // スペースキー以外のイベント、またはスペースキー押下中の場合は無視
      if (e.code !== 'Space' || spacePressing) return;

      // 入力フィールドにフォーカスがある場合は無視
      if (isInputFieldFocused()) {
        return;
      }

      e.preventDefault();
      setSpacePressing(true);

      // 選択モードの場合のみ、一時的にパンモードに切り替え
      if (isSelectionMode) {
        setNeedToReturnToSelectionMode(true);
        toggleMode();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // スペースキー以外のイベント、またはスペースキー押下中でない場合は無視
      if (e.code !== 'Space' || !spacePressing) return;

      // 入力フィールドにフォーカスがある場合は無視
      if (isInputFieldFocused()) {
        return;
      }

      e.preventDefault();
      setSpacePressing(false);

      // 元々選択モードだった場合、選択モードに復帰
      if (needToReturnToSelectionMode && !isSelectionMode) {
        setNeedToReturnToSelectionMode(false);
        toggleMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressing, isSelectionMode, needToReturnToSelectionMode, toggleMode]);

  useEffect(() => {
    const loadImages = async () => {
      const uniqueImageIds = Array.from(
        new Set(properties.map((property) => property.imageId).filter(Boolean))
      ) as string[];

      // 前回の画像IDと今回の画像IDを比較し、使われていない画像をメモリ開放対象とする
      const prevImageIds = prevImageRef.current;
      const unusedImageIds = prevImageIds.filter(
        (id) => !uniqueImageIds.includes(id)
      );
      prevImageRef.current = uniqueImageIds;

      const imageResultsRaw = await Promise.all(
        uniqueImageIds.map(async (imageId) => {
          await resetImageParamsInIndexedDb(imageId);
          const cachedImageResult = await getImageFromIndexedDb(imageId);
          if (cachedImageResult) {
            return { imageId, url: cachedImageResult.objectURL };
          }
          const s3ImageBlob = await fetchImage(imageId);
          const imageResult = await saveImageToIndexedDb(imageId, s3ImageBlob);
          if (imageResult) {
            return { imageId, url: imageResult.objectURL };
          }
          return null;
        })
      );
      const imageResults = imageResultsRaw.filter(Boolean) as {
        imageId: string;
        url: string;
      }[];

      const newImages: Record<string, string> = {};
      imageResults.forEach(({ imageId, url }) => {
        newImages[imageId] = url;
      });
      setImages(newImages);

      //クリーンアップ関数で使用する為に、現在のスコープの値を返す
      return unusedImageIds;
    };

    const cleanupPromise = loadImages();

    return () => {
      cleanupPromise.then((unusedImageIds) => {
        // 未使用の画像IDをIndexedDBから削除
        if (unusedImageIds && unusedImageIds.length > 0) {
          revokeMultipleObjectURLsAndCleanCache(unusedImageIds);
        }
      });
    };
  }, [fetchImage, properties]);

  // Stage全体のクリックイベントハンドラー
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // 矩形選択中の場合はStageクリックを無効化
      if (isSelectionInProgress) {
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

  // パーツの表示用データをメモ化
  const sortedParts = useMemo(() => {
    return [...parts].sort((a, b) => a.order - b.order);
  }, [parts]);

  // カーソルのスタイル
  const cursorStyle = useMemo(() => {
    // スペース押下状態、または選択モードでない場合
    if (spacePressing || !isSelectionMode) {
      return isGrabbing ? 'grabbing' : 'grab';
    }
    return 'default';
  }, [spacePressing, isGrabbing, isSelectionMode]);

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
        onContextMenu={handleCloseContextMenu}
        {...grabbingHandlers}
        style={{
          cursor: cursorStyle,
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
              hitStrokeWidth={0}
              // 矩形選択用イベントを背景Rectに直接バインド
              {...(isSelectionMode
                ? {
                    onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) =>
                      handleSelectionStart(e, camera),
                    onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) =>
                      handleSelectionMove(e, camera),
                    onMouseUp: (e: Konva.KonvaEventObject<MouseEvent>) =>
                      handleSelectionEnd(
                        e,
                        parts,
                        selectMultipleParts,
                        clearSelection
                      ),
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
            {sortedParts.map((part) => {
              const partProperties = propertiesMap.get(part.id) || [];
              const filteredImages = filteredImagesMap[part.id] || [];
              const isActive = selectedPartIds.includes(part.id);

              // カードの表示制御を判定
              const isOtherPlayerCard =
                part.type === 'card' && !cardVisibilityMap.get(part.id);

              return (
                <PartOnGameBoard
                  key={part.id}
                  part={part}
                  properties={partProperties}
                  images={filteredImages}
                  gameBoardMode={gameBoardMode}
                  isActive={isActive}
                  isOtherPlayerCard={isOtherPlayerCard}
                  userRoles={userRoles}
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
              x={rectForSelection.x}
              y={rectForSelection.y}
              width={rectForSelection.width}
              height={rectForSelection.height}
              visible={isSelectionMode && rectForSelection.visible}
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
          <RoleMenu
            projectId={projectId}
            userRoles={userRoles}
            loading={false}
          />
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

      {/* プレイモード時のサイドバー */}
      {gameBoardMode === GameBoardMode.PLAY && (
        <PlaySidebar
          parts={parts}
          onSelectPart={(partId) => selectPart(partId)}
          selectedPartId={
            selectedPartIds.length === 1 ? selectedPartIds[0] : null
          }
          userRoles={userRoles}
        />
      )}

      <ZoomToolbar
        zoomIn={handleZoomIn}
        zoomOut={handleZoomOut}
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        zoomLevel={camera.scale}
      />

      <DebugInfo
        camera={camera}
        prototypeName={prototypeName}
        projectId={projectId}
        mode={gameBoardMode}
        parts={parts}
        properties={properties}
        cursors={cursors}
      />

      {/* コンテキストメニュー */}
      <ProjectContextMenu
        visible={showContextMenu && contextMenuPartId !== null}
        position={menuPosition}
        onClose={handleCloseContextMenu}
        items={getContextMenuItems(contextMenuPartId!)}
      />
    </DebugModeProvider>
  );
}
