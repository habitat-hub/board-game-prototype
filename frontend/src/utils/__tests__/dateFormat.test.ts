import { describe, it, expect } from 'vitest';

import formatDate from '../dateFormat';

describe('formatDate', () => {
  it('formats a string date without time', () => {
    const result = formatDate('2021-01-01');
    expect(result).toBe('2021/01/01');
  });

  it('formats a Date object with time when withTime=true', () => {
    const result = formatDate(new Date('2021-01-01'), true);
    expect(result).toBe('2021/01/01 00:00:00');
  });
});
