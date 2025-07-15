/**
 * @page Playモード専用のサイドバー
 */

'use client';

import React, { useState, useMemo } from 'react';
import { GiPokerHand } from 'react-icons/gi';

import { Part } from '@/api/types';
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

  // 外部から選択されたパーツが手札の場合、サイドバーの選択状態を更新
  React.useEffect(() => {
    if (selectedPartId !== undefined) {
      const selectedPart = parts.find((part) => part.id === selectedPartId);
      if (selectedPart && selectedPart.type === 'hand') {
        setSelectedHandId(selectedPartId);
      } else {
        setSelectedHandId(null);
      }
    }
  }, [selectedPartId, parts]);

  // 手札のみをフィルタリング
  const hands = useMemo(() => {
    return parts.filter((part) => part.type === 'hand');
  }, [parts]);

  // カードのみをフィルタリング
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

  return (
    <div className="fixed top-20 left-4 flex w-[240px] flex-col rounded-lg shadow-lg border border-wood-lightest/40 bg-gradient-to-r from-content to-content-secondary max-h-[calc(100vh-32px)] overflow-y-auto">
      <div className="border-b border-wood-lightest/60 rounded-t-lg bg-gradient-to-r from-wood-light/30 to-wood-light/20 py-2 px-4">
        <div className="flex items-center">
          <GiPokerHand className="h-4 w-4 text-wood-dark mr-2" />
          <span className="text-[12px] font-medium text-wood-darkest">
            Play モード設定
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <span className="mb-2 text-[11px] font-medium">手札選択</span>

        <div className="space-y-2">
          {hands.map((hand, index) => {
            const isSelected = selectedHandId === hand.id;
            const isOwnHand = hand.ownerId === user?.id;

            return (
              <div
                key={hand.id}
                className={`p-2 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedHandId(hand.id);
                  onSelectPart(hand.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">手札 #{index + 1}</span>
                  {isOwnHand && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                      自分の手札
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedHand && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <span className="mb-2 text-[11px] font-medium">手札設定</span>
            <div className="space-y-3">
              <div className="text-xs text-gray-600">
                <div>
                  手札 #{hands.findIndex((h) => h.id === selectedHand.id) + 1}
                </div>
                <div>
                  所有者:{' '}
                  {selectedHand.ownerId
                    ? userMap.get(selectedHand.ownerId) ||
                      `ID: ${selectedHand.ownerId}`
                    : '未設定'}
                </div>
                <div>上のカード: {selectedHandCardCount}枚</div>
              </div>

              <div className="flex items-center gap-2">
                <button
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
                  className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  自分を設定
                </button>
                <button
                  onClick={() => {
                    dispatch({
                      type: 'UPDATE_PART',
                      payload: {
                        partId: selectedHand.id,
                        updatePart: { ownerId: null },
                      },
                    });
                  }}
                  className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
