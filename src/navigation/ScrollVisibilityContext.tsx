import React, { createContext, useContext, useRef, useState, useCallback, useMemo } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type ScrollContextType = {
  visible: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  setForceHidden: (hidden: boolean) => void;
};

const ScrollVisibilityContext = createContext<ScrollContextType>({
  visible: true,
  onScroll: () => {},
  setForceHidden: () => {},
});

export const ScrollVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(true);
  const [forceHidden, setForceHiddenState] = useState(false);
  const lastY = useRef(0);
  const lastToggle = useRef<number>(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (forceHidden) return;
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    const now = Date.now();

    if (y < 10) {
      setVisible(true);
      return;
    }

    if (now - lastToggle.current < 120) return;

    if (dy > 6) {
      setVisible(false);
      lastToggle.current = now;
    } else if (dy < -6) {
      setVisible(true);
      lastToggle.current = now;
    }
  }, []);

  const setForceHidden = useCallback((hidden: boolean) => {
    setForceHiddenState(hidden);
  }, []);

  const value = useMemo(
    () => ({ visible: forceHidden ? false : visible, onScroll, setForceHidden }),
    [visible, forceHidden, onScroll, setForceHidden],
  );

  return (
    <ScrollVisibilityContext.Provider value={value}>
      {children}
    </ScrollVisibilityContext.Provider>
  );
};

export const useScrollVisibility = () => useContext(ScrollVisibilityContext);
