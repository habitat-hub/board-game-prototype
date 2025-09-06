const UI_PREFERENCES_KEY = 'uiPreferences';

export type UIPreferences = {
  projectListView?: 'card' | 'table';
  // add more preferences here
};

export const loadUIPreferences = (): UIPreferences => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(UI_PREFERENCES_KEY);
    return stored ? (JSON.parse(stored) as UIPreferences) : {};
  } catch {
    return {};
  }
};

export const saveUIPreferences = (prefs: UIPreferences): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(prefs));
  } catch {
    // ignore write errors
  }
};

export const getUIPreference = <K extends keyof UIPreferences>(
  key: K
): UIPreferences[K] | undefined => {
  const prefs = loadUIPreferences();
  return prefs[key];
};

export const setUIPreference = <K extends keyof UIPreferences>(
  key: K,
  value: UIPreferences[K]
): void => {
  const prefs = loadUIPreferences();
  prefs[key] = value;
  saveUIPreferences(prefs);
};
