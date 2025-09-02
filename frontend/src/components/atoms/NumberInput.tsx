import React, { ReactNode } from 'react';

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.valueAsNumber;

    if (isNaN(newValue)) {
      onChange(newValue);
      return;
    }

    newValue = Math.min(max ?? newValue, Math.max(min ?? newValue, newValue));
    onChange(newValue);
  };

  return (
    <div className="relative h-fit w-full">
      <input
        type="number"
        value={value}
        onChange={handleChange}
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
