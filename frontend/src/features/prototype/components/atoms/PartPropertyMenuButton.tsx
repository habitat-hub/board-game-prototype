import { ReactNode } from 'react';

type Props = {
  // ボタンのテキスト
  text: string;
  // ボタンのアイコン
  icon: ReactNode;
  // ボタンが無効化されているか
  disabled?: boolean;
  // ボタンをクリックしたときの処理
  onClick?: () => void;
};

const PartPropertyMenuButton = ({
  text,
  icon,
  disabled = false,
  onClick,
}: Props) => {
  return (
    <button
      className="flex items-center gap-2 rounded px-2 py-1 text-xs text-kibako-white bg-kibako-primary/30 hover:bg-kibako-primary"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      {text}
    </button>
  );
};

export default PartPropertyMenuButton;
