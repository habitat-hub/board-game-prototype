/**
 * @page プレイルーム専用のサイドバー
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { Part } from '@/api/types';
import Button from '@/components/atoms/Button';
import PartTypeIcon from '@/features/prototype/components/atoms/PartTypeIcon';
import { useSelectedParts } from '@/features/prototype/contexts/SelectedPartsContext';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { useUser } from '@/hooks/useUser';

interface PlaySidebarProps {
  parts: Part[];
  onSelectPart: (partId: number) => void;
  selectedPartId?: number | null;
  userRoles: Array<{
    userId: string;
    user: { id: string; username: string };
    roles: Array<{ name: string; description: string }>;
  }>;
}

export default function PlaySidebar({
  parts,
  onSelectPart,
  selectedPartId,
  userRoles,
}: PlaySidebarProps) {
  const { dispatch } = usePartReducer();
  const { user } = useUser();
  const { clearSelection } = useSelectedParts();

  // 選択中の手札ID
  const [selectedHandId, setSelectedHandId] = useState<number | null>(null);

  // userRolesからユーザーマップを作成
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    userRoles.forEach((userRole) => {
      if (userRole.user.id && userRole.user.username) {
        map.set(userRole.user.id, userRole.user.username);
      }
    });
    return map;
  }, [userRoles]);

  // 手札
  const hands = useMemo(() => {
    return parts
      .filter((part) => part.type === 'hand')
      .map((hand) => {
        return {
          ...hand,
          ownerName: hand.ownerId ? userMap.get(hand.ownerId) : null,
        };
      });
  }, [parts, userMap]);

  // カード
  const cards = useMemo(() => {
    return parts.filter((part) => part.type === 'card');
  }, [parts]);

  // 手札の上のカードを判定する関数
  const isCardOnHand = (card: Part, hand: Part): boolean => {
    const cardCenterX = card.position.x + card.width / 2;
    const cardCenterY = card.position.y + card.height / 2;

    return (
      hand.position.x <= cardCenterX &&
      cardCenterX <= hand.position.x + hand.width &&
      hand.position.y <= cardCenterY &&
      cardCenterY <= hand.position.y + hand.height
    );
  };

  // 選択中の手札
  const selectedHand = useMemo(() => {
    return hands.find((hand) => hand.id === selectedHandId);
  }, [hands, selectedHandId]);

  // 選択中の手札の上のカード数
  const selectedHandCardCount = useMemo(() => {
    if (!selectedHand) return 0;
    return cards.filter((card) => isCardOnHand(card, selectedHand)).length;
  }, [selectedHand, cards]);

  // 外部から選択されたパーツが手札の場合、サイドバーの選択状態を更新
  useEffect(() => {
    if (!selectedPartId) return;

    const selectedPart = parts.find((part) => part.id === selectedPartId);
    setSelectedHandId(selectedPart?.type === 'hand' ? selectedPartId : null);
  }, [selectedPartId, parts]);

  return (
    <div className="fixed top-20 left-4 flex w-[18rem] flex-col rounded-xl shadow-lg border border-kibako-tertiary/40 bg-gradient-to-r from-kibako-white to-kibako-tertiary max-h-[calc(100vh-32px)] overflow-y-auto">
      {/* ヘッダー */}
      <div className="border-b border-kibako-tertiary/60 rounded-t-lg bg-gradient-to-r from-kibako-secondary/30 to-kibako-secondary/20 py-2 px-4">
        <div className="flex items-center">
          <PartTypeIcon type="hand" className="h-4 w-4 text-kibako-primary mr-2" ariaHidden />
          <span className="text-[12px] font-medium text-kibako-primary">
            プレイルーム設定
          </span>
        </div>
      </div>

      {/* コンテンツ  */}
      <div className="flex flex-col gap-2 p-4">
        <span className="mb-2 text-xs font-bold">手札選択</span>

        {/* 手札一覧 */}
        <div className="space-y-2">
          {hands.map((hand, index) => {
            const isOwnHand = hand.ownerId === user?.id;

            return (
              <div
                key={hand.id}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  selectedHandId === hand.id
                    ? 'border-kibako-info bg-kibako-info/10'
                    : 'border-kibako-secondary/20 hover:border-kibako-secondary/30'
                }`}
                onClick={() => {
                  clearSelection();
                  setSelectedHandId(hand.id);
                  onSelectPart(hand.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">手札 #{index + 1}</span>
                  {hand.ownerName && (
                    <span
                      className={`text-xs ${
                        isOwnHand
                          ? 'bg-kibako-success/10 text-kibako-success/80'
                          : 'bg-kibako-info/10 text-kibako-info/80'
                      } px-1 rounded`}
                    >
                      {hand.ownerName}の手札
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 手札設定情報 */}
        {selectedHand && (
          <div className="border-t border-kibako-secondary/20 pt-4 mt-4">
            <span className="mb-2 text-xs font-bold">手札設定</span>
            <div className="space-y-3">
              <div className="text-xs text-kibako-primary/70">
                <div>所有者: {selectedHand.ownerName || '未設定'}</div>
                <div>上のカード: {selectedHandCardCount}枚</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="!px-3 !py-1 !text-xs"
                  onClick={() => {
                    if (!user?.id) return;

                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedHand.id,
                        updatePart: { ownerId: user.id },
                      },
                    });
                  }}
                >
                  自分を設定
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="!px-3 !py-1 !text-xs"
                  onClick={() => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedHand.id,
                        updatePart: { ownerId: null },
                      },
                    });
                  }}
                >
                  クリア
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
