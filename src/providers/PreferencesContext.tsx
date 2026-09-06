import React, { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../lib/storage';

const STORAGE_KEY_VITALS = '@prefs/hideVitals';

interface PreferencesState {
  hideVitals: boolean;
  setHideVitals: (val: boolean) => void;
  loaded: boolean;
}

const PreferencesContext = createContext<PreferencesState>({
  hideVitals: false,
  setHideVitals: () => {},
  loaded: true,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideVitals, setHideVitalsState] = useState<boolean>(() => {
    const saved = storage.getString(STORAGE_KEY_VITALS);
    return saved !== null ? saved === 'true' : false;
  });

  const setHideVitals = useCallback((val: boolean) => {
    setHideVitalsState(val);
    try {
      storage.set(STORAGE_KEY_VITALS, String(val));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <PreferencesContext.Provider value={{ hideVitals, setHideVitals, loaded: true }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
