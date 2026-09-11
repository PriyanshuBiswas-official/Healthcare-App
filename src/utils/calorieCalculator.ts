/**
 * TDEE / BMR Calculator using Mifflin-St Jeor equation
 * and preset goal computation for onboarding.
 */

interface UserProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string; // 'male' | 'female' | 'other'
  activityLevel: string; // 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active'
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  'Sedentary': 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 */
function calcBMR(profile: UserProfile): number {
  const { weightKg, heightCm, age, gender } = profile;
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else if (gender === 'female') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }
  // 'other' — average of male and female
  const male = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  return (male + female) / 2;
}

/**
 * Calculate TDEE from BMR and activity level
 */
export function calcTDEE(profile: UserProfile): number {
  const bmr = calcBMR(profile);
  const multiplier = ACTIVITY_MULTIPLIERS[profile.activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

// ── Diet Goal Presets ──────────────────────────────────────────

export interface DietGoalPreset {
  label: string;
  description: string;
  calorieAdjustment: number;
  proteinPerKg: number;
  carbsPercent: number;
  fatPercent: number;
  fiberGrams: number;
  waterMl: number;
  icon: string;
  color: string; // hex color for icon + title
}

export const DIET_GOAL_PRESETS: DietGoalPreset[] = [
  {
    label: 'Lose Fat',
    description: 'Calorie deficit with high protein to preserve muscle while losing fat.',
    calorieAdjustment: -500,
    proteinPerKg: 2.0,
    carbsPercent: 40,
    fatPercent: 25,
    fiberGrams: 30,
    waterMl: 2500,
    icon: 'Flame',
    color: '#FF6B6B',
  },
  {
    label: 'Maintain Weight',
    description: 'Balanced nutrition to sustain your current weight and energy levels.',
    calorieAdjustment: 0,
    proteinPerKg: 1.6,
    carbsPercent: 45,
    fatPercent: 25,
    fiberGrams: 30,
    waterMl: 2500,
    icon: 'Scale',
    color: '#00E5A0',
  },
  {
    label: 'Gain Muscle',
    description: 'Calorie surplus with high protein to support muscle growth.',
    calorieAdjustment: 300,
    proteinPerKg: 1.8,
    carbsPercent: 50,
    fatPercent: 20,
    fiberGrams: 35,
    waterMl: 2500,
    icon: 'Dumbbell',
    color: '#60A5FA',
  },
  {
    label: 'Improve Endurance',
    description: 'Slightly higher calories with carb-focused fuel for endurance training.',
    calorieAdjustment: 200,
    proteinPerKg: 1.4,
    carbsPercent: 55,
    fatPercent: 20,
    fiberGrams: 35,
    waterMl: 3000,
    icon: 'Timer',
    color: '#C084FC',
  },
];

/**
 * Compute diet goals from a preset and user profile
 */
export function computeDietGoals(
  preset: DietGoalPreset,
  profile: UserProfile,
): {
  calorie_goal: number;
  water_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  fiber_goal: number;
} {
  const tdee = calcTDEE(profile);
  const calorieGoal = Math.max(1200, tdee + preset.calorieAdjustment);

  const proteinGrams = Math.round(profile.weightKg * preset.proteinPerKg);
  const proteinCalories = proteinGrams * 4;

  const fatCalories = Math.round(calorieGoal * (preset.fatPercent / 100));
  const fatGrams = Math.round(fatCalories / 9);

  const carbsCalories = Math.round(calorieGoal * (preset.carbsPercent / 100));
  const carbsGrams = Math.round(carbsCalories / 4);

  return {
    calorie_goal: Math.round(calorieGoal),
    water_goal: preset.waterMl,
    protein_goal: proteinGrams,
    carbs_goal: carbsGrams,
    fat_goal: fatGrams,
    fiber_goal: preset.fiberGrams,
  };
}
