import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type ScrollContextType = {
  visible: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  setForceHidden: (hidden: boolean) => void;
  resetVisibility: () => void;
};

const ScrollVisibilityContext = createContext<ScrollContextType>({
  visible: true,
  onScroll: () => {},
  setForceHidden: () => {},
  resetVisibility: () => {},
});

export const ScrollVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(true);
  const [forceHidden, setForceHiddenState] = useState(false);
  const lastY = useRef(0);
  const lastToggle = useRef<number>(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (forceHidden) return;
    const y = e.nativeEvent.contentOffset.y;

    // Always keep tab bar visible near top of screen
    if (y <= 20) {
      setVisible(true);
      lastY.current = y;
      return;
    }

    const dy = y - lastY.current;
    lastY.current = y;

    // Promptly hide when scrolling down, show when scrolling up
    if (dy > 2) {
      setVisible(false);
    } else if (dy < -2) {
      setVisible(true);
    }
  }, [forceHidden]);

  const setForceHidden = useCallback((hidden: boolean) => {
    setForceHiddenState(hidden);
  }, []);

  const resetVisibility = useCallback(() => {
    lastY.current = 0;
    setVisible(true);
  }, []);

  const value = useMemo(
    () => ({ visible: forceHidden ? false : visible, onScroll, setForceHidden, resetVisibility }),
    [visible, forceHidden, onScroll, setForceHidden, resetVisibility],
  );

  return (
    <ScrollVisibilityContext.Provider value={value}>
      {children}
    </ScrollVisibilityContext.Provider>
  );
};

export const useScrollVisibility = () => useContext(ScrollVisibilityContext);
