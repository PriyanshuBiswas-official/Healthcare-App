export type AppointmentStatus = 'UPCOMING' | 'COMPLETED' | 'CANCELLED';

export interface Appointment {
  appointment_id: number;
  user_id: number;
  doctor_name: string;
  speciality: string;
  date_with_time: string;
  notes: string | null;
  location: string | null;
  status: AppointmentStatus;
  remind_1d: boolean;
  remind_2h: boolean;
  remind_custom: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CreateAppointmentPayload {
  doctor_name: string;
  speciality: string;
  date_with_time: string;
  notes?: string;
  location?: string;
  remind_1d?: boolean;
  remind_2h?: boolean;
  remind_custom?: string;
}

export interface UpdateAppointmentPayload {
  doctor_name?: string;
  speciality?: string;
  date_with_time?: string;
  notes?: string;
  location?: string;
  remind_1d?: boolean;
  remind_2h?: boolean;
  remind_custom?: string;
}
