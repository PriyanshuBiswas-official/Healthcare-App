import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { SectionHeader, GlassCardView } from '../../components/SharedComponents';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock Data
const MOCK_PARTNER = {
  id: '1',
  name: 'Sarah M.',
  relation: 'Partner',
  gender: 'female',
  avatar: 'S',
  status: 'online',
  isSharingWithMe: true,
  amISharingWithThem: true,
};

export default function PartnerHealthReportScreen({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  
  // Sharing toggles state
  const [shareVitals, setShareVitals] = useState(true);
  const [shareActivity, setShareActivity] = useState(true);
  const [shareSleep, setShareSleep] = useState(true);
  const [shareCycle, setShareCycle] = useState(true);
  const [twoWaySync, setTwoWaySync] = useState(MOCK_PARTNER.amISharingWithThem);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Report</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PARTNER PROFILE CARD */}
        <GlassCardView style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{MOCK_PARTNER.avatar}</Text>
              </View>
              {MOCK_PARTNER.status === 'online' && <View style={styles.statusDot} />}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{MOCK_PARTNER.name}</Text>
              <View style={styles.relationBadge}>
                <Text style={styles.relationBadgeText}>{MOCK_PARTNER.relation}</Text>
              </View>
            </View>
          </View>
        </GlassCardView>

        {/* SHARING CONFIGURATION */}
        <SectionHeader title="Access Configuration" subtitle="Manage what you share with Sarah" />
        <GlassCardView style={styles.configCard}>
          <View style={styles.configRow}>
            <View style={styles.configText}>
              <Text style={styles.configTitle}>Two-Way Sharing</Text>
              <Text style={styles.configDesc}>Allow Sarah to see your health data too.</Text>
            </View>
            <Switch 
              value={twoWaySync} 
              onValueChange={setTwoWaySync}
              trackColor={{ false: Colors.bgCardBorder, true: Colors.teal }}
              thumbColor={Colors.white}
            />
          </View>
          
          {twoWaySync && (
            <View style={styles.granularConfig}>
              <View style={styles.divider} />
              
              <View style={styles.configRowSmall}>
                <Text style={styles.configLabel}>Vitals & PRs</Text>
                <Switch value={shareVitals} onValueChange={setShareVitals} trackColor={{ true: Colors.teal }} style={{ transform: [{ scale: 0.8 }] }} />
              </View>
              
              <View style={styles.configRowSmall}>
                <Text style={styles.configLabel}>Activity & Workouts</Text>
                <Switch value={shareActivity} onValueChange={setShareActivity} trackColor={{ true: Colors.teal }} style={{ transform: [{ scale: 0.8 }] }} />
              </View>
              
              <View style={styles.configRowSmall}>
                <Text style={styles.configLabel}>Sleep Tracking</Text>
                <Switch value={shareSleep} onValueChange={setShareSleep} trackColor={{ true: Colors.teal }} style={{ transform: [{ scale: 0.8 }] }} />
              </View>

              {MOCK_PARTNER.gender === 'female' && (
                <View style={styles.configRowSmall}>
                  <Text style={styles.configLabel}>Cycle & Hormones</Text>
                  <Switch value={shareCycle} onValueChange={setShareCycle} trackColor={{ true: Colors.teal }} style={{ transform: [{ scale: 0.8 }] }} />
                </View>
              )}
            </View>
          )}
        </GlassCardView>

        {/* HEALTH DATA (MOCK) */}
        {!MOCK_PARTNER.isSharingWithMe ? (
          <View style={styles.noAccessContainer}>
            <Text style={styles.noAccessIcon}>🔒</Text>
            <Text style={styles.noAccessTitle}>No Access</Text>
            <Text style={styles.noAccessDesc}>{MOCK_PARTNER.name} has not shared their health data with you.</Text>
          </View>
        ) : (
          <>
            {/* WOMENS HEALTH (Conditional based on gender) */}
            {MOCK_PARTNER.gender === 'female' && (
              <>
                <SectionHeader title="Women's Health" />
                <GlassCardView style={styles.dataCard}>
                  <View style={styles.cycleRow}>
                    <View style={styles.cycleMetric}>
                      <Text style={styles.cycleLabel}>Next Period</Text>
                      <Text style={styles.cycleValueMain}>In 4 days</Text>
                      <Text style={styles.cycleSub}>Luteal Phase</Text>
                    </View>
                    <View style={styles.cycleMetric}>
                      <Text style={styles.cycleLabel}>Hormone Trends</Text>
                      <Text style={styles.cycleValue}>Progesterone ↑</Text>
                      <Text style={styles.cycleSub}>Estrogen ↓</Text>
                    </View>
                  </View>
                </GlassCardView>
              </>
            )}

            {/* WORKOUTS & PRs */}
            <SectionHeader title="Activity & Workouts" />
            <View style={styles.row}>
              <GlassCardView style={[styles.dataCard, { flex: 1, marginRight: Spacing.sm }]}>
                <Text style={styles.cardTitle}>Current Split</Text>
                <Text style={styles.cardValueMain}>Push Day</Text>
                <Text style={styles.cardSub}>Chest, Shoulders, Triceps</Text>
              </GlassCardView>
              <GlassCardView style={[styles.dataCard, { flex: 1, marginLeft: Spacing.sm }]}>
                <Text style={styles.cardTitle}>Recent PR</Text>
                <Text style={styles.cardValueMain}>185 lbs</Text>
                <Text style={styles.cardSub}>Bench Press (3 reps)</Text>
              </GlassCardView>
            </View>

            {/* VITALS & SLEEP */}
            <SectionHeader title="Vitals & Recovery" />
            <GlassCardView style={styles.dataCard}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricIcon}>❤️</Text>
                  <View>
                    <Text style={styles.metricTitle}>Heart Rate</Text>
                    <Text style={styles.metricValue}>64 bpm</Text>
                  </View>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricIcon}>🩸</Text>
                  <View>
                    <Text style={styles.metricTitle}>Blood Pressure</Text>
                    <Text style={styles.metricValue}>118/76</Text>
                  </View>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricIcon}>😴</Text>
                  <View>
                    <Text style={styles.metricTitle}>Sleep Last Night</Text>
                    <Text style={styles.metricValue}>7h 24m</Text>
                  </View>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricIcon}>🔋</Text>
                  <View>
                    <Text style={styles.metricTitle}>Recovery Score</Text>
                    <Text style={styles.metricValue}>82 / 100</Text>
                  </View>
                </View>
              </View>
            </GlassCardView>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  backBtnIcon: {
    color: Colors.white,
    fontSize: 20,
  },
  headerTitle: {
    fontSize: Typography.lg,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  
  // Profile Card
  profileCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    marginTop: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.purpleDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.bgCard,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  relationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.teal + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
  },
  relationBadgeText: {
    fontSize: 10,
    color: Colors.teal,
    fontWeight: Typography.semiBold,
  },

  // Config Card
  configCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  configTitle: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.semiBold,
    marginBottom: 2,
  },
  configDesc: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  granularConfig: {
    marginTop: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.bgCardBorder,
    marginBottom: Spacing.md,
  },
  configRowSmall: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  configLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },

  // No Access
  noAccessContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  noAccessIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  noAccessTitle: {
    fontSize: Typography.lg,
    color: Colors.white,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  noAccessDesc: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Data Cards
  dataCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
  },
  cardTitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  cardValueMain: {
    fontSize: Typography.xl,
    color: Colors.white,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  
  // Cycle
  cycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cycleMetric: {
    flex: 1,
  },
  cycleLabel: {
    fontSize: Typography.sm,
    color: Colors.pink,
    fontWeight: Typography.semiBold,
    marginBottom: Spacing.xs,
  },
  cycleValueMain: {
    fontSize: Typography.xl,
    color: Colors.white,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  cycleValue: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.semiBold,
    marginBottom: 4,
  },
  cycleSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },

  // Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  metricItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  metricTitle: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
});
