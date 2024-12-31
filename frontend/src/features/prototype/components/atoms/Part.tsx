import * as ContextMenu from '@radix-ui/react-context-menu';
import React, { forwardRef } from 'react';
import { TbCards } from 'react-icons/tb';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';
import { Socket } from 'socket.io-client';

import { PART_TYPE } from '@/features/prototype/const';
import { useCard } from '@/features/prototype/hooks/useCard';
import { MoveOrderType, PartHandle } from '@/features/prototype/type';
import { Part as PartType } from '@/types/models';

interface PartProps {
  part: PartType;
  onMouseDown: (e: React.MouseEvent, partId: number) => void;
  socket: Socket;
  onMoveOrder: ({ partId, type }: { partId: number; type: string }) => void;
}

const Part = forwardRef<PartHandle, PartProps>(
  ({ part, onMouseDown, socket, onMoveOrder }, ref) => {
    const { isFlipped, isReversing, setIsReversing, reverseCard } = useCard(
      part,
      ref,
      socket
    );

    const isCard = part.type === PART_TYPE.CARD;
    const isDeck = part.type === PART_TYPE.DECK;

    // TODO: オーナー設定のあるパーツは、オーナーのみが見れるようにする

    return (
      <svg
        key={part.id}
        onDoubleClick={() => {
          if (isCard) {
            reverseCard(!isFlipped, true);
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
            rotateY(${isFlipped ? 180 : 0}deg)
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
        {!isFlipped && (
          <text
            x={(part.position.x as number) + 10}
            y={(part.position.y as number) + 20}
            style={{
              fill: 'black',
              fontSize: '14px',
              userSelect: 'none',
            }}
          >
            {part.name}
          </text>
        )}
        {/* カードの反転可能アイコン */}
        {(isCard || isDeck) && (
          <foreignObject
            x={(part.position.x as number) + part.width - 30}
            y={(part.position.y as number) + part.height - 30}
            width={20}
            height={20}
          >
            <>
              {isCard &&
                // カードの場合
                ('isReversible' in part && part.isReversible ? (
                  <VscSync className="text-gray-600" />
                ) : (
                  <VscSyncIgnored className="text-gray-600" />
                ))}
              {isDeck &&
                // 山札の場合
                ('canReverseCardOnDeck' in part && part.canReverseCardOnDeck ? (
                  <TbCards className="text-gray-600" />
                ) : (
                  <></>
                ))}
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
