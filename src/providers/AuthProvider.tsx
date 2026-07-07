import React, { createContext, useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { API_BASE_URL } from '../config/api';

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
  checkProfile: (activeSession?: Session | null) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  loadProgress: 0,
  hasProfile: null,
  profileCompletion: null,
  gender: null,
  checkProfile: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const user = session?.user ?? null;

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
      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${targetSession.access_token}` },
      });
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
      // If we get here, the profile wasn't found (404) or there was a server error
      // Default to true so we don't lock the user into onboarding if the backend is down
      setHasProfile(true);
      setProfileCompletion(null);
      setGender(null);
      return false;
    } catch (e) {
      console.warn('[AuthProvider] checkProfile failed:', e);
      // Default to true on network error to allow app access
      setHasProfile(true);
      setProfileCompletion(null);
      setGender(null);
      return false;
    }
  }, [session]);

  useEffect(() => {
    let active = true;

    // Step 1: Session check — fill 0% → 25% over 2s estimate
    startProgress(0, 25, 2000);

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!active) return;
      setSession(initialSession);
      if (initialSession) {
        // Step 2: Profile check — fill 25% → 90% over 4s estimate
        startProgress(25, 90, 4000);
        checkProfile(initialSession).then(() => {
          if (!active) return;
          // Step 3: Done — snap to 100%
          if (progressRef.current) clearInterval(progressRef.current);
          setLoadProgress(100);
          setTimeout(() => setIsLoading(false), 300);
        });
      } else {
        if (progressRef.current) clearInterval(progressRef.current);
        setLoadProgress(100);
        setTimeout(() => setIsLoading(false), 300);
      }
    }).catch(() => {
      if (!active) return;
      if (progressRef.current) clearInterval(progressRef.current);
      setLoadProgress(100);
      setTimeout(() => setIsLoading(false), 300);
    });

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
    () => ({ session, user, isLoading, loadProgress, hasProfile, profileCompletion, gender, checkProfile }),
    [session, user, isLoading, loadProgress, hasProfile, profileCompletion, gender, checkProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
