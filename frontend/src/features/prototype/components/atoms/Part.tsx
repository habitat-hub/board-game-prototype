import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';
import { Socket } from 'socket.io-client';

import { AllPart } from '@/features/prototype/type';
import { PART_TYPE } from '@/features/prototype/const';

// 外部から呼び出せる関数のインターフェース
export interface PartHandle {
  flip: (isNextFlipped: boolean) => void;
}

interface PartProps {
  part: AllPart;
  onMouseDown: (e: React.MouseEvent, partId: number) => void;
  socket: Socket;
}

const Part = forwardRef<PartHandle, PartProps>(
  ({ part, onMouseDown, socket }, ref) => {
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
            x={part.position.x + 10}
            y={part.position.y + 20}
            style={{
              fill: 'black',
              fontSize: '14px',
              userSelect: 'none',
            }}
          >
            {part.name}
          </text>
        )}
        {/* 反転可能アイコン��カードの場合のみ） */}
        {'isReversible' in part && part.type === PART_TYPE.CARD && (
          <foreignObject
            x={part.position.x + part.width - 30}
            y={part.position.y + part.height - 30}
            width={20}
            height={20}
          >
            {part.isReversible ? (
              <VscSync className="text-gray-600" />
            ) : (
              <VscSyncIgnored className="text-gray-600" />
            )}
          </foreignObject>
        )}
      </svg>
    );
  }
);

Part.displayName = 'Part';

export default Part;
