import React, { ChangeEvent, ReactNode, useEffect, useState } from 'react';

const TextInput = ({
  value,
  onChange,
  icon,
  classNames,
}: {
  value: string;
  onChange: (value: string) => void;
  icon: ReactNode;
  classNames?: string;
}) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleCommit = () => {
    onChange(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommit();
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  return (
    <div className={`relative h-fit ${classNames ?? 'w-28'}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        className={`h-fit w-full rounded-lg border border-[#f5f5f5] bg-[#f5f5f5] px-2 py-1 pl-6 text-xs hover:border-[#e8e8e8]`}
      />
      {React.isValidElement(icon) && icon.type === 'p' ? (
        <p className="absolute left-2 top-[50%] -translate-y-1/2 text-[10px] text-gray-400">
          {
            (icon as React.ReactElement<{ children: React.ReactNode }>).props
              .children
          }
        </p>
      ) : (
        React.cloneElement(icon as React.ReactElement, {
          className:
            'absolute left-1.5 top-[50%] h-3 w-3 -translate-y-1/2 text-gray-400',
        })
      )}
    </div>
  );
};

export default TextInput;
