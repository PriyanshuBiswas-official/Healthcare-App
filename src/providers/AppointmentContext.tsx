import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus,
} from '../services/appointmentApi';
import {
  scheduleAppointmentNotifications,
  cancelAppointmentNotifications,
} from '../services/notificationService';
import type { Appointment, CreateAppointmentPayload, UpdateAppointmentPayload, AppointmentStatus } from '../types/appointment';

type AppointmentContextType = {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  addAppointment: (payload: CreateAppointmentPayload) => Promise<Appointment>;
  editAppointment: (id: number, payload: UpdateAppointmentPayload) => Promise<Appointment>;
  removeAppointment: (id: number) => Promise<void>;
  updateStatus: (id: number, status: AppointmentStatus) => Promise<void>;
  getUpcoming: () => Appointment[];
};

const AppointmentContext = createContext<AppointmentContextType>({
  appointments: [],
  isLoading: false,
  error: null,
  fetchAppointments: async () => {},
  addAppointment: async () => ({} as Appointment),
  editAppointment: async () => ({} as Appointment),
  removeAppointment: async () => {},
  updateStatus: async () => {},
  getUpcoming: () => [],
});

export function useAppointments() {
  return useContext(AppointmentContext);
}

export function AppointmentProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const token = session?.access_token || '';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await getAppointments(token);
      setAppointments(data);
    } catch (err: any) {
      console.error('[AppointmentContext] fetchAppointments error:', err);
      setError(err.message);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [token, fetchAppointments]);

  const addAppointment = useCallback(async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    if (!token) throw new Error('Not authenticated');
    const appointment = await createAppointment(token, payload);
    setAppointments(prev => [appointment, ...prev]);
    return appointment;
  }, [token]);

  const editAppointment = useCallback(async (id: number, payload: UpdateAppointmentPayload): Promise<Appointment> => {
    if (!token) throw new Error('Not authenticated');
    const appointment = await updateAppointment(token, id, payload);
    setAppointments(prev => prev.map(a => a.appointment_id === id ? appointment : a));
    return appointment;
  }, [token]);

  const removeAppointment = useCallback(async (id: number): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    await deleteAppointment(token, id);
    setAppointments(prev => prev.filter(a => a.appointment_id !== id));
    await cancelAppointmentNotifications(id);
  }, [token]);

  const updateStatus = useCallback(async (id: number, status: AppointmentStatus): Promise<void> => {
    if (!token) throw new Error('Not authenticated');
    const appointment = await updateAppointmentStatus(token, id, status);
    setAppointments(prev => prev.map(a => a.appointment_id === id ? appointment : a));
  }, [token]);

  const getUpcoming = useCallback((): Appointment[] => {
    return appointments.filter(a => a.status === 'UPCOMING');
  }, [appointments]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        error,
        fetchAppointments,
        addAppointment,
        editAppointment,
        removeAppointment,
        updateStatus,
        getUpcoming,
      }}>
      {children}
    </AppointmentContext.Provider>
  );
}
