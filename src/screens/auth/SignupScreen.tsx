import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../../lib/supabase';
import { GoogleSignin } from '../../lib/googleSignin';
import { API_BASE_URL } from '../../config/api';
import { useAuth } from '../../providers/AuthProvider';
import { Typography } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { posthog } from '../../config/posthog';
import { BackButton } from '../../components/SharedComponents';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';

type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: { onboardingData?: any };
};

type SignupScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
type SignupRouteProp = RouteProp<AuthStackParamList, 'Signup'>;

const OTP_LENGTH = 6;

const SignupScreen = () => {
  const navigation = useNavigation<SignupScreenProp>();
  const route = useRoute<SignupRouteProp>();
  const { checkProfile } = useAuth();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const onboardingData = route.params?.onboardingData;

  const handleBack = () => {
    navigation.goBack();
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one number.');
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

    // If session exists (email confirmation disabled), save profile data directly
    if (data?.session) {
      const saved = await saveProfileData(data.session.access_token);
      if (saved) {
        await checkProfile(data.session);
        posthog?.capture('user_signed_up', { method: 'password' });
      }
      setLoading(false);
    } else {
      // Email confirmation required — send OTP code explicitly
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) {
        setLoading(false);
        Alert.alert('Error', otpError.message);
        return;
      }
      setLoading(false);
      setShowOtp(true);
      setResendCooldown(60);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      Alert.alert('Error', `Please enter the ${OTP_LENGTH}-digit code`);
      return;
    }

    setOtpLoading(true);
    Keyboard.dismiss();

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });

    if (error) {
      setOtpLoading(false);
      Alert.alert('Verification Failed', error.message);
      return;
    }

    if (data?.session) {
      const saved = await saveProfileData(data.session.access_token);
      if (saved) {
        await checkProfile(data.session);
        posthog?.capture('user_signed_up', { method: 'password' });
      }
      setOtpLoading(false);
    } else {
      setOtpLoading(false);
      Alert.alert('Error', 'Verification succeeded but no session was created. Please log in.');
      navigation.navigate('Login');
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      Alert.alert('Resend Failed', error.message);
      return;
    }

    setResendCooldown(60);
    Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
  };

  const handleOtpChange = (text: string, index: number) => {
    // Allow only digits
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance to next input
    if (digit && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (digit && index === OTP_LENGTH - 1) {
      const code = newOtp.join('');
      if (code.length === OTP_LENGTH) {
        Keyboard.dismiss();
        // Small delay so the last digit renders
        setTimeout(() => verifyOtpCode(code), 100);
      }
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const verifyOtpCode = async (code: string) => {
    setOtpLoading(true);

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'signup',
    });

    if (error) {
      setOtpLoading(false);
      Alert.alert('Verification Failed', error.message);
      // Clear OTP on error
      setOtp(Array(OTP_LENGTH).fill(''));
      otpInputs.current[0]?.focus();
      return;
    }

    if (data?.session) {
      const saved = await saveProfileData(data.session.access_token);
      if (saved) {
        await checkProfile(data.session);
        posthog?.capture('user_signed_up', { method: 'password' });
      }
      setOtpLoading(false);
    } else {
      setOtpLoading(false);
      Alert.alert('Error', 'Verification succeeded but no session was created. Please log in.');
      navigation.navigate('Login');
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
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
    passwordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    eyeBtn: {
      position: 'absolute',
      right: 14,
      padding: 4,
    },
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
    // OTP styles
    otpContainer: { alignItems: 'center', marginTop: 8 },
    otpSubtitle: { fontSize: Typography.sm, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    otpEmail: { fontWeight: Typography.semiBold, color: theme.colors.white },
    otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    otpInput: {
      width: 48,
      height: 56,
      borderWidth: 1.5,
      borderColor: theme.colors.inputBorder,
      borderRadius: 12,
      textAlign: 'center',
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: theme.colors.white,
      backgroundColor: theme.colors.bgInput,
    },
    otpInputFocused: {
      borderColor: theme.colors.blue,
    },
    otpButton: {
      backgroundColor: theme.colors.blue,
      paddingVertical: 18,
      borderRadius: 16,
      alignItems: 'center',
      width: '100%',
      shadowColor: theme.colors.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    otpButtonText: { color: theme.colors.white, fontSize: Typography.base, fontWeight: Typography.semiBold },
    resendRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    resendText: { color: theme.colors.textHint, fontSize: Typography.sm },
    resendLink: { color: theme.colors.blue, fontSize: Typography.sm, fontWeight: Typography.semiBold },
    resendLinkDisabled: { color: theme.colors.textHint },
    changeEmailButton: { marginTop: 16, alignItems: 'center' },
    changeEmailText: { color: theme.colors.textHint, fontSize: Typography.sm, textDecorationLine: 'underline' },
    otpTopBar: {
      paddingHorizontal: 24,
      paddingTop: insets.top + 8,
    },
    otpContent: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
    },
  }));

  // OTP verification screen
  if (showOtp) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.otpTopBar}>
          <BackButton onPress={handleBack} color={theme.colors.textPrimary} />
        </View>
        <View style={styles.otpContent}>
          <Text style={styles.title}>Verify Email</Text>

          <View style={styles.otpContainer}>
            <Text style={styles.otpSubtitle}>
              We sent a {OTP_LENGTH}-digit code to{'\n'}
              <Text style={styles.otpEmail}>{email}</Text>
            </Text>

            <View style={styles.otpRow}>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <TextInput
                  key={i}
                  ref={(ref) => { otpInputs.current[i] = ref; }}
                  style={[styles.otpInput, otp[i] ? styles.otpInputFocused : null]}
                  value={otp[i]}
                  onChangeText={(text) => handleOtpChange(text, i)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!otpLoading}
                  autoFocus={i === 0}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.otpButton, otpLoading && { opacity: 0.6 }]}
              onPress={handleVerifyOtp}
              disabled={otpLoading || otp.join('').length !== OTP_LENGTH}>
              {otpLoading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.otpButtonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive the code? </Text>
              <TouchableOpacity onPress={handleResendOtp} disabled={resendCooldown > 0}>
                <Text style={[styles.resendLink, resendCooldown > 0 && styles.resendLinkDisabled]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.changeEmailButton} onPress={() => {
              setShowOtp(false);
              setOtp(Array(OTP_LENGTH).fill(''));
            }}>
              <Text style={styles.changeEmailText}>Change email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Signup form
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.otpTopBar}>
        <BackButton onPress={handleBack} color={theme.colors.textPrimary} />
      </View>
      <View style={styles.otpContent}>
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
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter your password"
              placeholderTextColor={theme.colors.textPlaceholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
              {showPassword ? (
                <EyeOff size={20} color={theme.colors.textSecondary} strokeWidth={1.8} />
              ) : (
                <Eye size={20} color={theme.colors.textSecondary} strokeWidth={1.8} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>At least 8 characters, 1 uppercase, 1 number.</Text>
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
