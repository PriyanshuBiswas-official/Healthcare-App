import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { useAuth } from '../providers/AuthProvider';
import { API_BASE_URL } from '../config/api';

type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: { onboardingData: any };
};

type OnboardingScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const GOALS = [
  'Improve Overall Health',
  'Lose Weight',
  'Build Muscle',
  'Improve Fitness',
  'Eat Better',
  'Track Cycle',
  'Manage Medical Conditions',
];

const GENDERS = ['male', 'female', 'other'];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ACTIVITY_LEVELS = [
  { label: 'Sedentary', desc: 'Little to no exercise, desk job' },
  { label: 'Lightly Active', desc: 'Light exercise or active lifestyle 1-3 days/week' },
  { label: 'Moderately Active', desc: 'Moderate exercise or sports 3-5 days/week' },
  { label: 'Very Active', desc: 'Hard exercise or active sports 6-7 days/week' },
];

const AI_FEATURES = [
  { icon: '💬', title: 'AI Advisor', desc: 'Personalized voice and chat advisor for health and wellness inquiries.' },
  { icon: '🍏', title: 'Nutrition Analyst & OCR', desc: 'Snap photos of food or barcodes for instant breakdown.' },
  { icon: '🌸', title: 'Menstrual & Ovulation Tracker', desc: 'Predictive cycles, symptom mapping, and AI advice.' },
  { icon: '📈', title: 'Interactive Performance Insights', desc: 'Deep analytics tracking your workouts, diet, and progress.' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenProp>();
  const { session, user, checkProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [activityLevel, setActivityLevel] = useState('');

  const nextStep = () => {
    // Validate current step
    if (step === 1) {
      if (!displayName.trim()) {
        Alert.alert('Required', 'Please enter your name');
        return;
      }
    } else if (step === 2) {
      if (!selectedGoal) {
        Alert.alert('Required', 'Please select a primary goal');
        return;
      }
    } else if (step === 3) {
      if (!dobYear || !dobMonth || !dobDay) {
        Alert.alert('Required', 'Please enter your complete date of birth');
        return;
      }
      const y = parseInt(dobYear, 10);
      const m = parseInt(dobMonth, 10);
      const d = parseInt(dobDay, 10);
      if (isNaN(y) || y < 1900 || y > new Date().getFullYear()) {
        Alert.alert('Invalid Date', 'Please enter a valid year');
        return;
      }
      if (isNaN(m) || m < 1 || m > 12) {
        Alert.alert('Invalid Date', 'Please enter a valid month (1-12)');
        return;
      }
      if (isNaN(d) || d < 1 || d > 31) {
        Alert.alert('Invalid Date', 'Please enter a valid day (1-31)');
        return;
      }
      if (!gender) {
        Alert.alert('Required', 'Please select your gender');
        return;
      }
      if (!height || isNaN(parseFloat(height))) {
        Alert.alert('Required', 'Please enter your height in cm');
        return;
      }
      if (!weight || isNaN(parseFloat(weight))) {
        Alert.alert('Required', 'Please enter your weight in kg');
        return;
      }
      if (!bloodGroup) {
        Alert.alert('Required', 'Please select your blood group');
        return;
      }
    } else if (step === 4) {
      if (!activityLevel) {
        Alert.alert('Required', 'Please select an activity level');
        return;
      }
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const getOnboardingData = () => {
    const formattedDob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    return {
      displayName,
      goals: [selectedGoal],
      dateOfBirth: formattedDob,
      gender,
      heightCm: parseFloat(height),
      weightKg: parseFloat(weight),
      bloodGroup,
      units: 'metric',
      activityLevel,
      // Default cycle variables to avoid issues in female cycles setup
      getsPeriods: gender === 'female',
      cycleLengthUnsure: true,
      cycleLength: 28,
      periodLength: 5,
      lastPeriodStart: new Date().toISOString().split('T')[0],
      isRegular: 'regular',
    };
  };

  const handleFinish = async () => {
    const data = getOnboardingData();

    if (session?.user) {
      // User is already logged in, write directly to database
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile/setup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        });

        const json = await response.json();
        setLoading(false);

        if (json.success) {
          await checkProfile();
        } else {
          Alert.alert('Error', json.error || 'Failed to save profile. Please try again.');
        }
      } catch (err: any) {
        setLoading(false);
        Alert.alert('Network Error', err.message || 'An unexpected error occurred. Please try again.');
      }
    } else {
      // User is not logged in yet, go to Signup and pass parameters
      navigation.navigate('Signup', { onboardingData: data });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {step > 1 && (
          <TouchableOpacity onPress={prevStep} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.progressText}>Step {step} of 5</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What should we call you?</Text>
            <Text style={styles.stepSubtitle}>This is how your name will appear throughout the application.</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Your Name"
              placeholderTextColor="#52525B"
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What is your primary goal?</Text>
            <Text style={styles.stepSubtitle}>We will customize your daily view and recommendations accordingly.</Text>
            <View style={styles.goalList}>
              {GOALS.map((goal) => {
                const isSelected = selectedGoal === goal;
                return (
                  <TouchableOpacity
                    key={goal}
                    style={[styles.goalButton, isSelected && styles.goalButtonSelected]}
                    onPress={() => setSelectedGoal(goal)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.goalText, isSelected && styles.goalTextSelected]}>{goal}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Basic Info</Text>
            <Text style={styles.stepSubtitle}>This data helps us calculate your BMI, daily calorie target, and cycle details.</Text>

            {/* DOB Inputs */}
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <View style={styles.dobContainer}>
              <TextInput
                style={[styles.textInput, styles.dobInput]}
                placeholder="YYYY"
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                maxLength={4}
                value={dobYear}
                onChangeText={setDobYear}
              />
              <TextInput
                style={[styles.textInput, styles.dobInput]}
                placeholder="MM"
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                maxLength={2}
                value={dobMonth}
                onChangeText={setDobMonth}
              />
              <TextInput
                style={[styles.textInput, styles.dobInput]}
                placeholder="DD"
                placeholderTextColor="#52525B"
                keyboardType="number-pad"
                maxLength={2}
                value={dobDay}
                onChangeText={setDobDay}
              />
            </View>

            {/* Gender Input */}
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.rowContainer}>
              {GENDERS.map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.badgeOption, isSelected && styles.badgeOptionSelected]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Height & Weight Container */}
            <View style={styles.rowContainer}>
              <View style={styles.flexItem}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 175"
                  placeholderTextColor="#52525B"
                  keyboardType="decimal-pad"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={[styles.flexItem, { marginLeft: Spacing.md }]}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 70"
                  placeholderTextColor="#52525B"
                  keyboardType="decimal-pad"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>

            {/* Blood Group */}
            <Text style={styles.inputLabel}>Blood Group</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bloodScroll}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodGroupBadge, isSelected && styles.bloodGroupBadgeSelected]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[styles.bloodGroupText, isSelected && styles.bloodGroupTextSelected]}>{bg}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Activity Level</Text>
            <Text style={styles.stepSubtitle}>How active are you in your everyday life?</Text>
            <View style={styles.activityList}>
              {ACTIVITY_LEVELS.map((act) => {
                const isSelected = activityLevel === act.label;
                return (
                  <TouchableOpacity
                    key={act.label}
                    style={[styles.activityButton, isSelected && styles.activityButtonSelected]}
                    onPress={() => setActivityLevel(act.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.activityLabelText, isSelected && styles.activityLabelTextSelected]}>
                      {act.label}
                    </Text>
                    <Text style={styles.activityDescText}>{act.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>AI Health Features</Text>
            <Text style={styles.stepSubtitle}>LunaFlow features next-generation AI modules built directly into the app.</Text>

            <View style={styles.aiFeaturesGrid}>
              {AI_FEATURES.map((feat) => (
                <View key={feat.title} style={styles.aiFeatureCard}>
                  <Text style={styles.aiFeatureIcon}>{feat.icon}</Text>
                  <View style={styles.aiFeatureContent}>
                    <Text style={styles.aiFeatureTitle}>{feat.title}</Text>
                    <Text style={styles.aiFeatureDesc}>{feat.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step < 5 ? (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleFinish} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.bg} />
            ) : (
              <Text style={styles.nextButtonText}>
                {session?.user ? 'Save Profile' : 'Continue to Sign Up'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  backButtonText: {
    color: Colors.text,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  progressText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
    lineHeight: 20,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    color: Colors.text,
    padding: Spacing.base,
    fontSize: Typography.md,
  },
  goalList: {
    gap: Spacing.md,
  },
  goalButton: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.base,
    alignItems: 'center',
  },
  goalButtonSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealDim,
  },
  goalText: {
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    color: Colors.text,
  },
  goalTextSelected: {
    color: Colors.teal,
    fontWeight: Typography.bold,
  },
  inputLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  dobContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  dobInput: {
    flex: 1,
    textAlign: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  flexItem: {
    flex: 1,
  },
  badgeOption: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  badgeOptionSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealDim,
  },
  badgeText: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  badgeTextSelected: {
    color: Colors.teal,
    fontWeight: Typography.bold,
  },
  bloodScroll: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  bloodGroupBadge: {
    width: 60,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodGroupBadgeSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealDim,
  },
  bloodGroupText: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
  },
  bloodGroupTextSelected: {
    color: Colors.teal,
    fontWeight: Typography.bold,
  },
  activityList: {
    gap: Spacing.md,
  },
  activityButton: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  activityButtonSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealDim,
  },
  activityLabelText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  activityLabelTextSelected: {
    color: Colors.teal,
  },
  activityDescText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  aiFeaturesGrid: {
    gap: Spacing.lg,
  },
  aiFeatureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.base,
    gap: Spacing.base,
  },
  aiFeatureIcon: {
    fontSize: 28,
  },
  aiFeatureContent: {
    flex: 1,
  },
  aiFeatureTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.text,
    marginBottom: 4,
  },
  aiFeatureDesc: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.bgCardBorder,
  },
  nextButton: {
    backgroundColor: Colors.teal,
    paddingVertical: 18,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.bg,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
});
