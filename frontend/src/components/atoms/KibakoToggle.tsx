import React, { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

type KibakoToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  labelLeft?: ReactNode;
  labelRight?: ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  /** トラック背景を状態に応じて変えるか（デフォルト: true） */
  shouldChangeBackground?: boolean;
  /** @deprecated タイポ。shouldChangeBackground を使用してください */
  shouldChangeBackgroud?: boolean;
};

/**
 * KibakoToggle
 * A simple, accessible toggle switch using the kibako color palette.
 */
export default function KibakoToggle({
  checked,
  onChange,
  labelLeft,
  labelRight,
  id,
  className = '',
  disabled = false,
  ariaLabel,
  shouldChangeBackground = true,
  shouldChangeBackgroud,
}: KibakoToggleProps) {
  // 旧プロップが指定されている場合はそれを優先
  const effectiveShouldChangeBackground =
    typeof shouldChangeBackgroud === 'boolean'
      ? shouldChangeBackgroud
      : shouldChangeBackground;
  const baseWrapper = twMerge(
    'inline-flex items-center gap-2 select-none',
    className
  );
  const trackBg = effectiveShouldChangeBackground
    ? checked
      ? 'bg-kibako-primary'
      : 'bg-kibako-tertiary'
    : 'bg-kibako-tertiary';
  const trackClasses = twMerge(
    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-kibako-secondary/30 transition-colors duration-200 focus:outline-none',
    trackBg,
    disabled ? 'opacity-60 cursor-not-allowed' : ''
  );
  const knobClasses = twMerge(
    'pointer-events-none absolute left-0.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-kibako-white ring-1 ring-kibako-primary/30 shadow-sm transition-transform duration-200',
    checked ? 'translate-x-5' : 'translate-x-0'
  );

  return (
    <div className={baseWrapper} aria-disabled={disabled}>
      {labelLeft ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(false)}
          className={twMerge(
            'inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium focus:outline-none',
            checked ? 'text-kibako-primary/70' : 'text-kibako-primary',
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer hover:opacity-80'
          )}
        >
          <span>{labelLeft}</span>
        </button>
      ) : null}
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        className={trackClasses}
        onClick={() => !disabled && onChange(!checked)}
      >
        <span className="sr-only">Toggle</span>
        <span aria-hidden="true" className={knobClasses} />
      </button>
      {labelRight ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(true)}
          className={twMerge(
            'inline-flex items-center gap-1 rounded px-1 py-0.5 text-xs font-medium focus:outline-none',
            checked ? 'text-kibako-primary' : 'text-kibako-primary/70',
            disabled
              ? 'cursor-not-allowed opacity-60'
              : 'cursor-pointer hover:opacity-80'
          )}
        >
          <span>{labelRight}</span>
        </button>
      ) : null}
    </div>
  );
}
