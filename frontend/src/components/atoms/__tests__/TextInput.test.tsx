import { render, screen, fireEvent } from '@testing-library/react';

import TextInput from '../TextInput';

describe('TextInput', () => {
  it('calls onChange with new value on input', () => {
    const handleChange = vi.fn();
    render(<TextInput value="hello" onChange={handleChange} icon={<span />} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'world' } });
    expect(handleChange).toHaveBeenCalledWith('world');
    // value is controlled by props
    expect(input).toHaveValue('hello');
  });
});
