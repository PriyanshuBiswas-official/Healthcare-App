import React, { createContext, useContext } from 'react';

interface PreferencesState {
  loaded: boolean;
}

const PreferencesContext = createContext<PreferencesState>({
  loaded: true,
});

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PreferencesContext.Provider value={{ loaded: true }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => useContext(PreferencesContext);
