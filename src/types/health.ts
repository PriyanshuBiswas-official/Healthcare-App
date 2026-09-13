export interface MoodLog {
  id: number;
  user_id: number;
  date: string;
  mood: string;
  energy_level: string;
  libido: number | null;
  focus_level: number | null;
  stress: number | null;
  stress_level: number | null;
  created_at: string;
}

export interface SleepLog {
  sleep_id: number;
  user_id: number;
  sleep_hr: number;
  sleep_quality: number | null;
  date: string;
  notes: string | null;
  created_at: string;
}

export interface DischargeLog {
  discharge_id: number;
  user_id: number;
  date: string | null;
  discharge_type: string | null;
  texture: string | null;
  color: string | null;
  amount: number | null;
  created_at: string;
}

export interface SymptomsLog {
  symptoms_id: number;
  user_id: number;
  date: string;
  symptom: string;
  severity: number | null;
  created_at: string;
}

export interface PeriodLog {
  period_id: number;
  user_id: number;
  period_start_date: string;
  day_no: number;
  flow_intensity: string | null;
  Flow_color: string | null;
  cramps: string | null;
  clots: string | null;
  cycle_id: number | null;
  created_at: string;
}

export interface CycleInsight {
  predict_start_date: string;
  predict_end_date: string;
  predict_follicular_start: string;
  predict_follicular_end: string;
  predict_ovulation_start: string;
  predict_ovulation_end: string;
  predict_luteal_start: string;
  predict_luteal_end: string;
  predict_fertile_start: string;
  predict_fertile_end: string;
  confidence: number;
}

export interface HormoneLevel {
  value: string;
  status: string;
  pct: number;
}

export interface HormoneSnapshot {
  estrogen: HormoneLevel;
  progesterone: HormoneLevel;
  lh_surge: HormoneLevel;
  cortisol: HormoneLevel;
  fsh: HormoneLevel;
}

export interface CycleData {
  cycle_id: number;
  user_id: number;
  start_date: string;
  cycle_length: number;
  avg_cycle_length: number;
  period_length: number;
  regularity: string;
  // Computed by backend
  current_cycle_day: number;
  current_phase: string;
  phase_color: string;
  days_until_next_period: number;
  ovulation_day: number;
  fertile_window_start: number;
  fertile_window_end: number;
  is_fertile: boolean;
  hormone_snapshot: HormoneSnapshot;
}

export interface CycleHistoryEntry {
  cycle_id: number;
  user_id: number;
  start_date: string;
  end_date: string;
  cycle_length: number;
  avg_cycle_length: number;
  period_length: number;
  regularity: string;
}

export interface WeightEntry {
  id: number;
  user_id: number;
  weight_kg: number;
  date: string;
  created_at: string;
}

export interface FemaleHealthData {
  cycleData: CycleData | null;
  insights: CycleInsight[];
  periodLogs: PeriodLog[];
  moodLogs: MoodLog[];
  dischargeLogs: DischargeLog[];
  symptomsLogs: SymptomsLog[];
}

export interface HealthScore {
  score_id: number;
  user_id: number;
  activity_score: number | null;
  nutrition_score: number | null;
  sleep_score: number | null;
  hydration_score: number | null;
  MoodStress_score: number | null;
  challenge_score: number | null;
  total_score: number | null;
  date: string;
  created_at: string;
  updated_at: string | null;
}

export interface DashboardHealthScore {
  score: number;
  isLimitedData: boolean;
  message?: string;
}
