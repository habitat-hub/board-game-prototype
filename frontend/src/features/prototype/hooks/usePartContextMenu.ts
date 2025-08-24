import Konva from 'konva';
import React, { useCallback, useState } from 'react';

import { ContextMenuItem } from '@/features/prototype/types/contextMenu';
import { Position } from '@/features/prototype/types/gameBoard';
import {
  ChangeOrderType,
  PartDispatch,
} from '@/features/prototype/types/socket';

/**
 * Hook に渡すパラメータ
 */
type UsePartContextMenuParams = {
  stageRef: React.RefObject<Konva.Stage | null>;
  dispatch: PartDispatch;
};

/**
 * Hook が返す値の型
 */
type UsePartContextMenuReturn = {
  showContextMenu: boolean;
  menuPosition: Position;
  contextMenuPartId: number | null;
  handlePartContextMenu: (
    e: Konva.KonvaEventObject<PointerEvent>,
    partId: number
  ) => void;
  handleCloseContextMenu: () => void;
  handleStageClickFromHook: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  getContextMenuItems: (partId: number) => ContextMenuItem[];
};

/**
 * Konva の Stage と連携して、パーツのコンテキストメニューの表示制御を行う Hook
 *
 * @param params.stageRef Konva.Stage の ref
 * @param params.dispatch コンテキストメニューからのアクションを dispatch する関数（任意）
 * @returns 表示制御用のハンドラや状態
 */
export function usePartContextMenu({
  stageRef,
  dispatch,
}: UsePartContextMenuParams): UsePartContextMenuReturn {
  const [showContextMenu, setVisible] = useState(false);
  const [menuPosition, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [contextMenuPartId, setActivePartId] = useState<number | null>(null);

  const handlePartContextMenu = useCallback(
    (e: Konva.KonvaEventObject<PointerEvent>, partId: number) => {
      // Konva のクリック伝播を止め、ブラウザのデフォルトコンテキストメニューを抑止する
      e.cancelBubble = true;
      try {
        // evt が存在しないケースがあるため保護
        e.evt.preventDefault();
      } catch (err) {
        // evt が無い、または preventDefault に失敗した場合は無視する
      }

      // ステージからマウス位置を取得してメニュー位置を設定
      const stage = stageRef?.current;
      if (stage) {
        const pointerPosition = stage.getPointerPosition();
        if (pointerPosition) {
          // メニューが要素と被らないように少しオフセットする
          setPosition({ x: pointerPosition.x + 5, y: pointerPosition.y + 5 });
        }
      }

      setActivePartId(partId);
      setVisible(true);
    },
    [stageRef]
  );

  const handleCloseContextMenu = useCallback(() => {
    setVisible(false);
    setActivePartId(null);
  }, []);

  /**
   * コンテキストメニューの項目を生成して返す
   * @param partId 対象のパーツID
   */

  const getContextMenuItems = useCallback(
    (partId: number): ContextMenuItem[] => {
      const changeOrder = (type: ChangeOrderType) => {
        dispatch({ type: 'CHANGE_ORDER', payload: { partId, type } });
        handleCloseContextMenu();
      };

      return [
        {
          id: 'frontmost',
          text: '最前面に移動',
          action: () => {
            changeOrder('frontmost');
          },
        },
        {
          id: 'front',
          text: '前面に移動',
          action: () => {
            changeOrder('front');
          },
        },
        {
          id: 'back',
          text: '背面に移動',
          action: () => {
            changeOrder('back');
          },
        },
        {
          id: 'backmost',
          text: '最背面に移動',
          action: () => {
            changeOrder('backmost');
          },
        },
      ];
    },
    [handleCloseContextMenu, dispatch]
  );

  const handleStageClickFromHook = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // クリック対象がコンテキストメニュー本体でない場合は閉じる
      if (showContextMenu) {
        // クリック対象がコンテキストメニュー本体でない場合は閉じる
        if (!e.target.hasName('context-menu-component')) {
          handleCloseContextMenu();
        }
      }
    },
    [showContextMenu, handleCloseContextMenu]
  );

  return {
    showContextMenu,
    menuPosition,
    contextMenuPartId,
    handlePartContextMenu,
    handleCloseContextMenu,
    handleStageClickFromHook,
    getContextMenuItems,
  };
}
