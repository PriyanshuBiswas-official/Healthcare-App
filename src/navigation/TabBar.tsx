import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing } from '../theme/theme';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { Home, HeartPulse, ChartNoAxesCombined, Utensils, Footprints } from 'lucide-react-native';
import { useScrollVisibility } from './ScrollVisibilityContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

export type TabName = 'Home' | 'Health' | 'Diet' | 'Activity' | 'AI' | 'Profile' | 'Notifications' | 'WorkoutLog' | 'HealthLog' | 'PartnerReport' | 'Relationships';

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const styles = useStyles(themeStyles);
  const { visible, resetVisibility } = useScrollVisibility();

  const TABS: { name: string; label: string; Icon: React.ElementType }[] = [
    { name: 'Home', label: 'Home', Icon: Home },
    { name: 'Health', label: 'Health', Icon: HeartPulse },
    { name: 'AI', label: 'Insights', Icon: ChartNoAxesCombined },
    { name: 'Diet', label: 'Nutrition', Icon: Utensils },
    { name: 'Activity', label: 'Activity', Icon: Footprints },
  ];

  const activeRouteName = state.routes[state.index].name;

  const anim = useRef(new Animated.Value(0)).current;

  // Always reset visibility when switching active tabs
  useEffect(() => {
    resetVisibility();
  }, [activeRouteName, resetVisibility]);

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 0 : 1, duration: 220, useNativeDriver: true }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 90] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.0] });

  // Theme reference colors matching reference image
  const COLOR_ACTIVE = '#00E0C7';
  const COLOR_INACTIVE = '#A7A9BE';

  const handleTabPress = (routeName: string) => {
    resetVisibility();
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });

    if (activeRouteName !== routeName && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]} pointerEvents="box-none">
      <View style={styles.floating}>
        <View style={styles.bar}>
          {TABS.map(tab => {
            const isActive = activeRouteName === tab.name;

            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => handleTabPress(tab.name)}
                activeOpacity={0.6}
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: isActive }}>
                
                <tab.Icon
                  size={24}
                  color={isActive ? COLOR_ACTIVE : COLOR_INACTIVE}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />

                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {tab.label}
                </Text>

                {isActive ? (
                  <View style={styles.activeIndicator} />
                ) : (
                  <View style={styles.indicatorSpacer} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const themeStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    zIndex: 50,
  },
  floating: {
    width: '92%',
    borderRadius: 40,
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(23, 26, 39, 0.95)',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    color: '#A7A9BE',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  labelActive: {
    color: '#00E0C7',
    fontWeight: '600',
  },
  activeIndicator: {
    width: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#00E0C7',
    marginTop: 4,
    shadowColor: '#00E0C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  indicatorSpacer: {
    height: 2,
    marginTop: 4,
  },
});

export default React.memo(TabBar);
