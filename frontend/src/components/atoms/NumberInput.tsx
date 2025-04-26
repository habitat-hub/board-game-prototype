import React, { ReactNode, useState } from 'react';

const NumberInput = ({
  value,
  onChange,
  min,
  max,
  icon,
}: {
  // 入力値
  value: number;
  // 値が変更されたときのコールバック
  onChange: (value: number) => void;
  // 最小値
  min?: number;
  // 最大値
  max?: number;
  // アイコン
  icon: ReactNode;
}) => {
  // 入力値
  const [inputValue, setInputValue] = useState(value?.toString() || '');

  /**
   * 値が変更されたときの処理
   */
  const handleChange = () => {
    const newValue = parseFloat(inputValue);

    if (isNaN(newValue)) {
      setInputValue(value.toString());
      return;
    }

    const clampedValue = Math.min(
      max ?? newValue,
      Math.max(min ?? newValue, newValue)
    );
    onChange(clampedValue);
  };

  /**
   * キー押下時の処理
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;

    handleChange();
    (e.currentTarget as HTMLInputElement).blur();
  };

  return (
    <div className="relative h-fit w-full">
      <input
        type="number"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleChange}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        className={`h-fit w-full rounded-lg border border-[#f5f5f5] bg-[#f5f5f5] px-2 py-1 pl-6 text-xs hover:border-[#e8e8e8]`}
      />
      <p className="absolute left-2 top-[50%] -translate-y-1/2 text-[10px] text-gray-400">
        {icon}
      </p>
    </div>
  );
};

export default NumberInput;
