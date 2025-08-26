import { useMemo } from 'react';

import { Part } from '@/api/types';
import { GameBoardMode } from '@/features/prototype/types';
import { isRectOverlap } from '@/features/prototype/utils/overlap';
import { useUser } from '@/hooks/useUser';

// グリッドセルのサイズ（ピクセル）
const GRID_CELL_SIZE = 100;

interface GridCell {
  x: number;
  y: number;
  hands: Part[];
  cards: Part[];
}

/**
 * グリッド管理クラス
 */
class GridManager {
  private grid: Map<string, GridCell> = new Map();

  /**
   * 座標からグリッドセルのキーを生成
   */
  private getGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / GRID_CELL_SIZE);
    const gridY = Math.floor(y / GRID_CELL_SIZE);
    return `${gridX},${gridY}`;
  }

  /**
   * パーツが占めるグリッドセルを取得
   */
  private getPartGridCells(part: Part): string[] {
    const cells: string[] = [];
    const startX = Math.floor(part.position.x / GRID_CELL_SIZE);
    const endX = Math.floor((part.position.x + part.width) / GRID_CELL_SIZE);
    const startY = Math.floor(part.position.y / GRID_CELL_SIZE);
    const endY = Math.floor((part.position.y + part.height) / GRID_CELL_SIZE);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x},${y}`);
      }
    }
    return cells;
  }

  /**
   * グリッドを構築
   */
  buildGrid(parts: Part[]): void {
    this.grid.clear();

    parts.forEach((part) => {
      const cells = this.getPartGridCells(part);

      cells.forEach((cellKey) => {
        if (!this.grid.has(cellKey)) {
          this.grid.set(cellKey, { x: 0, y: 0, hands: [], cards: [] });
        }

        const cell = this.grid.get(cellKey)!;
        if (part.type === 'hand') {
          cell.hands.push(part);
        } else if (part.type === 'card') {
          cell.cards.push(part);
        }
      });
    });
  }

  /**
   * カードが手札と少しでも重なっているかチェック（グリッド最適化版）
   */
  isCardOnHand(card: Part, hand: Part): boolean {
    const cardRect = {
      x: card.position.x,
      y: card.position.y,
      width: card.width,
      height: card.height,
    };
    const handRect = {
      x: hand.position.x,
      y: hand.position.y,
      width: hand.width,
      height: hand.height,
    };

    return isRectOverlap(cardRect, handRect);
  }

  /**
   * カードの表示制御を計算（グリッド最適化版）
   */
  calculateCardVisibility(
    parts: Part[],
    gameBoardMode: GameBoardMode,
    userId?: string
  ): Map<number, boolean> {
    const visibilityMap = new Map<number, boolean>();

    // PLAYモードでない場合は全て表示
    if (gameBoardMode !== GameBoardMode.PLAY) {
      parts.forEach((part) => {
        if (part.type === 'card') {
          visibilityMap.set(part.id, true);
        }
      });
      return visibilityMap;
    }

    // カードのみを取得
    const cards = parts.filter((part) => part.type === 'card');

    // 各カードについて表示制御を判定
    cards.forEach((card) => {
      let shouldShow = true; // デフォルトは表示

      // カードが存在するグリッドセルを取得
      const cardCells = this.getPartGridCells(card);

      // 関連する手札を収集
      const relevantHands: Part[] = [];
      cardCells.forEach((cellKey) => {
        const cell = this.grid.get(cellKey);
        if (cell) {
          relevantHands.push(...cell.hands);
        }
      });

      // 重複を除去
      const uniqueHands = relevantHands.filter(
        (hand, index, self) => self.findIndex((h) => h.id === hand.id) === index
      );

      // 手札の上にあるカードかチェック
      for (const hand of uniqueHands) {
        if (this.isCardOnHand(card, hand)) {
          // 手札の所有者が自分かどうかチェック
          const isOwnHand = hand.ownerId === userId;
          shouldShow = isOwnHand;
          break; // 最初に見つかった手札の判定を使用
        }
      }

      visibilityMap.set(card.id, shouldShow);
    });

    return visibilityMap;
  }
}

/**
 * 手札の上のカードの表示制御を行うフック（グリッド最適化版）
 * @param parts - 全パーツ
 * @param gameBoardMode - ゲームボードモード
 * @returns カードの表示制御情報
 */
export const useHandVisibility = (
  parts: Part[],
  gameBoardMode: GameBoardMode
) => {
  const { user } = useUser();

  // グリッドマネージャーを作成
  const gridManager = useMemo(() => new GridManager(), []);

  // カードの表示制御情報を計算（グリッド最適化版）
  const cardVisibilityMap = useMemo(() => {
    // グリッドを構築
    gridManager.buildGrid(parts);

    // 表示制御を計算
    return gridManager.calculateCardVisibility(parts, gameBoardMode, user?.id);
  }, [parts, gameBoardMode, user?.id, gridManager]);

  return {
    cardVisibilityMap,
    isCardOnHand: gridManager.isCardOnHand.bind(gridManager),
  };
};
