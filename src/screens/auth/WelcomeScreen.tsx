import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  const styles = useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bg,
      paddingTop: insets.top,
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
      backgroundColor: theme.colors.teal,
    },
    glowPink: {
      bottom: 100,
      right: -50,
      backgroundColor: theme.colors.pink,
    },
    heroContainer: {
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: Radius.xl,
      backgroundColor: theme.colors.tooltipBg,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
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
      color: theme.colors.text,
      letterSpacing: -1,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.base,
      color: theme.colors.textSecondary,
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
      backgroundColor: theme.colors.bgCard,
      padding: Spacing.base,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    featureIcon: {
      fontSize: Typography.xl,
    },
    featureTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: theme.colors.text,
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
    },
    actionContainer: {
      gap: Spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.teal,
      paddingVertical: 18,
      borderRadius: Radius.md,
      alignItems: 'center',
      shadowColor: theme.colors.teal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    primaryButtonText: {
      color: theme.colors.bg,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
    },
    secondaryButton: {
      paddingVertical: 16,
      borderRadius: Radius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      backgroundColor: theme.colors.bgCard,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
    },
  }));

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Glow Effects */}
        <View style={[styles.glow, styles.glowTeal]} />
        <View style={[styles.glow, styles.glowPink]} />

        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🌙</Text>
          </View>
          <Text style={styles.title}>Cureto</Text>
          <Text style={styles.subtitle}>Your AI-powered personalized health & wellness companion</Text>
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
    </View>
  );
}
