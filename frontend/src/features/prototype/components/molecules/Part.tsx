import Konva from 'konva';
import React, { forwardRef, useMemo, useRef, useEffect, useState } from 'react';
import { Group, Rect, Text, Image } from 'react-konva';
import useImage from 'use-image';

import { Part as PartType, PartProperty as PropertyType } from '@/api/types';
import { useCard } from '@/features/prototype/hooks/useCard';
import { useDebugMode } from '@/features/prototype/hooks/useDebugMode';
import { useDeck } from '@/features/prototype/hooks/useDeck';
import { useSocket } from '@/features/prototype/hooks/useSocket';
import { PartHandle } from '@/features/prototype/type';
import { GameBoardMode } from '@/features/prototype/types/gameBoardMode';

import FlipIcon from '../atoms/FlipIcon';
import ShuffleIcon from '../atoms/ShuffleIcon';

interface PartProps {
  part: PartType;
  properties: PropertyType[];
  images: Record<string, string>[];
  isOtherPlayerCard: boolean;
  gameBoardMode: GameBoardMode;
  onDragStart: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragMove: (e: Konva.KonvaEventObject<DragEvent>, partId: number) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>, partId: number) => void;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onContextMenu: (
    e: Konva.KonvaEventObject<PointerEvent>,
    partId: number
  ) => void;
  isActive: boolean;
}

const Part = forwardRef<PartHandle, PartProps>(
  (
    {
      part,
      properties,
      isOtherPlayerCard = false,
      gameBoardMode,
      images,
      onDragStart,
      onDragMove,
      onDragEnd,
      onClick,
      onContextMenu,
      isActive = false,
    },
    ref
  ) => {
    const groupRef = useRef<Konva.Group>(null);
    const { isReversing, setIsReversing, reverseCard } = useCard(part, ref);
    const { shuffleDeck } = useDeck(part);
    const [scaleX, setScaleX] = useState(1);
    const { showDebugInfo } = useDebugMode();
    const { socket } = useSocket();

    // 要素のドラッグ開始時に最前面に移動する処理を追加（PLAYモードのみ）
    useEffect(() => {
      if (!groupRef.current || gameBoardMode !== GameBoardMode.PLAY) return;

      const currentGroup = groupRef.current;

      // ドラッグ開始時のハンドラーを追加（PLAYモードのみ）
      currentGroup.on('dragstart', () => {
        // ドラッグ中のノードを最前面に移動
        currentGroup.moveToTop();
      });

      return () => {
        // クリーンアップ
        currentGroup.off('dragstart');
      };
    }, [gameBoardMode, groupRef]);

    const isCard = part.type === 'card';
    const isDeck = part.type === 'deck';

    // カードの反転を受信する
    useEffect(() => {
      const handleFlipCard = ({
        cardId,
        nextFrontSide,
      }: {
        cardId: number;
        nextFrontSide: 'front' | 'back';
      }) => {
        if (cardId === part.id) {
          reverseCard(nextFrontSide, false);
        }
      };

      socket.on('FLIP_CARD', handleFlipCard);

      // クリーンアップ関数を追加
      return () => {
        socket.off('FLIP_CARD', handleFlipCard);
      };
    }, [part.id, reverseCard, socket]);

    // アニメーション用のエフェクト
    useEffect(() => {
      if (!isCard || !isReversing || !groupRef.current) return;

      // フリップアニメーション
      const anim = new Konva.Animation((frame) => {
        if (!frame || !groupRef.current) return;

        const duration = 200; // アニメーション時間 (ミリ秒)
        const timePassed = frame.time % duration;
        const progress = timePassed / duration;

        if (progress < 0.5) {
          // 最初の半分：縮小
          setScaleX(1 - progress * 2);
        } else {
          // 後半：拡大
          setScaleX((progress - 0.5) * 2);
        }

        // アニメーション終了
        if (frame.time >= duration) {
          anim.stop();
          setScaleX(1);
          setIsReversing(false);
        }
      }, groupRef.current.getLayer());

      anim.start();

      return () => {
        anim.stop();
      };
    }, [isReversing, isCard, setIsReversing]);

    // 裏向き表示にする必要があるか
    const isFlippedNeeded =
      gameBoardMode === GameBoardMode.PLAY && isOtherPlayerCard;

    // 対象面（表or裏）のプロパティを取得 (ローカルの isFlipped 状態を使用)
    const targetProperty = useMemo(() => {
      return properties.find((p) => p.side === part.frontSide);
    }, [part.frontSide, properties]);

    // 有効な画像URLの値を取得する関数
    const getValidImageURL = (imageId?: string | null) => {
      if (!imageId) return null;
      const targetImage = images.find((image) => image[imageId]);
      return targetImage ? targetImage[imageId] : null;
    };

    // 有効な画像URLの値
    const validImageURL = getValidImageURL(targetProperty?.imageId);

    // 画像をロード
    const [image] = useImage(validImageURL || '');

    // ロードされた画像の状態を追跡
    const imageLoaded = !!image && validImageURL;

    const handleDoubleClick = () => {
      const isInteractivePart = isCard || isDeck;
      if (!isInteractivePart) return;

      if (isDeck) {
        shuffleDeck();
        return;
      }

      if (isCard && !isFlippedNeeded) {
        reverseCard(part.frontSide === 'front' ? 'back' : 'front', true);
        return;
      }
    };

    // 中央を軸にして反転させるための設定
    const offsetX = part.width / 2;

    // コンテキストメニュー用ハンドラー
    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
      onContextMenu(e, part.id);
    };

    return (
      <Group
        ref={groupRef}
        name={`part-${part.id}`}
        x={part.position.x + offsetX}
        y={part.position.y}
        width={part.width}
        height={part.height}
        offsetX={offsetX}
        draggable
        scaleX={scaleX}
        onDragStart={onDragStart}
        onDragMove={(e) => onDragMove(e, part.id)}
        onDragEnd={(e) => onDragEnd(e, part.id)}
        onClick={onClick}
        onDblClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        {/* パーツの背景 */}
        <Rect
          width={part.width}
          height={part.height}
          fill={imageLoaded ? 'white' : targetProperty?.color || 'white'}
          stroke={'grey'}
          strokeWidth={1}
          cornerRadius={isCard ? 10 : 4}
          opacity={part.type === 'area' ? 0.6 : 1}
          dash={part.type === 'area' ? [4, 4] : undefined}
          shadowColor={isActive ? 'rgba(59, 130, 246, 1)' : 'transparent'}
          shadowBlur={isActive ? 10 : 0}
          shadowOffsetX={0}
          shadowOffsetY={0}
        />

        {/* 画像があれば表示 */}
        {imageLoaded && (
          <Image
            image={image}
            width={part.width}
            height={part.height}
            cornerRadius={isCard ? 10 : 4}
            opacity={part.type === 'area' ? 0.6 : 1}
            alt={targetProperty?.name || 'Game part'}
          />
        )}

        {/* パーツの名前 - フリップされていなければ表示 */}
        {!isFlippedNeeded && (
          <Text
            text={targetProperty?.name || ''}
            fontSize={part.type === 'token' ? 12 : 14}
            fontStyle="bold"
            fill={targetProperty?.textColor || 'black'}
            width={part.width}
            align="center"
            padding={10}
            y={5}
          />
        )}

        {/* 説明文 - フリップされていなければ表示 */}
        {!isFlippedNeeded && targetProperty?.description && (
          <Text
            text={targetProperty.description}
            fontSize={10}
            fill={targetProperty.textColor || '#666'}
            width={part.width - 20}
            align="center"
            y={part.height / 2}
            x={10}
            wrap="word"
            ellipsis={true}
          />
        )}

        {/* タイプを示す小さなアイコン */}
        <Group x={part.width - 30} y={part.height - 25}>
          {isDeck && <ShuffleIcon size={20} color="#666" />}
          {isCard && <FlipIcon size={20} color="#666" />}
        </Group>

        {/* デバッグ情報: ID と順序（order） - showDebugInfoがtrueの場合のみ表示 */}
        {showDebugInfo && (
          <Group x={5} y={5}>
            <Rect
              width={85}
              height={20}
              fill="rgba(0, 0, 0, 0.7)"
              cornerRadius={4}
            />
            <Text
              text={`ID:${part.id} / O:${typeof part.order === 'number' ? part.order.toFixed(2) : 'N/A'}`}
              fontSize={10}
              fill="white"
              width={85}
              align="center"
              y={5}
            />
          </Group>
        )}
      </Group>
    );
  }
);
Part.displayName = 'Part';

export default Part;
