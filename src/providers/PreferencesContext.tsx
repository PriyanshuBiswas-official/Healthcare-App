import React, { createContext, useContext, useState, useCallback } from 'react';
import { storage } from '../lib/storage';

const STORAGE_KEY_VITALS = '@prefs/hideVitals';
const STORAGE_KEY_COMMUNITY = '@prefs/hideCommunitySpotlight';

interface PreferencesState {
  hideVitals: boolean;
  setHideVitals: (val: boolean) => void;
  hideCommunitySpotlight: boolean;
  setHideCommunitySpotlight: (val: boolean) => void;
  loaded: boolean;
}

const PreferencesContext = createContext<PreferencesState>({
  hideVitals: false,
  setHideVitals: () => {},
  hideCommunitySpotlight: false,
  setHideCommunitySpotlight: () => {},
  loaded: true,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideVitals, setHideVitalsState] = useState<boolean>(() => {
    const saved = storage.getString(STORAGE_KEY_VITALS);
    return saved !== null ? saved === 'true' : false;
  });

  const [hideCommunitySpotlight, setHideCommunitySpotlightState] = useState<boolean>(() => {
    const saved = storage.getString(STORAGE_KEY_COMMUNITY);
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

  const setHideCommunitySpotlight = useCallback((val: boolean) => {
    setHideCommunitySpotlightState(val);
    try {
      storage.set(STORAGE_KEY_COMMUNITY, String(val));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <PreferencesContext.Provider value={{ hideVitals, setHideVitals, hideCommunitySpotlight, setHideCommunitySpotlight, loaded: true }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
