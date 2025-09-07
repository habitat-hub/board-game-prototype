export const IS_MAC =
  typeof navigator !== 'undefined' &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const IS_WINDOWS =
  typeof navigator !== 'undefined' && /Win/.test(navigator.platform);
