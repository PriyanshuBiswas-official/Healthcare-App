import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { User, ClipboardList, Pill, TriangleAlert, Apple, Dumbbell, Flower2, Stethoscope, Salad, Leaf, Egg, Beef, Check, Shield } from 'lucide-react-native';
import { GlassCardView, ProgressBar, BackButton } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import { API_BASE_URL } from '../../config/api';

const TOTAL_STEPS = 7;

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

export interface ProfileSetupData {
  displayName: string;
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

const INITIAL_DATA: ProfileSetupData = {
  displayName: '',
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

interface Props {
  onBack: () => void;
}

export default function ProfileSetupScreen({ onBack }: Props) {
  const { theme } = useTheme();
  const { user, session, checkProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProfileSetupData>(() => {
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
  const [validationError, setValidationError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showLastPeriodPicker, setShowLastPeriodPicker] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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
    progressContainer: {
      paddingHorizontal: Spacing.base,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    progressLabel: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
    },
    progressPercent: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.teal,
    },
    scrollContent: {
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.xxl,
    },
    stepHeader: {
      marginBottom: Spacing.xl,
    },
    stepIcon: {
      marginBottom: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
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
      padding: Spacing.lg,
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
      borderColor: t.colors.teal,
      backgroundColor: t.colors.tealDim,
    },
    genderText: {
      color: t.colors.textSecondary,
      fontSize: Typography.base,
      fontWeight: Typography.medium,
    },
    genderTextSelected: {
      color: t.colors.teal,
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
      borderColor: t.colors.teal,
      backgroundColor: t.colors.tealDim,
    },
    bloodText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.textSecondary,
    },
    bloodTextSelected: {
      color: t.colors.teal,
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
      borderColor: t.colors.teal,
      backgroundColor: t.colors.tealDim,
    },
    chipText: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      fontWeight: Typography.medium,
    },
    chipTextSelected: {
      color: t.colors.teal,
      fontWeight: Typography.bold,
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
      borderColor: t.colors.teal + '50',
      backgroundColor: t.colors.tealDim,
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    addBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: t.colors.teal,
    },
    addSmallBtn: {
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.base,
      borderRadius: Radius.md,
      backgroundColor: t.colors.teal,
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
      backgroundColor: t.colors.tealDim,
      borderWidth: 1,
      borderColor: t.colors.teal + '50',
    },
    tagText: {
      fontSize: Typography.xs,
      color: t.colors.teal,
      fontWeight: Typography.semiBold,
      marginRight: Spacing.xs,
    },
    tagRemove: {
      fontSize: Typography.xs,
      color: t.colors.teal,
      fontWeight: Typography.bold,
    },
    skipCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.base,
      borderRadius: Radius.lg,
      backgroundColor: t.colors.amberDim,
      borderWidth: 1.5,
      borderColor: t.colors.amber + '35',
      marginBottom: Spacing.md,
    },
    skipCardSelected: {
      backgroundColor: t.colors.amberDim,
      borderColor: t.colors.amber + '70',
    },
    skipCardSelectedGreen: {
      backgroundColor: t.colors.success + '1A',
      borderColor: t.colors.success + '60',
    },
    skipIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: t.colors.amber + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    skipIconWrapSelected: {
      backgroundColor: t.colors.amber + '30',
    },
    skipIconWrapSelectedGreen: {
      backgroundColor: t.colors.success + '25',
    },
    skipIcon: {
      fontSize: Typography.lg,
    },
    skipContent: {
      flex: 1,
    },
    skipTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.amber,
    },
    skipTitleSelected: {
      color: t.colors.amber,
    },
    skipTitleSelectedGreen: {
      color: t.colors.success,
    },
    skipSub: {
      fontSize: Typography.xs,
      color: t.colors.textSecondary,
      marginTop: 2,
      lineHeight: 16,
    },
    skipCheck: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: t.colors.amber + '40',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.sm,
    },
    skipCheckSelected: {
      backgroundColor: t.colors.amber,
      borderColor: t.colors.amber,
    },
    skipCheckSelectedGreen: {
      backgroundColor: t.colors.success,
      borderColor: t.colors.success,
    },
    skipCheckMark: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: t.colors.bg,
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
      borderColor: t.colors.teal,
      backgroundColor: t.colors.tealDim,
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
      color: t.colors.teal,
      fontWeight: Typography.bold,
    },
    emptyText: {
      fontSize: Typography.sm,
      color: t.colors.textSecondary,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
      lineHeight: 20,
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
      backgroundColor: t.colors.teal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveBtn: {
      ...Shadows.teal,
    },
    nextBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: t.colors.bg,
    },
  }));

  const update = (partial: Partial<ProfileSetupData>) =>
    setData(prev => ({ ...prev, ...partial }));

  const progress = (step + 1) / TOTAL_STEPS;

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

  // ── Android Back Button ──────────────────────────────────────
  useEffect(() => {
    const onBackPress = () => {
      if (step > 0) {
        animateTransition(() => setStep(s => s - 1));
        return true;
      }
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [step, onBack]);

  const validateStep = (): string | null => {
    switch (step) {
      case 0:
        if (!data.displayName.trim()) return 'Please enter your name';
        if (!data.dateOfBirth.trim()) return 'Please enter your date of birth';
        if (!data.gender) return 'Please select your gender';
        if (!data.height.trim()) return 'Please enter your height';
        if (!data.weight.trim()) return 'Please enter your weight';
        if (!data.bloodGroup) return 'Please select your blood group';
        return null;
      case 1:
        if (data.medicalConditions.length === 0) return 'Please select at least one option';
        if (data.medicalConditions.includes('Other') && !data.otherCondition.trim())
          return 'Please specify your condition';
        return null;
      case 2:
        if (!data.noMedications && data.medications.length === 0)
          return 'Please add at least one medication or select "Not on medications"';
        return null;
      case 3:
        if (!data.noAllergies && data.allergies.length === 0)
          return 'Please select at least one allergy or select "No known allergies"';
        return null;
      case 4:
        if (!data.dietType) return 'Please select your diet type';
        return null;
      case 5:
        if (!data.fitnessLevel) return 'Please select your fitness level';
        if (!data.exerciseLocation) return 'Please select where you exercise';
        return null;
      case 6:
        if (data.gender === 'female') {
        } else if (data.gender === 'male') {
        }
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
      onBack();
    }
  };

  const handleSave = async () => {
    if (!session?.access_token) {
      Alert.alert('Error', 'Not authenticated. Please log in again.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
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
        getsPeriods: data.getsPeriods,
        cycleLength: parseInt(data.cycleLength, 10) || 28,
        periodLength: parseInt(data.periodLength, 10) || 5,
        lastPeriodStart: data.lastPeriodStart || undefined,
      };

      const res = await fetch(`${API_BASE_URL}/api/profile/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        await checkProfile();
        Alert.alert(
          'Profile Saved',
          json.profile_completion?.completed
            ? 'Your profile is now 100% complete!'
            : `Profile updated — ${json.profile_completion?.percentage ?? 0}% complete.`,
          [{ text: 'OK', onPress: onBack }],
        );
      } else {
        Alert.alert('Error', json.message || 'Failed to save profile. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

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

  const renderStepHeader = (icon: React.ReactNode, title: string, subtitle: string) => (
    <View style={styles.stepHeader}>
      <View style={styles.stepIcon}>{icon}</View>
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

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderMedicalConditions();
      case 2:
        return renderMedications();
      case 3:
        return renderAllergies();
      case 4:
        return renderNutrition();
      case 5:
        return renderFitness();
      case 6:
        return renderGenderSpecific();
      default:
        return null;
    }
  };

  const renderBasicInfo = () => (
    <>
      {renderStepHeader(<User size={28} color="#14B8A6" />, 'Basic Info', "Let's verify the details from your onboarding.")}
      <GlassCardView style={styles.formCard}>
        <Text style={styles.inputLabel}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={data.displayName}
          onChangeText={v => update({ displayName: v })}
          placeholder="Your name"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.inputLabel}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          value={data.dateOfBirth}
          onChangeText={v => update({ dateOfBirth: v })}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textMuted}
        />

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
              style={styles.input}
              value={data.height}
              onChangeText={v => update({ height: v })}
              placeholder="175"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={data.weight}
              onChangeText={v => update({ weight: v })}
              placeholder="70"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Blood Group</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodRow}>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
            <TouchableOpacity
              key={bg}
              style={[styles.bloodChip, data.bloodGroup === bg && styles.bloodChipSelected]}
              onPress={() => update({ bloodGroup: bg })}>
              <Text style={[styles.bloodText, data.bloodGroup === bg && styles.bloodTextSelected]}>
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </GlassCardView>
      {renderValidation()}
    </>
  );

  const renderMedicalConditions = () => (
    <>
      {renderStepHeader(<ClipboardList size={28} color="#EC4899" />, 'Medical Conditions', 'Do you have any ongoing medical conditions?')}
      <GlassCardView style={styles.formCard}>
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
      </GlassCardView>
      {renderValidation()}
    </>
  );

  const renderMedications = () => (
    <>
      {renderStepHeader(<Pill size={28} color="#F59E0B" />, 'Current Medications', 'Are you currently taking any medications?')}
      <GlassCardView style={styles.formCard}>
        <TouchableOpacity
          style={[styles.skipCard, data.noMedications && styles.skipCardSelected]}
          onPress={() => update({ noMedications: !data.noMedications, medications: data.noMedications ? data.medications : [] })}
          activeOpacity={0.7}>
          <View style={[styles.skipIconWrap, data.noMedications && styles.skipIconWrapSelected]}>
            <Check size={18} color={data.noMedications ? '#FFFFFF' : '#14B8A6'} />
          </View>
          <View style={styles.skipContent}>
            <Text style={[styles.skipTitle, data.noMedications && styles.skipTitleSelected]}>
              Not on any medications
            </Text>
            <Text style={styles.skipSub}>
              {data.noMedications ? 'Tapped — you can still add below if needed' : 'Tap here if this applies to you'}
            </Text>
          </View>
          <View style={[styles.skipCheck, data.noMedications && styles.skipCheckSelected]}>
            {data.noMedications && <Text style={styles.skipCheckMark}>✓</Text>}
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
                <TextInput
                  style={styles.input}
                  value={newMedStart}
                  onChangeText={setNewMedStart}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TextInput
                  style={styles.input}
                  value={newMedEnd}
                  onChangeText={setNewMedEnd}
                  placeholder="Ongoing"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addMedication} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>+ Add Medication</Text>
            </TouchableOpacity>
          </>
        )}
      </GlassCardView>
      {renderValidation()}
    </>
  );

  const renderAllergies = () => (
    <>
      {renderStepHeader(<TriangleAlert size={28} color="#F59E0B" />, 'Allergies', 'Do you have any known allergies?')}
      <GlassCardView style={styles.formCard}>
        <TouchableOpacity
          style={[styles.skipCard, data.noAllergies && styles.skipCardSelectedGreen]}
          onPress={() => update({ noAllergies: !data.noAllergies, allergies: data.noAllergies ? data.allergies : [] })}
          activeOpacity={0.7}>
          <View style={[styles.skipIconWrap, data.noAllergies && styles.skipIconWrapSelectedGreen]}>
            <Shield size={18} color={data.noAllergies ? '#FFFFFF' : '#14B8A6'} />
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
            {data.noAllergies && <Text style={styles.skipCheckMark}>✓</Text>}
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
      </GlassCardView>
      {renderValidation()}
    </>
  );

  const renderNutrition = () => (
    <>
      {renderStepHeader(<Apple size={28} color="#22C55E" />, 'Nutrition Preferences', 'What best describes your diet?')}
      <GlassCardView style={styles.formCard}>
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
      </GlassCardView>
      {renderValidation()}
    </>
  );

  const renderFitness = () => (
    <>
      {renderStepHeader(<Dumbbell size={28} color="#EC4899" />, 'Fitness Profile', 'Help us understand your activity level')}
      <GlassCardView style={styles.formCard}>
        <Text style={styles.inputLabel}>Fitness Level</Text>
        {renderOptionGrid(FITNESS_LEVELS, data.fitnessLevel, v => update({ fitnessLevel: v }))}

        <Text style={[styles.inputLabel, { marginTop: Spacing.xl }]}>Where do you exercise?</Text>
        {renderOptionGrid(EXERCISE_LOCATIONS, data.exerciseLocation, v => update({ exerciseLocation: v }))}
      </GlassCardView>
      {renderValidation()}
    </>
  );

  const renderGenderSpecific = () => {
    const isFemale = data.gender === 'female';
    const isMale = data.gender === 'male';

    return (
      <>
        {renderStepHeader(
          isFemale ? <Flower2 size={28} color="#EC4899" /> : <Stethoscope size={28} color="#3B82F6" />,
          isFemale ? 'Cycle Tracking' : "Men's Health",
          isFemale
            ? 'Track your menstrual cycle for better health insights'
            : 'Help us personalize your health profile',
        )}
        <GlassCardView style={styles.formCard}>
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
            <Text style={styles.emptyText}>
              Additional health profile options will be available based on your health goals.
            </Text>
          )}
        </GlassCardView>
        {renderValidation()}
      </>
    );
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={goBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Complete Profile</Text>
        <View style={styles.backPlaceholder} />
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar progress={progress} color={theme.colors.teal} height={6} />
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
          {step > 0 && (
            <TouchableOpacity style={styles.backStepBtn} onPress={goBack} activeOpacity={0.7}>
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, isLastStep && styles.saveBtn]}
            onPress={isLastStep ? handleSave : goNext}
            activeOpacity={0.8}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <Text style={styles.nextBtnText}>
                {isLastStep ? 'Save Profile' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
