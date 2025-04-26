export default function IconButton({
  onClick,
  children,
  disabled = false,
  ariaLabel,
}: {
  // ボタンをクリックしたときの処理
  onClick: () => void;
  // ボタンの子要素
  children: React.ReactNode;
  // ボタンを無効化するか
  disabled?: boolean;
  // アクセシビリティのためのラベル
  ariaLabel?: string;
}) {
  return (
    <button
      className="flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md text-gray-500 hover:enabled:text-gray-700 focus:enabled:text-gray-700 active:enabled:text-gray-900 disabled:cursor-default disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
