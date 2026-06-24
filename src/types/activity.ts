export interface ActivitySummary {
  steps: number;
  distance: number;
  calories_burned: number;
  exercise_minutes: number;
}

export interface WorkoutSet {
  set_id: number;
  exercise_id: number;
  set_no: number;
  weight: number;
  reps: number;
  completed: boolean;
  logged_at: string;
}

export interface TodayExercise {
  exercise_id: number;
  exercise_name: string;
  exercise_order: number;
  target_sets: number;
  target_reps: number;
  target_weight: number | null;
  rest_seconds: number | null;
  logged_sets: WorkoutSet[];
}

export interface TodayWorkout {
  plan_name: string | null;
  day_name: string | null;
  day_no: number | null;
  exercises: TodayExercise[];
}

export interface WeeklyDay {
  day: string;
  date: string;
  is_today: boolean;
  calories: number;
  duration: number;
  steps: number;
}

export interface WeeklyStats {
  sessions: number;
  total_time_minutes: number;
  kcal_burned: number;
  total_steps: number;
}

export interface WeeklyData {
  days: WeeklyDay[];
  stats: WeeklyStats;
}

export interface PersonalRecord {
  pr_id: number;
  exercise_name: string;
  weight: number;
  reps: number;
  description: string | null;
  achieved_at: string;
}
