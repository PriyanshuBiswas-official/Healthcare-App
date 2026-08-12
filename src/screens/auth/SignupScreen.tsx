import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { GoogleSignin } from '../../lib/googleSignin';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../providers/AuthProvider';
import { Typography } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { posthog } from '../../config/posthog';

type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: { onboardingData?: any };
};

type SignupScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
type SignupRouteProp = RouteProp<AuthStackParamList, 'Signup'>;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenProp>();
  const route = useRoute<SignupRouteProp>();
  const { checkProfile } = useAuth();
  const { theme } = useTheme();
  const onboardingData = route.params?.onboardingData;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const saveProfileData = async (accessToken: string) => {
    if (!onboardingData) return true;

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(onboardingData),
      });

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to save profile');
      }
      return true;
    } catch (err: any) {
      console.error('Error saving profile:', err);
      return new Promise<boolean>((resolve) => {
        Alert.alert(
          'Save Failed',
          err.message || 'Failed to save profile data. Please try again.',
          [
            {
              text: 'Retry',
              onPress: async () => {
                const success = await saveProfileData(accessToken);
                resolve(success);
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
          ]
        );
      });
    }
  };

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      Alert.alert('Signup Failed', error.message);
      return;
    }

    // If session exists (i.e. email confirmation disabled / auto-confirm on), save profile data
    if (data?.session) {
      const saved = await saveProfileData(data.session.access_token);
      if (saved) {
        // Re-check the profile — this sets hasProfile=true in AuthProvider,
        // which causes RootComponent to swap from Onboarding → AppShell.
        await checkProfile(data.session);
        posthog?.capture('user_signed_up', { method: 'password' });
      }
      setLoading(false);
    } else {
      setLoading(false);
      Alert.alert('Verify your email', 'Check your inbox to confirm your account, then log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      // Always sign out first so the account picker is shown even if a
      // Google account was previously cached on this device.
      try { await GoogleSignin.signOut(); } catch (_) {}
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google ID token');
        setLoading(false);
        return;
      }

      const { data: authData, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        setLoading(false);
        Alert.alert('Signup Failed', error.message);
        return;
      }

      if (authData?.session) {
        const saved = await saveProfileData(authData.session.access_token);
        if (saved) {
          // Re-check profile to set hasProfile=true and navigate to Dashboard.
          await checkProfile(authData.session);
          posthog?.capture('user_signed_up', { method: 'google' });
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'SIGN_IN_CANCELLED') {
        return;
      }
      Alert.alert('Google Signup Failed', error.message || 'An unexpected error occurred');
    }
  };

  const styles = useStyles((theme) => ({
    container: { flex: 1, backgroundColor: theme.colors.bgAuth },
    content: { flex: 1, padding: 24, justifyContent: 'center' },
    title: { fontSize: Typography.xxl, fontWeight: Typography.bold, marginBottom: 32, textAlign: 'center', color: theme.colors.white, letterSpacing: Typography.lsTight },
    inputContainer: { marginBottom: 20 },
    inputLabel: { fontSize: Typography.xs, fontWeight: Typography.medium, color: theme.colors.textInputLabel, marginBottom: 8, marginLeft: 2 },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      padding: 16,
      borderRadius: 12,
      fontSize: Typography.base,
      color: theme.colors.white,
      backgroundColor: theme.colors.bgInput,
    },
    hintText: { fontSize: Typography.sm, color: theme.colors.textHint, marginTop: 6, marginLeft: 2 },
    button: {
      backgroundColor: theme.colors.blue,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 16,
      shadowColor: theme.colors.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    buttonText: { color: theme.colors.white, fontSize: Typography.base, fontWeight: Typography.semiBold },
    linkButton: { marginTop: 24, alignItems: 'center' },
    linkText: { color: theme.colors.textHint, fontSize: Typography.base, fontWeight: Typography.medium },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
    divider: { flex: 1, height: 1, backgroundColor: theme.colors.inputBorder },
    dividerText: { marginHorizontal: 16, color: theme.colors.textPlaceholder, fontSize: Typography.xs, fontWeight: Typography.medium },
    socialContainer: { gap: 12 },
    socialButton: {
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.bgInput,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    socialButtonText: { fontSize: Typography.base, color: theme.colors.textInputLabel, fontWeight: Typography.medium },
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textPlaceholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={theme.colors.textPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.hintText}>Password must be at least 6 characters long.</Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Sign Up'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? Log In</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleSignup}>
            <Text style={styles.socialButtonText}>Sign up with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Coming Soon', 'Apple signup will be implemented soon.')}>
            <Text style={styles.socialButtonText}>Sign up with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Coming Soon', 'Facebook signup will be implemented soon.')}>
            <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignupScreen;
