import { render, screen } from '@testing-library/react';

import Button from '../Button';

describe('Button', () => {
  it('renders a button element with default styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).toContain('rounded-xl');
    expect(button.className).toContain('bg-kibako-white');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    // three dots are rendered when loading
    const dots = screen.getAllByText('・');
    expect(dots).toHaveLength(3);
  });
});
