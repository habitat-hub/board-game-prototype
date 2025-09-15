import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getUIPreference, setUIPreference } from '../uiPreferences';

describe('uiPreferences', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach((key) => delete store[key]);
      }),
    };

    vi.stubGlobal('window', {
      localStorage: localStorageMock,
    } as unknown as Window);
  });

  it('stores and retrieves projectListView preference', () => {
    setUIPreference('projectListView', 'table');
    expect(getUIPreference('projectListView')).toBe('table');
  });

  it('stores and retrieves projectListSortKey preference', () => {
    setUIPreference('projectListSortKey', 'name');
    expect(getUIPreference('projectListSortKey')).toBe('name');
  });

  it('stores and retrieves projectListSortOrder preference', () => {
    setUIPreference('projectListSortOrder', 'asc');
    expect(getUIPreference('projectListSortOrder')).toBe('asc');
  });

  it('stores and retrieves isSelectionMode preference', () => {
    setUIPreference('isSelectionMode', true);
    expect(getUIPreference('isSelectionMode')).toBe(true);
  });

  it('returns true by default for isSelectionMode', () => {
    expect(getUIPreference('isSelectionMode')).toBe(true);
  });
});
