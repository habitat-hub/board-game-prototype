import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import {
  PART_PROPERTY_MENU_WIDTH,
  DEFAULT_MENU_TOP,
  DEFAULT_RIGHT_OFFSET,
  DEFAULT_MENU_HEIGHT,
} from '../constants/partPropertyMenu';

/**
 * メニューをドラッグで移動させるためのフック
 * - 初期位置は右上（右オフセット基準）に配置します
 * - マウス・タッチ両対応でドラッグを扱います
 *
 * @returns containerRef - メニュー本体に付与する ref
 * @returns position - メニューの左上座標（null の場合は未初期化）
 * @returns isDragging - 現在ドラッグ中か
 * @returns handleDragStart - メニューヘッダ等に紐付けるドラッグ開始ハンドラ
 */
export default function useDraggablePartPropertyMenu(): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  position: { x: number; y: number } | null;
  isDragging: boolean;
  handleDragStart: (
    e:
      | React.MouseEvent<HTMLDivElement, MouseEvent>
      | React.TouchEvent<HTMLDivElement>
  ) => void;
  clampToViewport: () => void;
} {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    () => {
      // 遅延初期化（SSR 対応: window が未定義の場合に安全）
      if (typeof window === 'undefined') return null;
      const left = Math.max(
        0,
        window.innerWidth - DEFAULT_RIGHT_OFFSET - PART_PROPERTY_MENU_WIDTH
      );
      return { x: left, y: DEFAULT_MENU_TOP };
    }
  );

  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const startMouseRef = useRef({ x: 0, y: 0 });
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  /** 指定範囲に値を丸めるユーティリティ */
  const clamp = useCallback(
    (v: number, a: number, b: number) => Math.min(Math.max(v, a), b),
    []
  );

  /** 外部から呼べるように、現在位置をビューポート内にクランプする関数を用意 */
  const clampToViewport = useCallback(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    const width = container?.offsetWidth ?? PART_PROPERTY_MENU_WIDTH;
    const height = container?.offsetHeight ?? DEFAULT_MENU_HEIGHT;
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);

    setPosition((prev) => {
      if (!prev) {
        const left = Math.max(
          0,
          window.innerWidth - DEFAULT_RIGHT_OFFSET - width
        );
        const top = DEFAULT_MENU_TOP;
        return { x: clamp(left, 0, maxX), y: clamp(top, 0, maxY) };
      }
      return { x: clamp(prev.x, 0, maxX), y: clamp(prev.y, 0, maxY) };
    });
  }, [clamp]);

  /** イベント（マウス or タッチ）からクライアント座標を取り出す */
  const getClientCoords = (
    e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent
  ): { x: number; y: number } => {
    // タッチイベントの場合
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  /** ドラッグ開始ハンドラ */
  const handleDragStart = useCallback(
    (
      e:
        | React.MouseEvent<HTMLDivElement, MouseEvent>
        | React.TouchEvent<HTMLDivElement>
    ) => {
      e.preventDefault();
      const { x: clientX, y: clientY } = getClientCoords(e);
      draggingRef.current = true;
      setIsDragging(true);
      startMouseRef.current = { x: clientX, y: clientY };
      // 現在の位置を開始位置として記録する（未初期化の場合は右上相当の初期位置）
      if (position) {
        startPosRef.current = position;
      } else if (typeof window !== 'undefined') {
        const container = containerRef.current;
        const width = container?.offsetWidth ?? PART_PROPERTY_MENU_WIDTH;
        const left = Math.max(
          0,
          window.innerWidth - DEFAULT_RIGHT_OFFSET - width
        );
        startPosRef.current = { x: left, y: DEFAULT_MENU_TOP };
        setPosition(startPosRef.current);
      } else {
        startPosRef.current = { x: 0, y: 0 };
      }
      document.body.style.userSelect = 'none';
    },
    [position]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      // ドラッグ中でなければ無視
      if (!draggingRef.current) return;
      if (ev.cancelable) ev.preventDefault();
      const { x: clientX, y: clientY } = getClientCoords(
        ev as MouseEvent | TouchEvent
      );
      const dx = clientX - startMouseRef.current.x;
      const dy = clientY - startMouseRef.current.y;
      const newX = startPosRef.current.x + dx;
      const newY = startPosRef.current.y + dy;
      const container = containerRef.current;
      // ビューポートよりメニューが大きい場合にも上限を0以上にする
      const maxX = Math.max(
        0,
        window.innerWidth -
          (container?.offsetWidth ?? PART_PROPERTY_MENU_WIDTH)
      );
      const maxY = Math.max(
        0,
        window.innerHeight - (container?.offsetHeight ?? DEFAULT_MENU_HEIGHT)
      );
      setPosition({ x: clamp(newX, 0, maxX), y: clamp(newY, 0, maxY) });
    };

    const handleEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, {
      passive: false,
    } as EventListenerOptions);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove as EventListener);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [clamp]);

  // マウント時・リサイズ時・コンテナサイズ変更時にメニューがビューポート外に出ないようにする
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const clampCurrentPosition = () => {
      const container = containerRef.current;
      const width = container?.offsetWidth ?? PART_PROPERTY_MENU_WIDTH;
      const height = container?.offsetHeight ?? DEFAULT_MENU_HEIGHT;
      const maxX = Math.max(0, window.innerWidth - width);
      const maxY = Math.max(0, window.innerHeight - height);

      setPosition((prev) => {
        // 未初期化の場合は右上に配置（測定した幅を考慮）
        if (!prev) {
          const left = Math.max(
            0,
            window.innerWidth - DEFAULT_RIGHT_OFFSET - width
          );
          const top = DEFAULT_MENU_TOP;
          return { x: clamp(left, 0, maxX), y: clamp(top, 0, maxY) };
        }
        return { x: clamp(prev.x, 0, maxX), y: clamp(prev.y, 0, maxY) };
      });
    };

    // コンテナのサイズ変化を監視して、メニューの内容が増減したときに再クランプする
    if (typeof ResizeObserver !== 'undefined') {
      if (containerRef.current) {
        resizeObserverRef.current = new ResizeObserver(clampCurrentPosition);
        resizeObserverRef.current.observe(containerRef.current);
      }
    }

    // ウィンドウリサイズ時にもクランプする
    window.addEventListener('resize', clampCurrentPosition);

    // 一度即時実行して初期化／クランプする
    clampCurrentPosition();

    return () => {
      window.removeEventListener('resize', clampCurrentPosition);
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [clamp]);

  return {
    containerRef,
    position,
    isDragging,
    handleDragStart,
    clampToViewport,
  } as const;
}
