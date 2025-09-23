import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { IoChevronDown } from 'react-icons/io5';

import type { RoleValue } from '@/features/role/types';

import { getRoleConfig } from './RoleBadge';

interface RoleSelectProps {
  value: RoleValue;
  onChange: (value: RoleValue) => void;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
  className?: string;
}

// Simple headless-ish custom select to allow rich option content (badges+icons)
const RoleSelect: React.FC<RoleSelectProps> = ({
  value,
  onChange,
  disabled = false,
  title,
  className = '',
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null); // wrapper (for focus styles)
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setOpen((o) => !o);
  }, [disabled]);

  const close = useCallback(() => setOpen(false), []);

  // Compute and update menu position when opened / on resize / scroll
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition, value]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (buttonRef.current && buttonRef.current.contains(target)) return; // clicking button handled separately
      if (listRef.current && listRef.current.contains(target)) return; // inside menu
      close();
    };
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, close, updatePosition]);

  const roles: RoleValue[] = ['admin', 'editor', 'viewer'];

  const handleSelect = (role: RoleValue) => {
    onChange(role);
    close();
  };

  const currentConfig = getRoleConfig(value); // still used for icon + label text only

  const iconColorClass = useMemo(() => {
    switch (value) {
      case 'admin':
        return 'text-kibako-danger';
      case 'editor':
        return 'text-kibako-info';
      case 'viewer':
      default:
        return 'text-kibako-primary';
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      title={title}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex items-center gap-2 border border-kibako-secondary/20 rounded px-3 py-2 text-sm bg-kibako-white text-kibako-primary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-kibako-primary/40 transition ${
          open ? 'ring-2 ring-kibako-primary/40' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...rest}
      >
        <div className="flex items-center gap-1.5">
          {currentConfig.icon && (
            <span className={iconColorClass}>{currentConfig.icon}</span>
          )}
          <span className="text-sm font-medium text-kibako-primary">
            {currentConfig.label}
          </span>
        </div>
        <IoChevronDown
          className={`h-4 w-4 text-kibako-secondary/70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open &&
        menuPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <ul
            ref={listRef}
            role="listbox"
            style={{
              position: 'absolute',
              top: menuPos.top,
              left: menuPos.left,
              minWidth: menuPos.width,
            }}
            className="z-[9999] mt-1 rounded-md bg-kibako-white shadow-lg border border-kibako-secondary/20 py-1 focus:outline-none max-h-60 overflow-auto"
          >
            {roles.map((role) => {
              const selected = role === value;
              const cfg = getRoleConfig(role);
              const optionIconColor =
                role === 'admin'
                  ? 'text-kibako-danger'
                  : role === 'editor'
                    ? 'text-kibako-info'
                    : 'text-kibako-primary';
              return (
                <li
                  key={role}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(role)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(role);
                    }
                  }}
                  tabIndex={0}
                  className={`cursor-pointer select-none px-2 py-1.5 flex items-center gap-2 text-xs rounded mx-1 mb-0.5 last:mb-0 outline-none ${
                    selected
                      ? 'bg-kibako-primary/10 ring-1 ring-kibako-primary/30'
                      : 'hover:bg-kibako-tertiary/20'
                  }`}
                >
                  {cfg.icon && (
                    <span className={optionIconColor}>{cfg.icon}</span>
                  )}
                  <span className="font-medium text-kibako-primary">
                    {cfg.label}
                  </span>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
};

export default RoleSelect;
