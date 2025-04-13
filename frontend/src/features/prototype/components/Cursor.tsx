import { useEffect, useRef } from 'react';

import type { CursorInfo } from '../types/cursor';

interface CursorProps {
  // カーソルの情報
  cursor: CursorInfo;
}

export const Cursor = ({ cursor }: CursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursorRef.current) return;

    // カーソルの位置を更新
    cursorRef.current.style.transform = `translate(${cursor.position.x}px, ${cursor.position.y}px)`;
  }, [cursor.position]);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '20px',
        height: '20px',
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: '#000',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '2px 4px',
          backgroundColor: '#000',
          color: '#fff',
          fontSize: '12px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
        }}
      >
        {cursor.userName}
      </div>
    </div>
  );
};
