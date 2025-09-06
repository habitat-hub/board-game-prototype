const UI_PREFERENCES_KEY = 'uiPreferences';

export type ProjectListView = 'card' | 'table';

export type UIPreferences = {
  projectListView?: ProjectListView;
  // add more preferences here
};

// Runtime validator for known preference keys/values
const isValidPreferenceValue = <K extends keyof UIPreferences>(
  key: K,
  value: UIPreferences[K]
): boolean => {
  if (key === 'projectListView') {
    return value === 'card' || value === 'table';
  }
  return true;
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
  const value = prefs[key];
  return isValidPreferenceValue(key, value) ? value : undefined;
};

export const setUIPreference = <K extends keyof UIPreferences>(
  key: K,
  value: UIPreferences[K]
): void => {
  // Guard against invalid/corrupted values before persisting
  if (!isValidPreferenceValue(key, value)) return;
  const prefs = loadUIPreferences();
  prefs[key] = value;
  saveUIPreferences(prefs);
};
