/**
 * @page フローティングパーツ作成メニューコンポーネント
 */

'use client';

import { useState } from 'react';
import { BiArea } from 'react-icons/bi';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';

import { Part, PartProperty } from '@/api/types';
import {
  PART_DEFAULT_CONFIG,
  CANVAS_SIZE,
} from '@/features/prototype/constants';
import { AddPartProps } from '@/features/prototype/types';
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
}) {
  const [creatingPartType, setCreatingPartType] = useState<string | null>(null);

  const handleCreatePart = async (
    partType: 'card' | 'token' | 'hand' | 'deck' | 'area'
  ) => {
    // 既に作成中の場合は何もしない
    if (creatingPartType) return;

    setCreatingPartType(partType);

    try {
      // パーツの初期設定情報を取得するためのマッピング
      const configMapping = {
        card: PART_DEFAULT_CONFIG.CARD,
        token: PART_DEFAULT_CONFIG.TOKEN,
        hand: PART_DEFAULT_CONFIG.HAND,
        deck: PART_DEFAULT_CONFIG.DECK,
        area: PART_DEFAULT_CONFIG.AREA,
      };

      const partConfig = configMapping[partType];
      // パーツの初期設定情報が存在しない場合
      if (!partConfig) {
        return;
      }

      // パーツを中央に配置する座標を計算する関数
      const getCenteredPosition = (
        partWidth: number,
        partHeight: number,
        camera: { x: number; y: number; scale: number },
        viewportSize: { width: number; height: number }
      ) => {
        const cameraCenterX =
          (camera.x + viewportSize.width / 2) / camera.scale;
        const cameraCenterY =
          (camera.y + viewportSize.height / 2) / camera.scale;
        const x = Math.max(
          0,
          Math.min(
            CANVAS_SIZE - partWidth,
            Math.round(cameraCenterX - partWidth / 2)
          )
        );
        const y = Math.max(
          0,
          Math.min(
            CANVAS_SIZE - partHeight,
            Math.round(cameraCenterY - partHeight / 2)
          )
        );
        // 既存パーツと重ならない位置までxのみ+25ずつずらす
        const baseX = x;
        const candidate = Array.from({ length: 100 }, (_, i) => baseX + 25 * i)
          .map((candidateX) => ({
            x: Math.min(candidateX, CANVAS_SIZE - partWidth),
            y,
          }))
          .find(
            (pos) =>
              !parts.some((p) =>
                isRectOverlap(
                  { x: pos.x, y: pos.y, width: partWidth, height: partHeight },
                  {
                    x: p.position.x,
                    y: p.position.y,
                    width: p.width,
                    height: p.height,
                  }
                )
              )
          );
        return candidate ?? { x, y };
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

      // パーツタイプ別の設定を適用
      const typeSpecificConfigs = {
        card: () => {
          newPart.frontSide = 'front';
        },
        hand: () => {
          // 手札作成時の処理（現在は何もしない）
        },
        token: () => {},
        deck: () => {},
        area: () => {},
      };

      // パーツタイプに応じた処理を実行
      typeSpecificConfigs[partType]();

      // パーツの共通プロパティ
      const commonProperties = {
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
      icon: <Gi3dMeeple className="h-5 w-5 text-white" />,
    },
    {
      type: 'card' as const,
      name: PART_DEFAULT_CONFIG.CARD.name,
      icon: <GiCard10Clubs className="h-5 w-5 text-white" />,
    },
    {
      type: 'hand' as const,
      name: PART_DEFAULT_CONFIG.HAND.name,
      icon: <GiPokerHand className="h-5 w-5 text-white" />,
    },
    {
      type: 'deck' as const,
      name: PART_DEFAULT_CONFIG.DECK.name,
      icon: <GiStoneBlock className="h-5 w-5 text-white" />,
    },
    {
      type: 'area' as const,
      name: PART_DEFAULT_CONFIG.AREA.name,
      icon: <BiArea className="h-5 w-5 text-white" />,
    },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center justify-center">
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
                partType.icon
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
