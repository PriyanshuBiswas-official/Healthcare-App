import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { GoogleSignin } from '../lib/googleSignin';

type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
};

type LoginScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      const idToken = data?.idToken;

      if (!idToken) {
        Alert.alert('Error', 'Failed to get Google ID token');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      setLoading(false);

      if (error) {
        Alert.alert('Login Failed', error.message);
      }
    } catch (error: any) {
      setLoading(false);
      if (error.code === 'SIGN_IN_CANCELLED') {
        return;
      }
      Alert.alert('Google Login Failed', error.message || 'An unexpected error occurred');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
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
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.linkButton}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Coming Soon', 'Apple login will be implemented soon.')}>
            <Text style={styles.socialButtonText}>Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => Alert.alert('Coming Soon', 'Facebook login will be implemented soon.')}>
            <Text style={styles.socialButtonText}>Continue with Facebook</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 32, textAlign: 'center', color: '#FFFFFF', letterSpacing: -0.5 },
  inputContainer: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#E4E4E7', marginBottom: 8, marginLeft: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#27272A',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#18181B',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#A1A1AA', fontSize: 15, fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  divider: { flex: 1, height: 1, backgroundColor: '#27272A' },
  dividerText: { marginHorizontal: 16, color: '#52525B', fontSize: 14, fontWeight: '500' },
  socialContainer: { gap: 12 },
  socialButton: {
    borderWidth: 1,
    borderColor: '#27272A',
    backgroundColor: '#18181B',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  socialButtonText: { fontSize: 16, color: '#E4E4E7', fontWeight: '500' },
});

export default LoginScreen;
