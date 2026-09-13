import {
  initialize,
  getSdkStatus,
  requestPermission,
  getGrantedPermissions,
  aggregateRecord,
  insertRecords,
  readRecords,
  openHealthConnectSettings,
  SdkAvailabilityStatus,
  type Permission,
} from 'react-native-health-connect';

export type HCStatus = 'unavailable' | 'needs-update' | 'available' | 'not-granted' | 'error';

export interface HCTodayData {
  steps: number;
  activeCalories: number;
  distance: number;
  exerciseMinutes: number;
  sleepMinutes: number;
}

const PHASE1_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'SleepSession' },
];

export async function checkHCAvailability(): Promise<HCStatus> {
  try {
    const status = await getSdkStatus();
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) return 'unavailable';
    if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'needs-update';
    const initialized = await initialize();
    if (!initialized) return 'error';
    return 'available';
  } catch {
    return 'error';
  }
}

export async function requestHCPermissions(): Promise<boolean> {
  try {
    const granted = await requestPermission(PHASE1_PERMISSIONS);
    return granted.length === PHASE1_PERMISSIONS.length;
  } catch {
    return false;
  }
}

export async function hasPermissions(): Promise<boolean> {
  try {
    const perms = await getGrantedPermissions();
    return PHASE1_PERMISSIONS.every(required =>
      perms.some(g => g.recordType === required.recordType && g.accessType === required.accessType)
    );
  } catch {
    return false;
  }
}

export async function getTodayHealthData(): Promise<HCTodayData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = now.toISOString();

  const stepsRaw: any = await aggregateRecord({
    recordType: 'Steps',
    timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: end },
  }).catch(() => ({}));

  const calRaw: any = await aggregateRecord({
    recordType: 'ActiveCaloriesBurned',
    timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: end },
  }).catch(() => ({}));

  const distRaw: any = await aggregateRecord({
    recordType: 'Distance',
    timeRangeFilter: { operator: 'between', startTime: startOfDay, endTime: end },
  }).catch(() => ({}));

  const sleepRecs = await readRecords('SleepSession', {
    timeRangeFilter: {
      operator: 'between',
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: end,
    },
  }).catch(() => ({ records: [] }));

  const steps = stepsRaw.COUNT_TOTAL ?? stepsRaw.count ?? 0;
  const activeCalories = calRaw.ACTIVE_CALORIES_TOTAL?.inKilocalories ?? Math.round((calRaw.inCalories ?? 0) / 1000);
  const distance = distRaw.DISTANCE?.inMeters != null
    ? Math.round(distRaw.DISTANCE.inMeters / 1000 * 100) / 100
    : Math.round((distRaw.inMeters ?? 0) / 1000 * 100) / 100;

  let sleepMinutes = 0;
  if (sleepRecs.records && sleepRecs.records.length > 0) {
    const latest = sleepRecs.records.sort(
      (a: any, b: any) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    )[0];
    sleepMinutes = Math.round((new Date(latest.endTime).getTime() - new Date(latest.startTime).getTime()) / 60000);
  }

  return { steps, activeCalories, distance, exerciseMinutes: 0, sleepMinutes };
}

export async function logExerciseToHC(params: {
  title: string;
  startTime: string;
  endTime: string;
  exerciseType?: number;
}): Promise<string | null> {
  try {
    const ids = await insertRecords([{
      recordType: 'ExerciseSession',
      title: params.title,
      startTime: params.startTime,
      endTime: params.endTime,
      exerciseType: params.exerciseType ?? 0,
    }]);
    return ids[0] ?? null;
  } catch (e) {
    return null;
  }
}

export function openHCSettings() {
  return openHealthConnectSettings();
}
