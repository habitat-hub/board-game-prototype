import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { IoChevronDown } from 'react-icons/io5';

import { getRoleConfig } from './RoleBadge';

export type RoleValue = 'admin' | 'editor' | 'viewer';

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setOpen((o) => !o);
  }, [disabled]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

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
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex items-center gap-2 border border-kibako-secondary/20 rounded px-2 py-1 text-sm bg-kibako-white text-kibako-primary disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-kibako-primary/40 transition ${
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
          <span className="text-xs font-medium text-kibako-primary">
            {currentConfig.label}
          </span>
        </div>
        <IoChevronDown
          className={`h-4 w-4 text-kibako-secondary/70 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 min-w-full rounded-md bg-kibako-white shadow-lg border border-kibako-secondary/20 py-1 focus:outline-none max-h-60 overflow-auto"
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
        </ul>
      )}
    </div>
  );
};

export default RoleSelect;
