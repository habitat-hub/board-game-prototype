import { render, screen } from '@testing-library/react';

import LinkButton from '../LinkButton';

describe('LinkButton', () => {
  it('renders a link element with button styles', () => {
    render(<LinkButton href="/test">Go</LinkButton>);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('rounded-full');
    expect(link.className).toContain('bg-kibako-primary');
  });
});
