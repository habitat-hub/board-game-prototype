import { vi } from 'vitest';

describe('os utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  test('detects macOS platform', async () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('MacIntel');
    const { IS_MAC, IS_WINDOWS } = await import('../os');
    expect(IS_MAC).toBe(true);
    expect(IS_WINDOWS).toBe(false);
  });

  test('detects Windows platform', async () => {
    vi.spyOn(navigator, 'platform', 'get').mockReturnValue('Win32');
    const { IS_MAC, IS_WINDOWS } = await import('../os');
    expect(IS_MAC).toBe(false);
    expect(IS_WINDOWS).toBe(true);
  });
});
