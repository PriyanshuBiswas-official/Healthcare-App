import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';

type AuthStackParamList = {
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Signup: { onboardingData?: any } | undefined;
};

type WelcomeScreenProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const { height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Glow Effects */}
        <View style={[styles.glow, styles.glowTeal]} />
        <View style={[styles.glow, styles.glowPink]} />

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌙</Text>
          </View>
          <Text style={styles.title}>LunaFlow</Text>
          <Text style={styles.subtitle}>Your AI-powered personalized health, wellness, & cycle companion</Text>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>✨</Text>
            <View>
              <Text style={styles.featureTitle}>AI Insights</Text>
              <Text style={styles.featureDesc}>Get tailored answers to any health queries</Text>
            </View>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureIcon}>📊</Text>
            <View>
              <Text style={styles.featureTitle}>Health & Fitness Tracking</Text>
              <Text style={styles.featureDesc}>Log activity, sleep, diet, water & vitals</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: height * 0.08,
    paddingBottom: Spacing.xl,
  },
  glow: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.15,
  },
  glowTeal: {
    top: -50,
    left: -50,
    backgroundColor: Colors.teal,
  },
  glowPink: {
    bottom: 100,
    right: -50,
    backgroundColor: Colors.pink,
  },
  heroContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: Typography.display,
    fontWeight: Typography.bold,
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    lineHeight: 22,
  },
  featuresContainer: {
    marginVertical: Spacing.xxl,
    gap: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  actionContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.teal,
    paddingVertical: 18,
    borderRadius: Radius.md,
    alignItems: 'center',
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.bg,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
  },
});
