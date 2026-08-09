import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing } from '../theme/theme';
import { useTheme, useStyles } from '../providers/ThemeProvider';
import { Home, Stethoscope, Bot, Utensils, Activity } from 'lucide-react-native';
import { useScrollVisibility } from './ScrollVisibilityContext';

export type TabName = 'Home' | 'Health' | 'Diet' | 'Activity' | 'AI' | 'Profile' | 'Notifications' | 'WorkoutLog' | 'HealthLog' | 'PartnerReport' | 'Relationships';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { theme } = useTheme();
  const styles = useStyles(themeStyles);
  const { visible } = useScrollVisibility();

  const TABS: { name: TabName; Icon: React.ElementType; activeColor: string }[] = [
    { name: 'Home', Icon: Home, activeColor: theme.colors.teal },
    { name: 'Health', Icon: Stethoscope, activeColor: theme.colors.pink },
    { name: 'AI', Icon: Bot, activeColor: theme.colors.accentBlue },
    { name: 'Diet', Icon: Utensils, activeColor: theme.colors.amber },
    { name: 'Activity', Icon: Activity, activeColor: theme.colors.teal },
  ];
  const anim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 0 : 1, duration: 220, useNativeDriver: true }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.0] });

  return (
    <Animated.View style={[styles.container, styles.floating, { transform: [{ translateY }], opacity }]}>
      <View style={styles.bar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabChange(tab.name)}
              activeOpacity={0.8}
              accessibilityLabel={tab.name}
              accessibilityState={{ selected: isActive }}>
              <View style={styles.iconWrap}>
                <tab.Icon
                  size={28}
                  color={isActive ? theme.colors.teal : theme.colors.text}
                  strokeWidth={2}
                  style={styles.icon}
                />
              </View>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: theme.colors.teal, shadowColor: theme.colors.teal }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const themeStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 12,
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    backgroundColor: 'transparent',
  },
  floating: {
    alignSelf: 'center',
    width: '96%',
    borderRadius: 28,
    paddingVertical: Spacing.xs,
    backgroundColor: theme.colors.tabBarBg,
    borderWidth: 1,
    borderColor: theme.colors.bgCardBorder,
    shadowColor: theme.colors.shadowColor,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  icon: {
    color: theme.colors.text,
    zIndex: 1,
  },
  label: {
    fontSize: Typography.xs,
    maxWidth: 48,
    color: theme.colors.textMuted,
    fontWeight: Typography.semiBold,
    letterSpacing: Typography.lsNormal,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  activeIndicator: {
    width: 24,
    height: 2,
    borderRadius: 1,
    marginTop: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default React.memo(TabBar);
