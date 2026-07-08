import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Rect } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { GlassCardView, SectionHeader, ActivityProgressCard } from '../../components/SharedComponents';

const { width } = Dimensions.get('window');

// Mock Data
const MOCK_PARTNER = {
  id: '1',
  name: 'Sarah Williams',
  age: 28,
  gender: 'Female',
  avatar: 'S',
  status: 'online',
  isSharingWithMe: true,
};

// Mini Bar Chart Component
function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const chartHeight = 40;
  const chartWidth = 60;
  const max = Math.max(...data, 1);
  const barWidth = 4;
  const gap = (chartWidth - (data.length * barWidth)) / (data.length - 1);
  
  return (
    <Svg width={chartWidth} height={chartHeight}>
      {data.map((val, i) => {
        const height = (val / max) * chartHeight;
        return (
          <Rect
            key={i}
            x={i * (barWidth + gap)}
            y={chartHeight - height}
            width={barWidth}
            height={height}
            fill={color}
            rx={2}
          />
        );
      })}
    </Svg>
  );
}

export default function PartnerHealthReportScreen({ onBack }: { onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* HEADER */}
      <View style={[styles.header, { zIndex: 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Health Report</Text>
          <Text style={styles.headerSubtitle}>Shared by Sarah <Text style={{ color: Colors.purple }}>🛡️</Text></Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowMenu(!showMenu)}>
          <Text style={styles.iconBtnText}>⋮</Text>
        </TouchableOpacity>
        
        {/* DROPDOWN MENU */}
        {showMenu && (
          <View style={styles.dropdownMenu}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowMenu(false)}>
              <Text style={styles.dropdownItemText}>Manage Permissions</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => setShowMenu(false)}>
              <Text style={[styles.dropdownItemText, { color: Colors.pink }]}>Remove Partner</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* PROFILE CARD */}
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
              <Text style={styles.profileDetails}>{MOCK_PARTNER.age} • {MOCK_PARTNER.gender}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active now</Text>
              </View>
            </View>
            <View style={styles.datePicker}>
              <Text style={styles.datePickerText}>May 20 – May 26, 2024</Text>
            </View>
          </View>
          
          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Steps</Text>
              <Text style={styles.overviewValue}>8,432</Text>
              <MiniBarChart data={[3,5,2,8,4,9,6]} color={Colors.blue} />
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Active Time</Text>
              <Text style={styles.overviewValue}>68 <Text style={styles.overviewUnit}>min</Text></Text>
              <MiniBarChart data={[2,4,3,6,8,5,7]} color={Colors.success} />
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Calories</Text>
              <Text style={styles.overviewValue}>1,720 <Text style={styles.overviewUnit}>kcal</Text></Text>
              <MiniBarChart data={[5,6,4,7,5,8,6]} color={Colors.amber} />
            </View>
            <View style={styles.overviewItem}>
              <Text style={styles.overviewLabel}>Sleep</Text>
              <Text style={styles.overviewValue}>7h 24m</Text>
              <MiniBarChart data={[7,6,8,7,5,7,8]} color={Colors.purple} />
            </View>
          </View>
        </GlassCardView>

        {/* VITALS SECTION */}
        <SectionHeader title="❤️ Vitals" action="View all" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          <GlassCardView style={styles.vitalCard}>
            <Text style={styles.vitalLabel}>💓 Heart Rate</Text>
            <Text style={styles.vitalValue}>72 <Text style={styles.vitalUnit}>bpm</Text></Text>
            <Text style={styles.vitalSub}>Resting</Text>
          </GlassCardView>
          <GlassCardView style={styles.vitalCard}>
            <Text style={styles.vitalLabel}>🩸 Blood Pressure</Text>
            <Text style={styles.vitalValue}>118/76 <Text style={styles.vitalUnit}>mmHg</Text></Text>
            <Text style={[styles.vitalSub, { color: Colors.success }]}>Normal</Text>
          </GlassCardView>
          <GlassCardView style={styles.vitalCard}>
            <Text style={styles.vitalLabel}>💧 SpO₂</Text>
            <Text style={styles.vitalValue}>98 <Text style={styles.vitalUnit}>%</Text></Text>
            <Text style={[styles.vitalSub, { color: Colors.success }]}>Normal</Text>
          </GlassCardView>
          <GlassCardView style={styles.vitalCard}>
            <Text style={styles.vitalLabel}>⚖️ Weight</Text>
            <Text style={styles.vitalValue}>62.4 <Text style={styles.vitalUnit}>kg</Text></Text>
            <Text style={[styles.vitalSub, { color: Colors.success }]}>▼ 0.6 kg</Text>
          </GlassCardView>
        </ScrollView>

        {/* ACTIVITY SECTION */}
        <SectionHeader title="🏃 Activity" action="View all" />
        <GlassCardView style={styles.dataCard}>
          <ActivityProgressCard 
            steps={8432} stepsTarget={10000}
            exercise={68} exerciseTarget={90}
            calories={1720} caloriesTarget={2200}
          />
        </GlassCardView>

        {/* WOMEN'S HEALTH (Conditional based on gender) */}
        {MOCK_PARTNER.gender === 'Female' && (
          <>
            <SectionHeader title="🌺 Cycle & Health" action="View log" />
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

        {/* MEDICATIONS SECTION */}
        <SectionHeader title="💊 Medications" action="Schedule" />
        <GlassCardView style={styles.dataCard}>
          <View style={styles.medItem}>
            <View style={[styles.workoutIcon, { backgroundColor: Colors.amber + '20' }]}><Text>💊</Text></View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>Metformin 500 mg</Text>
              <Text style={styles.workoutSub}>Daily • 08:00 PM</Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.textMuted }}>Skipped today</Text>
          </View>
          <View style={[styles.medItem, { marginTop: Spacing.md }]}>
            <View style={[styles.workoutIcon, { backgroundColor: Colors.teal + '20' }]}><Text>💊</Text></View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>Vitamin D3 1000 IU</Text>
              <Text style={styles.workoutSub}>Daily • 08:00 AM</Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.success }}>Taken</Text>
          </View>
        </GlassCardView>

        {/* GOALS SECTION */}
        <SectionHeader title="✅ Goals" action="View all" />
        <GlassCardView style={styles.dataCard}>
          <View style={styles.goalItem}>
            <View style={styles.goalTop}>
              <Text style={styles.goalLabel}>10K Steps a day</Text>
              <Text style={styles.goalPct}>84%</Text>
            </View>
            <View style={styles.goalTrack}><View style={[styles.goalFill, { width: '84%', backgroundColor: Colors.success }]} /></View>
          </View>
          <View style={[styles.goalItem, { marginTop: Spacing.md }]}>
            <View style={styles.goalTop}>
              <Text style={styles.goalLabel}>Drink 2.5L Water</Text>
              <Text style={styles.goalPct}>72%</Text>
            </View>
            <View style={styles.goalTrack}><View style={[styles.goalFill, { width: '72%', backgroundColor: Colors.blue }]} /></View>
          </View>
          <View style={[styles.goalItem, { marginTop: Spacing.md }]}>
            <View style={styles.goalTop}>
              <Text style={styles.goalLabel}>Workout 4x/week</Text>
              <Text style={styles.goalPct}>75%</Text>
            </View>
            <View style={styles.goalTrack}><View style={[styles.goalFill, { width: '75%', backgroundColor: Colors.purple }]} /></View>
          </View>
        </GlassCardView>

        {/* WORKOUTS SECTION */}
        <SectionHeader title="🏋️ Workouts" action="View all" />
        <GlassCardView style={styles.dataCard}>
          <View style={styles.workoutItem}>
            <View style={[styles.workoutIcon, { backgroundColor: Colors.blue + '20' }]}><Text>🏋️</Text></View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>Strength Training</Text>
              <Text style={styles.workoutSub}>May 26 • 45 min • 320 kcal</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </View>
          <View style={[styles.workoutItem, { marginTop: Spacing.md }]}>
            <View style={[styles.workoutIcon, { backgroundColor: Colors.success + '20' }]}><Text>🏃</Text></View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>HIIT</Text>
              <Text style={styles.workoutSub}>May 24 • 30 min • 260 kcal</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </View>
          <View style={[styles.workoutItem, { marginTop: Spacing.md }]}>
            <View style={[styles.workoutIcon, { backgroundColor: Colors.purple + '20' }]}><Text>🧘‍♀️</Text></View>
            <View style={styles.workoutInfo}>
              <Text style={styles.workoutTitle}>Yoga</Text>
              <Text style={styles.workoutSub}>May 22 • 40 min • 180 kcal</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </View>
        </GlassCardView>

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
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.lg,
    color: Colors.white,
    fontWeight: Typography.bold,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: Colors.white,
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 100, // Space for fixed banner
  },
  
  // Profile Card
  profileCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  profileDetails: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeBadgeText: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: Typography.semiBold,
  },
  datePicker: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: Radius.sm,
  },
  datePickerText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },

  overviewGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.bgCardBorder,
    paddingTop: Spacing.lg,
  },
  overviewItem: {
    alignItems: 'center',
    width: '23%',
  },
  overviewLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  overviewUnit: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: 'normal',
  },

  // Vitals
  hScroll: {
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  vitalCard: {
    padding: Spacing.md,
    width: 120,
  },
  vitalLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  vitalValue: {
    fontSize: Typography.xl,
    color: Colors.white,
    fontWeight: Typography.bold,
    marginBottom: 4,
  },
  vitalUnit: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  vitalSub: {
    fontSize: 10,
    color: Colors.textMuted,
  },

  // Data Cards
  dataCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
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

  // Meds
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Goals
  goalItem: {},
  goalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  goalPct: {
    fontSize: Typography.sm,
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
  goalTrack: {
    height: 8,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: 4,
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Workouts
  workoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutTitle: {
    fontSize: Typography.base,
    color: Colors.white,
    fontWeight: Typography.semiBold,
    marginBottom: 4,
  },
  workoutSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
  chevron: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  
  // Dropdown Menu
  dropdownMenu: {
    position: 'absolute',
    top: 60,
    right: Spacing.lg,
    backgroundColor: Colors.bgCardSolid,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  dropdownItemText: {
    fontSize: Typography.sm,
    color: Colors.white,
    fontWeight: Typography.medium,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: Colors.bgCardBorder,
    marginVertical: Spacing.xs,
  },
});
