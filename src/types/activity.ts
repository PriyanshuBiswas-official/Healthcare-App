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
  equipment: string | null;
  muscle_group: string | null;
  exercise_type: string | null;
  logged_sets: WorkoutSet[];
  last_performance: {
    weight: number;
    reps: number;
    completed: boolean;
    sets_completed: number;
    sets_total: number;
  } | null;
  completed: boolean;
}

export interface TodayWorkout {
  plan_name: string | null;
  plan_id: number | null;
  plan_day_id: number | null;
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

export interface ActivityGoal {
  activity_goal_id: number;
  user_id: number;
  calorie_burn_goal: number;
  exercise_min_goal: number;
  steps_goal: number;
  created_at: string;
}

export interface WorkoutPlanDay {
  day_name: string;
  day_no: number;
}

export interface WorkoutPlanDays {
  plan_name: string | null;
  days: WorkoutPlanDay[];
}

// ── Exercise metadata types ─────────────────────────────────

export const EQUIPMENT_OPTIONS = [
  'None',
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Machine',
  'Plate',
  'Resistance Band',
  'Suspension Band',
  'Other',
] as const;

export type ExerciseEquipment = typeof EQUIPMENT_OPTIONS[number];

export const MUSCLE_GROUP_OPTIONS = [
  'Abdominals',
  'Abductors',
  'Adductors',
  'Biceps',
  'Calves',
  'Cardio',
  'Chest',
  'Forearms',
  'Full Body',
  'Glutes',
  'Hamstrings',
  'Lats',
  'Lower Back',
  'Neck',
  'Shoulders',
  'Traps',
  'Triceps',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUP_OPTIONS[number];

export const EXERCISE_TYPE_OPTIONS = [
  'Weight & Reps',
  'Bodyweight Reps',
  'Weighted Bodyweight',
  'Assisted Bodyweight',
  'Duration',
  'Duration & Weight',
  'Distance & Duration',
  'Weight & Distance',
] as const;

export type ExerciseType = typeof EXERCISE_TYPE_OPTIONS[number];

export interface PredefinedExercise {
  id: string;
  name: string;
  equipment: ExerciseEquipment;
  muscle_group: MuscleGroup;
  exercise_type: ExerciseType;
  instructions?: string[];
  videoUrl?: string;
}
