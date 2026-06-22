import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import WelcomeStep from './onboarding/WelcomeStep';
import FeaturesStep from './onboarding/FeaturesStep';
import PersonalizationStep from './onboarding/PersonalizationStep';
import BasicProfileStep from './onboarding/BasicProfileStep';
import MeetAssistantStep from './onboarding/MeetAssistantStep';
import PermissionsStep from './onboarding/PermissionsStep';
import GoalSetupStep from './onboarding/GoalSetupStep';

type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
};

type OnboardingScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

const OnboardingScreen = () => {
  const navigation = useNavigation<OnboardingScreenProp>();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Data collection state
  const [onboardingData, setOnboardingData] = useState({
    goals: [] as string[],
    dateOfBirth: '',
    gender: '',
    height: '',
    weight: '',
    primaryGoal: '',
  });

  // We no longer check @has_seen_onboarding. 
  // The WelcomeStep serves as the default landing page for unauthenticated users.
  // Users who already have an account can simply tap "Sign In" on the WelcomeStep.

  const handleSkipToAuth = () => {
    // If they sign in, we can skip and let Auth handle the rest
    navigation.replace('Login');
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderProgress = () => {
    // Show progress bar only on certain steps (Steps 2 to 6 i.e., Personalization to Goal Setup)
    if (currentStep < 2 || currentStep > 6) return null;
    
    const progress = ((currentStep - 1) / 5) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={() => setCurrentStep(1)} onSkip={handleSkipToAuth} />;
      case 1:
        return <FeaturesStep onNext={() => setCurrentStep(2)} />;
      case 2:
        return (
          <PersonalizationStep 
            onNext={(data) => {
              setOnboardingData((prev) => ({ ...prev, ...data }));
              setCurrentStep(3);
            }} 
            initialData={onboardingData.goals}
          />
        );
      case 3:
        return (
          <BasicProfileStep
            onNext={(data) => {
              setOnboardingData((prev) => ({ ...prev, ...data }));
              setCurrentStep(4);
            }}
            initialData={onboardingData}
          />
        );
      case 4:
        return <MeetAssistantStep onNext={() => setCurrentStep(5)} />;
      case 5:
        return <PermissionsStep onNext={() => setCurrentStep(6)} />;
      case 6:
        return (
          <GoalSetupStep 
            onNext={async (data) => {
              const finalData = { ...onboardingData, ...data };
              setOnboardingData(finalData);
              try {
                await AsyncStorage.setItem('@onboarding_data', JSON.stringify(finalData));
                navigation.replace('Signup');
              } catch (e) {
                console.error('Failed to save onboarding state', e);
              }
            }} 
          />
        );
      default:
        return <WelcomeStep onNext={() => setCurrentStep(1)} onSkip={handleSkipToAuth} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      <View style={styles.topContainer}>
        <View style={styles.headerRow}>
          {currentStep > 0 && currentStep <= 6 ? (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
              <Icon name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtnPlaceholder} />
          )}
          {renderProgress()}
        </View>
      </View>
      {renderStep()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090B',
  },
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  progressContainer: {
    flex: 1,
    paddingTop: 8,
    paddingBottom: 8,
    marginRight: 40, // offset back button to keep it centered if needed
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#27272A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnPlaceholder: {
    width: 40,
    height: 40,
  },
});

export default OnboardingScreen;
