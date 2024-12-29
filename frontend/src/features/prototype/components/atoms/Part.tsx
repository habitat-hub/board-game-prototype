import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';
import { Socket } from 'socket.io-client';
import { TbCards } from 'react-icons/tb';
import * as ContextMenu from '@radix-ui/react-context-menu';

import { MoveOrderType } from '@/features/prototype/type';
import { PART_TYPE } from '@/features/prototype/const';
import { Part as PartType } from '@/types/models';

// 外部から呼び出せる関数のインターフェース
export interface PartHandle {
  flip: (isNextFlipped: boolean) => void;
}

interface PartProps {
  part: PartType;
  onMouseDown: (e: React.MouseEvent, partId: number) => void;
  socket: Socket;
  onMoveOrder: ({ partId, type }: { partId: number; type: string }) => void;
}

const Part = forwardRef<PartHandle, PartProps>(
  ({ part, onMouseDown, socket, onMoveOrder }, ref) => {
    // カードが反転しているかどうか
    const [isFlipped, setIsFlipped] = useState(
      'isFlipped' in part ? part.isFlipped : false
    );
    // transition設定をしているか
    const [needsTransition, setNeedsTransition] = useState(false);

    /**
     * カードを反転させる
     * @param isNextFlipped - 次に反転させるかどうか
     */
    const flip = (isNextFlipped: boolean) => {
      // カードでない場合
      if (part.type !== PART_TYPE.CARD) return;
      // 反転不可の場合
      if (!('isReversible' in part) || !part.isReversible) return;
      // 反転が不要な場合
      if (isFlipped === isNextFlipped) return;

      // 反転させる
      setNeedsTransition(true);
      setIsFlipped(isNextFlipped);
    };

    // 外部から呼び出せる関数を定義
    useImperativeHandle(ref, () => ({
      flip: (isNextFlipped: boolean) => {
        flip(isNextFlipped);
      },
    }));

    // TODO: オーナー設定のあるパーツは、オーナーのみが見れるようにする

    return (
      <svg
        key={part.id}
        onDoubleClick={() => {
          if (part.type === PART_TYPE.CARD) {
            flip(!isFlipped);
            socket.emit('FLIP_CARD', {
              prototypeVersionId: part.prototypeVersionId,
              cardId: part.id,
              isNextFlipped: !isFlipped,
            });
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
        <rect
          id={part.id.toString()}
          onTransitionEnd={() => setNeedsTransition(false)}
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
            transition: needsTransition ? 'transform 0.6s' : 'none',
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
        {/* 反転可能アイコン */}
        {(part.type === PART_TYPE.CARD || part.type === PART_TYPE.DECK) && (
          <foreignObject
            x={(part.position.x as number) + part.width - 30}
            y={(part.position.y as number) + part.height - 30}
            width={20}
            height={20}
          >
            <>
              {part.type === PART_TYPE.CARD &&
                // カードの場合
                ('isReversible' in part && part.isReversible ? (
                  <VscSync className="text-gray-600" />
                ) : (
                  <VscSyncIgnored className="text-gray-600" />
                ))}
              {part.type === PART_TYPE.DECK &&
                // 山札の場合
                ('canReverseCardOnDeck' in part && part.canReverseCardOnDeck ? (
                  <TbCards className="text-gray-600" />
                ) : (
                  <></>
                ))}
            </>
          </foreignObject>
        )}

        {/* コンテキストメニュー */}
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
