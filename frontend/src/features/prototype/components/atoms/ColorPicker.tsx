/**
 * カスタムカラー選択用の小さなコンポーネント
 */

'use client';

import React, { useRef } from 'react';

import { isCustomColor } from '@/features/prototype/utils/partUtils';

type ColorPickerProps = {
  value: string;
  palette: string[];
  onChange: (color: string) => void;
  ariaLabel?: string;
};

export default function ColorPicker({
  value,
  palette,
  onChange,
  ariaLabel = 'カスタムカラーを選択',
}: ColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative inline-block">
      {/* カラーピッカー用のボタン */}
      <button
        type="button"
        className="flex items-center p-1 cursor-pointer bg-kibako-primary/30 hover:bg-kibako-primary rounded w-fit appearance-none"
        onClick={() => colorInputRef.current?.click()}
        aria-label={ariaLabel}
      >
        {/* カラープレビュー */}
        <div
          className={`w-4 h-4 rounded ${
            isCustomColor(palette, value || '')
              ? 'ring-2 ring-kibako-secondary'
              : ''
          }`}
          style={{ backgroundColor: value || '#FFFFFF' }}
          aria-hidden="true"
        />

        {/* ボタンのラベル */}
        <span className="text-kibako-white text-xs ml-2">
          カスタムカラーを選択
        </span>
      </button>

      {/*
        隠しの color input:
        透明にしてボタンに重ねることで、ネイティブのカラーピッカーが
        ボタンの近く（適切な位置）に表示されるようにする
      */}
      <input
        ref={colorInputRef}
        type="color"
        value={value || '#FFFFFF'}
        onChange={(e) => onChange(e.target.value)}
        aria-hidden="true"
        // ボタンにぴったり重ねて、ポインターイベントをキャプチャしないようにすることで、ボタン上でのホバーが機能する
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
      />
    </div>
  );
}
