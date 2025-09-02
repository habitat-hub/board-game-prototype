import { render, screen } from '@testing-library/react';

import Button from '../Button';

describe('Button', () => {
  it('renders a button element with default styles', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('bg-kibako-primary');
  });

  it('shows loading state', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');

    const status = screen.getByRole('status');
    const dots = status.querySelectorAll('span');
    expect(dots).toHaveLength(3);
  });
});
