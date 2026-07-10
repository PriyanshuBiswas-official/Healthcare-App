import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  loaded: false,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideVitals, setHideVitalsState] = useState(true);
  const [hideCommunitySpotlight, setHideCommunitySpotlightState] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_VITALS),
      AsyncStorage.getItem(STORAGE_KEY_COMMUNITY),
    ]).then(([vitals, community]) => {
      if (vitals !== null) setHideVitalsState(vitals === 'true');
      if (community !== null) setHideCommunitySpotlightState(community === 'true');
      setLoaded(true);
    });
  }, []);

  const setHideVitals = useCallback((val: boolean) => {
    setHideVitalsState(val);
    AsyncStorage.setItem(STORAGE_KEY_VITALS, String(val));
  }, []);

  const setHideCommunitySpotlight = useCallback((val: boolean) => {
    setHideCommunitySpotlightState(val);
    AsyncStorage.setItem(STORAGE_KEY_COMMUNITY, String(val));
  }, []);

  return (
    <PreferencesContext.Provider value={{ hideVitals, setHideVitals, hideCommunitySpotlight, setHideCommunitySpotlight, loaded }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
