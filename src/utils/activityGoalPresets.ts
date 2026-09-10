/**
 * Activity goal presets for onboarding.
 * Each preset maps to a daily calorie burn, exercise, and step target.
 */

export interface ActivityGoalPreset {
  label: string;
  description: string;
  calorieBurnGoal: number;
  exerciseMinGoal: number;
  stepsGoal: number;
  activityLevel: string;
  icon: string;
  color: string; // hex color for icon + title
}

export const ACTIVITY_GOAL_PRESETS: ActivityGoalPreset[] = [
  {
    label: 'Fat Loss',
    description: 'Higher calorie burn with daily movement for fat loss.',
    calorieBurnGoal: 500,
    exerciseMinGoal: 60,
    stepsGoal: 10000,
    activityLevel: 'Moderately Active',
    icon: 'Flame',
    color: '#FF6B6B',
  },
  {
    label: 'Stay Fit',
    description: 'Balanced daily activity to maintain overall fitness.',
    calorieBurnGoal: 400,
    exerciseMinGoal: 45,
    stepsGoal: 8000,
    activityLevel: 'Lightly Active',
    icon: 'Heart',
    color: '#00E5A0',
  },
  {
    label: 'Build Muscle',
    description: 'Focused strength training with adequate recovery.',
    calorieBurnGoal: 350,
    exerciseMinGoal: 60,
    stepsGoal: 8000,
    activityLevel: 'Moderately Active',
    icon: 'Dumbbell',
    color: '#60A5FA',
  },
  {
    label: 'Stay Athletic',
    description: 'Active lifestyle with varied workouts and high daily steps.',
    calorieBurnGoal: 450,
    exerciseMinGoal: 50,
    stepsGoal: 10000,
    activityLevel: 'Very Active',
    icon: 'Timer',
    color: '#C084FC',
  },
  {
    label: 'Bulk / Strength',
    description: 'Heavy lifting focus with lower cardio for mass gaining.',
    calorieBurnGoal: 300,
    exerciseMinGoal: 60,
    stepsGoal: 8000,
    activityLevel: 'Moderately Active',
    icon: 'Zap',
    color: '#FFB347',
  },
  {
    label: 'Cut / Lean Out',
    description: 'Aggressive calorie burn with high steps to get lean.',
    calorieBurnGoal: 500,
    exerciseMinGoal: 60,
    stepsGoal: 10000,
    activityLevel: 'Very Active',
    icon: 'Scissors',
    color: '#00E5CC',
  },
];
