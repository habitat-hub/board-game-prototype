import { ChangeEvent, useEffect, useState } from 'react';

const Dropdown = ({
  value,
  onChange,
  options,
  className,
}: {
  // 選択されている値
  value: string;
  // 値が変更されたときの処理
  onChange: (value: string) => void;
  // 選択肢
  options: string[];
  // カスタムクラス
  className?: string;
}) => {
  // 選択されている値
  const [selectedValue, setSelectedValue] = useState(value);

  // 選択されている値が変更されら、最新化
  // TODO: 外で値を管理した方が良いかも（整合性が取れなくなりそう）
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  /**
   * 選択されている値が変更されたときの処理
   */
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelectedValue(newValue);
    onChange(newValue);
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <select
        value={selectedValue}
        onChange={handleChange}
        className="w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f5] px-2 py-1 text-xs hover:bg-[#e8e8e8]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Dropdown;
