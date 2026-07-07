import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, SafeAreaView } from 'react-native';
import { Typography, Radius, Spacing } from '../../theme/theme';
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

const COLORS = {
  dark: {
    bg: '#0A0B14',
    title: '#F0F4FF',
    subtitle: '#6B7090',
    badgeBg: 'rgba(0,229,204,0.1)',
    badgeText: '#00E5CC',
    dangerBadgeBg: 'rgba(255,107,107,0.1)',
    dangerBadgeText: '#FF6B6B',
    warningBadgeBg: 'rgba(255,183,77,0.1)',
    warningBadgeText: '#FFB74D',
    purpleBadgeBg: 'rgba(179,136,255,0.1)',
    purpleBadgeText: '#B388FF',
    buttonBg: '#00E5CC',
    buttonText: '#0A0B14',
    secondaryButtonBg: 'rgba(255,255,255,0.06)',
    secondaryButtonText: '#F0F4FF',
  },
  light: {
    bg: '#F5F7FA',
    title: '#1A1B2E',
    subtitle: '#7A80A0',
    badgeBg: 'rgba(0,184,163,0.1)',
    badgeText: '#00B8A3',
    dangerBadgeBg: 'rgba(255,82,82,0.1)',
    dangerBadgeText: '#FF5252',
    warningBadgeBg: 'rgba(255,167,38,0.1)',
    warningBadgeText: '#FFA726',
    purpleBadgeBg: 'rgba(156,106,222,0.1)',
    purpleBadgeText: '#9C6ADE',
    buttonBg: '#00B8A3',
    buttonText: '#FFFFFF',
    secondaryButtonBg: 'rgba(0,0,0,0.05)',
    secondaryButtonText: '#1A1B2E',
  },
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
  const scheme = useColorScheme();
  const c = COLORS[scheme === 'light' ? 'light' : 'dark'];
  const defaults = DEFAULTS[type];
  const Illustration = ILLUSTRATIONS[type];

  const displayTitle = title || defaults.title;
  const displayMessage = message || defaults.message;
  const displayBadge = type === '500' && statusCode ? `Status Code: ${statusCode}` : defaults.badge;

  const getBadgeColors = () => {
    switch (defaults.badgeStyle) {
      case 'danger':
        return { bg: c.dangerBadgeBg, text: c.dangerBadgeText };
      case 'warning':
        return { bg: c.warningBadgeBg, text: c.warningBadgeText };
      case 'purple':
        return { bg: c.purpleBadgeBg, text: c.purpleBadgeText };
      default:
        return { bg: c.badgeBg, text: c.badgeText };
    }
  };

  const badgeColors = getBadgeColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <View style={styles.illustrationContainer}>
          <Illustration size={180} />
        </View>

        <Text style={[styles.title, { color: c.title }]}>{displayTitle}</Text>
        <Text style={[styles.message, { color: c.subtitle }]}>{displayMessage}</Text>

        {estimatedReturn && (
          <Text style={[styles.estimated, { color: c.subtitle }]}>
            Estimated return: {new Date(estimatedReturn).toLocaleString()}
          </Text>
        )}

        <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
          <Text style={[styles.badgeText, { color: badgeColors.text }]}>{displayBadge}</Text>
        </View>

        <View style={styles.buttonContainer}>
          {type === 'no-internet' && onRetry && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.buttonBg }]}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.buttonText }]}>Retry</Text>
            </TouchableOpacity>
          )}

          {type === 'permission' && onContactSupport && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.buttonBg }]}
              onPress={onContactSupport}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.buttonText }]}>Contact Support</Text>
            </TouchableOpacity>
          )}

          {type !== 'no-internet' && type !== 'permission' && onGoHome && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.buttonBg }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.buttonText }]}>Take Me Home</Text>
            </TouchableOpacity>
          )}

          {type === 'no-internet' && onGoHome && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: c.secondaryButtonBg }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.secondaryButtonText }]}>Take Me Home</Text>
            </TouchableOpacity>
          )}

          {type === 'permission' && onGoHome && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton, { backgroundColor: c.secondaryButtonBg }]}
              onPress={onGoHome}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: c.secondaryButtonText }]}>Take Me Home</Text>
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
