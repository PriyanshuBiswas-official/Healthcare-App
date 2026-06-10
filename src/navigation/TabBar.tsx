import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '../theme/theme';

export type TabName = 'Dashboard' | 'Cycle' | 'Fitness' | 'Nutrition' | 'AI';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: string; activeColor: string }[] = [
  { name: 'Dashboard', icon: '⬡', activeColor: Colors.teal },
  { name: 'Cycle', icon: '◎', activeColor: Colors.pink },
  { name: 'Fitness', icon: '⚡', activeColor: Colors.teal },
  { name: 'Nutrition', icon: '◈', activeColor: Colors.amber },
  { name: 'AI', icon: '✦', activeColor: Colors.purple },
];

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tab}
              onPress={() => onTabChange(tab.name)}
              activeOpacity={0.7}>
              <View style={[styles.iconWrap, isActive && { backgroundColor: tab.activeColor + '22' }]}>
                {isActive && (
                  <View style={[styles.activePill, { backgroundColor: tab.activeColor + '30', borderColor: tab.activeColor }]} />
                )}
                <Text style={[styles.icon, isActive && { color: tab.activeColor }]}>
                  {tab.icon}
                </Text>
              </View>
              <Text style={[styles.label, isActive && { color: tab.activeColor }]}>
                {tab.name}
              </Text>
              {isActive && (
                <View style={[styles.activeIndicator, { backgroundColor: tab.activeColor, shadowColor: tab.activeColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'android' ? Spacing.base : Spacing.xxl,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    backgroundColor: 'rgba(10,11,20,0.96)',
    borderTopWidth: 1,
    borderTopColor: Colors.bgCardBorder,
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    position: 'relative',
  },
  iconWrap: {
    width: 40,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  activePill: {
    position: 'absolute',
    width: 40,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 18,
    color: Colors.textMuted,
    zIndex: 1,
  },
  label: {
    fontSize: 9,
    color: Colors.textMuted,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -Spacing.xs,
    width: 24,
    height: 3,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});
