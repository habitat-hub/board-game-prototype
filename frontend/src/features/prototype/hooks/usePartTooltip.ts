/**
 * @page パーツツールチップの状態管理とDOM操作を行うカスタムフック
 */

import Konva from 'konva';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Part } from '@/__generated__/api/client';
import { PARTS_INFO } from '@/features/prototype/constants/helpInfo';

interface UsePartTooltipProps {
  /** パーツ情報 */
  part: Part;
}

interface UsePartTooltipReturn {
  /** マウスエンター時のハンドラー */
  handleMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  /** マウスリーブ時のハンドラー */
  handleMouseLeave: () => void;
  /** ツールチップを非表示にする関数 */
  hideTooltip: () => void;
}

export const usePartTooltip = ({
  part,
}: UsePartTooltipProps): UsePartTooltipReturn => {
  // ツールチップ関連の状態管理
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // パーツのヘルプ情報を取得
  const partInfo = PARTS_INFO.find((info) => info.id === part.type);

  /**
   * ツールチップタイマーをクリアする
   */
  const clearTooltipTimer = useCallback(() => {
    // タイマーが存在する場合はクリア
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
  }, []);

  /**
   * ツールチップを表示する
   */
  const showTooltipWithDelay = useCallback(
    (mousePosition: { x: number; y: number }) => {
      // パーツ情報が存在しない場合は表示しない
      if (!partInfo) return;

      clearTooltipTimer();

      // 1.5秒後にツールチップを表示
      tooltipTimerRef.current = setTimeout(() => {
        setTooltipPosition(mousePosition);
        setShowTooltip(true);
      }, 1500);
    },
    [partInfo, clearTooltipTimer]
  );

  /**
   * ツールチップを非表示にする
   */
  const hideTooltip = useCallback(() => {
    clearTooltipTimer();
    setShowTooltip(false);
  }, [clearTooltipTimer]);

  /**
   * ツールチップをネイティブDOM操作でレンダリング
   *
   * NOTE: 本来はReact Portalを使いたいところだが、KonvaとReactの相性問題で断念
   * 理由：
   * - KonvaコンポーネントとHTMLコンポーネント（ツールチップ）の混在でエラー
   * - "Text components are not supported for now in ReactKonva"
   * - "Konva has no node with the type div"
   * - "Cannot read properties of undefined (reading 'getParent')"
   *
   * 対策：createPortalの代わりにネイティブDOM操作を使用
   * 参考: https://konvajs.github.io/docs/react/DOM_Portal.html
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tooltipContainer = document.getElementById('tooltip-container');
    const tooltip = document.createElement('div');
    if (!tooltipContainer || !tooltip || !showTooltip || !partInfo) return;

    try {
      tooltip.id = `tooltip-${part.id}`;
      tooltip.className =
        'fixed z-tooltip pointer-events-none max-w-xs rounded-lg border border-kibako-tertiary/40 bg-gradient-to-r from-kibako-white to-kibako-tertiary shadow-lg p-3';
      tooltip.style.left = `${tooltipPosition.x + 10}px`;
      tooltip.style.top = `${tooltipPosition.y - 10}px`;

      // パーツ名をテキストノードで設定
      const nameEl = document.createElement('div');
      nameEl.className = 'text-xs font-semibold text-kibako-primary mb-1';
      nameEl.textContent = partInfo.name;

      // パーツ説明をテキストノードで設定
      const descEl = document.createElement('div');
      descEl.className = 'text-xs text-kibako-primary leading-relaxed';
      descEl.textContent = partInfo.description;

      tooltip.appendChild(nameEl);
      tooltip.appendChild(descEl);

      tooltipContainer.appendChild(tooltip);
    } catch (error) {
      console.error('ツールチップのレンダリングに失敗しました', error);
    }

    return () => {
      const existingTooltip = document.getElementById(`tooltip-${part.id}`);
      if (!existingTooltip) return;

      existingTooltip.remove();
    };
  }, [showTooltip, tooltipPosition, partInfo, part.id]);

  // コンポーネントアンマウント時のクリーンアップ
  useEffect(() => {
    return () => {
      clearTooltipTimer();
    };
  }, [clearTooltipTimer]);

  /**
   * マウスがパーツに乗った時の処理（ツールチップ開始）
   */
  const handleMouseEnter = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // ツールチップ表示開始（画面座標で取得）
      const mousePosition = {
        x: e.evt.clientX,
        y: e.evt.clientY,
      };
      showTooltipWithDelay(mousePosition);
    },
    [showTooltipWithDelay]
  );

  /**
   * マウスがパーツから離れた時の処理（ツールチップ非表示）
   */
  const handleMouseLeave = useCallback(() => {
    // ツールチップ非表示
    hideTooltip();
  }, [hideTooltip]);

  return {
    handleMouseEnter,
    handleMouseLeave,
    hideTooltip,
  };
};
