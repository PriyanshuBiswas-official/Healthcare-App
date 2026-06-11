import React, { createContext, useContext, useRef, useState } from 'react';
import { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

type ScrollContextType = {
  visible: boolean;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ScrollVisibilityContext = createContext<ScrollContextType>({
  visible: true,
  onScroll: () => {},
});

export const ScrollVisibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const lastToggle = useRef<number>(0);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;
    const now = Date.now();

    if (y < 10) {
      // At top — always show
      if (!visible) setVisible(true);
      return;
    }

    // Debounce toggles
    if (now - lastToggle.current < 120) return;

    if (dy > 6 && visible) {
      setVisible(false);
      lastToggle.current = now;
    } else if (dy < -6 && !visible) {
      setVisible(true);
      lastToggle.current = now;
    }
  };

  return (
    <ScrollVisibilityContext.Provider value={{ visible, onScroll }}>
      {children}
    </ScrollVisibilityContext.Provider>
  );
};

export const useScrollVisibility = () => useContext(ScrollVisibilityContext);
