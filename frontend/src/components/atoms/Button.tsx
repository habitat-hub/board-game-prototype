import { cva, type VariantProps } from 'class-variance-authority';
import Link from 'next/link';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

const buttonStyles = cva(
  'inline-block rounded-full font-semibold transition-colors',
  {
    variants: {
      variant: {
        primary:
          'bg-kibako-primary text-kibako-white hover:bg-kibako-primary/80',
        accent: 'bg-kibako-accent text-kibako-white hover:bg-kibako-accent/80',
        outline:
          'bg-transparent text-kibako-primary/70 hover:text-kibako-primary border border-kibako-primary/30 hover:border-kibako-primary/50',
      },
      size: {
        sm: 'px-6 py-3 text-base',
        md: 'px-8 py-4 text-lg',
        lg: 'px-10 py-5 text-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  children: ReactNode;
  href?: string;
  className?: string;
  isLoading?: boolean;
}

export default function Button({
  children,
  variant,
  size,
  type = 'button',
  href,
  className = '',
  isLoading = false,
  ...props
}: ButtonProps) {
  const buttonClasses = twMerge(
    buttonStyles({ variant, size }),
    className,
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
