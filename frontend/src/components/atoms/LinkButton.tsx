import { type VariantProps } from 'class-variance-authority';
import Link, { type LinkProps } from 'next/link';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

import { buttonStyles } from './Button';

interface LinkButtonProps
  extends LinkProps,
    VariantProps<typeof buttonStyles> {
  children: ReactNode;
  className?: string;
}

export default function LinkButton({
  children,
  variant,
  size,
  className = '',
  ...props
}: LinkButtonProps) {
  const buttonClasses = twMerge(
    buttonStyles({ variant, size }),
    className,
  );

  return (
    <Link className={buttonClasses} {...props}>
      {children}
    </Link>
  );
}
