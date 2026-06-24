export interface NutritionLog {
  nutrition_id: number;
  user_id: number;
  food: string;
  taken_as: string;
  serving_size: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fiber: number;
  fat: number;
  logged_at: string;
}

export interface WaterLog {
  water_id: number;
  user_id: number;
  amount_in_ml: number;
  logged_at: string;
}

export interface NutritionGoal {
  nutrition_id: number;
  user_id: number;
  calorie_goal: number;
  water_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  fiber_goal: number;
  created_at: string;
}

export interface DayMealsResponse {
  meals: NutritionLog[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
}

export interface DayWaterResponse {
  logs: WaterLog[];
  total_ml: number;
}

export interface WeeklyTrendDay {
  day: string;
  val: number;
  date: string;
  today: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';
