'use client';

import { motion } from 'framer-motion';
import React, { useState, useEffect } from 'react';
import {
  GiCardRandom,
  GiDiamonds,
  GiHearts,
  GiCube,
  GiClubs,
  GiSpades,
} from 'react-icons/gi';

// ボード内のランダムな位置を生成するカスタムフック
function useRandomPosition(width: string, height: string) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const calculateRandomPosition = () => {
      const boardElement = document.querySelector('.game-board-area');
      if (boardElement) {
        const boardRect = boardElement.getBoundingClientRect();

        // より堅牢な方法：実際の要素のサイズを取得する
        const pieceElement = document.querySelector(`.${width}.${height}`);
        const pieceRect = pieceElement?.getBoundingClientRect();

        // 要素が見つからない場合のフォールバック値
        const pieceWidth = pieceRect?.width || 64;
        const pieceHeight = pieceRect?.height || 64;

        // ボードの余白を考慮
        const buffer = 10;

        // ランダムな位置を計算（ボード内に収まるように）
        const randomX =
          Math.floor(
            Math.random() * (boardRect.width - pieceWidth - buffer * 2)
          ) + buffer;
        const randomY =
          Math.floor(
            Math.random() * (boardRect.height - pieceHeight - buffer * 2)
          ) + buffer;

        setPosition({ x: randomX, y: randomY });
      }
    };

    // 少し遅延を入れてDOMが確実にレンダリングされた後に実行
    const timer = setTimeout(calculateRandomPosition, 100);

    return () => clearTimeout(timer);
  }, [width, height]);

  return position;
}

interface DraggableGamePieceProps {
  children: React.ReactNode;
  initialX: number;
  initialY: number;
  color: string;
  width: string;
  height: string;
  useRandomInitialPosition?: boolean;
  onDragEnd?: () => void;
  zIndex?: number;
}

const DraggableGamePiece: React.FC<DraggableGamePieceProps> = ({
  children,
  initialX,
  initialY,
  color,
  width,
  height,
  useRandomInitialPosition = false,
  onDragEnd,
  zIndex = 10,
}) => {
  // ランダム初期位置の計算（オプション）
  const randomPosition = useRandomPosition(width, height);

  // useRandomInitialPositionがtrueの場合はランダム位置を使用、そうでなければ指定された初期位置を使用
  const startX = useRandomInitialPosition ? randomPosition.x : initialX;
  const startY = useRandomInitialPosition ? randomPosition.y : initialY;

  const [position, setPosition] = useState({ x: startX, y: startY });
  const [isDragging, setIsDragging] = useState(false);
  const [boardBounds, setBoardBounds] = useState<{
    left: number;
    right: number;
    top: number;
    bottom: number;
  } | null>(null);

  // ランダム位置が変更されたら、それを反映
  useEffect(() => {
    if (useRandomInitialPosition) {
      setPosition({ x: randomPosition.x, y: randomPosition.y });
    }
  }, [useRandomInitialPosition, randomPosition]);

  // コンポーネントマウント時とウィンドウリサイズ時にボード境界を計算
  React.useEffect(() => {
    const calculateBoundaries = () => {
      const boardElement = document.querySelector('.game-board-area');
      if (boardElement) {
        const boardRect = boardElement.getBoundingClientRect();
        const pieceElement = document.querySelector(`.${width}.${height}`);
        const pieceRect = pieceElement?.getBoundingClientRect();

        if (pieceRect) {
          const pieceWidth = pieceRect.width;
          const pieceHeight = pieceRect.height;

          // ボード内に少し余白を持たせて、見た目上完全にはみ出さないようにする
          const buffer = 5; // 5pxの余白

          setBoardBounds({
            left: buffer,
            top: buffer,
            right: boardRect.width - pieceWidth - buffer,
            bottom: boardRect.height - pieceHeight - buffer,
          });
        }
      }
    };

    // 初期値設定時と、DOMレンダリング後に正確な値を取得するために少し遅延
    const timer = setTimeout(calculateBoundaries, 100);
    window.addEventListener('resize', calculateBoundaries);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateBoundaries);
    };
  }, [width, height]);

  // ドラッグ機能
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 左クリックのみ
    setIsDragging(true);

    // テキスト選択を防止
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = position.x;
    const startPosY = position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (boardBounds) {
        // 境界内に位置を制限
        const newX = Math.max(
          boardBounds.left,
          Math.min(boardBounds.right, startPosX + dx)
        );
        const newY = Math.max(
          boardBounds.top,
          Math.min(boardBounds.bottom, startPosY + dy)
        );

        setPosition({
          x: newX,
          y: newY,
        });
      } else {
        setPosition({
          x: startPosX + dx,
          y: startPosY + dy,
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setIsDragging(false);
      // ドラッグ終了時に親コンポーネントに通知
      if (onDragEnd) {
        onDragEnd();
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`absolute cursor-move flex items-center justify-center ${width} ${height} rounded-lg`}
      style={{
        backgroundColor: color,
        transform: `translate(${position.x}px, ${position.y}px)`,
        zIndex: isDragging ? 100 : zIndex, // ドラッグ中は最上位、そうでなければ指定されたzIndex
        boxShadow: isDragging
          ? '0 10px 25px rgba(0, 0, 0, 0.2)'
          : '0 2px 5px rgba(0, 0, 0, 0.1)',
        userSelect: 'none', // テキスト選択を防止
      }}
      onMouseDown={handleMouseDown}
      onDragStart={handleDrag}
    >
      {/* ドラッグインジケータは削除 */}

      {/* メインのコンテンツ */}
      <motion.div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          userSelect: 'none', // テキスト選択を防止
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const CardComponent: React.FC<{
  initialX: number;
  initialY: number;
  color: string;
  textColor?: string;
  cardType?: 'spade' | 'diamond' | 'heart' | 'club';
  title?: string;
  useRandomInitialPosition?: boolean;
  onDragEnd?: () => number;
  zIndex?: number;
}> = ({
  initialX,
  initialY,
  color,
  textColor = 'text-amber-900',
  cardType = 'spade',
  title = 'カード',
  useRandomInitialPosition = false,
  onDragEnd,
  zIndex = 10,
}) => {
  const [isActive, setIsActive] = useState(false);
  // コンポーネント固有のzIndexステート
  // コンポーネント固有のzIndexステート - 親からの値を初期値とし、ドラッグ時に更新
  const [currentZIndex, setCurrentZIndex] = useState(zIndex);

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    if (onDragEnd) {
      const newZIndex = onDragEnd(); // 親コンポーネントのzIndexカウンターを更新し、新しい値を取得
      setCurrentZIndex(newZIndex ?? currentZIndex + 1);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
  };

  // カードタイプに応じたアイコンを選択
  const getCardIcon = () => {
    switch (cardType) {
      case 'diamond':
        return <GiDiamonds className="text-xl" />;
      case 'heart':
        return <GiHearts className="text-xl" />;
      case 'spade':
        return <GiSpades className="text-xl" />;
      case 'club':
        return <GiClubs className="text-xl" />;
      default:
        return <GiCardRandom className="text-xl" />;
    }
  };

  // カードタイプに応じた装飾マークを選択
  const getCardSymbol = () => {
    switch (cardType) {
      case 'diamond':
        return '♦';
      case 'heart':
        return '♥';
      case 'club':
        return '♣';
      default:
        return '♠';
    }
  };

  return (
    <DraggableGamePiece
      initialX={initialX}
      initialY={initialY}
      color={color}
      width="w-16"
      height="h-24"
      useRandomInitialPosition={useRandomInitialPosition}
      onDragEnd={handleDragEnd}
      zIndex={currentZIndex}
    >
      <div className="relative w-full h-full">
        {/* 選択時の緑の枠は削除 */}

        <div
          className={`w-full h-full absolute flex flex-col items-center justify-center ${textColor} 
            rounded-lg border border-amber-200/50 bg-gradient-to-b from-white/30 to-transparent relative overflow-hidden select-none`}
          onClick={handleClick}
        >
          {/* カード装飾 - 角の丸みとボーダー */}
          <div className="absolute top-1 left-1 right-1 bottom-1 border border-white/20 rounded-md pointer-events-none" />

          {/* カードの光沢効果 */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-30" />

          {/* カードのコンテンツ */}
          {getCardIcon()}
          <div className="text-xs font-bold mt-1">{title}</div>

          {/* カードの装飾マーク */}
          <div className="absolute top-1.5 left-1.5 text-[8px] opacity-70">
            {getCardSymbol()}
          </div>
          <div className="absolute bottom-1.5 right-1.5 text-[8px] opacity-70 rotate-180">
            {getCardSymbol()}
          </div>
        </div>
      </div>
    </DraggableGamePiece>
  );
};

const TokenComponent: React.FC<{
  initialX: number;
  initialY: number;
  color: string;
  shape?: 'circle' | 'square' | 'diamond';
  label?: string;
  useRandomInitialPosition?: boolean;
  onDragEnd?: () => number;
  zIndex?: number;
}> = ({
  initialX,
  initialY,
  color,
  shape = 'circle',
  label = 'TOKEN',
  useRandomInitialPosition = false,
  onDragEnd,
  zIndex = 10,
}) => {
  // コンポーネント固有のzIndexステート - 親からの値を初期値とし、ドラッグ時に更新
  const [currentZIndex, setCurrentZIndex] = useState(zIndex);

  // ドラッグ終了時の処理
  const handleDragEnd = () => {
    if (onDragEnd) {
      const newZIndex = onDragEnd(); // 親コンポーネントのzIndexカウンターを更新し、新しい値を取得
      setCurrentZIndex(newZIndex ?? currentZIndex + 1);
    }
  };

  // 形状に基づくクラス名の決定
  const getShapeClass = () => {
    switch (shape) {
      case 'square':
        return 'rounded-lg';
      case 'diamond':
        return 'rounded-lg rotate-45';
      default:
        return 'rounded-full';
    }
  };

  // アイコンの角度調整（ダイヤモンド形状の場合は逆回転）
  const getIconClass = () => {
    return shape === 'diamond' ? '-rotate-45' : '';
  };

  return (
    <DraggableGamePiece
      initialX={initialX}
      initialY={initialY}
      color={color}
      width="w-12"
      height="h-12"
      useRandomInitialPosition={useRandomInitialPosition}
      onDragEnd={handleDragEnd}
      zIndex={currentZIndex}
    >
      <div className="relative w-full h-full">
        {/* 選択時の緑の枠は削除 */}
        <div
          className={`w-full h-full ${getShapeClass()} flex items-center justify-center select-none`}
          style={{
            background: `radial-gradient(circle at 30% 30%, ${color}CC, ${color})`,
            boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.3)',
          }}
        >
          {/* トークン内の装飾パターン */}
          <div
            className={`absolute inset-2 ${getShapeClass()} border border-white/20 opacity-50`}
          />

          {/* 中央のアイコン */}
          <div
            className={`text-amber-900 flex flex-col items-center justify-center select-none ${getIconClass()}`}
          >
            <GiCube className="text-xl" />
            <div className="text-[8px] font-semibold mt-0.5">{label}</div>
          </div>
        </div>
      </div>
    </DraggableGamePiece>
  );
};

interface MiniGameBoardProps {
  className?: string;
}

const MiniGameBoard: React.FC<MiniGameBoardProps> = ({ className = '' }) => {
  // グローバルなzIndexカウンター（各コンポーネントがこれを基準に独自のzIndexを管理）
  const zIndexRef = React.useRef(20); // 初期値を設定

  // ドラッグ後にzIndexを更新するための関数
  const updateZIndex = () => {
    zIndexRef.current += 1;
    return zIndexRef.current;
  };

  return (
    <div
      style={{ maxWidth: '1440px' }}
      className={`relative w-full md:w-[95%] lg:w-[98%] xl:w-full mx-auto h-96 md:h-[28rem] lg:h-[32rem] xl:h-[40rem] bg-amber-100 rounded-2xl flex items-center justify-center overflow-hidden game-board-area ${className}`}
    >
      {/* ボードの装飾パターン - より洗練された格子パターン */}
      <div className="absolute inset-0 bg-amber-600 opacity-5">
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-5">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="border border-amber-500/10" />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/10 to-amber-600/5" />
      </div>

      {/* ゲームボード上の要素 */}
      <div className="relative w-full h-full">
        {/* 中央に配置したゲームパーツ */}

        {/* カード - 4種類（ランダム配置） */}
        <CardComponent
          initialX={0}
          initialY={0}
          useRandomInitialPosition={true}
          color="#ffe4b5"
          textColor="text-amber-800"
          cardType="spade"
          title="スペード"
          onDragEnd={updateZIndex}
          zIndex={10}
        />
        <CardComponent
          initialX={0}
          initialY={0}
          useRandomInitialPosition={true}
          color="#e6ccb2"
          textColor="text-red-900"
          cardType="diamond"
          title="ダイヤ"
          onDragEnd={updateZIndex}
          zIndex={11}
        />
        <CardComponent
          initialX={0}
          initialY={0}
          useRandomInitialPosition={true}
          color="#b5d8ff"
          textColor="text-blue-900"
          cardType="heart"
          title="ハート"
          onDragEnd={updateZIndex}
          zIndex={12}
        />
        <CardComponent
          initialX={0}
          initialY={0}
          useRandomInitialPosition={true}
          color="#d8ffb5"
          textColor="text-green-900"
          cardType="club"
          title="クローバー"
          onDragEnd={updateZIndex}
          zIndex={13}
        />

        {/* トークン - 2種類（ランダム配置） */}
        <TokenComponent
          initialX={0}
          initialY={0}
          useRandomInitialPosition={true}
          color="#f8b878"
          shape="square"
          label="キューブ"
          onDragEnd={updateZIndex}
          zIndex={14}
        />
        <TokenComponent
          initialX={0}
          initialY={0}
          useRandomInitialPosition={true}
          color="#78b8f8"
          shape="square"
          label="キューブ"
          onDragEnd={updateZIndex}
          zIndex={15}
        />

        {/* 操作説明 */}
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-amber-800/70 text-white text-xs px-2 py-1 rounded-full">
          パーツはドラッグできます
        </div>
      </div>
    </div>
  );
};

export default MiniGameBoard;
