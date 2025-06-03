/**
 * @page サイドバーコンポーネント（プレビューモードとパーツ作成モードを兼ねている）
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BiArea } from 'react-icons/bi';
import {
  Gi3dMeeple,
  GiCard10Clubs,
  GiPokerHand,
  GiStoneBlock,
} from 'react-icons/gi';
import { IoArrowBack, IoMenu } from 'react-icons/io5';

import { usePrototypes } from '@/api/hooks/usePrototypes';
import { Part, PartProperty, Player, User } from '@/api/types';
import Dropdown from '@/components/atoms/Dropdown';
import TextIconButton from '@/components/atoms/TextIconButton';
import { PART_DEFAULT_CONFIG } from '@/features/prototype/const';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { AddPartProps } from '@/features/prototype/type';

export default function LeftSidebar({
  prototypeName,
  prototypeVersionNumber,
  prototypeType,
  isMasterPreview,
  groupId,
  players,
  onAddPart,
}: {
  // プロトタイプ名
  prototypeName: string;
  // プロトタイプバージョン番号（プレビューモード時のみ使用）
  prototypeVersionNumber?: string;
  // プロトタイプタイプ（'preview'または'edit'）
  prototypeType: 'PREVIEW' | 'EDIT';
  // マスタープレビューかどうか（プレビューモード時のみ使用）
  isMasterPreview: boolean;
  // グループID
  groupId: string;
  // プレイヤー
  players: Player[];
  // パーツを追加時の処理（編集モード時のみ使用）
  onAddPart?: ({ part, properties }: AddPartProps) => void;
}) {
  const { dispatch } = usePartReducer();
  const { getAccessUsersByGroup } = usePrototypes();
  const router = useRouter();

  // 左サイドバーが最小化されているか
  const [isLeftSidebarMinimized, setIsLeftSidebarMinimized] = useState(false);
  // グループにアクセス可能なユーザー（プレビューモード時のみ使用）
  const [accessibleUsers, setAccessibleUsers] = useState<User[]>([]);

  // 左サイドバーのヘッダーコンポーネント
  const LeftSidebarHeader = ({
    prototypeName,
    prototypeVersionNumber,
    prototypeType,
    isMasterPreview,
    groupId,
    isMinimized,
    onToggle,
  }: {
    prototypeName: string;
    prototypeVersionNumber?: string;
    prototypeType: 'PREVIEW' | 'EDIT';
    isMasterPreview: boolean;
    groupId: string;
    isMinimized: boolean;
    onToggle: () => void;
  }) => {
    return (
      <div className="flex h-[48px] items-center justify-between px-2 py-4">
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
          {prototypeVersionNumber && prototypeType === 'PREVIEW' && (
            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded-md min-w-1 border border-blue-600 flex-shrink-0">
              {isMasterPreview
                ? 'プレビュー'
                : `プレイルーム${prototypeVersionNumber.replace('.0.0', '')}`}
            </span>
          )}
        </div>
        {(prototypeType === 'EDIT' || !isMasterPreview) && (
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

  // グループにアクセス可能なユーザーを取得（プレビューモード時のみ）
  useEffect(() => {
    if (prototypeType === 'PREVIEW' && !isMasterPreview) {
      getAccessUsersByGroup(groupId).then((response) => {
        setAccessibleUsers(response);
      });
    }
  }, [groupId, getAccessUsersByGroup, prototypeType, isMasterPreview]);

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
      'id' | 'prototypeVersionId' | 'order' | 'createdAt' | 'updatedAt'
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

  const toggleSidebar = () => {
    setIsLeftSidebarMinimized(!isLeftSidebarMinimized);
  };

  // プレビューモードのコンテンツをレンダリング
  const renderPreviewContent = () => {
    if (isMasterPreview) return null;

    return (
      <>
        <div className="border-b border-wood-light/30" />
        <div className="flex flex-col gap-2 p-4">
          <div className="flex flex-col items-start justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wide text-wood-dark/70">
              プレイヤー割り当て
            </span>
            <details className="text-xs">
              <summary className="cursor-pointer text-wood-dark/60 hover:text-wood-dark">
                詳細
              </summary>
              <div className="p-2 mt-1 bg-wood-lightest/20 rounded-md text-wood-dark/80">
                手札のプレイヤー番号とユーザーを紐づけます。
              </div>
            </details>
          </div>
          <div className="flex flex-col gap-1">
            {players.map((player) => (
              <div key={player.id}>
                <p className="text-[9px] font-medium text-wood-dark mb-1">
                  {player.playerName}
                </p>
                <div className="flex w-full mb-2">
                  <Dropdown
                    value={
                      accessibleUsers.find((user) => user.id === player.userId)
                        ?.username || 'プレイヤーを選択'
                    }
                    onChange={(value: string) => {
                      const userId = accessibleUsers.find(
                        (user) => user.username === value
                      )?.id;
                      dispatch({
                        type: 'UPDATE_PLAYER_USER',
                        payload: {
                          playerId: player.id,
                          userId: userId ?? null,
                        },
                      });
                    }}
                    options={[
                      'プレイヤーを選択',
                      ...accessibleUsers.map((user) => user.username),
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
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
      className={`fixed left-4 top-4 flex flex-col rounded-xl border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary shadow-md w-[18rem] ${
        !isLeftSidebarMinimized ? 'overflow-auto max-h-[90vh]' : 'h-[48px]'
      }`}
    >
      <LeftSidebarHeader
        prototypeName={prototypeName}
        prototypeVersionNumber={prototypeVersionNumber}
        prototypeType={prototypeType}
        isMasterPreview={isMasterPreview}
        groupId={groupId}
        isMinimized={isLeftSidebarMinimized}
        onToggle={toggleSidebar}
      />

      {!isLeftSidebarMinimized && (
        <>
          {prototypeType === 'PREVIEW' && renderPreviewContent()}
          {prototypeType === 'EDIT' && renderEditContent()}
        </>
      )}
    </div>
  );
}
