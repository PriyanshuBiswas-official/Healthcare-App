import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Typography, Spacing, Radius, Shadows } from '../theme/theme';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { ProgressBar } from './SharedComponents';

interface ProfileCompletionBannerProps {
  percentage: number;
  onSkip: () => void;
  onComplete: () => void;
}

export default function ProfileCompletionBanner({
  percentage,
  onSkip,
  onComplete,
}: ProfileCompletionBannerProps) {
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const progressColor =
    percentage < 40 ? theme.colors.pink : percentage < 70 ? theme.colors.amber : theme.colors.teal;

  const styles = useStyles((theme) => ({
    container: {
      marginBottom: Spacing.base,
    },
    card: {
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.teal + '40',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    icon: {
      fontSize: Typography.xl,
      marginRight: Spacing.sm,
    },
    title: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: Typography.sm,
      color: theme.colors.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 18,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    progressTrack: {
      flex: 1,
      marginRight: Spacing.md,
    },
    percentage: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      minWidth: 36,
      textAlign: 'right',
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    skipBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      alignItems: 'center',
    },
    skipText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold,
      color: theme.colors.textSecondary,
    },
    completeBtn: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: theme.colors.teal,
      alignItems: 'center',
    },
    completeText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: theme.colors.bg,
    },
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>📝</Text>
          <Text style={styles.title}>Complete Your Profile</Text>
        </View>

        <Text style={styles.subtitle}>
          {percentage === 0
            ? 'Set up your profile for a personalised experience'
            : `You're ${percentage}% done — almost there!`}
        </Text>

        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <ProgressBar progress={percentage / 100} color={progressColor} height={8} />
          </View>
          <Text style={[styles.percentage, { color: progressColor }]}>{percentage}%</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.completeBtn, Shadows.teal]}
            onPress={onComplete}
            activeOpacity={0.8}>
            <Text style={styles.completeText}>Complete Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}
