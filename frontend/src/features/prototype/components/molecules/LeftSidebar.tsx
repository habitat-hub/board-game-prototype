/**
 * @page サイドバーコンポーネント（プレビューモードとパーツ作成モードを兼ねている）
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

import { Part, PartProperty } from '@/api/types';
import TextIconButton from '@/components/atoms/TextIconButton';
import { PART_DEFAULT_CONFIG } from '@/features/prototype/const';
import { AddPartProps } from '@/features/prototype/type';

export default function LeftSidebar({
  prototypeName,
  prototypeVersionNumber,
  prototypeType,
  isVersionPrototype,
  groupId,
  onAddPart,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号（プレビューモード時のみ使用）
  prototypeVersionNumber?: number;
  // プロトタイプタイプ（'preview'または'edit'）
  prototypeType: 'MASTER' | 'VERSION' | 'INSTANCE';
  // マスタープレビューかどうか（プレビューモード時のみ使用）
  isVersionPrototype: boolean;
  // グループID
  groupId: string;
  // パーツを追加時の処理（編集モード時のみ使用）
  onAddPart?: ({ part, properties }: AddPartProps) => void;
}) {
  const router = useRouter();

  // 左サイドバーが最小化されているか
  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);

  // 左サイドバーのヘッダーコンポーネント
  const LeftSidebarHeader = ({
    prototypeName,
    prototypeVersionNumber,
    prototypeType,
    isVersionPrototype,
    groupId,
    isMinimized,
    onToggle,
  }: {
    prototypeName: string;
    prototypeVersionNumber?: number;
    prototypeType: 'MASTER' | 'VERSION' | 'INSTANCE';
    isVersionPrototype: boolean;
    groupId: string;
    isMinimized: boolean;
    onToggle: () => void;
  }) => {
    return (
      <div className="flex h-[48px] items-center justify-between px-2 py-4">
        <button
          onClick={() => router.push(`/groups/${groupId}`)}
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
          {prototypeVersionNumber && prototypeType === 'VERSION' && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-md min-w-1 border border-blue-600 flex-shrink-0">
              {isVersionPrototype
                ? 'プレビュー'
                : `プレイルーム${prototypeVersionNumber}`}
            </span>
          )}
        </div>
        {(prototypeType === 'MASTER' || !isVersionPrototype) && (
          <button
            onClick={onToggle}
            aria-label={isMinimized ? 'サイドバーを展開' : 'サイドバーを最小化'}
            className="p-2 rounded-full transition-transform hover:scale-110"
          >
            <IoMenu className="h-5 w-5 text-wood-dark hover:text-header transition-colors" />
          </button>
        )}
      </div>
    );
  };

  /**
   * パーツを作成する（編集モード時のみ）
   * @param partType - パーツのタイプ
   */
  const handleCreatePart = (
    partType: 'card' | 'token' | 'hand' | 'deck' | 'area'
  ) => {
    if (!onAddPart) return;

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

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  // プレビューモードのコンテンツをレンダリング
  const renderPreviewContent = () => {
    if (isVersionPrototype) return null;
    return null; // 現在プレビューモードでは何も表示しない
  };

  // 編集モードのコンテンツをレンダリング
  const renderEditContent = () => {
    return (
      <>
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
      </>
    );
  };

  return (
    <div
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[16rem] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <LeftSidebarHeader
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        prototypeType={prototypeType}
        isVersionPrototype={isVersionPrototype}
        groupId={groupId}
        isMinimized={isLeftSidebarMinimized}
        onToggle={toggleSidebar}
      />

      {!isLeftSidebarMinimized && (
        <>
          {prototypeType === 'VERSION' && renderPreviewContent()}
          {prototypeType === 'MASTER' && renderEditContent()}
        </>
      )}
    </div>
  );
}
