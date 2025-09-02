import { render, screen, fireEvent } from '@testing-library/react';

import NumberInput from '../NumberInput';

describe('NumberInput', () => {
  it('calls onChange with new value on input', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={1} onChange={handleChange} icon={<span />} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '2' } });
    expect(handleChange).toHaveBeenCalledWith(2);
    // value is controlled by props
    expect(input).toHaveValue(1);
  });

  it('clamps value within min and max', () => {
    const handleChange = vi.fn();
    render(
      <NumberInput
        value={5}
        min={0}
        max={10}
        onChange={handleChange}
        icon={<span />}
      />
    );
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '20' } });
    expect(handleChange).toHaveBeenCalledWith(10);
  });
});
