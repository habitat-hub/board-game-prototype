import { render, screen, fireEvent } from '@testing-library/react';

import Dropdown from '../Dropdown';

describe('Dropdown', () => {
  it('calls onChange with selected value', () => {
    const handleChange = vi.fn();
    render(<Dropdown value="A" options={['A', 'B']} onChange={handleChange} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'B' } });
    expect(handleChange).toHaveBeenCalledWith('B');
  });
});
