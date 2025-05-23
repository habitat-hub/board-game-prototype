import { throttle } from 'lodash';
import { useCallback, useMemo, useState, useEffect, useRef } from 'react';

import { Part } from '@/api/types';
import { GRID_SIZE } from '@/features/prototype/const';
import { needsParentUpdate } from '@/features/prototype/helpers/partHelper';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { Camera, Point } from '@/features/prototype/type';

interface UseCanvasEventsProps {
  camera: Camera;
  setCamera: React.Dispatch<React.SetStateAction<Camera>>;
  setSelectedPartId: React.Dispatch<React.SetStateAction<number | null>>;
  selectedPartId: number | null;
  selectedPartIds: number[];
  setSelectedPartIds: React.Dispatch<React.SetStateAction<number[]>>;
  parts: Part[];
  mainViewRef: React.RefObject<HTMLDivElement>;
}

export const useCanvasEvents = ({
  camera,
  setCamera,
  setSelectedPartId,
  selectedPartId,
  selectedPartIds,
  setSelectedPartIds,
  parts,
  mainViewRef,
}: UseCanvasEventsProps) => {
  const { dispatch } = usePartReducer();

  // 移動中のキャンバス
  const [movingCanvas, setMovingCanvas] = useState<{
    startX: number;
    startY: number;
  } | null>(null);

  // 移動中のパーツ
  const [movingPart, setMovingPart] = useState<{
    partId: number;
    startX: number;
    startY: number;
    offset: Point;
    isMultiSelect: boolean;
    partsInitialPositions: Map<number, Point>;
    wasDragged: boolean; // パーツがドラッグされたかどうかのフラグ
  } | null>(null);

  // リサイズ中のパーツ
  const [resizingPart, setResizingPart] = useState<{
    partId: number;
    startWidth: number;
    startHeight: number;
    startClientX: number;
    startClientY: number;
  } | null>(null);

  // 前回の位置を保持するためのref
  const lastPositions = useRef(new Map<number, { x: number; y: number }>());

  // 複数パーツ選択時、ドラッグ中のパーツとその他の選択されたパーツを全て更新する
  const updateMultiSelectedPartsPositions = useCallback(
    (x: number, y: number, shiftKey: boolean) => {
      if (!movingPart || !movingPart.isMultiSelect || !shiftKey) return;

      // ドラッグされたことを記録
      if (!movingPart.wasDragged) {
        setMovingPart({
          ...movingPart,
          wasDragged: true,
        });
      }

      const deltaX = x - movingPart.startX;
      const deltaY = y - movingPart.startY;

      // 全ての選択されたパーツの位置を個別に更新
      movingPart.partsInitialPositions.forEach((initialPos, partId) => {
        // ドラッグ中のパーツ自体は更新しない（別途更新されるため）
        if (partId === movingPart.partId) {
          return;
        }

        const newX =
          Math.round((initialPos.x + deltaX) / GRID_SIZE) * GRID_SIZE;
        const newY =
          Math.round((initialPos.y + deltaY) / GRID_SIZE) * GRID_SIZE;

        dispatch({
          type: 'UPDATE_PART',
          payload: {
            partId,
            updatePart: { position: { x: newX, y: newY } },
          },
        });
      });
    },
    [dispatch, movingPart]
  );

  /**
   * パーツの位置を更新するためのthrottledなdispatch関数
   * @param x - パーツのx座標
   * @param y - パーツのy座標
   * @param shiftKey - Shiftキーが押されているかどうか
   */
  const throttledUpdatePosition = useMemo(
    () =>
      throttle((x: number, y: number, shiftKey: boolean) => {
        if (!movingPart) {
          return;
        }

        // 複数選択モードの場合は、Shiftキーが押されている時のみ選択された全てのパーツを移動
        if (movingPart.isMultiSelect && shiftKey) {
          updateMultiSelectedPartsPositions(x, y, shiftKey);
        }

        // 移動中のパーツのID
        const movingPartId = movingPart.partId;

        // 前回の位置
        const lastPosition = lastPositions.current.get(movingPartId);

        // 前回の位置があり、かつ、前回の位置と現在の位置が5px以内の場合は更新しない
        if (
          lastPosition &&
          Math.abs(lastPosition.x - x) <= 10 &&
          Math.abs(lastPosition.y - y) <= 10
        ) {
          return;
        }

        // 前回の位置を更新
        lastPositions.current.set(movingPartId, { x, y });

        // パーツの位置を更新
        dispatch({
          type: 'UPDATE_PART',
          payload: {
            partId: movingPartId,
            updatePart: { position: { x, y } },
          },
        });
      }, 100),
    [movingPart, dispatch, updateMultiSelectedPartsPositions]
  );

  // throttleのクリーンアップ
  useEffect(() => {
    return () => {
      throttledUpdatePosition.cancel();
    };
  }, [throttledUpdatePosition]);

  /**
   * ズーム操作
   * @param e - ホイールイベント
   */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        // CtrlキーまたはCommandキーが押されている場合はズーム操作
        e.preventDefault();
        const delta = e.deltaY * -0.01; // ホイールの回転方向に合わせて調整

        setCamera((camera) => {
          // 新しいズーム値を計算（範囲制限付き）
          const newZoom = Math.max(0.4, Math.min(1.0, camera.zoom + delta));
          return {
            ...camera,
            zoom: newZoom,
          };
        });
      } else {
        // 通常のスクロール操作
        setCamera((camera) => ({
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY,
          zoom: camera.zoom,
        }));
      }
    },
    [setCamera]
  );

  /**
   * キャンバスに関するマウスダウンイベントのハンドラー
   * @param e - マウスイベント
   */
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    // テキスト選択を防止
    e.preventDefault();

    // シフトキーを押さずにクリックした場合は、選択中のパーツを全て解除
    if (!e.shiftKey) {
      setSelectedPartId(null);
      setSelectedPartIds([]);
    }

    // キャンバスの移動開始
    setMovingCanvas({
      startX: e.clientX - camera.x,
      startY: e.clientY - camera.y,
    });
  };

  /**
   * パーツに関するマウスダウンイベントのハンドラー
   * @param e - マウスイベント
   * @param partId - パーツID
   */
  const onPartMouseDown = (e: React.MouseEvent, partId: number) => {
    // テキスト選択を防止
    e.preventDefault();

    e.stopPropagation();

    const part = parts.find((part) => part.id === partId);
    const rect = mainViewRef.current?.getBoundingClientRect();
    // パーツが見つからない場合
    if (!rect || !part) {
      return;
    }

    // シフトキーが押されている場合は複数選択
    if (e.shiftKey) {
      // 現在のパーツが選択されているかどうかを確認
      const isPartSelected = selectedPartIds.includes(partId);

      if (isPartSelected) {
        // すでに選択されているパーツの場合は選択リストから削除
        const newSelectedIds = selectedPartIds.filter((id) => id !== partId);
        setSelectedPartIds(newSelectedIds);

        // 選択中のパーツが選択解除された場合は、別のパーツを主選択に設定
        if (partId === selectedPartId) {
          if (newSelectedIds.length > 0) {
            // 残りのパーツから最初のパーツを主選択に
            setSelectedPartId(newSelectedIds[0]);
          } else {
            // 選択パーツがなくなった場合はnullに
            setSelectedPartId(null);
          }
        }
      } else {
        // 新しく選択する場合は追加
        setSelectedPartIds((prev) => [...prev, partId]);

        // まだ主選択パーツがない場合はこのパーツを主選択に
        if (selectedPartId === null) {
          setSelectedPartId(partId);
        }
      }
    } else {
      // シフトキーなしでクリックした場合は他の選択をクリアして単一選択
      setSelectedPartId(partId);
      setSelectedPartIds([partId]);
    }

    const target = e.target as SVGElement;
    const direction = target.getAttribute('data-resize-direction') as
      | 'northWest'
      | 'northEast'
      | 'southEast'
      | 'southWest';

    // パーツのリサイズ
    if (direction) {
      setResizingPart({
        partId,
        startWidth: part.width,
        startHeight: part.height,
        startClientX: e.clientX,
        startClientY: e.clientY,
      });
      return;
    }

    // 選択されたパーツの初期位置を記録
    const partsInitialPositions = new Map<number, Point>();

    // Shiftキーが押されている場合のみ、複数選択モードを有効にする
    const isMultiSelect = e.shiftKey && selectedPartIds.length > 0;

    if (isMultiSelect) {
      // 選択リストを更新した後で現在の選択されたパーツをすべて取得
      // 注意: selectedPartIds.includes(partId)をチェックしない（選択解除直後も含めるため）
      const currentSelectedIds = selectedPartIds;

      // 選択されたパーツすべての初期位置を記録
      currentSelectedIds.forEach((id) => {
        const selectedPart = parts.find((p) => p.id === id);
        if (selectedPart) {
          partsInitialPositions.set(id, {
            x: selectedPart.position.x,
            y: selectedPart.position.y,
          });
        }
      });
    } else {
      partsInitialPositions.set(partId, {
        x: part.position.x,
        y: part.position.y,
      });
    }

    // パーツの移動
    const x = (e.clientX - rect.left) / camera.zoom - part.position.x;
    const y = (e.clientY - rect.top) / camera.zoom - part.position.y;
    setMovingPart({
      partId,
      startX: part.position.x,
      startY: part.position.y,
      offset: { x, y },
      isMultiSelect,
      partsInitialPositions,
      wasDragged: false, // 初期状態ではドラッグされていない
    });
  };

  /**
   * マウス移動イベントのハンドラー
   * @param e - マウス移動イベント
   */
  const onMouseMove = (e: React.MouseEvent) => {
    // テキスト選択を防止（ドラッグ中）
    if (movingCanvas || movingPart !== null) {
      e.preventDefault();
    }

    if (resizingPart) return;

    // パーツの移動中
    if (movingPart) {
      // パーツのドラッグ処理
      const rect = mainViewRef.current?.getBoundingClientRect();
      if (!rect) return;

      // マウス位置からパーツの新しい位置を計算
      const rawX = (e.clientX - rect.left) / camera.zoom - movingPart.offset.x;
      const rawY = (e.clientY - rect.top) / camera.zoom - movingPart.offset.y;

      const x = Math.round(rawX / GRID_SIZE) * GRID_SIZE;
      const y = Math.round(rawY / GRID_SIZE) * GRID_SIZE;

      // パーツの位置を更新（Shiftキーの状態も渡す）
      throttledUpdatePosition(x, y, e.shiftKey);
      return;
    }

    // キャンバスの移動中
    if (movingCanvas) {
      // カメラの移動処理
      setCamera((prev) => ({
        ...prev,
        x: e.clientX - movingCanvas.startX,
        y: e.clientY - movingCanvas.startY,
      }));
    }
  };

  /**
   * マウスイベントのクリーンアップ
   */
  const cleanUp = () => {
    setMovingCanvas(null);
    setMovingPart(null);
    setResizingPart(null);
  };

  /**
   * パーツのリサイズ処理
   */
  const handleResizePart = (e: React.MouseEvent) => {
    if (!resizingPart) return;

    e.stopPropagation();
    const dx = e.clientX - resizingPart.startClientX;
    const dy = e.clientY - resizingPart.startClientY;

    const newWidth =
      resizingPart.startWidth + dx > 50 ? resizingPart.startWidth + dx : 50;
    const newHeight =
      resizingPart.startHeight + dy > 50 ? resizingPart.startHeight + dy : 50;

    dispatch({
      type: 'UPDATE_PART',
      payload: {
        partId: resizingPart.partId,
        updatePart: {
          width: newWidth,
          height: newHeight,
        },
      },
    });
  };

  /**
   * カードの裏返し処理
   */
  const handleCardFlip = (
    cardPart: Part,
    previousParent: Part | undefined,
    newParent: Part | undefined
  ) => {
    if (cardPart.type !== 'card') return;

    // 前の親は裏向き必須か
    const isPreviousParentReverseRequired =
      previousParent?.type === 'deck' && !!previousParent.canReverseCardOnDeck;

    // 新しい親は裏向き必須か
    const isNextParentReverseRequired =
      newParent?.type === 'deck' && !!newParent.canReverseCardOnDeck;

    // 裏返し設定が変更された場合のみカードを裏返す
    if (isPreviousParentReverseRequired !== isNextParentReverseRequired) {
      dispatch({
        type: 'FLIP_CARD',
        payload: {
          cardId: cardPart.id,
          isNextFlipped: isNextParentReverseRequired,
        },
      });
    }
  };

  /**
   * パーツの親子関係を更新
   */
  const updatePartParent = (targetPart: Part) => {
    // 親子関係の更新処理
    const { needsUpdate, parentPart } = needsParentUpdate(parts, targetPart, {
      x: targetPart.position.x,
      y: targetPart.position.y,
    });

    if (!needsUpdate) return false;

    // 親パーツの更新
    dispatch({
      type: 'UPDATE_PART',
      payload: {
        partId: targetPart.id,
        updatePart: {
          parentId: parentPart ? parentPart.id : undefined,
        },
      },
    });

    // 前の親パーツを取得
    const previousParent = parts.find((p) => p.id === targetPart.parentId);

    // カードの裏返し処理
    handleCardFlip(targetPart, previousParent, parentPart);

    return true;
  };

  /**
   * 選択状態の更新処理
   */
  const updateSelectionState = (
    currentPartId: number,
    isShiftKey: boolean,
    isMultiSelect: boolean,
    wasDragged: boolean
  ) => {
    // ドラッグ操作がない場合は選択状態を変更しない
    if (!wasDragged) {
      return;
    }
    // Shift+ドラッグで複数選択時の処理
    if (isShiftKey && isMultiSelect) {
      // 現在のパーツが選択リストにない場合は追加
      if (!selectedPartIds.includes(currentPartId)) {
        setSelectedPartIds((prev) => [...prev, currentPartId]);
      }
    } else {
      // 単一選択の場合は、現在のパーツのみを選択
      setSelectedPartIds([currentPartId]);
    }
    // 現在のパーツを主選択パーツとして設定
    setSelectedPartId(currentPartId);
  };

  /**
   * マウスアップイベントのハンドラー
   */
  const onMouseUp = (e: React.MouseEvent) => {
    // リサイズ処理
    if (resizingPart) {
      handleResizePart(e);
      cleanUp();
      return;
    }

    // 移動中のパーツがない場合は終了
    if (!movingPart) {
      cleanUp();
      return;
    }

    e.stopPropagation();

    // 移動したパーツの取得
    const part = parts.find((p) => p.id === movingPart.partId);
    if (!part) {
      cleanUp();
      return;
    }

    // メインのパーツの親子関係を更新
    updatePartParent(part);

    // Shift+ドラッグで複数選択されている場合、他の選択されたパーツも更新
    if (movingPart.isMultiSelect && e.shiftKey && movingPart.wasDragged) {
      movingPart.partsInitialPositions.forEach((_, partId) => {
        // 現在ドラッグ中のパーツは既に処理済みなのでスキップ
        if (partId === movingPart.partId) {
          return;
        }

        const selectedPart = parts.find((part) => part.id === partId);
        if (selectedPart) {
          updatePartParent(selectedPart);
        }
      });
    }

    // 選択状態の更新
    updateSelectionState(
      movingPart.partId,
      e.shiftKey,
      movingPart.isMultiSelect,
      movingPart.wasDragged
    );

    // 状態をクリア
    cleanUp();
  };

  // キャンバスのドラッグ中かどうか
  const isDraggingCanvas = movingCanvas !== null;

  // Shift+ドラッグ中の関連パーツID群
  const relatedDraggingPartIds =
    (movingPart &&
      movingPart.isMultiSelect &&
      Array.from(movingPart.partsInitialPositions.keys())) ||
    [];

  return {
    isDraggingCanvas,
    relatedDraggingPartIds,
    onWheel,
    onCanvasMouseDown,
    onPartMouseDown,
    onMouseMove,
    onMouseUp,
  };
};
