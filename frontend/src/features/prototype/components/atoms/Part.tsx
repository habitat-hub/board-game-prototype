import React, { forwardRef, useMemo } from 'react';
import { FaRegEye } from 'react-icons/fa';
import { TbCards } from 'react-icons/tb';
import { VscSync, VscSyncIgnored } from 'react-icons/vsc';

import { Part as PartType, PartProperty as PropertyType } from '@/api/types';
import PartContextMenu from '@/features/prototype/components/atoms/PartContextMenu';
import { useCard } from '@/features/prototype/hooks/useCard';
import { useDeck } from '@/features/prototype/hooks/useDeck';
import { PartHandle } from '@/features/prototype/type';

interface PartProps {
  // パーツタイプ
  part: PartType;
  // プロパティ
  properties: PropertyType[];
  // 画像データ
  images: Record<string, string>[];
  // 他のプレイヤーのカードか
  isOtherPlayerCard?: boolean;
  // プロトタイプタイプ
  prototypeType: 'MASTER' | 'VERSION' | 'INSTANCE';
  // マウスダウン時のコールバック
  onMouseDown: (e: React.MouseEvent, partId: number) => void;
  // 移動順序を変更するコールバック
  onMoveOrder: ({
    partId,
    type,
  }: {
    partId: number;
    type: 'front' | 'back' | 'backmost' | 'frontmost';
  }) => void;
  // アクティブか
  isActive: boolean;
}

const Part = forwardRef<PartHandle, PartProps>(
  (
    {
      part,
      properties,
      isOtherPlayerCard = false,
      prototypeType,
      images,
      onMouseDown,
      onMoveOrder,
      isActive = false,
    },
    ref
  ) => {
    const { isFlipped, isReversing, setIsReversing, reverseCard } = useCard(
      part,
      ref
    );
    const { shuffleDeck } = useDeck(part);

    const isCard = part.type === 'card';
    const isDeck = part.type === 'deck';

    // Owner name functionality is not available since Player model was removed
    const ownerName = part.ownerId ? `Owner: ${part.ownerId}` : undefined;

    // 裏向き表示にする必要があるか
    const isFlippedNeeded = prototypeType === 'VERSION' && isOtherPlayerCard;

    // 対象面（表or裏）のプロパティを取得
    const targetProperty = useMemo(() => {
      const side = part.isFlipped ? 'back' : 'front';
      return properties.find((p) => p.side === side);
    }, [part, properties]);

    // 有効な画像URLの値
    const validImageURL = useMemo(() => {
      const imageId = targetProperty?.imageId;
      if (!imageId) return null;

      const targetImage = images.find((image) => image[imageId]);
      if (targetImage) {
        return targetImage[imageId];
      }
      return null;
    }, [targetProperty?.imageId, images]);

    // 背景パターンのID
    const bgPatternId: string = `bgPattern-${targetProperty?.partId}-${targetProperty?.side}`;

    const handleDoubleClick = () => {
      // カードやデッキでない場合
      if (!isCard && !isDeck) return;

      // デッキの場合
      if (isDeck) {
        shuffleDeck();
        return;
      }

      // カードの場合
      // 裏向き固定の場合
      if (isFlippedNeeded) return;
      reverseCard(!isFlipped, true);
    };

    return (
      <svg
        key={part.id}
        onDoubleClick={handleDoubleClick}
        onMouseDown={(e) => onMouseDown(e, part.id)}
        className="cursor-move border group relative"
        style={{
          transformOrigin: 'center center',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ツールチップ */}
        <title>{targetProperty?.description}</title>

        {/* 画像設定その1 */}
        {validImageURL && (
          <defs>
            <pattern
              id={bgPatternId}
              patternUnits="userSpaceOnUse"
              width={part.width}
              height={part.height}
            >
              <image
                xlinkHref={validImageURL}
                x="0"
                y="0"
                width={part.width}
                height={part.height}
              />
            </pattern>
          </defs>
        )}
        {/* パーツの枠 */}
        <rect
          id={part.id.toString()}
          onTransitionEnd={() => setIsReversing(false)}
          style={{
            stroke: 'gray',
            strokeDasharray: part.type === 'area' ? '4' : 'none',
            fill: validImageURL
              ? `url(#${bgPatternId})`
              : targetProperty?.color || 'white', // 条件付きで背景を設定
            opacity: part.type === 'area' ? 0.6 : 1,
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

        {/* リサイズ用のアイコン */}
        {isActive && (
          <g
            style={{
              transform: `translate(${part.position.x}px, ${part.position.y}px)`,
            }}
          >
            {/* 右下 */}
            <rect
              data-resize-direction="southEast"
              x={part.width - 8}
              y={part.height - 8}
              width="16"
              height="16"
              fill="white"
              stroke="#94a3b8"
              strokeWidth="1"
              className="cursor-se-resize"
            />
          </g>
        )}

        {/* パーツの情報オーバーレイ */}
        <foreignObject
          x={part.position.x}
          y={part.position.y}
          width={part.width}
          height={part.height}
        >
          <div className="h-full w-full p-2">
            {/* ヘッダー部分 */}
            {!isFlippedNeeded && (
              <div className="flex items-center justify-between">
                {/* パーツ名 */}
                <p
                  className={`flex-1 truncate ${part.type === 'token' ? 'text-xs' : 'text-sm'} font-medium`}
                  style={{
                    color: targetProperty?.textColor || 'black',
                  }}
                >
                  {targetProperty?.name}
                </p>
                {/* 所持プレイヤー名 */}
                {part.type === 'hand' && (
                  <div className="ml-2 flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5">
                    <FaRegEye className="h-3 w-3 text-gray-500" />
                    <span className="text-[10px] text-gray-600">
                      {ownerName}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* フッター部分（アイコン類） */}
            <div className="absolute bottom-2 right-2 flex items-center gap-2 opacity-60 transition-opacity group-hover:opacity-100">
              {/* シャッフル可能アイコン */}
              {isDeck && <TbCards className="h-4 w-4 text-gray-600" />}

              {/* カードの場合はシャッフル可能/不可アイコン */}
              {isCard &&
                (part.isReversible ? (
                  <VscSync className="h-4 w-4 text-gray-600" />
                ) : (
                  <VscSyncIgnored className="h-4 w-4 text-gray-600" />
                ))}
            </div>
          </div>
        </foreignObject>

        {/* アクティブ時の枠 */}
        {isActive && (
          <rect
            id={`${part.id}-border`}
            style={{
              stroke: '#47f5bb',
              fill: 'none',
              strokeWidth: 2,
              transform: `
            translate(${part.position.x - 4}px, ${part.position.y - 4}px)
            translate(${part.width / 2 + 4}px, ${part.height / 2 + 4}px)
            rotateY(${!isFlippedNeeded && isFlipped ? 180 : 0}deg)
            translate(-${part.width / 2 + 4}px, -${part.height / 2 + 4}px)
          `,
              transition: isReversing ? 'transform 0.6s' : 'none',
              transformStyle: 'preserve-3d',
            }}
            width={part.width + 8}
            height={part.height + 8}
            rx={12}
          />
        )}

        {/* コンテキストメニュー */}
        <foreignObject
          x={part.position.x}
          y={part.position.y}
          width={part.width}
          height={part.height}
        >
          <PartContextMenu onMoveOrder={onMoveOrder} partId={part.id} />
        </foreignObject>
      </svg>
    );
  }
);

Part.displayName = 'Part';

export default Part;
