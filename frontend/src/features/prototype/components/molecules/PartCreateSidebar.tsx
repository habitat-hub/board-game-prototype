/**
 * @page パーツ編集ページに表示するパーツ作成用のサイドバー
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BiArea } from 'react-icons/bi';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';
import { IoArrowBack, IoMenu } from 'react-icons/io5';

import { Part, PartProperty, Player } from '@/api/types';
import TextIconButton from '@/components/atoms/TextIconButton';
import { PART_DEFAULT_CONFIG } from '@/features/prototype/const';
import { AddPartProps } from '@/features/prototype/type';

const PART_DEFAULT_POSITION = {
  X: 1000,
  Y: 1000,
};

export default function PartCreateSidebar({
  prototypeName,
  groupId,
  players,
  onAddPart,
}: {
  // プロトタイプ名
  prototypeName: string;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // パーツを追加時の処理
  onAddPart: ({ part, properties }: AddPartProps) => void;
}) {
  const router = useRouter();
  // 左サイドバーが最小化されているか
  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);

  /**
   * パーツを作成する
   * @param partType - パーツのタイプ
   */
  const handleCreatePart = (
    partType: 'card' | 'token' | 'hand' | 'deck' | 'area'
  ) => {
    // パーツの初期設定情報
    const partConfig = Object.values(PART_DEFAULT_CONFIG).find(
      (part) => part.type === partType
    );
    // パーツの初期設定情報が存在しない場合
    if (!partConfig) {
      return;
    }

    // 新しいパーツ
    const newPart: Omit<
      Part,
      'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
    > = {
      type: partType,
      parentId: undefined,
      position: { x: PART_DEFAULT_POSITION.X, y: PART_DEFAULT_POSITION.Y },
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
        newPart.ownerId = players[0].id;
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
      image: '',
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

  return (
    <>
      {!isLeftSidebarMinimized ? (
        <div className="fixed left-2 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md overflow-auto w-[240px] max-h-[90vh]">
          <div className="flex h-[48px] items-center justify-between p-4">
            <button
              onClick={() => router.push(`/prototypes/groups/${groupId}`)}
              className="p-2 hover:bg-wood-lightest/20 rounded-full transition-colors flex-shrink-0"
              title="戻る"
            >
              <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
            </button>
            <div className="flex items-center gap-1 flex-grow ml-2 min-w-0">
              <h2
                className="text-xs font-medium truncate text-wood-darkest"
                title={prototypeName}
              >
                {prototypeName}
              </h2>
            </div>
            <button
              onClick={() => setIsLeftSidebarMinimized(true)}
              aria-label="サイドバーを最小化"
              className="p-2 rounded-full transition-transform hover:scale-110"
            >
              <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
            </button>
          </div>
          <div className="border-b border-wood-light/30" />
          <div className="flex flex-col gap-2 p-4 overflow-y-auto">
            <span className="mb-2 text-xs font-medium uppercase tracking-wide text-wood-dark/70">
              パーツ
            </span>
            {Object.values(PART_DEFAULT_CONFIG).map((part) => {
              const icon =
                part.type === 'card' ? (
                  <GiCard10Clubs className="h-4 w-4 text-wood-dark" />
                ) : part.type === 'token' ? (
                  <Gi3dMeeple className="h-4 w-4 text-wood-dark" />
                ) : part.type === 'hand' ? (
                  <GiPokerHand className="h-4 w-4 text-wood-dark" />
                ) : part.type === 'deck' ? (
                  <GiStoneBlock className="h-4 w-4 text-wood-dark" />
                ) : part.type === 'area' ? (
                  <BiArea className="h-4 w-4 text-wood-dark" />
                ) : null;

              return (
                <TextIconButton
                  key={part.type}
                  text={part.name}
                  isSelected={false}
                  icon={icon}
                  onClick={() => handleCreatePart(part.type)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <div className="fixed left-2 top-4 flex h-[48px] items-center justify-between rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary p-4 shadow-md w-[240px]">
          <button
            onClick={() => router.push(`/prototypes/groups/${groupId}`)}
            className="p-2 hover:bg-wood-lightest/20 rounded-full transition-colors flex-shrink-0"
            title="戻る"
          >
            <IoArrowBack className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
          </button>
          <div className="flex items-center gap-1 flex-grow ml-2 min-w-0">
            <h2
              className="text-xs font-medium truncate text-wood-darkest"
              title={prototypeName}
            >
              {prototypeName}
            </h2>
          </div>
          <button
            onClick={() => setIsLeftSidebarMinimized(false)}
            aria-label="サイドバーを展開"
            className="p-2 rounded-full transition-transform hover:scale-110"
          >
            <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
          </button>
        </div>
      )}
    </>
  );
}
