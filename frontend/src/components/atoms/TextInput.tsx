import React, { ReactNode } from 'react';

type TextInputProps = {
  // 入力値
  value: string;
  // 値が変更されたときのコールバック
  onChange: (value: string) => void;
  // 入力欄の前に表示するアイコン
  icon: ReactNode;
  // 複数行入力を許可するか
  multiline?: boolean;
  // 複数行入力時にリサイズを許可するか
  resizable?: boolean;
};

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  icon,
  multiline = false,
  resizable = false,
}) => {
  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="relative h-fit w-full">
      <InputComponent
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={multiline ? 3 : undefined}
        className={`h-fit w-full rounded-lg border border-[#f5f5f5] bg-[#f5f5f5] px-2 py-1 pl-6 text-xs hover:border-[#e8e8e8] ${
          multiline && !resizable
            ? 'resize-none'
            : multiline && resizable
              ? 'resize-y'
              : ''
        }`}
      />
      <p className="absolute left-2 top-2 text-[10px] text-gray-400">{icon}</p>
    </div>
  );
};

export default TextInput;
