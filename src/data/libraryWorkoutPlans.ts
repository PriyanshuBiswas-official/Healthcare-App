export interface LibraryPlanExercise {
  exercise_name: string;
  exercise_order: number;
  sets: number;
  reps: number;
  equipment: string | null;
  muscle_group: string | null;
  exercise_type: string | null;
}

export interface LibraryPlanDay {
  day_no: number;
  day_name: string;
  exercises: LibraryPlanExercise[];
}

export interface LibraryWorkoutPlan {
  id: string;
  plan_name: string;
  description: string;
  goal: string;
  best_for: string;
  days_per_week: number;
  days: LibraryPlanDay[];
}

export const LIBRARY_WORKOUT_PLANS: LibraryWorkoutPlan[] = [
  // ── 1. Push Pull Legs (PPL) ──
  {
    id: 'ppl-6day',
    plan_name: 'Push Pull Legs',
    description: 'A classic 6-day split that hits each muscle group twice per week. Train push muscles, pull muscles, and legs on separate days for maximum volume and recovery.',
    goal: 'Build muscle & strength',
    best_for: 'Intermediate lifters',
    days_per_week: 6,
    days: [
      {
        day_no: 1,
        day_name: 'Push',
        exercises: [
          { exercise_name: 'Bench Press', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Incline Bench Press', exercise_order: 2, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Shoulder Press', exercise_order: 3, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Lateral Raise', exercise_order: 4, sets: 3, reps: 15, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Tricep Pushdown', exercise_order: 5, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Triceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Overhead Press', exercise_order: 6, sets: 3, reps: 8, equipment: 'Barbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 2,
        day_name: 'Pull',
        exercises: [
          { exercise_name: 'Deadlift', exercise_order: 1, sets: 4, reps: 6, equipment: 'Barbell', muscle_group: 'Lower Back', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Barbell Row', exercise_order: 2, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Pull Ups', exercise_order: 3, sets: 3, reps: 10, equipment: 'None', muscle_group: 'Lats', exercise_type: 'Bodyweight Reps' },
          { exercise_name: 'Seated Cable Row', exercise_order: 4, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Face Pull', exercise_order: 5, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Barbell Curl', exercise_order: 6, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 3,
        day_name: 'Legs',
        exercises: [
          { exercise_name: 'Barbell Squat', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Romanian Deadlift', exercise_order: 2, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Press', exercise_order: 3, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Curl', exercise_order: 4, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Extension', exercise_order: 5, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Calf Raise', exercise_order: 6, sets: 4, reps: 15, equipment: 'Machine', muscle_group: 'Calves', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 4,
        day_name: 'Push',
        exercises: [
          { exercise_name: 'Dumbbell Bench Press', exercise_order: 1, sets: 4, reps: 10, equipment: 'Dumbbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Cable Fly', exercise_order: 2, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Arnold Press', exercise_order: 3, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Lateral Raise', exercise_order: 4, sets: 3, reps: 15, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Skull Crushers', exercise_order: 5, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Triceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Push Ups', exercise_order: 6, sets: 3, reps: 15, equipment: 'None', muscle_group: 'Chest', exercise_type: 'Bodyweight Reps' },
        ],
      },
      {
        day_no: 5,
        day_name: 'Pull',
        exercises: [
          { exercise_name: 'Pull Ups', exercise_order: 1, sets: 4, reps: 8, equipment: 'None', muscle_group: 'Lats', exercise_type: 'Bodyweight Reps' },
          { exercise_name: 'Dumbbell Row', exercise_order: 2, sets: 4, reps: 10, equipment: 'Dumbbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Lat Pulldown', exercise_order: 3, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Face Pull', exercise_order: 4, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Curl', exercise_order: 5, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Hammer Curl', exercise_order: 6, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 6,
        day_name: 'Legs',
        exercises: [
          { exercise_name: 'Goblet Squat', exercise_order: 1, sets: 4, reps: 10, equipment: 'Kettlebell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Romanian Deadlift', exercise_order: 2, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Walking Lunges', exercise_order: 3, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Extension', exercise_order: 4, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Curl', exercise_order: 5, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Calf Raise', exercise_order: 6, sets: 4, reps: 15, equipment: 'Machine', muscle_group: 'Calves', exercise_type: 'Weight & Reps' },
        ],
      },
    ],
  },

  // ── 2. Full Body Strength ──
  {
    id: 'fullbody-3day',
    plan_name: 'Full Body Strength',
    description: 'A 3-day full body program that trains every major muscle group each session. Perfect for building a solid foundation of strength and muscle.',
    goal: 'Build foundational strength',
    best_for: 'Beginners',
    days_per_week: 3,
    days: [
      {
        day_no: 1,
        day_name: 'Monday',
        exercises: [
          { exercise_name: 'Barbell Squat', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Bench Press', exercise_order: 2, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Barbell Row', exercise_order: 3, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Overhead Press', exercise_order: 4, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Plank', exercise_order: 5, sets: 3, reps: 1, equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Duration' },
        ],
      },
      {
        day_no: 3,
        day_name: 'Wednesday',
        exercises: [
          { exercise_name: 'Deadlift', exercise_order: 1, sets: 4, reps: 6, equipment: 'Barbell', muscle_group: 'Lower Back', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Bench Press', exercise_order: 2, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Pull Ups', exercise_order: 3, sets: 3, reps: 8, equipment: 'None', muscle_group: 'Lats', exercise_type: 'Bodyweight Reps' },
          { exercise_name: 'Dumbbell Shoulder Press', exercise_order: 4, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Curl', exercise_order: 5, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 5,
        day_name: 'Friday',
        exercises: [
          { exercise_name: 'Barbell Squat', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Incline Bench Press', exercise_order: 2, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Lat Pulldown', exercise_order: 3, sets: 3, reps: 10, equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Romanian Deadlift', exercise_order: 4, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Crunches', exercise_order: 5, sets: 3, reps: 15, equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Bodyweight Reps' },
        ],
      },
    ],
  },

  // ── 3. Upper Lower Split ──
  {
    id: 'upperlower-4day',
    plan_name: 'Upper Lower Split',
    description: 'A 4-day split alternating between upper body and lower body训练. Each muscle group gets trained twice a week with adequate recovery between sessions.',
    goal: 'Balanced muscle growth',
    best_for: 'Intermediate lifters',
    days_per_week: 4,
    days: [
      {
        day_no: 1,
        day_name: 'Upper Body',
        exercises: [
          { exercise_name: 'Bench Press', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Barbell Row', exercise_order: 2, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Overhead Press', exercise_order: 3, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Lat Pulldown', exercise_order: 4, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Curl', exercise_order: 5, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Tricep Pushdown', exercise_order: 6, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Triceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 2,
        day_name: 'Lower Body',
        exercises: [
          { exercise_name: 'Barbell Squat', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Romanian Deadlift', exercise_order: 2, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Press', exercise_order: 3, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Curl', exercise_order: 4, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Extension', exercise_order: 5, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Calf Raise', exercise_order: 6, sets: 4, reps: 15, equipment: 'Machine', muscle_group: 'Calves', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 4,
        day_name: 'Upper Body',
        exercises: [
          { exercise_name: 'Dumbbell Bench Press', exercise_order: 1, sets: 4, reps: 10, equipment: 'Dumbbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Row', exercise_order: 2, sets: 4, reps: 10, equipment: 'Dumbbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Arnold Press', exercise_order: 3, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Seated Cable Row', exercise_order: 4, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Hammer Curl', exercise_order: 5, sets: 3, reps: 10, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Skull Crushers', exercise_order: 6, sets: 3, reps: 10, equipment: 'Barbell', muscle_group: 'Triceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 5,
        day_name: 'Lower Body',
        exercises: [
          { exercise_name: 'Goblet Squat', exercise_order: 1, sets: 4, reps: 10, equipment: 'Kettlebell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Deadlift', exercise_order: 2, sets: 4, reps: 6, equipment: 'Barbell', muscle_group: 'Lower Back', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Walking Lunges', exercise_order: 3, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Extension', exercise_order: 4, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Leg Curl', exercise_order: 5, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Calf Raise', exercise_order: 6, sets: 4, reps: 15, equipment: 'Machine', muscle_group: 'Calves', exercise_type: 'Weight & Reps' },
        ],
      },
    ],
  },

  // ── 4. Shred & Burn ──
  {
    id: 'shred-5day',
    plan_name: 'Shred & Burn',
    description: 'A high-intensity 5-day program combining resistance training with metabolic conditioning. Designed to preserve muscle while maximizing calorie burn.',
    goal: 'Fat loss & endurance',
    best_for: 'Weight loss',
    days_per_week: 5,
    days: [
      {
        day_no: 1,
        day_name: 'Chest & Triceps',
        exercises: [
          { exercise_name: 'Bench Press', exercise_order: 1, sets: 4, reps: 10, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Incline Bench Press', exercise_order: 2, sets: 3, reps: 12, equipment: 'Barbell', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Cable Fly', exercise_order: 3, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Chest', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Push Ups', exercise_order: 4, sets: 3, reps: 20, equipment: 'None', muscle_group: 'Chest', exercise_type: 'Bodyweight Reps' },
          { exercise_name: 'Tricep Pushdown', exercise_order: 5, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Triceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 2,
        day_name: 'Back & Biceps',
        exercises: [
          { exercise_name: 'Deadlift', exercise_order: 1, sets: 4, reps: 8, equipment: 'Barbell', muscle_group: 'Lower Back', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Pull Ups', exercise_order: 2, sets: 4, reps: 10, equipment: 'None', muscle_group: 'Lats', exercise_type: 'Bodyweight Reps' },
          { exercise_name: 'Seated Cable Row', exercise_order: 3, sets: 3, reps: 12, equipment: 'Machine', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Barbell Curl', exercise_order: 4, sets: 3, reps: 12, equipment: 'Barbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Hammer Curl', exercise_order: 5, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 3,
        day_name: 'Legs & Core',
        exercises: [
          { exercise_name: 'Barbell Squat', exercise_order: 1, sets: 4, reps: 10, equipment: 'Barbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Romanian Deadlift', exercise_order: 2, sets: 3, reps: 12, equipment: 'Barbell', muscle_group: 'Hamstrings', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Walking Lunges', exercise_order: 3, sets: 3, reps: 15, equipment: 'Dumbbell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Plank', exercise_order: 4, sets: 3, reps: 1, equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Duration' },
          { exercise_name: 'Russian Twist', exercise_order: 5, sets: 3, reps: 20, equipment: 'Plate', muscle_group: 'Abdominals', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 4,
        day_name: 'Shoulders & Arms',
        exercises: [
          { exercise_name: 'Overhead Press', exercise_order: 1, sets: 4, reps: 10, equipment: 'Barbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Lateral Raise', exercise_order: 2, sets: 3, reps: 15, equipment: 'Dumbbell', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Face Pull', exercise_order: 3, sets: 3, reps: 15, equipment: 'Machine', muscle_group: 'Shoulders', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Dumbbell Curl', exercise_order: 4, sets: 3, reps: 12, equipment: 'Dumbbell', muscle_group: 'Biceps', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Skull Crushers', exercise_order: 5, sets: 3, reps: 12, equipment: 'Barbell', muscle_group: 'Triceps', exercise_type: 'Weight & Reps' },
        ],
      },
      {
        day_no: 5,
        day_name: 'Full Body HIIT',
        exercises: [
          { exercise_name: 'Goblet Squat', exercise_order: 1, sets: 3, reps: 15, equipment: 'Kettlebell', muscle_group: 'Glutes', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Push Ups', exercise_order: 2, sets: 3, reps: 20, equipment: 'None', muscle_group: 'Chest', exercise_type: 'Bodyweight Reps' },
          { exercise_name: 'Dumbbell Row', exercise_order: 3, sets: 3, reps: 15, equipment: 'Dumbbell', muscle_group: 'Lats', exercise_type: 'Weight & Reps' },
          { exercise_name: 'Jump Rope', exercise_order: 4, sets: 3, reps: 1, equipment: 'None', muscle_group: 'Cardio', exercise_type: 'Duration' },
          { exercise_name: 'Hanging Leg Raise', exercise_order: 5, sets: 3, reps: 15, equipment: 'None', muscle_group: 'Abdominals', exercise_type: 'Bodyweight Reps' },
        ],
      },
    ],
  },
];
