import React, {
  ChangeEvent,
  ReactNode,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';

const TextInput = ({
  value,
  onChange,
  icon,
  classNames,
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  classNames?: string;
  multiline?: boolean;
}) => {
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearDebounceTimer = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  };

  const setDebounceTimer = useCallback(() => {
    clearDebounceTimer();
    debounceTimerRef.current = setTimeout(() => {
      onChange(inputValue);
    }, 500);
  }, [inputValue, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    setDebounceTimer();
    return clearDebounceTimer;
  }, [setDebounceTimer]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !multiline) {
      clearDebounceTimer();
      onChange(inputValue);
      (e.currentTarget as HTMLElement).blur();
    }
  };

  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`relative h-fit ${classNames ?? 'w-28'}`}>
      <InputComponent
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        rows={multiline ? 3 : undefined}
        className={`h-fit w-full rounded-lg border border-[#f5f5f5] bg-[#f5f5f5] px-2 py-1 pl-6 text-xs hover:border-[#e8e8e8] ${
          multiline ? 'resize-none' : ''
        }`}
      />
      {React.isValidElement(icon) && icon.type === 'p' ? (
        <p className="absolute left-2 top-2 text-[10px] text-gray-400">
          {
            (icon as React.ReactElement<{ children: React.ReactNode }>).props
              .children
          }
        </p>
      ) : (
        React.cloneElement(icon as React.ReactElement, {
          className: 'absolute left-1.5 top-2 h-3 w-3 text-gray-400',
        })
      )}
    </div>
  );
};

export default TextInput;
