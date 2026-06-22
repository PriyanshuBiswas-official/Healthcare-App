import AsyncStorage from '@react-native-async-storage/async-storage';

export type SectionStatus = 'pending' | 'completed' | 'skipped';

export interface SectionData {
  status: SectionStatus;
  data?: Record<string, any>;
}

export interface ProfileCompletion {
  basic_info: SectionData;
  medical_history: SectionData;
  medications: SectionData;
  allergies: SectionData;
  emergency_contact: SectionData;
  gender_specific: SectionData;
}

const STORAGE_KEY = '@profile_completion';
const TOTAL_SECTIONS = 6;

const DEFAULT_COMPLETION: ProfileCompletion = {
  basic_info: { status: 'pending' },
  medical_history: { status: 'pending' },
  medications: { status: 'pending' },
  allergies: { status: 'pending' },
  emergency_contact: { status: 'pending' },
  gender_specific: { status: 'pending' },
};

export async function getProfileCompletion(): Promise<ProfileCompletion> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[ProfileCompletion] Failed to load:', e);
  }
  return { ...DEFAULT_COMPLETION };
}

export async function saveSection(
  sectionId: keyof ProfileCompletion,
  data: Record<string, any>,
): Promise<ProfileCompletion> {
  const completion = await getProfileCompletion();
  completion[sectionId] = { status: 'completed', data };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completion));
  return completion;
}

export async function skipSection(
  sectionId: keyof ProfileCompletion,
): Promise<ProfileCompletion> {
  const completion = await getProfileCompletion();
  completion[sectionId] = { status: 'skipped' };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completion));
  return completion;
}

export async function resetSection(
  sectionId: keyof ProfileCompletion,
): Promise<ProfileCompletion> {
  const completion = await getProfileCompletion();
  completion[sectionId] = { status: 'pending' };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(completion));
  return completion;
}

export async function resetAllSections(): Promise<ProfileCompletion> {
  const fresh = { ...DEFAULT_COMPLETION };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

export function calculatePercentage(completion: ProfileCompletion): number {
  const sections = Object.values(completion);
  const skipped = sections.filter(s => s.status === 'skipped').length;
  const completed = sections.filter(s => s.status === 'completed').length;
  const effective = TOTAL_SECTIONS - skipped;
  if (effective === 0) return 100;
  return Math.round((completed / effective) * 100);
}

export function isProfileComplete(completion: ProfileCompletion): boolean {
  return calculatePercentage(completion) === 100;
}

export const SECTION_META: Record<
  keyof ProfileCompletion,
  { title: string; icon: string; description: string }
> = {
  basic_info: {
    title: 'Basic Info',
    icon: '👤',
    description: 'Date of birth, height, weight',
  },
  medical_history: {
    title: 'Medical History',
    icon: '📋',
    description: 'Conditions, surgeries',
  },
  medications: {
    title: 'Medications',
    icon: '💊',
    description: 'Current prescriptions',
  },
  allergies: {
    title: 'Allergies',
    icon: '⚠️',
    description: 'Drug & food allergies',
  },
  emergency_contact: {
    title: 'Emergency Contact',
    icon: '🆘',
    description: 'Who to call in an emergency',
  },
  gender_specific: {
    title: 'Health Profile',
    icon: '🩺',
    description: 'Gender-specific health data',
  },
};

export const SECTION_ORDER: (keyof ProfileCompletion)[] = [
  'basic_info',
  'medical_history',
  'medications',
  'allergies',
  'emergency_contact',
  'gender_specific',
];
