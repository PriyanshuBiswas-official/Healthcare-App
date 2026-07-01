import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
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
  hasProfile: boolean | null;
  profileCompletion: ProfileCompletion | null;
  gender: string | null;
  checkProfile: (activeSession?: Session | null) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  hasProfile: null,
  profileCompletion: null,
  gender: null,
  checkProfile: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profileCompletion, setProfileCompletion] = useState<ProfileCompletion | null>(null);
  const [gender, setGender] = useState<string | null>(null);

  const user = session?.user ?? null;

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

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!active) return;
      setSession(initialSession);
      if (initialSession) {
        checkProfile(initialSession).then(() => {
          if (active) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      if (active) setIsLoading(false);
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
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, user, isLoading, hasProfile, profileCompletion, gender, checkProfile }),
    [session, user, isLoading, hasProfile, profileCompletion, gender, checkProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
