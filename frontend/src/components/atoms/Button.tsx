import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  className?: string;
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  href,
  className = '',
  isLoading = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-block rounded-full font-semibold transition-colors';

  const variants = {
    primary: 'bg-kibako-primary text-kibako-white hover:bg-kibako-primary/80',
    outline:
      'bg-transparent text-kibako-primary/70 hover:text-kibako-primary border border-kibako-primary/30 hover:border-kibako-primary/50',
  };

  const sizes = {
    sm: 'px-6 py-3 text-base',
    md: 'px-8 py-4 text-lg',
    lg: 'px-10 py-5 text-xl',
  };

  const buttonClasses = twMerge(
    [baseStyles, variants[variant], sizes[size], className].join(' ')
  );

  return isLoading ? (
    // ローディング中(3つのドットを点滅表示)
    <button type={type} className={buttonClasses} {...props}>
      {/* NOTE: ローディング中は子要素を非表示にする(ボタンの横幅を維持するためinvisibleを使用) */}
      <div className="invisible h-0">{children}</div>
      <div className="flex items-center justify-center gap-2">
        <span className="animate-pulse text-lg">・</span>
        <span className="animate-pulse text-lg">・</span>
        <span className="animate-pulse text-lg">・</span>
      </div>
    </button>
  ) : href ? (
    // リンク
    <Link href={href} className={buttonClasses}>
      {children}
    </Link>
  ) : (
    // ボタン
    <button type={type} className={buttonClasses} {...props}>
      {children}
    </button>
  );
}
