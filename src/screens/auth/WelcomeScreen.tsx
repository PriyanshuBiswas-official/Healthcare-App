import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'react-native-linear-gradient';
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
const logo = require('../../../assets/logo.png');

export default function WelcomeScreen() {
  const navigation = useNavigation<WelcomeScreenProp>();
  const insets = useSafeAreaInsets();

  const styles = useStyles((theme) => ({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: insets.top + height * 0.06,
      paddingBottom: Spacing.xl,
    },
    heroSection: {
      alignItems: 'center',
      marginTop: height * 0.04,
      marginBottom: Spacing.lg,
    },
    logoGlow: {
      width: 160,
      height: 160,
      borderRadius: 80,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.md,
    },
    logoImage: {
      width: 120,
      height: 120,
      borderRadius: 30,
    },
    title: {
      fontSize: 42,
      fontWeight: Typography.bold,
      color: '#FFFFFF',
      letterSpacing: -1,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: Typography.base,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      paddingHorizontal: Spacing.lg,
      lineHeight: 22,
    },
    featuresScroll: {
      flex: 1,
    },
    featuresContainer: {
      gap: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    featureCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.base,
      backgroundColor: 'rgba(255,255,255,0.10)',
      padding: Spacing.base,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    featureDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    featureTextContainer: {
      flex: 1,
    },
    featureTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
      color: '#FFFFFF',
      marginBottom: 2,
    },
    featureDesc: {
      fontSize: Typography.sm,
      color: 'rgba(255,255,255,0.65)',
    },
    actionContainer: {
      gap: Spacing.md,
      paddingTop: Spacing.md,
    },
    primaryButton: {
      backgroundColor: theme.colors.blue,
      paddingVertical: 18,
      borderRadius: Radius.md,
      alignItems: 'center',
      shadowColor: theme.colors.blue,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    primaryButtonText: {
      color: theme.colors.white,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
    },
    secondaryButton: {
      paddingVertical: 16,
      borderRadius: Radius.md,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.colors.blue + '50',
      backgroundColor: theme.colors.blue + '10',
    },
    secondaryButtonText: {
      color: theme.colors.white,
      fontSize: Typography.base,
      fontWeight: Typography.semiBold,
    },
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0D1B2A', '#070F18', '#030810']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoGlow}>
              <Image source={logo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Cureto</Text>
            <Text style={styles.subtitle}>Your AI-powered personalized health & wellness companion</Text>
          </View>

          {/* Scrollable Feature Cards */}
          <ScrollView
            style={styles.featuresScroll}
            contentContainerStyle={styles.featuresContainer}
            showsVerticalScrollIndicator={false}>
            <View style={styles.featureCard}>
              <View style={[styles.featureDot, { backgroundColor: '#60A5FA' }]} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>AI Insights</Text>
                <Text style={styles.featureDesc}>Get tailored answers to any health queries</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureDot, { backgroundColor: '#34D399' }]} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Health & Fitness Tracking</Text>
                <Text style={styles.featureDesc}>Log activity, sleep, diet & water</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureDot, { backgroundColor: '#A78BFA' }]} />
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>Sleep & Recovery</Text>
                <Text style={styles.featureDesc}>Monitor sleep patterns and recovery scores</Text>
              </View>
            </View>
          </ScrollView>

          {/* Fixed Bottom Buttons */}
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
              <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
