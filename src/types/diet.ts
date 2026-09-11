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
  water_goal: number;
  goal_reached: boolean;
  date: string;
}

export interface WaterChallenge {
  daysComplete: number;
  totalDays: number;
  progress: number;
  streak: number;
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
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export type WeeklyWaterDay = WeeklyTrendDay;

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

// ── Meal Suggestions (Spoonacular) ───────────────────────

export interface MealSuggestion {
  id: number;
  title: string;
  image: string;
  imageType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servings: number;
  readyInMinutes: number;
  healthScore: number;
  diets: string[];
  dishTypes: string[];
  summary: string;
}

export interface MealSuggestionQuery {
  diet?: string;
  maxCalories?: number;
  minCalories?: number;
  excludeAllergens?: string;
  number?: number;
  offset?: number;
}

// ── Food Search (Auto-fill) ──────────────────────────────

export interface FoodSearchResult {
  id: number;
  title: string;
  image: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface FoodNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// ── Food Search Screen ──────────────────────────────────

export interface FoodItem {
  id: number;
  title: string;
  image: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize?: string;
}

export interface AddedFood {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  servingSize?: string;
}

export interface RecentMeal {
  food: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving_size: string | null;
  logged_at: string;
}
