import Konva from 'konva';
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';

import { Part, PartProperty } from '@/__generated__/api/client';
import { useImages } from '@/api/hooks/useImages';
import { PERMISSION_ACTIONS, RoleType } from '@/constants/roles';
import { ProjectContextMenu } from '@/features/prototype/components/atoms/ProjectContextMenu';
import SelectionModeToggleButton from '@/features/prototype/components/atoms/SelectionModeToggleButton';
import LeftSidebar from '@/features/prototype/components/molecules/LeftSidebar';
import PartCreateMenu from '@/features/prototype/components/molecules/PartCreateMenu';
import PartPropertyMenu from '@/features/prototype/components/molecules/PartPropertyMenu';
import PlaySidebar from '@/features/prototype/components/molecules/PlaySidebar';
import RightTopMenu from '@/features/prototype/components/molecules/RightTopMenu';
import ZoomToolbar from '@/features/prototype/components/molecules/ZoomToolbar';
import { GAME_BOARD_SIZE } from '@/features/prototype/constants';
import { DebugModeProvider } from '@/features/prototype/contexts/DebugModeContext';
import { PartOverlayMessageProvider } from '@/features/prototype/contexts/PartOverlayMessageContext';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import DebugInfo from '@/features/prototype/debug-info/DebugInfo';
import { useGameBoardShortcuts } from '@/features/prototype/hooks/useGameBoardShortcut';
import { useGameCamera } from '@/features/prototype/hooks/useGameCamera';
import { useGrabbingCursor } from '@/features/prototype/hooks/useGrabbingCursor';
import { useHandVisibility } from '@/features/prototype/hooks/useHandVisibility';
import { usePartContextMenu } from '@/features/prototype/hooks/usePartContextMenu';
import { usePartDragSystem } from '@/features/prototype/hooks/usePartDragSystem';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePerformanceTracker } from '@/features/prototype/hooks/usePerformanceTracker';
import { useSelection } from '@/features/prototype/hooks/useSelection';
import {
  AddPartProps,
  DeleteImageProps,
  GameBoardMode,
} from '@/features/prototype/types';
import type { ConnectedUser } from '@/features/prototype/types';
import { useRoleManagement } from '@/features/role/hooks/useRoleManagement';
import {
  getImageFromIndexedDb,
  resetImageParamsInIndexedDb,
  saveImageToIndexedDb,
  updateImageParamsInIndexedDb,
} from '@/utils/db';
import { revokeMultipleObjectURLsAndCleanCache } from '@/utils/imageCache';
import { isInputFieldFocused } from '@/utils/inputFocus';
import { can } from '@/utils/permissions';

import GameBoardCanvas from './GameBoardCanvas';

interface GameBoardProps {
  prototypeName: string;
  prototypeId: string;
  projectId: string;
  partsMap: Map<number, Part>;
  propertiesMap: Map<number, PartProperty[]>;
  gameBoardMode: GameBoardMode;
  connectedUsers: Array<{
    userId: string;
    username: string;
  }>;
  selectedUsersByPart: Record<number, { userId: string; username: string }[]>;
  currentUserId: string;
}

/**
 * ロール管理API由来のユーザー最小型
 * 表示用のユーザー名と代表ロール名を取得するために使用
 *
 * @property {string} userId ユーザーの一意なID
 * @property {{ username: string }} user 表示用のユーザー名を保持
 * @property {Array<{ name: string }>} roles 付与ロール一覧（先頭要素を代表ロールとして利用）
 */
interface RoleUser {
  userId: string;
  user: { username: string };
  roles: Array<{ name: string }>;
}

function deriveRoleUsers(
  userRoles: RoleUser[] | undefined,
  connectedUsers: ConnectedUser[]
): ConnectedUser[] {
  const uniqUsers = Array.from(
    new Map(
      (userRoles ?? []).map((ur) => [
        ur.userId,
        {
          userId: ur.userId,
          username: ur.user.username,
          roleName: ur.roles[0]?.name,
        } as ConnectedUser,
      ])
    ).values()
  );
  const connectedSet = new Set(connectedUsers.map((u) => u.userId));
  const active = uniqUsers.filter((u) => connectedSet.has(u.userId));
  const inactive = uniqUsers.filter((u) => !connectedSet.has(u.userId));
  return [...active, ...inactive];
}

export default function GameBoard({
  prototypeName: initialPrototypeName,
  prototypeId,
  projectId,
  partsMap,
  propertiesMap,
  gameBoardMode,
  connectedUsers,
  selectedUsersByPart,
  currentUserId,
}: GameBoardProps) {
  const [prototypeName, setPrototypeName] = useState(initialPrototypeName);
  useEffect(() => {
    setPrototypeName(initialPrototypeName);
  }, [initialPrototypeName]);
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
  const { userRoles, rolesReady } = useRoleManagement(projectId);
  // ロールユーザー一覧（接続中→非接続の順で一意化）
  const roleUsers: ConnectedUser[] = useMemo(
    () => deriveRoleUsers(userRoles, connectedUsers),
    [userRoles, connectedUsers]
  );

  const currentRole: RoleType | null = useMemo(
    () =>
      (userRoles?.find((ur) => ur.userId === currentUserId)?.roles[0]
        ?.name as RoleType | null) || null,
    [userRoles, currentUserId]
  );
  // ロール未取得/不明時は編集不可（デフォルト拒否）
  const canWrite = useMemo(
    () => can(currentRole, PERMISSION_ACTIONS.WRITE),
    [currentRole]
  );

  const canInteract = useMemo(() => {
    if (canWrite) return true;
    if (!currentRole) return false;
    if (gameBoardMode !== GameBoardMode.PLAY) {
      return false;
    }
    return can(currentRole, PERMISSION_ACTIONS.INTERACT);
  }, [canWrite, currentRole, gameBoardMode]);

  // 自分のユーザー情報（色付けに使用）
  const selfUser = useMemo(() => {
    return connectedUsers.find((u) => u.userId === currentUserId) || null;
  }, [connectedUsers, currentUserId]);

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
    consumeJustFinishedSelection,
    setSelectionMode,
  } = useSelection({
    stageRef,
    parts,
    onPartsSelected: (ids) => {
      const selectable = ids.filter((id) => !selectedUsersByPart[id]);
      if (selectable.length > 0) {
        selectMultipleParts(selectable);
      }
    },
    onClearSelection: clearSelection,
  });

  // ロール読み込み完了後、閲覧者（編集不可）の場合のみ選択モードを無効化
  useEffect(() => {
    if (!rolesReady) return;
    if (!canInteract && isSelectionMode) {
      setSelectionMode(false, { persist: false });
    }
  }, [rolesReady, canInteract, isSelectionMode, setSelectionMode]);
  // ドラッグ機能
  const { handlePartDragStart, handlePartDragMove, handlePartDragEnd } =
    usePartDragSystem({
      parts,
      canvasSize,
      gameBoardMode,
      stageRef: stageRef as React.RefObject<Konva.Stage>,
      canInteract,
    });

  const [images, setImages] = useState<Record<string, string>>({});
  const {
    showContextMenu,
    menuPosition,
    contextMenuPartId,
    handlePartContextMenu,
    handleCloseContextMenu,
    handleStageClickFromHook,
    getContextMenuItems,
  } = usePartContextMenu({
    stageRef,
    dispatch,
  });
  // スペースキー押下しているか
  const [spacePressing, setSpacePressing] = useState(false);
  // 選択モードへの復帰が必要か
  const [needToReturnToSelectionMode, setNeedToReturnToSelectionMode] =
    useState(false);

  const handlePartClick = (
    e: Konva.KonvaEventObject<MouseEvent>,
    partId: number
  ) => {
    // Viewerはクリック操作を無効化
    if (!canInteract) {
      e.cancelBubble = true;
      return;
    }
    e.cancelBubble = true;
    // 左クリックのみContextMenuを閉じる
    if ((e.evt as MouseEvent).button === 0) {
      handleCloseContextMenu();
    }
    if (selectedUsersByPart[partId] && !selectedPartIds.includes(partId)) {
      return;
    }
    const isShift = (e.evt as MouseEvent).shiftKey;
    if (isShift) {
      togglePartSelection(partId);
    } else {
      selectMultipleParts([partId]);
    }
  };

  const handleBackgroundClick = () => {
    // Viewerは背景クリックも無効化（選択状態を変更しない）
    if (!canInteract) return;
    // 矩形選択中の場合は背景クリックを無効化
    if (isSelectionInProgress) {
      return;
    }
    // 矩形選択完了直後の誤操作防止: 選択モード中のみ直後クリックを無視
    if (isJustFinishedSelection) {
      const wasJustFinished = consumeJustFinishedSelection();
      if (wasJustFinished && isSelectionMode) {
        return;
      }
    }
    // パーツの選択を解除
    clearSelection();
  };

  /**
   * パーツを追加する
   */
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

  /**
   * パーツを複製する
   */
  const handleDuplicatePart = useCallback(() => {
    if (selectedPartIds.length !== 1) return;
    const selectedPartId = selectedPartIds[0];
    const selectedPart = parts.find((p) => p.id === selectedPartId);
    if (!selectedPart) return;

    const selectedPartProperties = properties.filter(
      (p) => p.partId === selectedPartId
    );

    const computeCopyPosition = (part: Part): { x: number; y: number } => {
      const boardMaxX = GAME_BOARD_SIZE - part.width;
      const boardMaxY = GAME_BOARD_SIZE - part.height;

      const positionCandidates = [
        { x: part.position.x + part.width, y: part.position.y },
        { x: part.position.x, y: part.position.y + part.height },
        { x: part.position.x - part.width, y: part.position.y },
        { x: part.position.x, y: part.position.y - part.height },
      ];

      const fit = positionCandidates.find(
        (c) => c.x >= 0 && c.y >= 0 && c.x <= boardMaxX && c.y <= boardMaxY
      );
      if (fit) return fit;

      const clamped = positionCandidates[0];
      return {
        x: Math.min(Math.max(0, clamped.x), boardMaxX),
        y: Math.min(Math.max(0, clamped.y), boardMaxY),
      };
    };

    const newPart: Omit<
      Part,
      'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'
    > = {
      type: selectedPart.type,
      position: computeCopyPosition(selectedPart),
      width: selectedPart.width,
      height: selectedPart.height,
    };

    if (selectedPart.type === 'card') {
      newPart.frontSide = selectedPart.frontSide;
    } else {
      newPart.frontSide = 'front';
    }

    if (selectedPart.type === 'hand') {
      newPart.ownerId = selectedPart.ownerId;
    }

    const newPartProperties = selectedPartProperties
      .filter(({ side }) =>
        selectedPart.type === 'card' ? true : side === 'front'
      )
      .map(({ side, name, description, color, imageId, textColor }) => ({
        side,
        name,
        description,
        color,
        textColor,
        imageId,
      }));

    handleAddPart({ part: newPart, properties: newPartProperties });
  }, [selectedPartIds, parts, properties, handleAddPart]);

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

  /**
   * パーツを削除する
   */
  const handleDeleteParts = useCallback(async () => {
    // 0件は何もしない
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

    // パーツ削除リクエストを送信
    dispatch({ type: 'DELETE_PARTS', payload: { partIds: selectedPartIds } });
    clearSelection();
  }, [
    selectedPartIds,
    clearSelection,
    parts,
    properties,
    handleDeleteImage,
    dispatch,
  ]);

  // 削除処理のキーボードショートカット
  useGameBoardShortcuts(
    canWrite ? handleDeleteParts : () => {},
    canWrite ? handleDuplicatePart : () => {},
    canWrite ? gameBoardMode : GameBoardMode.PREVIEW
  );

  // スペースキー検出とモード切り替え（編集可能なユーザーのみ）
  useEffect(() => {
    if (!canInteract) return;

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
        setSelectionMode(false, { persist: false });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // スペースキー以外のイベント、またはスペースキー押下中でない場合は無視
      if (e.code !== 'Space' || !spacePressing) return;

      e.preventDefault();
      setSpacePressing(false);

      // 元々選択モードだった場合、選択モードに復帰
      if (needToReturnToSelectionMode && !isSelectionMode) {
        setNeedToReturnToSelectionMode(false);
        setSelectionMode(true, { persist: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    canInteract,
    spacePressing,
    isSelectionMode,
    needToReturnToSelectionMode,
    setSelectionMode,
  ]);

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
          try {
            const s3ImageBlob = await fetchImage(imageId);
            const imageResult = await saveImageToIndexedDb(
              imageId,
              s3ImageBlob
            );
            if (imageResult) {
              return { imageId, url: imageResult.objectURL };
            }
          } catch (error) {
            console.warn(
              `Image with ID ${imageId} could not be loaded.`,
              error
            );
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
      // delegate to hook's stage click handler which closes context menu when appropriate
      handleStageClickFromHook(e);
    },
    [handleStageClickFromHook, isSelectionInProgress]
  );

  const effectiveSelectionMode = canInteract ? isSelectionMode : false;

  // カーソルのスタイル
  const cursorStyle = useMemo(() => {
    // スペース押下状態、または選択モードでない場合
    if (spacePressing || !effectiveSelectionMode) {
      return isGrabbing ? 'grabbing' : 'grab';
    }
    return 'default';
  }, [spacePressing, isGrabbing, effectiveSelectionMode]);

  return (
    <DebugModeProvider>
      {/* Provide overlay messages for parts (e.g., shuffle text like deck) */}
      <PartOverlayMessageProvider>
        <GameBoardCanvas
          stageRef={stageRef}
          viewportSize={viewportSize}
          canvasSize={canvasSize}
          camera={camera}
          gameBoardMode={gameBoardMode}
          isSelectionMode={effectiveSelectionMode}
          cursorStyle={cursorStyle}
          grabbingHandlers={grabbingHandlers}
          handleWheel={handleWheel}
          handleStageClick={handleStageClick}
          handleCloseContextMenu={handleCloseContextMenu}
          handleSelectionMove={handleSelectionMove}
          handleSelectionEnd={handleSelectionEnd}
          handleDragMove={handleDragMove}
          handleSelectionStart={handleSelectionStart}
          handleBackgroundClick={handleBackgroundClick}
          parts={parts}
          propertiesMap={propertiesMap}
          images={images}
          selectedPartIds={selectedPartIds}
          selectedUsersByPart={selectedUsersByPart}
          cardVisibilityMap={cardVisibilityMap}
          selfUser={selfUser}
          userRoles={userRoles}
          handlePartClick={handlePartClick}
          handlePartDragStart={handlePartDragStart}
          handlePartDragMove={handlePartDragMove}
          handlePartDragEnd={handlePartDragEnd}
          handlePartContextMenu={canInteract ? handlePartContextMenu : () => {}}
          canInteract={canInteract}
          rectForSelection={rectForSelection}
        />

        <LeftSidebar
          prototypeName={prototypeName}
          prototypeId={prototypeId}
          gameBoardMode={gameBoardMode}
          projectId={projectId}
          onPrototypeNameChange={setPrototypeName}
        />

        {/* ロールメニュー - CREATEモードとPLAYモードで表示 */}
        {(gameBoardMode === GameBoardMode.CREATE ||
          gameBoardMode === GameBoardMode.PLAY) && (
          <RightTopMenu
            projectId={projectId}
            connectedUsers={connectedUsers}
            roleUsers={roleUsers}
            loading={false}
            showRoleManagementButton={gameBoardMode === GameBoardMode.CREATE}
          />
        )}

        {canWrite && gameBoardMode === GameBoardMode.CREATE && (
          <PartCreateMenu
            onAddPart={handleAddPart}
            camera={camera}
            viewportSize={viewportSize}
            parts={parts}
          />
        )}

        {canWrite && (
          <PartPropertyMenu
            selectedPartIds={selectedPartIds}
            parts={parts}
            properties={properties}
            onDuplicatePart={handleDuplicatePart}
            onDeletePart={handleDeleteParts}
            onDeleteImage={handleDeleteImage}
            gameBoardMode={gameBoardMode}
          />
        )}

        {/* プレイルーム時のサイドバー */}
        {gameBoardMode === GameBoardMode.PLAY && canInteract && (
          <PlaySidebar
            parts={parts}
            onSelectPart={(partId) => {
              if (!canInteract) return;
              selectPart(partId);
            }}
            selectedPartId={
              selectedPartIds.length === 1 ? selectedPartIds[0] : null
            }
            userRoles={userRoles}
            canInteract={canInteract}
          />
        )}

        <div className="fixed bottom-4 right-4 z-overlay flex items-center gap-4">
          {canInteract && (
            <SelectionModeToggleButton
              isSelectionMode={isSelectionMode}
              onToggle={toggleMode}
            />
          )}
          <ZoomToolbar
            zoomIn={handleZoomIn}
            zoomOut={handleZoomOut}
            canZoomIn={canZoomIn}
            canZoomOut={canZoomOut}
            zoomLevel={camera.scale}
          />
        </div>

        <DebugInfo
          camera={camera}
          prototypeName={prototypeName}
          projectId={projectId}
          mode={gameBoardMode}
          parts={parts}
          properties={properties}
        />

        {/* コンテキストメニュー */}
        <ProjectContextMenu
          visible={showContextMenu && contextMenuPartId !== null}
          position={menuPosition}
          onClose={handleCloseContextMenu}
          items={getContextMenuItems(contextMenuPartId!)}
        />
      </PartOverlayMessageProvider>
    </DebugModeProvider>
  );
}
