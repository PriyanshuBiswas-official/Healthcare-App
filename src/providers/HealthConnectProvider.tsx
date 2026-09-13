import React, { createContext, useState, useEffect, useCallback, useRef, useContext } from 'react';
import * as hc from '../services/healthConnect';
import { useAuth } from './AuthProvider';

interface HCContextValue {
  status: hc.HCStatus;
  todayData: hc.HCTodayData | null;
  loading: boolean;
  syncToday: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  openSettings: () => void;
}

const HealthConnectContext = createContext<HCContextValue>({
  status: 'unavailable',
  todayData: null,
  loading: false,
  syncToday: async () => {},
  requestPermissions: async () => false,
  openSettings: () => {},
});

export function useHealthConnect() {
  return useContext(HealthConnectContext);
}

export function HealthConnectProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [status, setStatus] = useState<hc.HCStatus>('unavailable');
  const [todayData, setTodayData] = useState<hc.HCTodayData | null>(null);
  const [loading, setLoading] = useState(false);
  const initRef = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;

  const syncToday = useCallback(async () => {
    if (statusRef.current !== 'available') return;
    setLoading(true);
    try {
      const data = await hc.getTodayHealthData();
      setTodayData(data);
    } catch (e) {
      console.warn('[HCProvider] Sync failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      const s = await hc.checkHCAvailability();
      setStatus(s);
      statusRef.current = s;
      if (s === 'available') {
        const has = await hc.hasPermissions();
        if (has) {
          await syncToday();
        }
      }
    })();
  }, [syncToday]);

  const requestPermissions = useCallback(async () => {
    const granted = await hc.requestHCPermissions();
    if (granted) {
      statusRef.current = 'available';
      setStatus('available');
      setLoading(true);
      try {
        const data = await hc.getTodayHealthData();
        setTodayData(data);
      } catch (e) {
        console.warn('[HCProvider] Post-permission sync failed:', e);
      } finally {
        setLoading(false);
      }
    }
    return granted;
  }, []);

  return (
    <HealthConnectContext.Provider value={{
      status,
      todayData,
      loading,
      syncToday,
      requestPermissions,
      openSettings: hc.openHCSettings,
    }}>
      {children}
    </HealthConnectContext.Provider>
  );
}
