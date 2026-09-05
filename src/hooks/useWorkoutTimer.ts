import { useState, useEffect } from 'react';
import { workoutTimerService, TimerStatus } from '../services/workoutTimerService';

export type { TimerStatus };

export interface UseWorkoutTimerReturn {
  status: TimerStatus;
  elapsed: number;
  formatted: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useWorkoutTimer(): UseWorkoutTimerReturn {
  const [snapshot, setSnapshot] = useState(() => workoutTimerService.getSnapshot());

  useEffect(() => {
    setSnapshot(workoutTimerService.getSnapshot());
    const unsubscribe = workoutTimerService.subscribe(() => {
      setSnapshot(workoutTimerService.getSnapshot());
    });
    return unsubscribe;
  }, []);

  return {
    status: snapshot.status,
    elapsed: snapshot.elapsed,
    formatted: workoutTimerService.formatTime(snapshot.elapsed),
    start: () => { workoutTimerService.start(); },
    pause: () => { workoutTimerService.pause(); },
    resume: () => { workoutTimerService.resume(); },
    stop: () => { workoutTimerService.stop(); },
  };
}
