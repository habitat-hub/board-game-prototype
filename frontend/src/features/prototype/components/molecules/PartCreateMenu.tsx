/**
 * @page フローティングパーツ作成メニューコンポーネント
 */

'use client';

import { useState } from 'react';
import type { ReactElement } from 'react';
import { FaPuzzlePiece, FaChevronDown, FaChevronUp } from 'react-icons/fa';

import { Part, PartProperty } from '@/__generated__/api/client';
import PartTypeIcon from '@/features/prototype/components/atoms/PartTypeIcon';
import {
  PART_DEFAULT_CONFIG,
  GAME_BOARD_SIZE,
  COLORS,
  PARTS_INFO,
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
  const [isOpen, setIsOpen] = useState(true);

  const partDescriptions = PARTS_INFO.reduce<
    Partial<Record<Part['type'], string>>
  >((acc, part) => {
    acc[part.id as Part['type']] = part.description;
    return acc;
  }, {});

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
                color: COLORS.BACKGROUNDS[COLORS.BACKGROUNDS.length - 1],
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
      description: partDescriptions.token ?? '',
    },
    {
      type: 'card' as const,
      name: PART_DEFAULT_CONFIG.CARD.name,
      description: partDescriptions.card ?? '',
    },
    {
      type: 'hand' as const,
      name: PART_DEFAULT_CONFIG.HAND.name,
      description: partDescriptions.hand ?? '',
    },
    {
      type: 'area' as const,
      name: PART_DEFAULT_CONFIG.AREA.name,
      description: partDescriptions.area ?? '',
    },
  ];

  const toggleMenu = (): void => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-dropdown flex items-center justify-center">
      {/* パーツ作成メニュー */}
      <div className="rounded-xl bg-kibako-white shadow-lg border border-kibako-secondary/30 p-3 flex flex-col items-stretch w-[220px]">
        <button
          type="button"
          onClick={toggleMenu}
          className="flex items-center justify-between gap-3 text-kibako-primary hover:text-kibako-primary/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-kibako-primary/40 rounded"
          aria-expanded={isOpen}
          aria-controls="part-create-menu-content"
        >
          <span className="flex items-center gap-2">
            <FaPuzzlePiece className="h-4 w-4" aria-hidden />
            <span className="text-xs font-semibold tracking-wide">
              パーツ作成メニュー
            </span>
          </span>
          {isOpen ? (
            <FaChevronUp className="h-3 w-3" aria-hidden />
          ) : (
            <FaChevronDown className="h-3 w-3" aria-hidden />
          )}
        </button>
        <div
          id="part-create-menu-content"
          className={`flex items-center gap-2 transition-all duration-300 ${
            isOpen
              ? 'mt-3 opacity-100'
              : 'mt-0 max-h-0 overflow-hidden opacity-0'
          }`}
          aria-hidden={!isOpen}
        >
          {isOpen &&
            partTypes.map((partType) => (
              <button
                key={partType.type}
                onClick={() => handleCreatePart(partType.type)}
                disabled={creatingPartType !== null}
                className={`group relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-kibako-secondary to-kibako-primary rounded-lg transition-all duration-200 ${
                  creatingPartType !== null
                    ? 'opacity-50 cursor-not-allowed scale-95'
                    : 'hover:from-kibako-primary hover:to-kibako-primary hover:scale-105 hover:shadow-md'
                }`}
                aria-label={`${partType.name}を作成${
                  partType.description ? `: ${partType.description}` : ''
                }`}
              >
                {creatingPartType === partType.type ? (
                  <div className="w-5 h-5 border-2 border-kibako-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PartTypeIcon
                    type={partType.type}
                    className="h-5 w-5 text-kibako-white"
                    ariaHidden
                  />
                )}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 flex -translate-x-1/2 translate-y-1 flex-col items-center opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="min-w-[12rem] max-w-[20rem] rounded-md bg-kibako-primary/95 px-3 py-2 text-left text-xs leading-snug text-kibako-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] ring-1 ring-kibako-black/10">
                    {creatingPartType === partType.type ? (
                      '作成中...'
                    ) : (
                      <>
                        <span className="block text-[0.7rem] font-semibold text-kibako-white/90">
                          {partType.name}
                        </span>
                        <span className="mt-1 block whitespace-pre-line">
                          {partType.description || '説明が設定されていません。'}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="mt-[-2px] h-3 w-3 rotate-45 bg-kibako-primary/95 opacity-90" />
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
