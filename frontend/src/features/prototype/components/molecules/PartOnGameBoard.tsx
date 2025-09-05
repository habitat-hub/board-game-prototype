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
import {
  DEFAULT_STROKE_COLOR,
  SELECTED_SHADOW_OPACITY,
  SELECT_OUTLINE_STEP_PX,
  SELECT_OUTLINE_STROKE_WIDTH,
  LABEL_ITEM_HEIGHT,
  LABEL_X_OFFSET,
  LABEL_MARKER_SIZE,
  LABEL_MARKER_RADIUS,
  LABEL_MARKER_Y,
  LABEL_TEXT_X,
  LABEL_FONT_SIZE,
} from '@/constants/gameBoardUi';
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
import { getUserColor } from '@/features/prototype/utils/userColor';

// 選択表示用の軽量ユーザー型
type SelectedUser = { userId: string; username: string };

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
  /** 選択中のユーザー一覧（UI 表示用） */
  selectedBy?: ReadonlyArray<SelectedUser>;
  /** 自ユーザー（自身の選択色の決定に使用） */
  selfUser?: SelectedUser;
  // ユーザー情報
  userRoles?: Array<{
    userId: string;
    user: { id: string; username: string };
    roles: Array<{ name: string; description: string }>;
  }>;
}

/** ゲーム盤上のパーツ描画コンポーネント */
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
  selectedBy = [],
  selfUser,
  userRoles = [],
}: PartOnGameBoardProps): React.ReactElement {
  const groupRef = useRef<Konva.Group>(null);
  const { isReversing, setIsReversing, reverseCard } = useCard(part);
  const { dispatch } = usePartReducer();
  // 楽観的に表裏を切り替えるためのローカル状態（操作者のカードのみ使用）
  const [optimisticFrontSide, setOptimisticFrontSide] = useState<string | null>(
    null
  );
  // 他プレイヤーの手札は常に裏面表示する (表示制御用)
  const shouldAlwaysDisplayBackSide =
    gameBoardMode === GameBoardMode.PLAY &&
    part.type === 'card' &&
    isOtherPlayerHandCard;
  // 実際に画面で表示している面。アニメーション進捗の中点で切り替える
  const [displayedSide, setDisplayedSide] = useState<string | null>(
    shouldAlwaysDisplayBackSide ? 'back' : (part.frontSide ?? 'front')
  );
  const [scaleX, setScaleX] = useState(1);
  // フリップ中に一度だけ面を切り替えたかどうかを保持
  const sideSwitchedRef = useRef(false);
  // フリップ時に切り替えるべき最終面 (アニメーション中に参照する)
  const flipTargetRef = useRef<string>(part.frontSide ?? 'front');
  const { showDebugInfo } = useDebugMode();
  const { eventHandlers } = useGrabbingCursor();

  const allUsers = useMemo(
    () => userRoles.map(({ user }) => ({ userId: user.id })),
    [userRoles]
  );

  // 他ユーザーによるロック（自分が選択していないのに他人が選択中）
  const isLockedByOthers = selectedBy.length > 0 && !isActive;
  // ロック中は移動禁止
  const isDraggable = !isLockedByOthers;

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
  const [shuffleMessage, setShuffleMessage] = useState<string | null>(null);
  const shuffleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shuffleHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (shuffleTimeoutRef.current) clearTimeout(shuffleTimeoutRef.current);
      if (shuffleHideTimeoutRef.current)
        clearTimeout(shuffleHideTimeoutRef.current);
    };
  }, []);

  // 自分の選択色（自分が選択中のときに枠・影色に使用）
  const selfSelectedColor = useMemo<string | null>(() => {
    if (!selfUser) return null;
    return getUserColor(selfUser.userId, allUsers);
  }, [selfUser, allUsers]);

  // 選択装飾用の計算結果をメモ化
  const selectedByWithColors = useMemo(
    () =>
      selectedBy.map((u) => ({
        ...u,
        color: getUserColor(u.userId, allUsers),
      })),
    [selectedBy, allUsers]
  );

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

  // isOtherPlayerHandCard の前回値を保持
  const prevIsOtherPlayerHandRef = useRef<boolean>(isOtherPlayerHandCard);

  // frontSide と isOtherPlayerHandCard の変化を統合して処理する
  useEffect(() => {
    // 対象はカードのみ
    if (part.type !== 'card') {
      // 非カードでは前回値を同期して副作用を起こさない
      prevIsOtherPlayerHandRef.current = isOtherPlayerHandCard;
      prevFrontSideRef.current = part.frontSide;
      return;
    }

    const isInitialRender = prevFrontSideRef.current === undefined;

    // 初回レンダー時は参照値を合わせて何もしない
    if (isInitialRender) {
      prevIsOtherPlayerHandRef.current = isOtherPlayerHandCard;
      prevFrontSideRef.current = part.frontSide;
      return;
    }

    const isHandOwnerChanged =
      prevIsOtherPlayerHandRef.current !== isOtherPlayerHandCard;
    const isServerDataChanged = prevFrontSideRef.current !== part.frontSide;
    const isOptimisticChanged =
      !!optimisticFrontSide && prevFrontSideRef.current !== optimisticFrontSide;

    // 変化がなければ何もしない
    if (!isHandOwnerChanged && !isServerDataChanged && !isOptimisticChanged)
      return;

    // 手札の持ち主変化を最優先に扱う（他プレイヤー手札は裏になる）
    const baseTarget = optimisticFrontSide ?? part.frontSide ?? 'front';
    const target = isHandOwnerChanged
      ? isOtherPlayerHandCard
        ? 'back'
        : baseTarget
      : baseTarget;

    flipTargetRef.current = target;
    sideSwitchedRef.current = false;

    // isOtherPlayerHandCard（手札所有者）の変化があった場合はアニメーションを行わず
    // 表示面だけ即座に切り替える
    if (isHandOwnerChanged) {
      if (isOtherPlayerHandCard) {
        setDisplayedSide('back');
      } else {
        setDisplayedSide(optimisticFrontSide ?? part.frontSide ?? 'front');
      }
    } else {
      // 所有者変化以外（サーバーの frontSide 更新や楽観更新）は既存の挙動を維持
      if (!shouldAlwaysDisplayBackSide) {
        setIsReversing(true);
      } else {
        setDisplayedSide('back');
      }
    }

    // 楽観表示が残っていれば解除
    if (optimisticFrontSide) {
      setOptimisticFrontSide(null);
    }

    // 前回値を更新
    prevIsOtherPlayerHandRef.current = isOtherPlayerHandCard;
    prevFrontSideRef.current = part.frontSide;
  }, [
    part.frontSide,
    part.type,
    isOtherPlayerHandCard,
    gameBoardMode,
    optimisticFrontSide,
    setIsReversing,
    setDisplayedSide,
    setOptimisticFrontSide,
    shouldAlwaysDisplayBackSide,
  ]);

  // アニメーション用のエフェクト: 中点で displayedSide を切り替える
  useEffect(() => {
    if (!isCard || !isReversing || !groupRef.current) return;

    const node = groupRef.current;
    const layer =
      node.getLayer() || node.getStage()?.getLayers?.()?.[0] || null;
    if (!layer) {
      setScaleX(1);
      setIsReversing(false);
      return;
    }

    const duration = FLIP_ANIMATION.DURATION_MS;
    sideSwitchedRef.current = false;

    const anim = new Konva.Animation((frame) => {
      if (!frame || !groupRef.current) return;

      const time = frame.time % duration;
      const progress = time / duration;

      // scaleX を滑らかに変える (0..1..0 -> use mirrored behaviour)
      if (progress < 0.5) {
        setScaleX(1 - progress * 2);
      } else {
        setScaleX((progress - 0.5) * 2);
        // 中点を越えたら一度だけ表示する面を切り替える
        if (!sideSwitchedRef.current) {
          sideSwitchedRef.current = true;
          setDisplayedSide(flipTargetRef.current);
        }
      }

      // アニメーション終了処理
      if (frame.time >= duration) {
        anim.stop();
        setScaleX(1);
        setIsReversing(false);
        sideSwitchedRef.current = false;
        // アニメーションが終わったら楽観状態が残っていれば解除
        if (optimisticFrontSide) setOptimisticFrontSide(null);
      }
    }, layer);

    anim.start();

    return () => {
      anim.stop();
    };
    // displayedSide は anim 内で制御するため依存から除外
  }, [isReversing, isCard, setIsReversing, part.id, optimisticFrontSide]);

  // 表示する面は displayedSide を参照する。optimisticFrontSide は flipTargetRef に保存される。

  // 対象面（表or裏）のプロパティを取得 (render で使う displayedSide を参照)
  const targetProperty = useMemo(() => {
    const useSide = displayedSide ?? (part.frontSide || 'front');
    return properties.find((p) => p.side === useSide);
  }, [displayedSide, properties, part.frontSide]);

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
  // ... rest of file unchanged
