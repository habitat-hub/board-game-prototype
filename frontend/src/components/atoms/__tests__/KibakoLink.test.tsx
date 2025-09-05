import { render, screen } from '@testing-library/react';

import KibakoLink from '../KibakoLink';

describe('KibakoLink', () => {
  it('renders a link element with button styles', () => {
    render(<KibakoLink href="/test">Go</KibakoLink>);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('rounded-xl');
    expect(link.className).toContain('bg-kibako-white');
  });
});
