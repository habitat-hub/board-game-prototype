'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';
import { IoArrowBack } from 'react-icons/io5';
import { PiSidebarSimpleThin } from 'react-icons/pi';

import TextIconButton from '@/components/atoms/TextIconButton';
import { PART_DEFAULT_CONFIG, PART_TYPE } from '@/features/prototype/const';
import { Part, Player } from '@/types/models';

export default function PartCreateSidebar({
  prototypeName,
  prototypeVersionNumber,
  groupId,
  players,
  onAddPart,
  mainViewRef,
}: {
  prototypeName: string;
  prototypeVersionNumber?: string;
  groupId: string;
  players: Player[];
  onAddPart: (part: Part) => void;
  mainViewRef: React.RefObject<HTMLDivElement>;
}) {
  const router = useRouter();
  const [leftIsMinimized, setLeftIsMinimized] = useState(false);

  /**
   * パーツを作成する
   * @param partId - パーツのID
   */
  const handleCreatePart = (partId: string) => {
    if (mainViewRef.current) {
      // メインビューの幅と高さを取得
      const mainViewWidth = mainViewRef.current.offsetWidth;
      const mainViewHeight = mainViewRef.current.offsetHeight;

      // 中央の座標を計算
      const centerX = mainViewWidth / 2;
      const centerY = mainViewHeight / 2;

      const partConfig = Object.values(PART_DEFAULT_CONFIG).find(
        (part) => part.id === partId
      );

      if (!partConfig) {
        return;
      }

      const newPart: Omit<
        Part,
        'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
      > = {
        type: partId,
        parentId: undefined,
        name: partConfig.name,
        description: partConfig.description,
        color: partConfig.color,
        titleColor: partConfig.titleColor,
        playerNameColor: partConfig.playerNameColor,
        position: { x: centerX, y: centerY },
        width: partConfig.width,
        height: partConfig.height,
        configurableTypeAsChild: partConfig.configurableTypeAsChild,
        originalPartId: undefined,
      };
      if (partId === PART_TYPE.CARD) {
        newPart.isReversible = (
          partConfig as typeof PART_DEFAULT_CONFIG.CARD
        ).isReversible;
        newPart.isFlipped = false;
      }
      if (partId === PART_TYPE.HAND) {
        newPart.ownerId = players[0].id;
      }

      onAddPart(newPart as Part);
    }
  };

  return (
    <>
      {!leftIsMinimized ? (
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
                onClick={() => setLeftIsMinimized(true)}
                className="h-5 w-5 cursor-pointer flex-shrink-0"
              />
            </div>
          </div>
          <div className="border-b border-gray-200" />
          <div className="flex flex-col gap-1 p-4">
            <span className="mb-2 text-xs font-medium">パーツ</span>
            {Object.values(PART_DEFAULT_CONFIG).map((part) => {
              const icon =
                part.id === 'card' ? (
                  <GiCard10Clubs className="h-4 w-4 text-gray-500" />
                ) : part.id === 'token' ? (
                  <Gi3dMeeple className="h-4 w-4 text-gray-500" />
                ) : part.id === 'hand' ? (
                  <GiPokerHand className="h-4 w-4 text-gray-500" />
                ) : part.id === 'deck' ? (
                  <GiStoneBlock className="h-4 w-4 text-gray-500" />
                ) : null;

              return (
                <TextIconButton
                  key={part.id}
                  text={part.name}
                  isSelected={false}
                  icon={icon}
                  onClick={() => handleCreatePart(part.id)}
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
            onClick={() => setLeftIsMinimized(false)}
            className="h-5 w-5 cursor-pointer flex-shrink-0"
          />
        </div>
      )}
    </>
  );
}
