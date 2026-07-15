import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type NetworkContextType = {
  isConnected: boolean;
  isInitialCheck: boolean;
};

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInitialCheck: true,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isInitialCheck, setIsInitialCheck] = useState(true);

  useEffect(() => {
    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setIsInitialCheck(false);
    });

    // Real-time listener
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isInitialCheck }}>
      {children}
    </NetworkContext.Provider>
  );
};

/** One-time connectivity check for startup */
export const checkInitialConnectivity = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};
