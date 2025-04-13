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
import { IoArrowBack } from 'react-icons/io5';
import { PiSidebarSimpleThin } from 'react-icons/pi';

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
  prototypeVersionNumber,
  groupId,
  players,
  onAddPart,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号
  prototypeVersionNumber?: string;
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

    // カードパーツか
    const isCard = partType === 'card';
    // カードパーツの場合
    if (isCard) {
      newPart.isReversible =
        'isReversible' in partConfig && partConfig.isReversible;
      newPart.isFlipped = false;
    }
    // 手札パーツの場合
    if (partType === 'hand') {
      newPart.ownerId = players[0].id;
    }

    // パーツの共通プロパティ
    const commonProperties = {
      name: partConfig.name,
      description: partConfig.description,
      color: partConfig.color,
      textColor: partConfig.textColor,
      image: '',
    };
    // パーツのプロパティ
    const newPartProperties: Omit<
      PartProperty,
      'id' | 'partId' | 'createdAt' | 'updatedAt'
    >[] = isCard
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
        <div className="fixed left-0 flex h-full w-[240px] flex-col border-r border-gray-200 bg-white">
          <div className="p-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => router.push(`/prototypes/groups/${groupId}`)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                title="戻る"
              >
                <IoArrowBack className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 flex-grow ml-2 min-w-0">
                <h2
                  className="text-sm font-medium truncate"
                  title={prototypeName}
                >
                  {prototypeName}
                </h2>
                {prototypeVersionNumber && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-md min-w-1 border border-blue-600 flex-shrink-0">
                    v{prototypeVersionNumber}
                  </span>
                )}
              </div>
              <PiSidebarSimpleThin
                onClick={() => setIsLeftSidebarMinimized(true)}
                className="h-5 w-5 cursor-pointer flex-shrink-0"
              />
            </div>
          </div>
          <div className="border-b border-gray-200" />
          <div className="flex flex-col gap-1 p-4">
            <span className="mb-2 text-xs font-medium">パーツ</span>
            {Object.values(PART_DEFAULT_CONFIG).map((part) => {
              const icon =
                part.type === 'card' ? (
                  <GiCard10Clubs className="h-4 w-4 text-gray-500" />
                ) : part.type === 'token' ? (
                  <Gi3dMeeple className="h-4 w-4 text-gray-500" />
                ) : part.type === 'hand' ? (
                  <GiPokerHand className="h-4 w-4 text-gray-500" />
                ) : part.type === 'deck' ? (
                  <GiStoneBlock className="h-4 w-4 text-gray-500" />
                ) : part.type === 'area' ? (
                  <BiArea className="h-4 w-4 text-gray-500" />
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
        <div className="fixed left-2 top-14 flex h-[48px] w-[250px] items-center justify-between rounded-xl border bg-white p-4">
          <button
            onClick={() => router.push(`/prototypes/groups/${groupId}`)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            title="戻る"
          >
            <IoArrowBack className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 flex-grow ml-2 min-w-0">
            <h2 className="text-sm font-medium truncate" title={prototypeName}>
              {prototypeName}
            </h2>
            {prototypeVersionNumber && (
              <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-md min-w-1 border border-blue-600 flex-shrink-0">
                v{prototypeVersionNumber}
              </span>
            )}
          </div>
          <PiSidebarSimpleThin
            onClick={() => setIsLeftSidebarMinimized(false)}
            className="h-5 w-5 cursor-pointer flex-shrink-0"
          />
        </div>
      )}
    </>
  );
}
