import * as ContextMenu from '@radix-ui/react-context-menu';
import React, { forwardRef, useMemo } from 'react';
import { FaRegEyeSlash } from 'react-icons/fa';
import { TbCards } from 'react-icons/tb';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';
import { Socket } from 'socket.io-client';

import { PART_TYPE, PROTOTYPE_TYPE } from '@/features/prototype/const';
import { useCard } from '@/features/prototype/hooks/useCard';
import { useDeck } from '@/features/prototype/hooks/useDeck';
import { MoveOrderType, PartHandle } from '@/features/prototype/type';
import { Part as PartType, Player } from '@/types/models';

interface PartProps {
  part: PartType;
  players: Player[];
  isOtherPlayerCard: boolean;
  prototypeType: typeof PROTOTYPE_TYPE.EDIT | typeof PROTOTYPE_TYPE.PREVIEW;
  onMouseDown: (e: React.MouseEvent, partId: number) => void;
  socket: Socket;
  onMoveOrder: ({ partId, type }: { partId: number; type: string }) => void;
}

const Part = forwardRef<PartHandle, PartProps>(
  (
    {
      part,
      players,
      isOtherPlayerCard,
      prototypeType,
      onMouseDown,
      socket,
      onMoveOrder,
    },
    ref
  ) => {
    const { isFlipped, isReversing, setIsReversing, reverseCard } = useCard(
      part,
      ref,
      socket
    );
    const { shuffleDeck } = useDeck(part, socket);

    const isCard = part.type === PART_TYPE.CARD;
    const isDeck = part.type === PART_TYPE.DECK;
    const isHand = part.type === PART_TYPE.HAND;

    // 裏向き表示にする必要があるか
    const isFlippedNeeded = useMemo(
      () => prototypeType === PROTOTYPE_TYPE.PREVIEW && isOtherPlayerCard,
      [prototypeType, isOtherPlayerCard]
    );

    return (
      <svg
        key={part.id}
        onDoubleClick={() => {
          if (isCard) {
            if (isFlippedNeeded) return;

            reverseCard(!isFlipped, true);
          }
          if (isDeck) {
            shuffleDeck();
          }
        }}
        onMouseDown={(e) => onMouseDown(e, part.id)}
        className="cursor-move border group relative"
        style={{
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ツールチップ */}
        <title>{part.description}</title>

        {/* 画像設定その1 */}
        {/* <defs>
          <pattern
            id="bgPattern"
            patternUnits="userSpaceOnUse"
            width="150"
            height="150"
          >
            <image
              href={'/boardgame_icon.png'}
              x="0"
              y="0"
              width="150"
              height="150"
            />
          </pattern>
        </defs> */}
        {/* パーツの枠 */}
        <rect
          id={part.id.toString()}
          onTransitionEnd={() => setIsReversing(false)}
          style={{
            stroke: 'gray',
            fill: part.color || 'white',
            // fill: `url(#bgPattern)`, // 画像設定その2
            transform: `
            translate(${part.position.x}px, ${part.position.y}px)
            translate(${part.width / 2}px, ${part.height / 2}px)
            rotateY(${!isFlippedNeeded && isFlipped ? 180 : 0}deg)
            translate(${-part.width / 2}px, ${-part.height / 2}px)
          `,
            transition: isReversing ? 'transform 0.6s' : 'none',
            transformStyle: 'preserve-3d',
          }}
          width={part.width}
          height={part.height}
          rx={10}
        />
        {/* タイトル */}
        {!isFlippedNeeded && !isFlipped && (
          <text
            x={(part.position.x as number) + 10}
            y={(part.position.y as number) + 20}
            style={{
              fill: part.textColor || 'black',
              fontSize: '14px',
              userSelect: 'none',
            }}
          >
            {part.name}
          </text>
        )}
        {/* 割り当てられているユーザー */}
        {isHand && (
          <text
            x={(part.position.x as number) + 10}
            y={(part.position.y as number) + part.height - 20}
            style={{
              fill: part.textColor || 'black',
              fontSize: '12px',
              userSelect: 'none',
            }}
          >
            {players.find((player) => player.id === part.ownerId)?.playerName}
          </text>
        )}
        {/* シャッフルアイコン */}
        {isDeck && (
          <foreignObject
            x={(part.position.x as number) + part.width - 30}
            y={(part.position.y as number) + part.height - 50}
            width={20}
            height={20}
          >
            <TbCards className="text-gray-600" />
          </foreignObject>
        )}
        {/* カードの反転可能アイコン */}
        {(isCard || isDeck || isHand) && (
          <foreignObject
            x={(part.position.x as number) + part.width - 30}
            y={(part.position.y as number) + part.height - 30}
            width={20}
            height={20}
          >
            <>
              {isCard &&
                // カードの場合
                (part.isReversible ? (
                  <VscSync className="text-gray-600" />
                ) : (
                  <VscSyncIgnored className="text-gray-600" />
                ))}
              {isDeck &&
                // 山札の場合
                (part.canReverseCardOnDeck ? (
                  <VscSync className="text-gray-600" />
                ) : (
                  <VscSyncIgnored className="text-gray-600" />
                ))}
              {isHand && <FaRegEyeSlash className="text-gray-600" />}
            </>
          </foreignObject>
        )}
        {/* 右クリックで表示するコンテキストメニュー */}
        <foreignObject
          x={part.position.x as number}
          y={part.position.y as number}
          width={part.width}
          height={part.height}
        >
          <ContextMenu.Root>
            <ContextMenu.Trigger className="w-full h-full" asChild>
              <div className="w-full h-full" />
            </ContextMenu.Trigger>
            <ContextMenu.Portal>
              <ContextMenu.Content className="min-w-[80px] bg-[#1f1f1f] rounded-md p-1 shadow-lg border">
                <ContextMenu.Item
                  className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
                  onClick={() =>
                    onMoveOrder({ partId: part.id, type: MoveOrderType.BACK })
                  }
                >
                  背面へ移動
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
                  onClick={() =>
                    onMoveOrder({
                      partId: part.id,
                      type: MoveOrderType.BACKMOST,
                    })
                  }
                >
                  最背面へ移動
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
                  onClick={() =>
                    onMoveOrder({
                      partId: part.id,
                      type: MoveOrderType.FRONT,
                    })
                  }
                >
                  前面へ移動
                </ContextMenu.Item>
                <ContextMenu.Item
                  className="text-[10px] px-2 py-1.5 outline-none cursor-pointer hover:bg-gray-600 rounded text-white"
                  onClick={() =>
                    onMoveOrder({
                      partId: part.id,
                      type: MoveOrderType.FRONTMOST,
                    })
                  }
                >
                  最前面へ移動
                </ContextMenu.Item>
              </ContextMenu.Content>
            </ContextMenu.Portal>
          </ContextMenu.Root>
        </foreignObject>
      </svg>
    );
  }
);

Part.displayName = 'Part';

export default Part;
