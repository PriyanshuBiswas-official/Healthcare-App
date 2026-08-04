import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Typography, Radius, Spacing } from '../../theme/theme';
import { useTheme } from '../../providers/ThemeProvider';
import {
  NotFoundIllustration,
  ServerErrorIllustration,
  MaintenanceIllustration,
  PermissionIllustration,
  NoInternetIllustration,
} from './ErrorIllustrations';

type ErrorType = '404' | '500' | 'maintenance' | 'permission' | 'no-internet';

type ErrorScreenProps = {
  type: ErrorType;
  statusCode?: number;
  title?: string;
  message?: string;
  estimatedReturn?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  onContactSupport?: () => void;
};

const ILLUSTRATIONS: Record<ErrorType, React.FC<{ size?: number }>> = {
  '404': NotFoundIllustration,
  '500': ServerErrorIllustration,
  maintenance: MaintenanceIllustration,
  permission: PermissionIllustration,
  'no-internet': NoInternetIllustration,
};

const DEFAULTS: Record<ErrorType, { title: string; message: string; badge: string; badgeStyle: 'default' | 'danger' | 'warning' | 'purple' }> = {
  '404': {
    title: 'Not Found',
    message: "Whoops! The page you're looking for doesn't exist.",
    badge: 'Status Code: 404',
    badgeStyle: 'default',
  },
  '500': {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again.',
    badge: 'Status Code: 500',
    badgeStyle: 'danger',
  },
  maintenance: {
    title: 'Under Maintenance',
    message: "We're currently performing scheduled maintenance. We'll be back soon.",
    badge: 'Come back later',
    badgeStyle: 'warning',
  },
  permission: {
    title: 'Access Denied',
    message: "You don't have permission to view this content.",
    badge: 'Contact Support',
    badgeStyle: 'purple',
  },
  'no-internet': {
    title: 'No Internet',
    message: 'Check your connection and try again.',
    badge: 'No connection detected',
    badgeStyle: 'default',
  },
};

const ErrorScreen: React.FC<ErrorScreenProps> = ({
  type,
  statusCode,
  title,
  message,
  estimatedReturn,
  onRetry,
  onGoHome,
  onContactSupport,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const defaults = DEFAULTS[type];
  const Illustration = ILLUSTRATIONS[type];

  const displayTitle = title || defaults.title;
  const displayMessage = message || defaults.message;
  const displayBadge = type === '500' && statusCode ? `Status Code: ${statusCode}` : defaults.badge;

  const getBadgeColors = () => {
    switch (defaults.badgeStyle) {
      case 'danger':
        return { bg: c.danger + '1A', text: c.danger };
      case 'warning':
        return { bg: c.amber + '1A', text: c.amber };
      case 'purple':
        return { bg: c.purple + '1A', text: c.purple };
      default:
        return { bg: c.teal + '1A', text: c.teal };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Illustration size={180} />
        </View>

        <Text style={[styles.title, { color: c.textPrimary }]}>{displayTitle}</Text>
        <Text style={[styles.message, { color: c.textSecondary }]}>{displayMessage}</Text>

        {estimatedReturn && (
          <Text style={[styles.estimated, { color: c.textSecondary }]}>
            Estimated return: {new Date(estimatedReturn).toLocaleString()}
          </Text>
        )}

        <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
          <Text style={[styles.badgeText, { color: badgeColors.text }]}>{displayBadge}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {type === 'no-internet' && onRetry && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.teal }]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.bg }]}>Retry</Text>
            </TouchableOpacity>
          )}

          {type === 'permission' && onContactSupport && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.teal }]}
              onPress={onContactSupport}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.bg }]}>Contact Support</Text>
            </TouchableOpacity>
          )}

          {type !== 'no-internet' && type !== 'permission' && onGoHome && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.teal }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.bg }]}>Take Me Home</Text>
            </TouchableOpacity>
          )}

          {type === 'no-internet' && onGoHome && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: c.chipBg }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.textPrimary }]}>Take Me Home</Text>
            </TouchableOpacity>
          )}

          {type === 'permission' && onGoHome && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: c.chipBg }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.textPrimary }]}>Take Me Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  illustrationContainer: {
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  estimated: {
    fontSize: Typography.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginBottom: Spacing.xxl,
  },
  badgeText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  secondaryButton: {
    borderWidth: 0,
  },
  buttonText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
});

export default ErrorScreen;
