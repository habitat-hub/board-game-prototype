import Link from 'next/link';
import React from 'react';

type RowIconLinkProps = {
  href: string;
  ariaLabel: string;
  title?: string;
  variant?: 'neutral' | 'danger';
  className?: string;
  children: React.ReactNode;
};

const RowIconLink: React.FC<RowIconLinkProps> = ({
  href,
  ariaLabel,
  title,
  variant = 'neutral',
  className = '',
  children,
}) => {
  const base =
    'inline-flex items-center justify-center px-2 py-1 rounded-md shadow-sm transition-colors duration-150 focus:outline-none';
  const neutral =
    'border border-kibako-secondary/30 bg-white text-kibako-primary hover:bg-kibako-accent/20 hover:border-kibako-accent hover:shadow focus:ring-2 focus:ring-kibako-accent/50';
  const danger =
    'border border-red-200 bg-white text-red-600 hover:bg-red-100 hover:border-red-400 hover:text-red-700 hover:shadow focus:ring-2 focus:ring-red-300';

  const variantClass = variant === 'danger' ? danger : neutral;

  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={`${base} ${variantClass} ${className}`}
    >
      {children}
    </Link>
  );
};

export default RowIconLink;
