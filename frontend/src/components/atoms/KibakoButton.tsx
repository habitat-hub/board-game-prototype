import { cva, type VariantProps } from 'class-variance-authority';
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

export const buttonStyles = cva(
  'inline-flex items-center justify-center text-sm font-bold rounded-xl shadow-sm transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-kibako-primary disabled:opacity-80 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:
          'bg-kibako-white text-kibako-primary hover:shadow-lg hover:scale-105',
        accent:
          'bg-kibako-accent text-kibako-white hover:shadow-lg hover:scale-105 hover:bg-kibako-accent/90',
        outline:
          'bg-transparent text-kibako-primary border border-kibako-primary/30 hover:border-kibako-primary/50 hover:shadow-lg hover:scale-105',
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

interface KibakoButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonStyles> {
  children: ReactNode;
  className?: string;
  isLoading?: boolean;
}

export default function KibakoButton({
  children,
  variant,
  size,
  type = 'button',
  className = '',
  isLoading = false,
  ...props
}: KibakoButtonProps) {
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
  ) : (
    // ボタン
    <button type={type} className={buttonClasses} {...props}>
      {children}
    </button>
  );
}
