import { render, screen } from '@testing-library/react';

import KibakoButton from '../KibakoButton';
describe('KibakoButton', () => {
  it('renders a button element with default styles', () => {
    render(<KibakoButton>Click me</KibakoButton>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).toContain('rounded-xl');
    expect(button.className).toContain('bg-kibako-white');
  });

  it('shows loading state', () => {
    render(<KibakoButton isLoading>Loading</KibakoButton>);
    // three dots are rendered when loading
    const dots = screen.getAllByText('・');
    expect(dots).toHaveLength(3);
  });

  it('applies danger variant styles', () => {
    render(<KibakoButton variant="danger">Delete</KibakoButton>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-kibako-danger');
  });
});
