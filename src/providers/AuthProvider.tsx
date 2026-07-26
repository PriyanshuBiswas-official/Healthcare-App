import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API_BASE_URL, fetchWithTimeout } from '../config/api';
import { checkInitialConnectivity } from '../services/networkService';
import { checkMaintenance, MaintenanceData } from '../services/maintenanceService';

export interface ProfileCompletion {
  percentage: number;
  sections: {
    basic_info: boolean;
    medical_conditions: boolean;
    medications: boolean;
    allergies: boolean;
    nutrition: boolean;
    fitness: boolean;
    gender_specific: boolean;
  };
  completed: boolean;
}

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  loadProgress: number;
  hasProfile: boolean | null;
  profileCompletion: ProfileCompletion | null;
  gender: string | null;
  networkError: string | null;
  maintenanceData: MaintenanceData | null;
  checkProfile: (activeSession?: Session | null) => Promise<boolean>;
  clearNetworkError: () => void;
  retryAfterNetworkError: () => void;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  loadProgress: 0,
  hasProfile: null,
  profileCompletion: null,
  gender: null,
  networkError: null,
  maintenanceData: null,
  checkProfile: async () => false,
  clearNetworkError: () => {},
  retryAfterNetworkError: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = session?.user ?? null;

  const clearNetworkError = useCallback(() => setNetworkError(null), []);

  const retryAfterNetworkError = useCallback(() => {
    setNetworkError(null);
    setIsLoading(true);
    // Re-run the full init flow
    (async () => {
      try {
        const hasNetwork = await checkInitialConnectivity();
        if (!hasNetwork) {
          setNetworkError('no-internet');
          setIsLoading(false);
          return;
        }
        const maintenance = await checkMaintenance();
        if (maintenance) {
          setMaintenanceData(maintenance);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    })();
  }, []);

  // Drive smooth progress between milestones
  const startProgress = useCallback((from: number, to: number, durationMs: number) => {
    if (progressRef.current) clearInterval(progressRef.current);
    setLoadProgress(from);
    const step = (to - from) / (durationMs / 40);
    progressRef.current = setInterval(() => {
      setLoadProgress((prev) => {
        const next = prev + step;
        if (next >= to) {
          if (progressRef.current) clearInterval(progressRef.current);
          return to;
        }
        return next;
      });
    }, 40);
  }, []);

  const checkProfile = useCallback(async (activeSession?: Session | null): Promise<boolean> => {
    const targetSession = activeSession !== undefined ? activeSession : session;
    if (!targetSession?.access_token) {
      setHasProfile(null);
      setProfileCompletion(null);
      return false;
    }

    try {
      const res = await fetchWithTimeout(
        `${API_BASE_URL}/api/profile`,
        { headers: { Authorization: `Bearer ${targetSession.access_token}` } },
        8000,
      );
      if (res.status === 200) {
        const json = await res.json();
        if (json.success && json.data) {
          setHasProfile(true);
          setGender(json.data.gender || null);
          if (json.profile_completion) {
            setProfileCompletion(json.profile_completion);
          }
          return true;
        }
      }
      setHasProfile(false);
      setProfileCompletion(null);
      setGender(null);
      return false;
    } catch (e) {
      console.warn('[AuthProvider] checkProfile failed:', e);
      setHasProfile(false);
      setProfileCompletion(null);
      setGender(null);
      return false;
    }
  }, [session]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      startProgress(0, 25, 2000);

      // 1. Auth session
      let initialSession: Session | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        initialSession = data.session;
      } catch {
        // auth failed
      }
      if (!active) return;
      setSession(initialSession);

      // 2. Profile (if logged in)
      if (initialSession) {
        startProgress(25, 70, 3000);
        await checkProfile(initialSession);
      }
      if (!active) return;

      // 3. Network check
      startProgress(70, 85, 1500);
      const hasNetwork = await checkInitialConnectivity();
      if (!active) return;

      if (!hasNetwork) {
        if (progressRef.current) clearInterval(progressRef.current);
        setNetworkError('no-internet');
        setIsLoading(false);
        return;
      }

      // 4. Maintenance check
      startProgress(85, 95, 1000);
      const maintenance = await checkMaintenance();
      if (!active) return;

      if (maintenance) {
        if (progressRef.current) clearInterval(progressRef.current);
        setMaintenanceData(maintenance);
        setIsLoading(false);
        return;
      }

      // 5. Done
      if (progressRef.current) clearInterval(progressRef.current);
      setLoadProgress(100);
      setTimeout(() => {
        if (active) setIsLoading(false);
      }, 300);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      if (newSession) {
        checkProfile(newSession);
      } else {
        setHasProfile(null);
        setProfileCompletion(null);
        setGender(null);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      if (progressRef.current) clearInterval(progressRef.current);
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session, user, isLoading, loadProgress, hasProfile, profileCompletion, gender,
      networkError, maintenanceData, checkProfile, clearNetworkError, retryAfterNetworkError,
    }),
    [session, user, isLoading, loadProgress, hasProfile, profileCompletion, gender,
     networkError, maintenanceData, checkProfile, clearNetworkError, retryAfterNetworkError],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
