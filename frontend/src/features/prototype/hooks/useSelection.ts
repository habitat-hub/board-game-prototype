/**
 * @page ドラッグによる複数選択機能を管理するカスタムフック
 */
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  RefObject,
} from 'react';

import { Part } from '@/api/types';
import { isRectOverlap } from '@/features/prototype/utils/overlap';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

interface Camera {
  x: number;
  y: number;
  scale: number;
}

interface UseSelectionOptions {
  stageRef?: RefObject<Konva.Stage | null>;
  parts?: Part[];
  onPartsSelected?: (partIds: number[]) => void;
  onClearSelection?: () => void;
}

export function useSelection(options: UseSelectionOptions = {}) {
  const { stageRef, parts = [], onPartsSelected, onClearSelection } = options;
  // 複数選択可能モード
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(true);
  // 複数選択用の矩形
  const [rectForSelection, setRectForSelection] = useState<SelectionRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  // 選択開始座標
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);
  // 選択終了フラグ
  const justFinishedSelectionRef = useRef<boolean>(false);
  // 最後に処理したポインタ位置（粗くスキップ判定用）
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  // window.requestAnimationFrame が返すハンドル（識別子）
  const requestAnimationFrameIdRef = useRef<number | null>(null);
  // 最新の矩形（state に頼らず終了時に参照するため）
  const latestRectRef = useRef<SelectionRect | null>(null);

  // Stage座標→カメラ考慮のキャンバス座標に変換
  const convertToCanvasCoords = useCallback(
    (stageX: number, stageY: number, camera: Camera) => {
      return {
        x: (stageX + camera.x) / camera.scale,
        y: (stageY + camera.y) / camera.scale,
      };
    },
    []
  );

  // 選択開始
  const handleSelectionStart = useCallback(
    (e: KonvaEventObject<MouseEvent>, camera: Camera) => {
      if (!isSelectionMode) return;

      e.cancelBubble = true;
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      const { x, y } = convertToCanvasCoords(pos.x, pos.y, camera);
      selectionStartRef.current = { x, y };
      const initialRect = {
        x,
        y,
        width: 0,
        height: 0,
        visible: true,
      } as SelectionRect;
      // 同期参照更新
      lastPointerRef.current = { x, y };
      latestRectRef.current = initialRect;
      setRectForSelection(initialRect);
    },
    [isSelectionMode, convertToCanvasCoords]
  );

  // 選択中の移動
  const handleSelectionMove = useCallback(
    (e: KonvaEventObject<MouseEvent>, camera: Camera) => {
      if (!isSelectionMode || !selectionStartRef.current) return;

      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;

      const { x, y } = convertToCanvasCoords(pos.x, pos.y, camera);

      const last = lastPointerRef.current;
      const THRESHOLD = 2;

      const start = selectionStartRef.current!;
      const rect: SelectionRect = {
        x: Math.min(start.x, x),
        y: Math.min(start.y, y),
        width: Math.abs(x - start.x),
        height: Math.abs(y - start.y),
        visible: true,
      };

      // しきい値未満の細かい移動は描画をスキップするが、最新矩形は保持しておく
      if (last) {
        const delta = Math.max(Math.abs(x - last.x), Math.abs(y - last.y));
        if (delta < THRESHOLD) {
          latestRectRef.current = rect;
          lastPointerRef.current = { x, y };
          return; // 描画は間引く
        }
      }

      // 最新ポインタを更新
      lastPointerRef.current = { x, y };

      // requestAnimationFrame を使って矩形描画を間引く（複数イベントで1フレームにつき1回だけ更新）
      if (requestAnimationFrameIdRef.current == null) {
        requestAnimationFrameIdRef.current = window.requestAnimationFrame(
          () => {
            // 最新矩形は事前計算済み
            latestRectRef.current = rect;
            setRectForSelection(rect);
            requestAnimationFrameIdRef.current = null;
          }
        );
      }
    },
    [isSelectionMode, convertToCanvasCoords]
  );

  // 選択終了
  const handleSelectionEnd = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // ドラッグ開始が記録されていない場合のみ早期リターン
      if (!selectionStartRef.current) return;

      e.cancelBubble = true;
      // requestAnimationFrame の予約が残っていればキャンセルして最新矩形を確定
      if (requestAnimationFrameIdRef.current != null) {
        window.cancelAnimationFrame(requestAnimationFrameIdRef.current);
        requestAnimationFrameIdRef.current = null;
      }

      // 直近のポインタと開始座標から最終矩形を再計算して反映
      const start = selectionStartRef.current;
      const last = lastPointerRef.current ?? start;
      if (start && last) {
        latestRectRef.current = {
          x: Math.min(start.x, last.x),
          y: Math.min(start.y, last.y),
          width: Math.abs(last.x - start.x),
          height: Math.abs(last.y - start.y),
          visible: true,
        };
        // state 側も同期しておく
        setRectForSelection(latestRectRef.current);
      }

      // state の矩形ではなく、最新の矩形(ref)を参照して判定する（state の非同期性回避）
      const rect = latestRectRef.current ?? rectForSelection ?? null;

      // 状態の非同期性を回避するため、確定済みの矩形（ref / state）を使用する
      if (rect && rect.width > 0 && rect.height > 0) {
        const selected = parts.filter((part) => {
          const partRect = {
            x: part.position.x,
            y: part.position.y,
            width: part.width,
            height: part.height,
          };
          return isRectOverlap(rect, partRect);
        });
        const newSelectedIds = selected.map((p) => p.id);
        if (onPartsSelected) onPartsSelected(newSelectedIds);
        justFinishedSelectionRef.current = true;
      } else {
        if (onClearSelection) onClearSelection();
        justFinishedSelectionRef.current = false;
      }

      // 後片付け
      setRectForSelection((r) => ({ ...r, visible: false }));
      selectionStartRef.current = null;
      lastPointerRef.current = null;
      latestRectRef.current = null;
    },
    [rectForSelection, parts, onPartsSelected, onClearSelection]
  );

  const toggleMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
  }, []);

  const isJustFinishedSelection = useMemo(() => {
    const result = justFinishedSelectionRef.current;
    if (result) {
      justFinishedSelectionRef.current = false;
    }
    return result;
  }, []);

  // Stage外でmouseupしたときでも選択を終了させるため、
  // 選択中は window に mouseup / pointerup を張る（ライフサイクル管理）
  useEffect(() => {
    if (!rectForSelection.visible) return;

    const onWindowUp = (ev: MouseEvent | PointerEvent) => {
      // Konva のステージ内での mouseup は Konva 側のハンドラに任せる。
      // そうしないと requestAnimationFrame の更新タイミングと競合して最新矩形が反映されず
      // 選択が空になることがあるため、ステージ外のリリースのみ処理する。
      const stageContainer = stageRef?.current?.container();
      if (stageContainer && ev.target && ev.target instanceof Node) {
        if (stageContainer.contains(ev.target as Node)) {
          return; // ステージ内のイベントは無視
        }
      }

      // ステージ外でのリリースはフックの選択終了処理を呼ぶ
      const fakeEvent = {
        cancelBubble: false,
      } as unknown as Konva.KonvaEventObject<MouseEvent>;
      fakeEvent.cancelBubble = true;
      handleSelectionEnd(fakeEvent);
    };

    window.addEventListener('mouseup', onWindowUp as EventListener);
    window.addEventListener('pointerup', onWindowUp as EventListener);

    return () => {
      window.removeEventListener('mouseup', onWindowUp as EventListener);
      window.removeEventListener('pointerup', onWindowUp as EventListener);
    };
  }, [rectForSelection.visible, stageRef, handleSelectionEnd]);

  return {
    isSelectionMode,
    rectForSelection,
    isSelectionInProgress: selectionStartRef.current !== null,
    isJustFinishedSelection,
    handleSelectionStart,
    handleSelectionMove,
    handleSelectionEnd,
    toggleMode,
  };
}
