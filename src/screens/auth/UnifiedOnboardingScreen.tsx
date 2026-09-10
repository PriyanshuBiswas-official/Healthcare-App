import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Salad,
  Leaf,
  Egg,
  Beef,
  Shield,
  Pill,
  Check,
  Flame,
  Heart,
  Dumbbell,
  Timer,
  Zap,
  Scissors,
  Scale,
} from 'lucide-react-native';
import { Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../config/api';
import { posthog } from '../../config/posthog';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DIET_GOAL_PRESETS,
  computeDietGoals,
  calcTDEE,
  type DietGoalPreset,
} from '../../utils/calorieCalculator';
import {
  ACTIVITY_GOAL_PRESETS,
  type ActivityGoalPreset,
} from '../../utils/activityGoalPresets';

type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: { onboardingData: any };
};

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const TOTAL_STEPS = 10;

const ACTIVITY_ICONS: Record<string, any> = {
  Flame,
  Heart,
  Dumbbell,
  Timer,
  Zap,
  Scissors,
};

const DIET_ICONS: Record<string, any> = {
  Flame,
  Scale,
  Dumbbell,
  Timer,
};

const GOALS = [
  'Improve Overall Health',
  'Lose Weight',
  'Build Muscle',
  'Improve Fitness',
  'Eat Better',
  'Track Cycle',
  'Manage Medical Conditions',
];

const MEDICAL_CONDITIONS = [
  'Diabetes',
  'Hypertension',
  'PCOS',
  'Thyroid Disorder',
  'Asthma',
  'Heart Condition',
  'Other',
  'None',
];

const COMMON_ALLERGIES = [
  'Penicillin',
  'Aspirin',
  'Peanuts',
  'Shellfish',
  'Milk',
  'Eggs',
  'Soy',
  'Gluten',
  'Dust Mites',
  'Pollen',
  'Pet Dander',
  'Latex',
];

const DIET_TYPES = [
  { label: 'Vegetarian', icon: <Salad size={22} color="#14B8A6" /> },
  { label: 'Vegan', icon: <Leaf size={22} color="#22C55E" /> },
  { label: 'Eggetarian', icon: <Egg size={22} color="#F59E0B" /> },
  { label: 'Non-Vegetarian', icon: <Beef size={22} color="#EF4444" /> },
];

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const EXERCISE_LOCATIONS = ['Home', 'Gym', 'Both', "Don't Exercise"];

const CYCLE_LENGTHS = Array.from({ length: 15 }, (_, i) => String(20 + i));
const PERIOD_LENGTHS = Array.from({ length: 10 }, (_, i) => String(2 + i));

export interface UnifiedOnboardingData {
  displayName: string;
  goals: string[];
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  bloodGroup: string;
  medicalConditions: string[];
  otherCondition: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate: string;
  }[];
  noMedications: boolean;
  allergies: string[];
  otherAllergy: string;
  noAllergies: boolean;
  dietType: string;
  dietaryRestrictions: string;
  fitnessLevel: string;
  exerciseLocation: string;
  getsPeriods: boolean;
  cycleLength: string;
  periodLength: string;
  lastPeriodStart: string;
  menopauseStatus: string;
  prostateIssues: string;
}

const INITIAL_DATA: UnifiedOnboardingData = {
  displayName: '',
  goals: [],
  dateOfBirth: '',
  gender: '',
  height: '',
  weight: '',
  bloodGroup: '',
  medicalConditions: [],
  otherCondition: '',
  medications: [],
  noMedications: false,
  allergies: [],
  otherAllergy: '',
  noAllergies: false,
  dietType: '',
  dietaryRestrictions: '',
  fitnessLevel: '',
  exerciseLocation: '',
  getsPeriods: false,
  cycleLength: '28',
  periodLength: '5',
  lastPeriodStart: '',
  menopauseStatus: '',
  prostateIssues: '',
};

export default function UnifiedOnboardingScreen() {
  if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const navigation = useNavigation<Nav>();
  const { session, user, checkProfile } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [data, setData] = useState<UnifiedOnboardingData>(() => {
    const meta = user?.user_metadata;
    return {
      ...INITIAL_DATA,
      displayName: meta?.full_name || '',
      gender: meta?.gender || '',
    };
  });
  const [customAllergy, setCustomAllergy] = useState('');
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFrequency, setNewMedFrequency] = useState('');
  const [newMedStart, setNewMedStart] = useState('');
  const [newMedEnd, setNewMedEnd] = useState('');
  const [showMedStartPicker, setShowMedStartPicker] = useState(false);
  const [showMedEndPicker, setShowMedEndPicker] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLastPeriodPicker, setShowLastPeriodPicker] = useState(false);
  const [dietGoalPreset, setDietGoalPreset] = useState('');
  const [activityGoalPreset, setActivityGoalPreset] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const update = (partial: Partial<UnifiedOnboardingData>) =>
    setData(prev => ({ ...prev, ...partial }));

  const validateField = (field: string, value: string) => {
    let error = '';
    if (field === 'dateOfBirth') {
      if (value) {
        const age = Math.floor((Date.now() - new Date(value).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 7) error = 'Age must be at least 7 years';
        else if (age > 120) error = 'Please enter a valid date of birth';
      }
    } else if (field === 'height') {
      if (value) {
        const h = parseFloat(value);
        if (isNaN(h) || h < 50) error = 'Height must be at least 50 cm';
        else if (h > 250) error = 'Height must be under 250 cm';
      }
    } else if (field === 'weight') {
      if (value) {
        const w = parseFloat(value);
        if (isNaN(w) || w < 20) error = 'Weight must be at least 20 kg';
        else if (w > 300) error = 'Weight must be under 300 kg';
      }
    }
    setFieldErrors(prev => {
      const next = { ...prev };
      if (error) next[field] = error;
      else delete next[field];
      return next;
    });
  };

  const animateTransition = (next: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      next();
      setValidationError('');
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    const onBackPress = () => {
      if (step > 0) {
        animateTransition(() => setStep(s => s - 1));
        return true;
      }
      navigation.goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step]);

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (!data.displayName.trim()) return 'Please enter your name';
        return null;
      case 1:
        if (data.goals.length === 0) return 'Please select a primary goal';
        return null;
      case 2:
        if (!data.dateOfBirth.trim()) return 'Please enter your date of birth';
        if (!data.gender) return 'Please select your gender';
        if (!data.height.trim()) return 'Please enter your height';
        if (!data.weight.trim()) return 'Please enter your weight';
        if (!data.bloodGroup) return 'Please select your blood group';
        if (fieldErrors.dateOfBirth) return fieldErrors.dateOfBirth;
        if (fieldErrors.height) return fieldErrors.height;
        if (fieldErrors.weight) return fieldErrors.weight;
        return null;
      case 3:
        if (data.medicalConditions.length === 0) return 'Please select at least one option';
        if (data.medicalConditions.includes('Other') && !data.otherCondition.trim())
          return 'Please specify your condition';
        return null;
      case 4:
        if (!data.noMedications && data.medications.length === 0)
          return 'Please add at least one medication or select "Not on medications"';
        if (!data.noAllergies && data.allergies.length === 0)
          return 'Please select at least one allergy or select "No known allergies"';
        return null;
      case 5:
        if (!data.dietType) return 'Please select your diet type';
        return null;
      case 6:
        if (!data.fitnessLevel) return 'Please select your fitness level';
        if (!data.exerciseLocation) return 'Please select where you exercise';
        return null;
      case 7:
        return null;
      default:
        return null;
    }
  };

  const goNext = () => {
    const error = validateStep();
    if (error) {
      setValidationError(error);
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      animateTransition(() => setStep(s => s + 1));
    }
  };

  const goBack = () => {
    if (step > 0) {
      animateTransition(() => setStep(s => s - 1));
    } else {
      navigation.goBack();
    }
  };

  const buildSetupPayload = (activityLevel: string) => {
    const formattedDob = data.dateOfBirth;
    return {
      displayName: data.displayName,
      goals: data.goals,
      dateOfBirth: formattedDob,
      gender: data.gender,
      heightCm: parseFloat(data.height),
      weightKg: parseFloat(data.weight),
      bloodGroup: data.bloodGroup,
      units: 'metric',
      activityLevel,
      getsPeriods: data.gender === 'female' && data.getsPeriods,
      cycleLength: parseInt(data.cycleLength, 10) || 28,
      periodLength: parseInt(data.periodLength, 10) || 5,
      lastPeriodStart: data.lastPeriodStart || new Date().toISOString().split('T')[0],
    };
  };

  const buildCompletePayload = () => ({
    medicalConditions: data.medicalConditions,
    medications: data.medications,
    noMedications: data.noMedications,
    allergies: data.allergies,
    dietType: data.dietType,
    dietaryRestrictions: data.dietaryRestrictions,
    fitnessLevel: data.fitnessLevel,
    exerciseLocation: data.exerciseLocation,
    height: data.height,
    weight: data.weight,
    bloodGroup: data.bloodGroup,
    getsPeriods: data.gender === 'female' && data.getsPeriods,
    cycleLength: parseInt(data.cycleLength, 10) || 28,
    periodLength: parseInt(data.periodLength, 10) || 5,
    lastPeriodStart: data.lastPeriodStart || undefined,
  });

  const handleFinish = async () => {
    const selectedActivityPreset = ACTIVITY_GOAL_PRESETS.find(p => p.label === activityGoalPreset);
    const activityLevel = selectedActivityPreset?.activityLevel || 'Sedentary';

    if (session?.user) {
      setLoading_global(true);
      try {
        const token = session.access_token;

        const setupRes = await fetch(`${API_BASE_URL}/api/profile/setup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildSetupPayload(activityLevel)),
        });
        const setupJson = await setupRes.json();
        if (!setupJson.success) {
          throw new Error(setupJson.error || 'Failed to save basic profile');
        }

        const completeRes = await fetch(`${API_BASE_URL}/api/profile/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(buildCompletePayload()),
        });
        const completeJson = await completeRes.json();
        if (!completeJson.success) {
          throw new Error(completeJson.message || 'Failed to save profile details');
        }

        // Save diet goals if preset selected
        if (dietGoalPreset) {
          const profile = {
            weightKg: parseFloat(data.weight) || 70,
            heightCm: parseFloat(data.height) || 170,
            age: data.dateOfBirth ? Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25,
            gender: data.gender || 'other',
            activityLevel,
          };
          const preset = DIET_GOAL_PRESETS.find(p => p.label === dietGoalPreset);
          if (preset) {
            const goals = computeDietGoals(preset, profile);
            await fetch(`${API_BASE_URL}/api/diet/goal`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(goals),
            });
          }
        }

        // Save activity goals if preset selected
        if (activityGoalPreset) {
          const preset = ACTIVITY_GOAL_PRESETS.find(p => p.label === activityGoalPreset);
          if (preset) {
            await fetch(`${API_BASE_URL}/api/activity/goal`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                calorie_burn_goal: preset.calorieBurnGoal,
                exercise_min_goal: preset.exerciseMinGoal,
                steps_goal: preset.stepsGoal,
              }),
            });
          }
        }

        await checkProfile();
        posthog?.capture('onboarding_completed', {
          goal_selected: data.goals[0],
          activity_level: activityLevel,
          diet_goal_preset: dietGoalPreset || 'skipped',
          activity_goal_preset: activityGoalPreset || 'skipped',
        });
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to save profile. Please try again.');
      } finally {
        setLoading_global(false);
      }
    } else {
      // Compute goals to pass to signup
      let dietGoals = null;
      let activityGoals = null;

      if (dietGoalPreset) {
        const profile = {
          weightKg: parseFloat(data.weight) || 70,
          heightCm: parseFloat(data.height) || 170,
          age: data.dateOfBirth ? Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25,
          gender: data.gender || 'other',
          activityLevel,
        };
        const preset = DIET_GOAL_PRESETS.find(p => p.label === dietGoalPreset);
        if (preset) {
          dietGoals = computeDietGoals(preset, profile);
        }
      }

      if (activityGoalPreset) {
        const preset = ACTIVITY_GOAL_PRESETS.find(p => p.label === activityGoalPreset);
        if (preset) {
          activityGoals = {
            calorie_burn_goal: preset.calorieBurnGoal,
            exercise_min_goal: preset.exerciseMinGoal,
            steps_goal: preset.stepsGoal,
          };
        }
      }

      navigation.navigate('Signup', {
        onboardingData: {
          ...buildSetupPayload(activityLevel),
          ...buildCompletePayload(),
          dietGoals,
          activityGoals,
        },
      });
    }
  };

  const [loadingGlobal, setLoading_global] = useState(false);

  const toggleMultiSelect = (field: 'medicalConditions' | 'allergies', value: string) => {
    const current = data[field];
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    update({ [field]: next });
  };

  const addMedication = () => {
    if (!newMedName.trim()) return;
    update({
      medications: [
        ...data.medications,
        {
          name: newMedName.trim(),
          dosage: newMedDosage.trim(),
          frequency: newMedFrequency.trim(),
          startDate: newMedStart.trim(),
          endDate: newMedEnd.trim(),
        },
      ],
    });
    setNewMedName('');
    setNewMedDosage('');
    setNewMedFrequency('');
    setNewMedStart('');
    setNewMedEnd('');
  };

  const removeMedication = (index: number) => {
    update({ medications: data.medications.filter((_, i) => i !== index) });
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    if (!data.allergies.includes(customAllergy.trim())) {
      update({ allergies: [...data.allergies, customAllergy.trim()] });
    }
    setCustomAllergy('');
  };

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    flex: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: t.colors.bgCardBorder,
    },
    backPlaceholder: { width: 40 },
    pageTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    scrollContent: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xxl,
    },
    stepHeader: {
      marginBottom: Spacing.xl,
    },
    stepTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    stepSubtitle: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      lineHeight: 20,
    },
    formCard: {
      paddingVertical: Spacing.lg,
    },
    inputLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    input: {
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      borderRadius: Radius.md,
      color: t.colors.textPrimary,
      paddingVertical: Spacing.base,
      paddingHorizontal: Spacing.base,
      fontSize: Typography.base,
      marginBottom: Spacing.md,
      minHeight: 48,
    },
    textArea: {
      height: 80,
      paddingTop: Spacing.md,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    halfField: {
      flex: 1,
    },
    genderBadge: {
      flex: 1,
      paddingVertical: 14,
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      borderRadius: Radius.md,
      alignItems: 'center',
    },
    genderBadgeSelected: {
      borderColor: t.colors.blue,
      backgroundColor: t.colors.blueDim,
    },
    genderText: {
      color: t.colors.textSecondary,
      fontSize: Typography.base,
      fontWeight: Typography.medium,
    },
    genderTextSelected: {
      color: t.colors.blue,
      fontWeight: Typography.bold,
    },
    bloodRow: {
      gap: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    bloodChip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderRadius: Radius.full,
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
    },
    bloodChipSelected: {
      borderColor: t.colors.blue,
      backgroundColor: t.colors.blueDim,
    },
    bloodText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    bloodTextSelected: {
      color: t.colors.blue,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    chip: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderRadius: Radius.full,
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
    },
    chipSelected: {
      borderColor: t.colors.blue,
      backgroundColor: t.colors.blueDim,
    },
    chipText: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    chipTextSelected: {
      color: t.colors.blue,
      fontWeight: Typography.bold,
    },
    goalCard: {
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      borderRadius: Radius.md,
      padding: Spacing.base,
      alignItems: 'center',
    },
    goalCardSelected: {
      borderColor: t.colors.blue,
      backgroundColor: t.colors.blueDim,
    },
    goalText: {
      fontSize: Typography.base,
      fontWeight: Typography.medium,
      color: t.colors.textSecondary,
    },
    goalTextSelected: {
      color: t.colors.blue,
      fontWeight: Typography.bold,
    },
    activityCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: t.colors.chipBg,
      borderWidth: 1.5,
      borderColor: t.colors.chipBorder,
      borderRadius: Radius.md,
      padding: Spacing.base,
    },
    activityCardSelected: {
      borderColor: t.colors.blue + '50',
    },
    activityIconWrap: {
      width: 40,
      height: 40,
      borderRadius: Radius.sm,
      backgroundColor: t.colors.chipBg,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    activityIconWrapSelected: {
      backgroundColor: t.colors.blueDim,
    },
    activityTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.white,
    },
    activityTitleSelected: {
      color: t.colors.textPrimary,
    },
    activityDesc: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    activityMetrics: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.sm,
      gap: 4,
      opacity: 1,
    },
    activityMetric: {
      fontSize: Typography.xs,
      color: t.colors.blue,
      fontWeight: Typography.semiBold,
    },
    activityMetricDot: {
      fontSize: Typography.xs,
      color: t.colors.blue + '60',
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    addBtn: {
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: t.colors.blue + '50',
      backgroundColor: t.colors.blueDim,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    addBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.blue,
    },
    addSmallBtn: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.base,
      borderRadius: Radius.md,
      backgroundColor: t.colors.blue,
    },
    addSmallBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.bg,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      backgroundColor: t.colors.blueDim,
      borderWidth: 1,
      borderColor: t.colors.blue + '50',
    },
    tagText: {
      fontSize: Typography.xs,
      color: t.colors.blue,
      fontWeight: Typography.semiBold,
      marginRight: Spacing.xs,
    },
    tagRemove: {
      fontSize: Typography.xs,
      color: t.colors.blue,
      fontWeight: Typography.bold,
    },
    skipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.base,
      borderRadius: Radius.md,
      backgroundColor: t.colors.chipBg,
      borderWidth: 1.5,
      borderColor: t.colors.chipBorder,
      marginBottom: Spacing.md,
    },
    skipCardSelected: {
      borderColor: t.colors.blue + '50',
    },
    skipCardSelectedGreen: {
      borderColor: t.colors.blue + '50',
    },
    skipIconWrap: {
      width: 36,
      height: 36,
      borderRadius: Radius.sm,
      backgroundColor: t.colors.tealDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    skipIconWrapSelected: {
      backgroundColor: t.colors.blueDim,
    },
    skipIconWrapSelectedGreen: {
      backgroundColor: t.colors.blueDim,
    },
    skipContent: {
      flex: 1,
    },
    skipTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.textPrimary,
    },
    skipTitleSelectedGreen: {
      color: t.colors.blue,
    },
    skipSub: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    skipCheck: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: t.colors.chipBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.sm,
    },
    skipCheckSelected: {
      backgroundColor: t.colors.blue,
      borderColor: t.colors.blue,
    },
    skipCheckSelectedGreen: {
      backgroundColor: t.colors.blue,
      borderColor: t.colors.blue,
    },
    medList: {
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    medItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
    },
    medInfo: {
      flex: 1,
    },
    medName: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: t.colors.textPrimary,
    },
    medDetail: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
    },
    medDate: {
      fontSize: Typography.xs,
      color: t.colors.teal,
      marginTop: 2,
    },
    removeBtn: {
      fontSize: Typography.base,
      color: t.colors.danger,
      fontWeight: Typography.bold,
      paddingLeft: Spacing.md,
    },
    dietGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.md,
    },
    dietCard: {
      width: '47%',
      padding: Spacing.lg,
      borderRadius: Radius.lg,
      backgroundColor: t.colors.chipBg,
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      alignItems: 'center',
    },
    dietCardSelected: {
      borderColor: t.colors.blue,
      backgroundColor: t.colors.blueDim,
    },
    dietIcon: {
      marginBottom: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dietLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    dietLabelSelected: {
      color: t.colors.blue,
      fontWeight: Typography.bold,
    },
    datePickerButton: {
      borderWidth: 1,
      borderColor: t.colors.chipBorder,
      backgroundColor: t.colors.chipBg,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md + 2,
      marginBottom: Spacing.md,
    },
    datePickerText: {
      fontSize: Typography.base,
      color: t.colors.textPrimary,
    },
    errorBox: {
      marginTop: Spacing.md,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: t.colors.danger + '15',
      borderWidth: 1,
      borderColor: t.colors.danger + '40',
    },
    errorText: {
      fontSize: Typography.sm,
      color: t.colors.danger,
      fontWeight: Typography.medium,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: t.colors.bgCardBorder,
      gap: Spacing.md,
    },
    backStepBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: t.colors.bgCardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backStepText: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    nextBtn: {
      flex: 2,
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      backgroundColor: t.colors.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtn: {
      shadowColor: t.colors.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    nextBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.white,
    },
  }));

  const renderStepHeader = (title: string, subtitle: string) => (
    <View style={styles.stepHeader}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderChipGrid = (
    options: string[],
    selected: string[],
    onToggle: (val: string) => void,
  ) => (
    <View style={styles.chipGrid}>
      {options.map(opt => {
        const isSelected = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderOptionGrid = (
    options: string[],
    selected: string,
    onSelect: (val: string) => void,
  ) => (
    <View style={styles.chipGrid}>
      {options.map(opt => {
        const isSelected = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}>
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderValidation = () =>
    validationError ? (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{validationError}</Text>
      </View>
    ) : null;

  // ── Step 0: Name ─────────────────────────────────────────────
  const renderName = () => (
    <>
      {renderStepHeader(
        'Welcome to Cureto',
        "Let's start by getting to know you. What should we call you?",
      )}
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Your Name</Text>
        <TextInput
          style={styles.input}
          value={data.displayName}
          onChangeText={v => update({ displayName: v })}
          placeholder="Enter your name"
          placeholderTextColor={theme.colors.textMuted}
          autoFocus
        />
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 1: Goals ────────────────────────────────────────────
  const renderGoals = () => (
    <>
      {renderStepHeader(
        'Your Primary Goal',
        "We'll customize your experience based on what matters most to you.",
      )}
      <View style={styles.formCard}>
        <View style={{ gap: Spacing.md }}>
          {GOALS.map(goal => {
            const isSelected = data.goals.includes(goal);
            return (
              <TouchableOpacity
                key={goal}
                style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                onPress={() => update({ goals: [goal] })}
                activeOpacity={0.7}>
                <Text style={[styles.goalText, isSelected && styles.goalTextSelected]}>{goal}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 2: Basic Info ───────────────────────────────────────
  const renderBasicInfo = () => (
    <>
      {renderStepHeader(
        'Basic Information',
        'This helps us calculate your BMI, calorie targets, and personalize your experience.',
      )}
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Date of Birth</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, fieldErrors.dateOfBirth && { borderColor: theme.colors.danger }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}>
          <Text style={[styles.datePickerText, !data.dateOfBirth && { color: theme.colors.textMuted }]}>
            {data.dateOfBirth || 'Select your date of birth'}
          </Text>
        </TouchableOpacity>
        {fieldErrors.dateOfBirth ? <Text style={styles.errorText}>{fieldErrors.dateOfBirth}</Text> : null}
        {showDatePicker && (
          <DateTimePicker
            value={data.dateOfBirth ? new Date(data.dateOfBirth + 'T00:00:00') : new Date(2000, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={(_: DateTimePickerEvent, selected?: Date) => {
              if (Platform.OS === 'android') setShowDatePicker(false);
              if (selected) {
                const y = selected.getFullYear();
                const m = String(selected.getMonth() + 1).padStart(2, '0');
                const d = String(selected.getDate()).padStart(2, '0');
                const dob = `${y}-${m}-${d}`;
                update({ dateOfBirth: dob });
                validateField('dateOfBirth', dob);
              }
            }}
          />
        )}

        <Text style={styles.inputLabel}>Gender</Text>
        <View style={styles.row}>
          {['male', 'female', 'other'].map(g => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBadge, data.gender === g && styles.genderBadgeSelected]}
              onPress={() => update({ gender: g })}>
              <Text style={[styles.genderText, data.gender === g && styles.genderTextSelected]}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={[styles.input, fieldErrors.height && { borderColor: theme.colors.danger }]}
              value={data.height}
              onChangeText={v => { update({ height: v }); validateField('height', v); }}
              onBlur={() => validateField('height', data.height)}
              placeholder="175"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />
            {fieldErrors.height ? <Text style={styles.errorText}>{fieldErrors.height}</Text> : null}
          </View>
          <View style={styles.halfField}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={[styles.input, fieldErrors.weight && { borderColor: theme.colors.danger }]}
              value={data.weight}
              onChangeText={v => { update({ weight: v }); validateField('weight', v); }}
              onBlur={() => validateField('weight', data.weight)}
              placeholder="70"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />
            {fieldErrors.weight ? <Text style={styles.errorText}>{fieldErrors.weight}</Text> : null}
          </View>
        </View>

        <Text style={styles.inputLabel}>Blood Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodRow}>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
            <TouchableOpacity
              key={bg}
              style={[styles.bloodChip, data.bloodGroup === bg && styles.bloodChipSelected]}
              onPress={() => update({ bloodGroup: bg })}>
              <Text style={[styles.bloodText, data.bloodGroup === bg && styles.bloodTextSelected]}>{bg}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 3: Medical Conditions ──────────────────────────────
  const renderMedicalConditions = () => (
    <>
      {renderStepHeader(
        'Medical Conditions',
        'Do you have any ongoing medical conditions?',
      )}
      <View style={styles.formCard}>
        {renderChipGrid(MEDICAL_CONDITIONS, data.medicalConditions, v =>
          toggleMultiSelect('medicalConditions', v),
        )}
        {data.medicalConditions.includes('Other') && (
          <TextInput
            style={[styles.input, { marginTop: Spacing.md }]}
            value={data.otherCondition}
            onChangeText={v => update({ otherCondition: v })}
            placeholder="Specify other condition"
            placeholderTextColor={theme.colors.textMuted}
          />
        )}
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 4: Medications & Allergies ──────────────────────────
  const renderMedicationsAllergies = () => (
    <>
      {renderStepHeader(
        'Medications & Allergies',
        'Help us understand your current medications and any known allergies.',
      )}

      {/* Medications section */}
      <View style={[styles.formCard, { marginBottom: Spacing.lg }]}>
        <Text style={[styles.inputLabel, { marginBottom: Spacing.md, fontSize: Typography.md }]}>
          Current Medications
        </Text>
        <TouchableOpacity
          style={[styles.skipCard, data.noMedications && styles.skipCardSelected]}
          onPress={() => update({ noMedications: !data.noMedications, medications: data.noMedications ? data.medications : [] })}
          activeOpacity={0.7}>
          <View style={[styles.skipIconWrap, data.noMedications && styles.skipIconWrapSelected]}>
            <Pill size={18} color={theme.colors.blue} />
          </View>
          <View style={styles.skipContent}>
            <Text style={[styles.skipTitle, data.noMedications && { color: theme.colors.blue }]}>
              Not on any medications
            </Text>
            <Text style={styles.skipSub}>
              {data.noMedications ? 'Tapped — you can still add below if needed' : 'Tap here if this applies to you'}
            </Text>
          </View>
          <View style={[styles.skipCheck, data.noMedications && styles.skipCheckSelected]}>
            {data.noMedications && <Check size={14} color={theme.colors.bg} strokeWidth={3} />}
          </View>
        </TouchableOpacity>

        {!data.noMedications && (
          <>
            {data.medications.length > 0 && (
              <View style={styles.medList}>
                {data.medications.map((med, i) => (
                  <View key={i} style={styles.medItem}>
                    <View style={styles.medInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDetail}>
                        {med.dosage}{med.frequency ? ` · ${med.frequency}` : ''}
                      </Text>
                      {(med.startDate || med.endDate) && (
                        <Text style={styles.medDate}>
                          {med.startDate}{med.endDate ? ` — ${med.endDate}` : ' — Present'}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeMedication(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={[styles.inputLabel, { marginTop: data.medications.length > 0 ? Spacing.lg : Spacing.md }]}>
              Add Medication
            </Text>
            <TextInput
              style={styles.input}
              value={newMedName}
              onChangeText={setNewMedName}
              placeholder="Medication name"
              placeholderTextColor={theme.colors.textMuted}
            />
            <View style={styles.row}>
              <View style={styles.halfField}>
                <TextInput
                  style={styles.input}
                  value={newMedDosage}
                  onChangeText={setNewMedDosage}
                  placeholder="Dosage (e.g. 500mg)"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <TextInput
                  style={styles.input}
                  value={newMedFrequency}
                  onChangeText={setNewMedFrequency}
                  placeholder="Frequency (e.g. twice daily)"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowMedStartPicker(true)}
                  activeOpacity={0.7}>
                  <Text style={[styles.datePickerText, !newMedStart && { color: theme.colors.textMuted }]}>
                    {newMedStart || 'Select start date'}
                  </Text>
                </TouchableOpacity>
                {showMedStartPicker && (
                  <DateTimePicker
                    value={newMedStart ? new Date(newMedStart + 'T00:00:00') : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    onChange={(_: DateTimePickerEvent, selected?: Date) => {
                      if (Platform.OS === 'android') setShowMedStartPicker(false);
                      if (selected) {
                        const y = selected.getFullYear();
                        const m = String(selected.getMonth() + 1).padStart(2, '0');
                        const d = String(selected.getDate()).padStart(2, '0');
                        setNewMedStart(`${y}-${m}-${d}`);
                      }
                    }}
                  />
                )}
              </View>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowMedEndPicker(true)}
                  activeOpacity={0.7}>
                  <Text style={[styles.datePickerText, !newMedEnd && { color: theme.colors.textMuted }]}>
                    {newMedEnd || 'Ongoing'}
                  </Text>
                </TouchableOpacity>
                {showMedEndPicker && (
                  <DateTimePicker
                    value={newMedEnd ? new Date(newMedEnd + 'T00:00:00') : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={newMedStart ? new Date(newMedStart + 'T00:00:00') : undefined}
                    onChange={(_: DateTimePickerEvent, selected?: Date) => {
                      if (Platform.OS === 'android') setShowMedEndPicker(false);
                      if (selected) {
                        const y = selected.getFullYear();
                        const m = String(selected.getMonth() + 1).padStart(2, '0');
                        const d = String(selected.getDate()).padStart(2, '0');
                        setNewMedEnd(`${y}-${m}-${d}`);
                      }
                    }}
                  />
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addMedication} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>+ Add Medication</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Allergies section */}
      <View style={styles.formCard}>
        <Text style={[styles.inputLabel, { marginBottom: Spacing.md, fontSize: Typography.md }]}>
          Known Allergies
        </Text>
        <TouchableOpacity
          style={[styles.skipCard, data.noAllergies && styles.skipCardSelectedGreen]}
          onPress={() => update({ noAllergies: !data.noAllergies, allergies: data.noAllergies ? data.allergies : [] })}
          activeOpacity={0.7}>
          <View style={[styles.skipIconWrap, data.noAllergies && styles.skipIconWrapSelectedGreen]}>
            <Shield size={18} color={theme.colors.blue} />
          </View>
          <View style={styles.skipContent}>
            <Text style={[styles.skipTitle, data.noAllergies && styles.skipTitleSelectedGreen]}>
              No known allergies
            </Text>
            <Text style={styles.skipSub}>
              {data.noAllergies ? 'Tapped — you can still add below if needed' : 'Tap here if this applies to you'}
            </Text>
          </View>
          <View style={[styles.skipCheck, data.noAllergies && styles.skipCheckSelectedGreen]}>
            {data.noAllergies && <Check size={14} color={theme.colors.bg} strokeWidth={3} />}
          </View>
        </TouchableOpacity>

        {!data.noAllergies && (
          <>
            <View style={{ marginTop: Spacing.md }}>
              {renderChipGrid(COMMON_ALLERGIES, data.allergies, v => toggleMultiSelect('allergies', v))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Other Allergy</Text>
            <View style={styles.addRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={customAllergy}
                onChangeText={setCustomAllergy}
                placeholder="Type an allergy"
                placeholderTextColor={theme.colors.textMuted}
              />
              <TouchableOpacity style={styles.addSmallBtn} onPress={addCustomAllergy} activeOpacity={0.7}>
                <Text style={styles.addSmallBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {data.allergies.length > 0 && (
              <View style={styles.tagRow}>
                {data.allergies.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={styles.tag}
                    onPress={() => toggleMultiSelect('allergies', a)}>
                    <Text style={styles.tagText}>{a}</Text>
                    <Text style={styles.tagRemove}>✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 5: Diet & Nutrition ─────────────────────────────────
  const renderNutrition = () => (
    <>
      {renderStepHeader(
        'Nutrition Preferences',
        'What best describes your diet?',
      )}
      <View style={styles.formCard}>
        <View style={styles.dietGrid}>
          {DIET_TYPES.map(d => {
            const isSelected = data.dietType === d.label;
            return (
              <TouchableOpacity
                key={d.label}
                style={[styles.dietCard, isSelected && styles.dietCardSelected]}
                onPress={() => update({ dietType: d.label })}
                activeOpacity={0.7}>
                <View style={styles.dietIcon}>{d.icon}</View>
                <Text style={[styles.dietLabel, isSelected && styles.dietLabelSelected]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>
          Dietary Restrictions (Optional)
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={data.dietaryRestrictions}
          onChangeText={v => update({ dietaryRestrictions: v })}
          placeholder="e.g. gluten-free, lactose intolerant"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 6: Fitness Profile ──────────────────────────────────
  const renderFitness = () => (
    <>
      {renderStepHeader(
        'Fitness Profile',
        'Help us understand your activity level',
      )}
      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Fitness Level</Text>
        {renderOptionGrid(FITNESS_LEVELS, data.fitnessLevel, v => update({ fitnessLevel: v }))}

        <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>Where do you exercise?</Text>
        {renderOptionGrid(EXERCISE_LOCATIONS, data.exerciseLocation, v => update({ exerciseLocation: v }))}
      </View>
      {renderValidation()}
    </>
  );

  // ── Step 7: Gender-Specific ──────────────────────────────────
  const renderGenderSpecific = () => {
    const isFemale = data.gender === 'female';
    const isMale = data.gender === 'male';

    return (
      <>
        {renderStepHeader(
          isFemale ? 'Cycle Tracking' : "Men's Health",
          isFemale
            ? 'Track your menstrual cycle for better health insights'
            : 'Help us personalize your health profile',
        )}
        <View style={styles.formCard}>
          {isFemale && (
            <>
              <Text style={styles.inputLabel}>Do you get periods?</Text>
              {renderOptionGrid(['Yes', 'No'], data.getsPeriods ? 'Yes' : 'No', v =>
                update({ getsPeriods: v === 'Yes' }),
              )}

              {data.getsPeriods && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>Average Cycle Length</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodRow}>
                    {CYCLE_LENGTHS.map(cl => (
                      <TouchableOpacity
                        key={cl}
                        style={[styles.bloodChip, data.cycleLength === cl && styles.bloodChipSelected]}
                        onPress={() => update({ cycleLength: cl })}>
                        <Text style={[styles.bloodText, data.cycleLength === cl && styles.bloodTextSelected]}>
                          {cl}d
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>Average Period Length</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodRow}>
                    {PERIOD_LENGTHS.map(pl => (
                      <TouchableOpacity
                        key={pl}
                        style={[styles.bloodChip, data.periodLength === pl && styles.bloodChipSelected]}
                        onPress={() => update({ periodLength: pl })}>
                        <Text style={[styles.bloodText, data.periodLength === pl && styles.bloodTextSelected]}>
                          {pl}d
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>Last Period Start Date</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowLastPeriodPicker(true)}
                    activeOpacity={0.7}>
                    <Text style={{ color: data.lastPeriodStart ? theme.colors.text : theme.colors.textMuted, fontSize: Typography.md }}>
                      {data.lastPeriodStart || 'Select date'}
                    </Text>
                  </TouchableOpacity>
                  {showLastPeriodPicker && (
                    <DateTimePicker
                      value={data.lastPeriodStart ? new Date(data.lastPeriodStart + 'T00:00:00') : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      maximumDate={new Date()}
                      onChange={(_: DateTimePickerEvent, selected?: Date) => {
                        if (Platform.OS === 'android') setShowLastPeriodPicker(false);
                        if (selected) {
                          const y = selected.getFullYear();
                          const m = String(selected.getMonth() + 1).padStart(2, '0');
                          const d = String(selected.getDate()).padStart(2, '0');
                          update({ lastPeriodStart: `${y}-${m}-${d}` });
                        }
                      }}
                    />
                  )}
                </>
              )}

              {!data.getsPeriods && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>Menopause Status</Text>
                  {renderOptionGrid(
                    ['Pre-Menopause', 'Peri-Menopause', 'Post-Menopause', 'Hysterectomy'],
                    data.menopauseStatus,
                    v => update({ menopauseStatus: v }),
                  )}
                </>
              )}
            </>
          )}

          {isMale && (
            <>
              <Text style={styles.inputLabel}>Any prostate-related issues?</Text>
              {renderOptionGrid(
                ['None', 'BPH', 'Prostatitis', 'Other'],
                data.prostateIssues,
                v => update({ prostateIssues: v }),
              )}
            </>
          )}

          {!isFemale && !isMale && (
            <Text style={{ fontSize: Typography.sm, color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.xl, lineHeight: 20 }}>
              Additional health profile options will be available based on your health goals.
            </Text>
          )}
        </View>
        {renderValidation()}
      </>
    );
  };

  // ── Step 8: Diet Goals ───────────────────────────────────────
  const renderDietGoals = () => {
    const selectedActivityPreset = ACTIVITY_GOAL_PRESETS.find(p => p.label === activityGoalPreset);
    const profile = {
      weightKg: parseFloat(data.weight) || 70,
      heightCm: parseFloat(data.height) || 170,
      age: data.dateOfBirth ? Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 25,
      gender: data.gender || 'other',
      activityLevel: selectedActivityPreset?.activityLevel || 'Sedentary',
    };
    const tdee = calcTDEE(profile);

    return (
      <>
        {renderStepHeader(
          'Diet Goals',
          'Choose a goal that matches what you want to achieve. We\'ll calculate your daily targets automatically.',
        )}
        <View style={{ gap: Spacing.sm }}>
          {DIET_GOAL_PRESETS.map(preset => {
            const isSelected = dietGoalPreset === preset.label;
            const goals = computeDietGoals(preset, profile);
            const IconComp = DIET_ICONS[preset.icon];
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.activityCard, isSelected && styles.activityCardSelected]}
                onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)); setDietGoalPreset(preset.label); }}
                activeOpacity={0.7}>
                <View style={[styles.activityIconWrap, isSelected && styles.activityIconWrapSelected]}>
                  {isSelected
                    ? <Check size={20} color={theme.colors.blue} strokeWidth={2.5} />
                    : IconComp && <IconComp size={20} color={preset.color} />}
                </View>
                <View style={{ flex: 1 }}>
                <Text style={[styles.activityTitle, isSelected && styles.activityTitleSelected]}>
                    {preset.label}
                  </Text>
                  <Text style={styles.activityDesc}>
                    {preset.description}
                  </Text>
                  {isSelected && (
                    <View style={styles.activityMetrics}>
                      <Text style={styles.activityMetric}>{goals.calorie_goal} kcal</Text>
                      <Text style={styles.activityMetricDot}>·</Text>
                      <Text style={styles.activityMetric}>{goals.protein_goal}g protein</Text>
                      <Text style={styles.activityMetricDot}>·</Text>
                      <Text style={styles.activityMetric}>{goals.carbs_goal}g carbs</Text>
                      <Text style={styles.activityMetricDot}>·</Text>
                      <Text style={styles.activityMetric}>{goals.fat_goal}g fat</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={{ fontSize: Typography.xs, color: theme.colors.textMuted, marginTop: Spacing.lg, textAlign: 'center' }}>
          Based on your TDEE of {tdee} kcal/day. You can adjust these later.
        </Text>
        {renderValidation()}
      </>
    );
  };

  // ── Step 9: Activity Goals ────────────────────────────────────
  const renderActivityGoals = () => (
    <>
      {renderStepHeader(
        'Activity Goals',
        'Pick an activity style that fits your lifestyle. We\'ll set your daily targets.',
      )}
      <View style={{ gap: Spacing.sm }}>
        {ACTIVITY_GOAL_PRESETS.map(preset => {
          const isSelected = activityGoalPreset === preset.label;
          const IconComp = ACTIVITY_ICONS[preset.icon];
          return (
            <TouchableOpacity
              key={preset.label}
              style={[styles.activityCard, isSelected && styles.activityCardSelected]}
              onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.create(250, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)); setActivityGoalPreset(preset.label); }}
              activeOpacity={0.7}>
              <View style={[styles.activityIconWrap, isSelected && styles.activityIconWrapSelected]}>
                {isSelected
                  ? <Check size={20} color={theme.colors.blue} strokeWidth={2.5} />
                  : IconComp && <IconComp size={20} color={preset.color} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activityTitle, isSelected && styles.activityTitleSelected]}>
                  {preset.label}
                </Text>
                <Text style={styles.activityDesc}>
                  {preset.description}
                </Text>
                {isSelected && (
                  <View style={styles.activityMetrics}>
                    <Text style={styles.activityMetric}>{preset.calorieBurnGoal} kcal burn</Text>
                    <Text style={styles.activityMetricDot}>·</Text>
                    <Text style={styles.activityMetric}>{preset.exerciseMinGoal} min</Text>
                    <Text style={styles.activityMetricDot}>·</Text>
                    <Text style={styles.activityMetric}>{preset.stepsGoal.toLocaleString()} steps</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {renderValidation()}
    </>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0: return renderName();
      case 1: return renderGoals();
      case 2: return renderBasicInfo();
      case 3: return renderMedicalConditions();
      case 4: return renderMedicationsAllergies();
      case 5: return renderNutrition();
      case 6: return renderFitness();
      case 7: return renderGenderSpecific();
      case 8: return renderActivityGoals();
      case 9: return renderDietGoals();
      default: return null;
    }
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.xs }]}>
        <BackButton onPress={goBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Step {step + 1} / {TOTAL_STEPS}</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, isLastStep && styles.saveBtn]}
            onPress={isLastStep ? handleFinish : goNext}
            activeOpacity={0.8}
            disabled={saving || loadingGlobal}>
            {saving || loadingGlobal ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <Text style={styles.nextBtnText}>
                {isLastStep
                  ? (session?.user ? 'Save Profile' : 'Continue to Sign Up')
                  : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
