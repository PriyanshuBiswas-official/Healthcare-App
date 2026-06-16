import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../theme/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useScrollVisibility } from './ScrollVisibilityContext';

export type TabName = 'Home' | 'Health' | 'Diet' | 'Activity' | 'AI';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: string; activeColor: string }[] = [
  { name: 'Home', icon: 'home', activeColor: Colors.teal },
  { name: 'Health', icon: 'stethoscope', activeColor: Colors.pink },
  { name: 'AI', icon: 'robot', activeColor: Colors.purple },
  { name: 'Diet', icon: 'silverware-fork-knife', activeColor: Colors.amber },
  { name: 'Activity', icon: 'run-fast', activeColor: Colors.teal },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { visible } = useScrollVisibility();
  const anim = React.useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden

  useEffect(() => {
    Animated.timing(anim, { toValue: visible ? 0 : 1, duration: 220, useNativeDriver: true }).start();
  }, [visible]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.0] });
  const ICON_SIZE = 28;

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
              activeOpacity={0.8}>
              <View style={[styles.iconWrap, isActive && { backgroundColor: tab.activeColor + '22' }]}>
                {isActive && (
                  <View style={[styles.activePill, { backgroundColor: tab.activeColor + '30', borderColor: tab.activeColor }]} />
                )}
                
                  <MaterialCommunityIcons name={tab.icon} size={ICON_SIZE} color={isActive ? tab.activeColor : Colors.text} style={[styles.icon, isActive && { color: tab.activeColor }]} />
              
              </View>
              <Text style={[styles.label, isActive && { color: tab.activeColor }]} numberOfLines={1} ellipsizeMode="tail">{tab.name}</Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: tab.activeColor, shadowColor: tab.activeColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    width: '94%',
    borderRadius: 18,
    paddingVertical: Spacing.xs,
    backgroundColor: 'rgba(10,11,20,0.96)',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    shadowColor: '#000',
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
    width: 52,
    height: 48,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  activePill: {
    position: 'absolute',
    width: 52,
    height: 48,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  icon: {
    color: Colors.text,
    zIndex: 1,
  },
  label: {
    fontSize: 9,
    maxWidth: 48,
    color: Colors.textMuted,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.15,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -Spacing.xs,
    width: 28,
    height: 4,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },

});
