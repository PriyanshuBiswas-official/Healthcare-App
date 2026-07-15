import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, useColorScheme } from 'react-native';
import { Typography, Spacing } from '../theme/theme';
import { useNetwork } from '../services/networkService';

const COLORS = {
  dark: { bg: '#1A1040', text: '#E0E4F0', icon: '#FF6B6B' },
  light: { bg: '#FFF0F0', text: '#D32F2F', icon: '#FF5252' },
};

const OfflineBanner: React.FC = () => {
  const { isConnected, isInitialCheck } = useNetwork();
  const scheme = useColorScheme();
  const c = COLORS[scheme === 'light' ? 'light' : 'dark'];
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
        { backgroundColor: c.bg, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={[styles.icon, { color: c.icon }]}>⚡</Text>
      <Text style={[styles.text, { color: c.text }]}>No internet connection</Text>
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
