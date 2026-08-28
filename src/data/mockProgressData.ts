// Deterministic pseudo-random based on a string seed
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  let state = Math.abs(hash) || 1;
  return () => {
    state = (state * 16807 + 0) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export interface ProgressDataPoint {
  date: string;
  value: number;
}

// Exercises with baseline 0 or not listed = no chart shown
const EXERCISE_BASELINES: Record<string, number> = {
  'bench press': 60,
  'incline bench press': 50,
  'dumbbell bench press': 24,
  'dumbbell fly': 14,
  'cable fly': 15,
  'overhead press': 40,
  'dumbbell shoulder press': 16,
  'lateral raise': 8,
  'front raise': 6,
  'face pull': 15,
  'arnold press': 14,
  'barbell row': 50,
  'dumbbell row': 22,
  'lat pulldown': 40,
  'seated cable row': 35,
  'deadlift': 80,
  'barbell curl': 25,
  'dumbbell curl': 10,
  'hammer curl': 10,
  'tricep pushdown': 20,
  'skull crushers': 20,
  'barbell squat': 60,
  'goblet squat': 16,
  'leg press': 100,
  'romanian deadlift': 50,
  'leg curl': 30,
  'leg extension': 30,
  'calf raise': 40,
  'walking lunges': 14,
  'russian twist': 8,
  'ab rollout': 8,
};

export function getMockProgressData(exerciseName: string): ProgressDataPoint[] {
  const key = exerciseName.toLowerCase().trim();
  const baseline = EXERCISE_BASELINES[key] ?? 20;

  const rand = seededRandom(exerciseName);
  const points: ProgressDataPoint[] = [];
  const now = new Date();
  let currentWeight = baseline;

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - (i * 7 + Math.floor(rand() * 3)));

    const roll = rand();
    if (roll < 0.55) {
      currentWeight += baseline >= 50 ? 2.5 : (baseline >= 15 ? 1 : 0.5);
    } else if (roll > 0.92) {
      currentWeight -= baseline >= 50 ? 2.5 : 1;
    }

    const variance = (rand() - 0.5) * (baseline >= 50 ? 2 : 1);

    points.push({
      date: date.toISOString().split('T')[0],
      value: Math.round((currentWeight + variance) * 10) / 10,
    });
  }

  return points;
}
