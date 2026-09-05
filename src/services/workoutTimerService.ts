import { Platform } from 'react-native';
import {
  startWorkoutTimerNotification,
  updateWorkoutTimerNotification,
  stopWorkoutTimerNotification,
} from './notificationService';

export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerSnapshot {
  status: TimerStatus;
  elapsed: number;
}

class WorkoutTimerService {
  private status: TimerStatus = 'idle';
  private startWall: number = 0;
  private pausedElapsed: number = 0;
  private lastNotifSec: number = -1;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<() => void>();

  private clearInterval() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {}
    });
  }

  public getSnapshot(): TimerSnapshot {
    return {
      status: this.status,
      elapsed: this.getElapsed(),
    };
  }

  public getElapsed(): number {
    if (this.status === 'running' && this.startWall > 0) {
      return this.pausedElapsed + (Date.now() - this.startWall);
    }
    return this.pausedElapsed;
  }

  public getStatus(): TimerStatus {
    return this.status;
  }

  public formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  private updateTick = () => {
    const currentElapsed = this.getElapsed();
    this.notify();

    const currentSec = Math.floor(currentElapsed / 1000);
    if (currentSec !== this.lastNotifSec) {
      this.lastNotifSec = currentSec;
      if (Platform.OS === 'android') {
        updateWorkoutTimerNotification(currentSec, false).catch(() => {});
      }
    }
  };

  public async start(): Promise<void> {
    this.clearInterval();
    this.pausedElapsed = 0;
    this.startWall = Date.now();
    this.lastNotifSec = 0;
    this.status = 'running';
    this.notify();

    if (Platform.OS === 'android') {
      try {
        await startWorkoutTimerNotification(0);
      } catch {}
    }
    this.intervalId = setInterval(this.updateTick, 250);
  }

  public async pause(): Promise<void> {
    if (this.status !== 'running') return;
    this.clearInterval();
    const now = Date.now();
    if (this.startWall > 0) {
      this.pausedElapsed += now - this.startWall;
      this.startWall = 0;
    }
    this.status = 'paused';
    const pausedSec = Math.floor(this.pausedElapsed / 1000);
    this.lastNotifSec = pausedSec;
    this.notify();

    if (Platform.OS === 'android') {
      try {
        await updateWorkoutTimerNotification(pausedSec, true);
      } catch {}
    }
  }

  public async resume(): Promise<void> {
    if (this.status !== 'paused') return;
    this.clearInterval();
    this.startWall = Date.now();
    this.status = 'running';
    const currentSec = Math.floor(this.pausedElapsed / 1000);
    this.lastNotifSec = currentSec;
    this.notify();

    if (Platform.OS === 'android') {
      try {
        await updateWorkoutTimerNotification(currentSec, false);
      } catch {}
    }
    this.intervalId = setInterval(this.updateTick, 250);
  }

  public async stop(): Promise<void> {
    this.clearInterval();
    this.pausedElapsed = 0;
    this.startWall = 0;
    this.lastNotifSec = -1;
    this.status = 'idle';
    this.notify();

    if (Platform.OS === 'android') {
      try {
        await stopWorkoutTimerNotification();
      } catch {}
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const workoutTimerService = new WorkoutTimerService();
