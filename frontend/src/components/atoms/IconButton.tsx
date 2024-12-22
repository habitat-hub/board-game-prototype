export default function IconButton({
  onClick,
  children,
  isActive,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  isActive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      className={`flex min-h-[28px] min-w-[28px] items-center justify-center rounded-md text-gray-500 hover:enabled:text-gray-700 focus:enabled:text-gray-700 active:enabled:text-gray-900 disabled:cursor-default disabled:opacity-50 ${
        isActive
          ? 'bg-gray-100 text-blue-600 hover:enabled:text-blue-600 focus:enabled:text-blue-600 active:enabled:text-blue-600'
          : ''
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
