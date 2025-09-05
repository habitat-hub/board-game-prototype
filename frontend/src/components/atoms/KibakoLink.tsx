import { type VariantProps } from 'class-variance-authority';
import Link, { type LinkProps } from 'next/link';
import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

import { buttonStyles } from './KibakoButton';

interface KibakoLinkProps
  extends LinkProps,
    VariantProps<typeof buttonStyles> {
  children: ReactNode;
  className?: string;
}

export default function KibakoLink({
  children,
  variant,
  size,
  className = '',
  ...props
}: KibakoLinkProps) {
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
