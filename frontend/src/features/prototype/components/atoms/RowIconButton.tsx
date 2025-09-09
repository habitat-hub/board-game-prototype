import React from 'react';

type RowIconButtonProps = {
  ariaLabel: string;
  title?: string;
  onClick?: () => void;
  variant?: 'neutral' | 'danger';
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
};

const RowIconButton: React.FC<RowIconButtonProps> = ({
  ariaLabel,
  title,
  onClick,
  variant = 'neutral',
  className = '',
  disabled = false,
  children,
}) => {
  const base =
    'inline-flex items-center justify-center px-2 py-1 rounded-md shadow-sm transition-colors duration-150 focus:outline-none';
  const neutral =
    'border border-kibako-secondary/30 bg-white text-kibako-primary hover:bg-kibako-accent/20 hover:border-kibako-accent hover:shadow focus:ring-2 focus:ring-kibako-accent/50';
  const danger =
    'border border-red-200 bg-white text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-700 hover:shadow focus:ring-2 focus:ring-red-300';

  const variantClass = variant === 'danger' ? danger : neutral;
  const disabledClass = disabled ? ' opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={`${base} ${variantClass}${disabledClass} ${className}`}
    >
      {children}
    </button>
  );
};

export default RowIconButton;
