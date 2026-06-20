import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import SuccessScreen from '../screens/SuccessScreen';

const Stack = createNativeStackNavigator();

export const MainStack = () => {
  const { session, user } = useAuth();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkAndSync = async () => {
      try {
        const onboardingJson = await AsyncStorage.getItem('@onboarding_data');

        if (onboardingJson && session?.access_token) {
          const onboardingData = JSON.parse(onboardingJson);

          const API_URL = 'http://192.168.0.159:5000/api/profile/setup';
          const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              email: user?.email || '',
              age: parseInt(onboardingData.age, 10) || 0,
              gender: onboardingData.gender?.toLowerCase() || 'other',
              heightCm: parseFloat(onboardingData.height) || 0,
              weightKg: parseFloat(onboardingData.weight) || 0,
              units: 'metric',
              goals: onboardingData.goals || [],
              primaryGoal: onboardingData.primaryGoal || '',
              displayName: user?.email ? user.email.split('@')[0] : 'User',
            }),
          });

          if (response.ok) {
            await AsyncStorage.removeItem('@onboarding_data');
            await AsyncStorage.removeItem('@is_new_signup');
            setInitialRoute('Success');
          } else {
            const errText = await response.text();
            console.error('[MainStack] Backend sync failed:', response.status, errText);
            setInitialRoute('Success');
          }
        } else {
          setInitialRoute('Home');
        }
      } catch (e) {
        console.error('[MainStack] Sync error:', e);
        setInitialRoute('Home');
      }
    };

    if (session) {
      checkAndSync();
    }
  }, [session]);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: '#09090B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Success" component={SuccessScreen} />
    </Stack.Navigator>
  );
};
