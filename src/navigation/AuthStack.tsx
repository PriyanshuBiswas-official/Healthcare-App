import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import UnifiedOnboardingScreen from '../screens/auth/UnifiedOnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import { PostHogBoundary } from '../providers/PostHogBoundary';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
      <Stack.Screen name="Welcome">
        {() => <PostHogBoundary><WelcomeScreen /></PostHogBoundary>}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {() => <PostHogBoundary><UnifiedOnboardingScreen /></PostHogBoundary>}
      </Stack.Screen>
      <Stack.Screen name="Login">
        {() => <PostHogBoundary><LoginScreen /></PostHogBoundary>}
      </Stack.Screen>
      <Stack.Screen name="Signup">
        {() => <PostHogBoundary><SignupScreen /></PostHogBoundary>}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
