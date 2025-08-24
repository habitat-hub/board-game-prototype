import Konva from 'konva';
import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Group, Rect, Text, Image } from 'react-konva';
import useImage from 'use-image';

import { Part, PartProperty } from '@/api/types';
import FlipIcon from '@/features/prototype/components/atoms/FlipIcon';
import ShuffleIcon from '@/features/prototype/components/atoms/ShuffleIcon';
import { FLIP_ANIMATION } from '@/features/prototype/constants/animation';
import { TEXT_LAYOUT } from '@/features/prototype/constants/part';
import { useCard } from '@/features/prototype/hooks/useCard';
import { useCursorControl } from '@/features/prototype/hooks/useCursorControl';
import { useDebugMode } from '@/features/prototype/hooks/useDebugMode';
import { useGrabbingCursor } from '@/features/prototype/hooks/useGrabbingCursor';
import { usePartReducer } from '@/features/prototype/hooks/usePartReducer';
import { usePartTooltip } from '@/features/prototype/hooks/usePartTooltip';
import { GameBoardMode } from '@/features/prototype/types';
import {
  getCornerRadius,
  getImageCornerRadius,
  getStrokeWidth,
  getDashPattern,
  getShadowColor,
  getShadowBlur,
  getShadowOffsetX,
  getShadowOffsetY,
} from '@/features/prototype/utils/partUtils';

interface PartOnGameBoardProps {
  part: Part;
  properties: PartProperty[];
  images: Record<string, string>[];
  isOtherPlayerHandCard: boolean;
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
  // ユーザー情報
  userRoles?: Array<{
    userId: string;
    user: { id: string; username: string };
    roles: Array<{ name: string; description: string }>;
  }>;
}

export default function PartOnGameBoard({
  part,
  properties,
  isOtherPlayerHandCard = false,
  gameBoardMode,
  images,
  onDragStart,
  onDragMove,
  onDragEnd,
  onClick,
  onContextMenu,
  isActive = false,
  userRoles = [],
}: PartOnGameBoardProps) {
  const groupRef = useRef<Konva.Group>(null);
  const { isReversing, setIsReversing, reverseCard } = useCard(part);
  const { dispatch } = usePartReducer();
  // 楽観的に表裏を切り替えるためのローカル状態（操作者のカードのみ使用）
  const [optimisticFrontSide, setOptimisticFrontSide] = useState<string | null>(
    null
  );
  const [scaleX, setScaleX] = useState(1);
  const { showDebugInfo } = useDebugMode();
  const { eventHandlers } = useGrabbingCursor();

  // プレイモードでエリアパーツの場合は移動禁止
  const isDraggable = !(
    gameBoardMode === GameBoardMode.PLAY && part.type === 'area'
  );

  // カーソル制御hooks
  const {
    getCursorType,
    setDraggableCursor,
    setGrabbingCursor,
    setDefaultCursor,
  } = useCursorControl(isDraggable);

  // ツールチップ機能
  const {
    handleMouseEnter: tooltipMouseEnter,
    handleMouseLeave: tooltipMouseLeave,
    hideTooltip,
  } = usePartTooltip({ part });

  const isCard = part.type === 'card';
  const isDeck = part.type === 'deck';

  // 手札の持ち主
  const handOwnerName = useMemo(() => {
    // 手札表示が不要な場合
    if (
      gameBoardMode !== GameBoardMode.PLAY ||
      part.type !== 'hand' ||
      !part.ownerId
    ) {
      return null;
    }
    return userRoles.find((userRole) => userRole.user.id === part.ownerId)?.user
      .username;
  }, [gameBoardMode, part.type, part.ownerId, userRoles]);

  // 前回の表面を保持するref
  const prevFrontSideRef = useRef<string | undefined>(part.frontSide);

  // 表面が変化したときにアニメーションを実行するエフェクト
  useEffect(() => {
    // カード以外や初回レンダー時は反転アニメは不要なので prev を合わせて終了
    const isCard = part.type === 'card';
    const isInitialRender = prevFrontSideRef.current === undefined;
    if (!isCard || isInitialRender) {
      prevFrontSideRef.current = part.frontSide;
      return;
    }

    const isServerDataChanged = prevFrontSideRef.current !== part.frontSide;
    const isOptimisticChanged =
      optimisticFrontSide && prevFrontSideRef.current !== optimisticFrontSide;
    // 変化がなければ早期リターン
    if (!isServerDataChanged && !isOptimisticChanged) return;

    const shouldAlwaysDisplayBackSideLocal =
      gameBoardMode === GameBoardMode.PLAY && isOtherPlayerHandCard;

    // プレイ中の他プレイヤーの手札でない かつ 変化がある場合にアニメーション実行
    if (
      !shouldAlwaysDisplayBackSideLocal &&
      (isServerDataChanged || isOptimisticChanged)
    ) {
      setIsReversing(true);
    }

    // 楽観的状態を解除
    if (optimisticFrontSide) {
      setOptimisticFrontSide(null);
    }
    prevFrontSideRef.current = part.frontSide;
  }, [
    part.frontSide,
    part.type,
    isOtherPlayerHandCard,
    gameBoardMode,
    setIsReversing,
    optimisticFrontSide,
  ]);

  // アニメーション用のエフェクト
  useEffect(() => {
    if (!isCard || !isReversing || !groupRef.current) return;

    // フリップアニメーション
    const node = groupRef.current;
    const layer =
      node.getLayer() || node.getStage()?.getLayers?.()?.[0] || null;
    if (!layer) {
      // レイヤー未構築時は状態を復帰して中断
      setScaleX(1);
      setIsReversing(false);
      return;
    }

    const anim = new Konva.Animation((frame) => {
      if (!frame || !groupRef.current) return;

      const duration = FLIP_ANIMATION.DURATION_MS; // フリップアニメーション時間
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
    }, layer);

    anim.start();

    return () => {
      anim.stop();
    };
  }, [isReversing, isCard, setIsReversing, part.id]);

  // 常に裏面を表示すべきカードか
  const shouldAlwaysDisplayBackSide =
    gameBoardMode === GameBoardMode.PLAY &&
    part.type === 'card' &&
    isOtherPlayerHandCard;

  // 表示する面を決定
  // 操作者の操作の場合は楽観的に画面だけ先に切り替える
  const frontSide =
    optimisticFrontSide ??
    (shouldAlwaysDisplayBackSide ? 'back' : part.frontSide);

  // 対象面（表or裏）のプロパティを取得 (ローカルの isFlipped 状態を使用)
  const targetProperty = useMemo(() => {
    return properties.find((p) => p.side === frontSide);
  }, [frontSide, properties]);

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
      dispatch({ type: 'SHUFFLE_DECK', payload: { deckId: part.id } });
      return;
    }

    if (isCard && !shouldAlwaysDisplayBackSide) {
      // 楽観的に先に表示を切り替え、アニメーションも開始する
      const newSide = part.frontSide === 'front' ? 'back' : 'front';
      setOptimisticFrontSide(newSide);
      setIsReversing(true);
      // サーバーへ更新を投げる（reverseCard は外部更新も行う）
      reverseCard(newSide, true);
      return;
    }
  };

  // 中央を軸にして反転させるための設定
  const offsetX = part.width / 2;

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // ドラッグ開始時にツールチップを非表示
    hideTooltip();

    // ドラッグ中のカーソルを設定
    const stage = e.target.getStage();
    if (isDraggable) {
      setGrabbingCursor(stage);
    }

    onDragStart(e);
  };

  // コンテキストメニュー用ハンドラー
  const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    hideTooltip();
    onContextMenu(e, part.id);
  };

  /**
   * ドラッグ終了時の処理
   * @param e - Konvaのドラッグイベントオブジェクト
   */
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    onDragEnd(e, part.id);
    // ドラッグ終了後のカーソルを設定
    const stage = e.target.getStage();
    setDraggableCursor(stage);
  };

  /**
   * マウスがパーツに乗った時の処理（ツールチップ開始）
   */
  const handleMouseEnter = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // ツールチップ表示開始
      tooltipMouseEnter(e);

      // カーソルを動的に変更
      const stage = e.target.getStage();
      setDraggableCursor(stage);
    },
    [tooltipMouseEnter, setDraggableCursor]
  );

  /**
   * マウスがパーツから離れた時の処理（ツールチップ非表示）
   */
  const handleMouseLeave = useCallback(() => {
    // ツールチップ非表示
    tooltipMouseLeave();

    // カーソルをデフォルトに戻す
    const stage = groupRef.current?.getStage();
    setDefaultCursor(stage || null);

    // useGrabbingCursor のイベントハンドラーを呼び出し
    eventHandlers.onMouseLeave();
  }, [tooltipMouseLeave, setDefaultCursor, eventHandlers]);

  return (
    <Group
      ref={groupRef}
      name={`part-${part.id}`}
      x={part.position.x + offsetX}
      y={part.position.y}
      width={part.width}
      height={part.height}
      offsetX={offsetX}
      draggable={isDraggable}
      scaleX={scaleX}
      cursor={getCursorType()}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={eventHandlers.onMouseDown}
      onMouseUp={eventHandlers.onMouseUp}
      onDragStart={handleDragStart}
      onDragMove={(e) => onDragMove(e, part.id)}
      onDragEnd={handleDragEnd}
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
        strokeWidth={getStrokeWidth(part.type)}
        cornerRadius={getCornerRadius(part.type)}
        dash={getDashPattern(part.type)}
        shadowColor={getShadowColor(part.type, isActive)}
        shadowBlur={getShadowBlur(part.type, isActive)}
        shadowOffsetX={getShadowOffsetX(part.type, isActive)}
        shadowOffsetY={getShadowOffsetY(part.type, isActive)}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
      />

      {/* 画像があれば表示 */}
      {imageLoaded && (
        <Image
          image={image}
          width={part.width}
          height={part.height}
          cornerRadius={getImageCornerRadius(part.type)}
          alt={targetProperty?.name || 'Game part'}
          perfectDrawEnabled={false}
          hitStrokeWidth={0}
          listening={false}
        />
      )}

      {/* パーツの名前 */}
      <Text
        text={targetProperty?.name || ''}
        fontSize={part.type === 'token' ? 12 : 14}
        fontStyle="bold"
        fill={targetProperty?.textColor || 'black'}
        width={part.width}
        align="center"
        padding={10}
        y={5}
        perfectDrawEnabled={false}
        hitStrokeWidth={0}
        listening={false}
      />

      {/* 手札の持ち主表示（プレイモードのみ） */}
      {handOwnerName && (
        <Text
          text={`持ち主: ${handOwnerName}`}
          fontSize={12}
          fill={targetProperty?.textColor || 'black'}
          width={part.width - TEXT_LAYOUT.HORIZONTAL_MARGIN * 2}
          align="center"
          y={part.height / 2 - TEXT_LAYOUT.LINE_GAP}
          x={TEXT_LAYOUT.HORIZONTAL_MARGIN}
          wrap="word"
          ellipsis={true}
          perfectDrawEnabled={false}
          hitStrokeWidth={0}
          listening={false}
        />
      )}

      {/* 説明文 */}
      {targetProperty?.description && (
        <Text
          text={targetProperty.description}
          fontSize={12}
          fill={targetProperty.textColor || '#666'}
          width={part.width - TEXT_LAYOUT.HORIZONTAL_MARGIN * 2}
          align="center"
          y={part.height / 2}
          x={TEXT_LAYOUT.HORIZONTAL_MARGIN}
          wrap="word"
          ellipsis={true}
          perfectDrawEnabled={false}
          hitStrokeWidth={0}
          listening={false}
        />
      )}

      {/* タイプを示す小さなアイコン */}
      <Group x={part.width - 30} y={part.height - 25} listening={false}>
        {isDeck && <ShuffleIcon size={20} color="#666" />}
        {isCard && <FlipIcon size={20} color="#666" />}
      </Group>

      {/* デバッグ情報: ID と順序（order） - showDebugInfoがtrueの場合のみ表示 */}
      {showDebugInfo && (
        <Group x={5} y={5} listening={false}>
          <Rect
            width={90}
            height={20}
            fill="rgba(200, 200, 200, 0.8)"
            cornerRadius={4}
            perfectDrawEnabled={false}
            hitStrokeWidth={0}
            listening={false}
          />
          <Text
            text={`ID:${part.id}\nO:${typeof part.order === 'number' ? part.order : 'N/A'}`}
            fontSize={7}
            fill="black"
            width={85}
            align="left"
            x={5}
            y={3}
            perfectDrawEnabled={false}
            hitStrokeWidth={0}
            listening={false}
          />
        </Group>
      )}
    </Group>
  );
}
