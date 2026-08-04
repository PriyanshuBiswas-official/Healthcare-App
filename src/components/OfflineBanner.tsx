import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Typography, Spacing } from '../theme/theme';
import { useTheme } from '../providers/ThemeProvider';
import { useNetwork } from '../services/networkService';

const OfflineBanner: React.FC = () => {
  const { isConnected, isInitialCheck } = useNetwork();
  const { theme } = useTheme();
  const c = theme.colors;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const showBanner = !isConnected && !isInitialCheck;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showBanner ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBanner]);

  if (isInitialCheck) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        { backgroundColor: c.danger + '20', transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={[styles.icon, { color: c.danger }]}>⚡</Text>
      <Text style={[styles.text, { color: c.danger }]}>No internet connection</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 14,
  },
  text: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
});

export default OfflineBanner;
