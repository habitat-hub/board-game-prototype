import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';

import KibakoToggle from '../KibakoToggle';

describe('KibakoToggle', () => {
  it('calls onChange with new value and updates aria-checked', () => {
    const handleChange = vi.fn();

    function Wrapper() {
      const [checked, setChecked] = useState(false);
      return (
        <KibakoToggle
          checked={checked}
          onChange={(value) => {
            handleChange(value);
            setChecked(value);
          }}
        />
      );
    }

    render(<Wrapper />);
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('renders inactive label with reduced opacity', () => {
    const { rerender } = render(
      <KibakoToggle
        checked={false}
        onChange={() => {}}
        labelLeft="Left"
        labelRight="Right"
      />
    );

    expect(screen.getByRole('button', { name: 'Right' })).toHaveClass(
      'text-kibako-primary/30'
    );
    expect(screen.getByRole('button', { name: 'Left' })).toHaveClass(
      'text-kibako-primary'
    );

    rerender(
      <KibakoToggle
        checked
        onChange={() => {}}
        labelLeft="Left"
        labelRight="Right"
      />
    );

    expect(screen.getByRole('button', { name: 'Left' })).toHaveClass(
      'text-kibako-primary/30'
    );
    expect(screen.getByRole('button', { name: 'Right' })).toHaveClass(
      'text-kibako-primary'
    );
  });
});
