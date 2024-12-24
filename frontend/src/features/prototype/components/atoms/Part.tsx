import React, { useCallback, useState } from 'react';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';

import { AllPart } from '@/features/prototype/type';
import { PART_TYPE } from '@/features/prototype/const';

interface PartProps {
  part: AllPart;
  onMouseDown: (e: React.MouseEvent, partId: number) => void;
}

const Part: React.FC<PartProps> = ({ part, onMouseDown }) => {
  // カードが反転しているかどうか
  const [isFlipped, setIsFlipped] = useState(false);
  // transition設定をしているか
  const [needsTransition, setNeedsTransition] = useState(false);

  const onDoubleClick = useCallback(() => {
    if (part.type === PART_TYPE.CARD) {
      setNeedsTransition(true);
      setIsFlipped(!isFlipped);
    }
  }, [isFlipped, part.type]);

  return (
    <svg
      key={part.id}
      onDoubleClick={onDoubleClick}
      onMouseDown={(e) => onMouseDown(e, part.id)}
      className="cursor-move border"
      style={{
        transformOrigin: 'center center',
        transformStyle: 'preserve-3d',
      }}
    >
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
      {/* 反転可能アイコン（カードの場合のみ） */}
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
};

export default Part;
