/**
 * @page フローティングパーツ作成メニューコンポーネント
 */

'use client';

import { BiArea } from 'react-icons/bi';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';

import { Part, PartProperty } from '@/api/types';
import { PART_DEFAULT_CONFIG } from '@/features/prototype/const';
import { AddPartProps } from '@/features/prototype/type';

export default function PartCreateMenu({
  onAddPart,
}: {
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
}) {
  /**
   * パーツを作成する
   * @param partType - パーツのタイプ
   */
  const handleCreatePart = (
    partType: 'card' | 'token' | 'hand' | 'deck' | 'area'
  ) => {
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

    // 新しいパーツ
    const newPart: Omit<
      Part,
      'id' | 'prototypeId' | 'order' | 'createdAt' | 'updatedAt'
    > = {
      type: partType,
      parentId: undefined,
      position: { x: 0, y: 0 }, // 仮の位置（GameBoardのhandleAddPartで上書きされる）
      width: partConfig.width,
      height: partConfig.height,
      configurableTypeAsChild: partConfig.configurableTypeAsChild,
      originalPartId: undefined,
    };

    // パーツタイプ別の設定を適用
    const typeSpecificConfigs = {
      card: () => {
        newPart.isReversible =
          'isReversible' in partConfig && partConfig.isReversible;
        newPart.isFlipped = false;
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
            { side: 'front', ...commonProperties },
            { side: 'back', ...commonProperties },
          ]
        : [{ side: 'front', ...commonProperties }];

    onAddPart({ part: newPart, properties: newPartProperties });
  };

  // パーツタイプとアイコンのマッピング
  const partTypes = [
    {
      type: 'card' as const,
      name: PART_DEFAULT_CONFIG.CARD.name,
      icon: <GiCard10Clubs className="h-5 w-5 text-white" />,
    },
    {
      type: 'token' as const,
      name: PART_DEFAULT_CONFIG.TOKEN.name,
      icon: <Gi3dMeeple className="h-5 w-5 text-white" />,
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
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[10000] flex items-center justify-center rounded-xl bg-content shadow-lg border border-wood-light/30 p-2">
      <div className="flex items-center justify-center gap-2">
        {partTypes.map((partType) => (
          <button
            key={partType.type}
            onClick={() => handleCreatePart(partType.type)}
            className="group relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-wood to-wood-dark hover:from-wood-dark hover:to-wood-darkest rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
            title={`${partType.name}を作成`}
          >
            {partType.icon}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-header text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              {partType.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
