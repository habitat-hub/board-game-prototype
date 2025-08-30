/**
 * @page フローティングパーツ作成メニューコンポーネント
 */

'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';

import { Part, PartProperty } from '@/api/types';
import PartTypeIcon from '@/features/prototype/components/atoms/PartTypeIcon';
import {
  PART_DEFAULT_CONFIG,
  GAME_BOARD_SIZE,
} from '@/features/prototype/constants';
import {
  POSITION_ATTEMPTS,
  OFFSET_STEP_SIZE,
  PART_CREATE_THROTTLE_MS,
} from '@/features/prototype/constants/part';
import { AddPartProps } from '@/features/prototype/types';
import { CommonPartProperties } from '@/features/prototype/types/part';
import { isRectOverlap } from '@/features/prototype/utils/overlap';

export default function PartCreateMenu({
  onAddPart,
  camera,
  viewportSize,
  parts,
}: {
  onAddPart: ({ part, properties }: AddPartProps) => void;
  camera: { x: number; y: number; scale: number };
  viewportSize: { width: number; height: number };
  parts: Part[];
}): ReactElement {
  const [creatingPartType, setCreatingPartType] = useState<Part['type'] | null>(
    null
  );

  /**
   * 新しいパーツを作成し、中央に配置して追加します。
   * @param partType 作成するパーツの種類（'card' | 'token' | 'hand' | 'deck' | 'area'）
   * @returns Promise<void>
   */
  const handleCreatePart = async (partType: Part['type']): Promise<void> => {
    // 既に作成中の場合は何もしない
    if (creatingPartType) return;

    setCreatingPartType(partType);

    try {
      // パーツの初期設定情報を取得するためのマッピング
      const configMapping: Record<
        Part['type'],
        typeof PART_DEFAULT_CONFIG.CARD
      > = {
        card: PART_DEFAULT_CONFIG.CARD,
        token: PART_DEFAULT_CONFIG.TOKEN,
        hand: PART_DEFAULT_CONFIG.HAND,
        deck: PART_DEFAULT_CONFIG.DECK,
        area: PART_DEFAULT_CONFIG.AREA,
      };
      const partConfig = configMapping[partType];

      // パーツを中央に配置する座標を計算する関数
      const getCenteredPosition = (
        partWidth: number,
        partHeight: number,
        camera: { x: number; y: number; scale: number },
        viewportSize: { width: number; height: number }
      ): { x: number; y: number } => {
        const cameraCenterX =
          (camera.x + viewportSize.width / 2) / camera.scale;
        const cameraCenterY =
          (camera.y + viewportSize.height / 2) / camera.scale;
        const initialX = Math.max(
          0,
          Math.min(
            GAME_BOARD_SIZE - partWidth,
            Math.round(cameraCenterX - partWidth / 2)
          )
        );
        const initialY = Math.max(
          0,
          Math.min(
            GAME_BOARD_SIZE - partHeight,
            Math.round(cameraCenterY - partHeight / 2)
          )
        );

        const isFree = (posX: number, posY: number) =>
          !parts.some((p) =>
            isRectOverlap(
              { x: posX, y: posY, width: partWidth, height: partHeight },
              {
                x: p.position.x,
                y: p.position.y,
                width: p.width,
                height: p.height,
              }
            )
          );

        // 1) 同じ行で右方向にずらして試す
        for (let i = 0; i < POSITION_ATTEMPTS; i++) {
          const candidateX = Math.min(
            initialX + OFFSET_STEP_SIZE * i,
            GAME_BOARD_SIZE - partWidth
          );
          if (isFree(candidateX, initialY))
            return { x: candidateX, y: initialY };
        }

        // 2) x方向に空きがない場合、xをリセットまたは調整して下方向（y+）の行を順にスキャンする
        for (let row = 1; row <= POSITION_ATTEMPTS; row++) {
          const candidateY = Math.min(
            initialY + OFFSET_STEP_SIZE * row,
            GAME_BOARD_SIZE - partHeight
          );
          for (let col = 0; col < POSITION_ATTEMPTS; col++) {
            const candidateX = Math.min(
              initialX + OFFSET_STEP_SIZE * col,
              GAME_BOARD_SIZE - partWidth
            );
            if (isFree(candidateX, candidateY))
              return { x: candidateX, y: candidateY };
          }
        }

        // 3) それでも見つからない場合は、xをリセットまたは調整して上方向（y-）の行を順にスキャンする
        for (let row = 1; row <= POSITION_ATTEMPTS; row++) {
          const candidateY = Math.max(0, initialY - OFFSET_STEP_SIZE * row);
          for (let col = 0; col < POSITION_ATTEMPTS; col++) {
            const candidateX = Math.min(
              initialX + OFFSET_STEP_SIZE * col,
              GAME_BOARD_SIZE - partWidth
            );
            if (isFree(candidateX, candidateY))
              return { x: candidateX, y: candidateY };
          }
        }

        // フォールバック：初期の中央位置を返す
        return { x: initialX, y: initialY };
      };

      const newPart: Omit<
        Part,
        'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'
      > = {
        type: partType,
        position: getCenteredPosition(
          partConfig.width,
          partConfig.height,
          camera,
          viewportSize
        ),
        width: partConfig.width,
        height: partConfig.height,
        frontSide: 'front',
      };

      const commonProperties: CommonPartProperties = {
        name: partConfig.name,
        description: partConfig.description,
        color: partConfig.color,
        textColor: partConfig.textColor,
      };

      // カードの場合は表裏両方のプロパティを作成、それ以外は表面のみ
      const newPartProperties: Omit<
        PartProperty,
        'id' | 'partId' | 'createdAt' | 'updatedAt'
      >[] =
        partType === 'card'
          ? [
              {
                side: 'front',
                ...commonProperties,
                description:
                  partConfig.frontDescription || partConfig.description,
              },
              {
                side: 'back',
                ...commonProperties,
                description:
                  partConfig.backDescription || partConfig.description,
              },
            ]
          : [{ side: 'front', ...commonProperties }];

      onAddPart({ part: newPart, properties: newPartProperties });
      // 連打防止のためにスリープ
      await new Promise((resolve) =>
        setTimeout(resolve, PART_CREATE_THROTTLE_MS)
      );
    } catch (error) {
      console.error('パーツ作成中にエラーが発生しました:', error);
    } finally {
      setCreatingPartType(null);
    }
  };

  // パーツタイプとアイコンのマッピング（グループ分けをやめて1つの配列に統合、順番も指定通りに）
  const partTypes = [
    {
      type: 'token' as const,
      name: PART_DEFAULT_CONFIG.TOKEN.name,
    },
    {
      type: 'card' as const,
      name: PART_DEFAULT_CONFIG.CARD.name,
    },
    {
      type: 'hand' as const,
      name: PART_DEFAULT_CONFIG.HAND.name,
    },
    {
      type: 'deck' as const,
      name: PART_DEFAULT_CONFIG.DECK.name,
    },
    {
      type: 'area' as const,
      name: PART_DEFAULT_CONFIG.AREA.name,
    },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center justify-center">
      {/* パーツ作成メニュー */}
      <div className="rounded-xl bg-content shadow-lg border border-wood-light/30 p-3 flex flex-col items-center min-w-[140px]">
        <div className="flex items-center gap-2">
          {partTypes.map((partType) => (
            <button
              key={partType.type}
              onClick={() => handleCreatePart(partType.type)}
              disabled={creatingPartType !== null}
              className={`group relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-wood to-wood-dark rounded-lg transition-all duration-200 ${
                creatingPartType !== null
                  ? 'opacity-50 cursor-not-allowed scale-95'
                  : 'hover:from-wood-dark hover:to-wood-darkest hover:scale-105 hover:shadow-md'
              }`}
              title={`${partType.name}を作成`}
            >
              {creatingPartType === partType.type ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PartTypeIcon
                  type={partType.type}
                  className="h-5 w-5 text-white"
                  ariaHidden
                />
              )}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-header text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                {creatingPartType === partType.type
                  ? '作成中...'
                  : partType.name}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
