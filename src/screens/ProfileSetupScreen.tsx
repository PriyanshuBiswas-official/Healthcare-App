import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { ProgressBar } from '../components/SharedComponents';
import {
  getProfileCompletion,
  saveSection,
  skipSection,
  calculatePercentage,
  isProfileComplete,
  SECTION_ORDER,
  SECTION_META,
  ProfileCompletion,
} from '../services/profileCompletionService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BasicInfoSection from './profile/BasicInfoSection';
import MedicalHistorySection from './profile/MedicalHistorySection';
import MedicationsSection from './profile/MedicationsSection';
import AllergiesSection from './profile/AllergiesSection';
import EmergencyContactSection from './profile/EmergencyContactSection';
import GenderSpecificSection from './profile/GenderSpecificSection';

interface Props {
  onComplete?: () => void;
}

export default function ProfileSetupScreen({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [gender, setGender] = useState('');
  const [onboardingData, setOnboardingData] = useState<Record<string, any> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    (async () => {
      const data = await getProfileCompletion();
      setCompletion(data);

      let onboardGender = '';
      const onboardingJson = await AsyncStorage.getItem('@onboarding_data');
      if (onboardingJson) {
        const parsed = JSON.parse(onboardingJson);
        setOnboardingData(parsed);
        if (parsed.gender) onboardGender = parsed.gender;
      }

      if (onboardGender) {
        setGender(onboardGender);
      } else if (data.basic_info?.data?.gender) {
        setGender(data.basic_info.data.gender);
      }
    })();
  }, [fadeAnim]);

  const currentSectionId = SECTION_ORDER[step];
  const meta = SECTION_META[currentSectionId];
  const totalSteps = SECTION_ORDER.length;
  const percentage = completion ? calculatePercentage(completion) : 0;

  const handleSave = async (data: Record<string, any>) => {
    const updated = await saveSection(currentSectionId, data);
    setCompletion(updated);
    advance();
  };

  const handleSkip = async () => {
    const updated = await skipSection(currentSectionId);
    setCompletion(updated);
    advance();
  };

  const advance = () => {
    if (step < totalSteps - 1) {
      fadeAnim.setValue(0);
      setStep(step + 1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      onComplete?.();
    }
  };

  const goBack = () => {
    if (step > 0) {
      fadeAnim.setValue(0);
      setStep(step - 1);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      onComplete?.();
    }
  };

  const handleFinish = () => {
    onComplete?.();
  };

  if (!completion) return null;

  const isLastStep = step === totalSteps - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.navBtnText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Profile Setup</Text>

        <TouchableOpacity style={styles.skipHeaderBtn} onPress={handleSkip} activeOpacity={0.7}>
          <Text style={styles.skipHeaderText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        <ProgressBar progress={(step + 1) / totalSteps} color={Colors.teal} height={4} />
        <Text style={styles.progressLabel}>
          Step {step + 1} of {totalSteps} · {percentage}% complete
        </Text>
      </View>

      <View style={styles.sectionIndicator}>
        <Text style={styles.sectionIcon}>{meta.icon}</Text>
        <Text style={styles.sectionTitle}>{meta.title}</Text>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim, flex: 1 }]}>
        {currentSectionId === 'basic_info' && (
          <BasicInfoSection
            initialData={
              onboardingData
                ? {
                    dateOfBirth: onboardingData.dateOfBirth ?? '',
                    gender: onboardingData.gender ?? '',
                    height: onboardingData.height ?? '',
                    weight: onboardingData.weight ?? '',
                  }
                : completion?.basic_info?.data
                  ? {
                      dateOfBirth: completion.basic_info.data.dateOfBirth ?? '',
                      gender: completion.basic_info.data.gender ?? '',
                      height: completion.basic_info.data.height ?? '',
                      weight: completion.basic_info.data.weight ?? '',
                    }
                  : undefined
            }
            onSave={handleSave}
            onBack={goBack}
          />
        )}
        {currentSectionId === 'medical_history' && (
          <MedicalHistorySection onSave={handleSave} onBack={goBack} />
        )}
        {currentSectionId === 'medications' && (
          <MedicationsSection onSave={handleSave} onBack={goBack} />
        )}
        {currentSectionId === 'allergies' && (
          <AllergiesSection onSave={handleSave} onBack={goBack} />
        )}
        {currentSectionId === 'emergency_contact' && (
          <EmergencyContactSection onSave={handleSave} onBack={goBack} />
        )}
        {currentSectionId === 'gender_specific' && (
          <GenderSpecificSection
            gender={gender}
            initialData={completion.gender_specific?.data}
            onSave={handleSave}
            onBack={goBack}
          />
        )}
      </Animated.View>

      {isLastStep && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.finishBtn, Shadows.teal]}
            onPress={handleFinish}
            activeOpacity={0.8}>
            <Text style={styles.finishText}>
              {isProfileComplete(completion) ? 'Finish' : 'Skip Rest & Finish'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnText: { fontSize: 20, color: Colors.textPrimary },
  headerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  skipHeaderBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  skipHeaderText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textSecondary,
  },
  progressContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  sectionIcon: {
    fontSize: 22,
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.extraBold,
    color: Colors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.base,
  },
  footer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
  finishBtn: {
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.teal,
    alignItems: 'center',
  },
  finishText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.bg,
  },
});
