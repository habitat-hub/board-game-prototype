import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  className?: string;
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  className = '',
  isLoading = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-block rounded-full font-semibold transition-colors';

  const variants = {
    primary: 'bg-kibako-primary text-kibako-white hover:bg-kibako-primary/80',
    secondary:
      'bg-kibako-secondary/90 text-kibako-white hover:bg-kibako-secondary/80',
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
    <button className={buttonClasses} {...props}>
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
    <button className={buttonClasses} {...props}>
      {children}
    </button>
  );
}
