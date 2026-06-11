import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Typography, Spacing } from '../theme/theme';

export type TabName = 'Dashboard' | 'Health' | 'Nutrition' | 'Activity' | 'AI';

interface TabBarProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

const TABS: { name: TabName; icon: string; activeColor: string }[] = [
  { name: 'Dashboard', icon: '⬡', activeColor: Colors.teal },
  { name: 'Health', icon: '◎', activeColor: Colors.pink },
  { name: 'Nutrition', icon: '◈', activeColor: Colors.amber },
  { name: 'Activity', icon: '⚡', activeColor: Colors.teal },
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
    paddingBottom: Platform.OS === 'android' ? Spacing.lg : Spacing.xxl,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    backgroundColor: 'rgba(10,11,20,0.98)',
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
    paddingVertical: Spacing.sm,
    position: 'relative',
  },
  iconWrap: {
    width: 44,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  activePill: {
    position: 'absolute',
    width: 44,
    height: 40,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  icon: {
    fontSize: 22,
    color: Colors.text,
    zIndex: 1,
  },
  label: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: Typography.semiBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -Spacing.sm,
    width: 28,
    height: 4,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});
