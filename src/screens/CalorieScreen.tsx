import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';
import { GlassCardView, SectionHeader, ProgressBar, ProfileAvatarButton, NotificationIconButton } from '../components/SharedComponents';
import { useAuth } from '../providers/AuthProvider';

const INITIAL_MEALS = [
  {
    name: 'Breakfast',
    icon: '☕',
    color: Colors.amber,
    calories: 480,
    items: ['Oats, banana, almond milk, 2 boiled eggs'],
  },
  {
    name: 'Lunch',
    icon: '🥗',
    color: Colors.teal,
    calories: 620,
    items: ['Grilled chicken salad, quinoa, olive oil dressing'],
  },
  {
    name: 'Snack',
    icon: '🍎',
    color: Colors.pink,
    calories: 320,
    items: ['Greek yoghurt, mixed nuts, 1 apple'],
  },
  {
    name: 'Dinner',
    icon: '🌙',
    color: Colors.textMuted,
    calories: 0,
    items: [],
  },
];

const MACROS = [
  { label: 'Protein', val: 82, target: 120, unit: 'g', color: Colors.teal },
  { label: 'Carbs', val: 210, target: 280, unit: 'g', color: Colors.amber },
  { label: 'Fats', val: 54, target: 70, unit: 'g', color: Colors.pink },
  { label: 'Fiber', val: 18, target: 25, unit: 'g', color: Colors.purple },
];

const AI_SUGGESTIONS = [
  { title: 'Baked salmon & broccoli', tags: ['High protein', 'omega-3', 'low carb'], calories: 490, highlight: '38g protein', icon: '🐟', type: 'AI pick', color: Colors.teal },
  { title: 'Lentil soup & roti', tags: ['Low GI', 'high fibre', 'gut friendly'], calories: 420, highlight: '24g fibre', icon: '🍲', type: 'Diabetic', color: Colors.purple },
  { title: 'Egg fried brown rice', tags: ['Balanced macros', '15 min prep'], calories: 510, highlight: '28g protein', icon: '🥚', type: 'Quick', color: Colors.amber },
  { title: 'Tofu stir fry & noodles', tags: ['Plant-based', 'iron rich', 'anti-inflammatory'], calories: 460, highlight: '22g protein', icon: '🍃', type: 'Vegan', color: Colors.pink },
];

const WEEKLY_TREND = [
  { day: 'M', val: 1800 },
  { day: 'T', val: 2100 },
  { day: 'W', val: 1700 },
  { day: 'T', val: 1900 },
  { day: 'F', val: 1850 },
  { day: 'S', val: 2400 },
  { day: 'S', val: 1600, today: true },
];

export default function CalorieScreen({ onProfilePress, onNotificationsPress }: { onProfilePress?: () => void; onNotificationsPress?: () => void }) {
  const { onScroll } = useScrollVisibility();
  const { user } = useAuth();
  const [mealsState, setMealsState] = useState(INITIAL_MEALS);
  const [calorieGoal, setCalorieGoal] = useState(2500);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(calorieGoal.toString());

  const totalCalories = mealsState.reduce((s, m) => s + m.calories, 0);
  const remaining = calorieGoal - totalCalories;
  const progress = totalCalories / calorieGoal;

  const handleSaveGoal = () => {
    const parsed = parseInt(tempGoal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setCalorieGoal(parsed);
    } else {
      setTempGoal(calorieGoal.toString());
    }
    setIsEditingGoal(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Diet</Text>
            <Text style={styles.sub}>Tuesday, June 10</Text>
          </View>
          <View style={styles.headerActions}>
            <NotificationIconButton onPress={onNotificationsPress} />
            <ProfileAvatarButton
              onPress={onProfilePress}
              userName={user?.user_metadata?.full_name || user?.email?.split('@')[0]}
              avatarUrl={user?.user_metadata?.avatar_url}
            />
          </View>
        </View>

        {/* AI Nutrition Insight */}
        <GlassCardView style={styles.aiCard} accentColor={Colors.amber}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm }}>
            <View style={[styles.iconWrapSm, { backgroundColor: Colors.amber + '20' }]}>
              <Text style={{ fontSize: 14 }}>✦</Text>
            </View>
            <Text style={[styles.aiLabel, { color: Colors.amber, marginLeft: Spacing.sm, marginBottom: 0 }]}>AI NUTRITION INSIGHT</Text>
          </View>
          <Text style={styles.aiText}>
            Your protein intake is 32% below your daily goal. Adding a protein shake or an egg-white omelette at dinner could close the gap. Fiber is also trending low this week — consider adding spinach or flaxseed to your meals.
          </Text>
        </GlassCardView>

        {/* Calorie Ring Card */}
        <GlassCardView style={styles.calorieCard}>
          <View style={styles.calorieRow}>
            {/* Central Gauge */}
            <View style={styles.gaugeWrap}>
              <View style={[styles.gaugeOuter, { borderColor: Colors.bgCardBorder }]}>
                <View style={[styles.gaugeInner, { borderColor: Colors.teal + '60' }]}>
                  <Text style={styles.gaugeValue}>{totalCalories.toLocaleString()}</Text>
                  <Text style={styles.gaugeUnit}>kcal eaten</Text>
                </View>
              </View>
              <View style={[styles.gaugeProgress, {
                borderTopColor: Colors.teal,
                borderRightColor: progress > 0.5 ? Colors.teal : 'transparent',
              }]} />
            </View>

            {/* Side stats */}
            <View style={styles.calorieStats}>
              <View style={styles.calorieStat}>
                <View style={styles.goalHeaderRow}>
                  <Text style={styles.calorieStatLabel}>Goal</Text>
                  {!isEditingGoal && (
                    <TouchableOpacity onPress={() => setIsEditingGoal(true)} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {isEditingGoal ? (
                  <View style={styles.editGoalRow}>
                    <TextInput
                      style={styles.editGoalInput}
                      value={tempGoal}
                      onChangeText={setTempGoal}
                      keyboardType="number-pad"
                      autoFocus
                    />
                    <TouchableOpacity onPress={handleSaveGoal} style={styles.saveGoalBtn}>
                      <Text style={styles.saveGoalBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.calorieStatVal, { color: Colors.textPrimary }]}>{calorieGoal.toLocaleString()}</Text>
                )}
              </View>
              <View style={[styles.calorieDivider]} />
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Remaining</Text>
                <Text style={[styles.calorieStatVal, { color: remaining > 0 ? Colors.teal : Colors.pink }]}>
                  {remaining > 0 ? remaining.toLocaleString() : `+${Math.abs(remaining)}`}
                </Text>
              </View>
              <View style={[styles.calorieDivider]} />
              <View style={styles.calorieStat}>
                <Text style={styles.calorieStatLabel}>Burned</Text>
                <Text style={[styles.calorieStatVal, { color: Colors.amber }]}>420</Text>
              </View>
            </View>
          </View>
          <ProgressBar progress={progress} color={progress > 1 ? Colors.pink : Colors.teal} height={8} style={{ marginTop: Spacing.md }} />
          <Text style={styles.calorieProgressLabel}>{Math.round(progress * 100)}% of daily goal</Text>
        </GlassCardView>

        {/* Track Calorie with a Photo */}
        <SectionHeader title="Track Calorie with a photo" />
        <GlassCardView style={styles.photoUploadCard}>
          <TouchableOpacity style={styles.photoUploadArea}>
            <View style={styles.cameraIconWrap}>
              <Text style={{ fontSize: 28 }}>📷</Text>
            </View>
            <Text style={styles.photoUploadTitle}>Scan meal with AI</Text>
            <Text style={styles.photoUploadSub}>Upload or take a photo to automatically log calories and macros.</Text>
          </TouchableOpacity>
        </GlassCardView>

        {/* Macros */}
        <SectionHeader title="Macronutrients" />
        <GlassCardView style={styles.macroCard}>
          <View style={styles.macroGrid}>
            {MACROS.map(m => (
              <View key={m.label} style={[styles.macroItem, { borderColor: m.color + '40', backgroundColor: m.color + '10' }]}>
                <Text style={[styles.macroVal, { color: m.color }]}>{m.val}{m.unit}</Text>
                <Text style={styles.macroLabel}>{m.label}</Text>
                <ProgressBar progress={m.val / m.target} color={m.color} height={4} style={{ marginTop: Spacing.xs }} />
                <Text style={styles.macroTarget}>/ {m.target}{m.unit}</Text>
              </View>
            ))}
          </View>
        </GlassCardView>

        {/* NEW SECTION: TODAY'S MEALS */}
        <SectionHeader title="TODAY'S MEALS" />
        <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
          {mealsState.map((meal, index) => (
            <View key={meal.name}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm }}>
                 <View style={[styles.iconWrapSm, { backgroundColor: meal.items.length > 0 ? meal.color + '20' : Colors.bgCardBorder, width: 44, height: 44, borderRadius: Radius.md }]}>
                    <Text style={{ fontSize: 22, opacity: meal.items.length > 0 ? 1 : 0.5 }}>{meal.icon}</Text>
                 </View>
                 <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                       <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: meal.items.length > 0 ? Colors.textPrimary : Colors.textSecondary }}>{meal.name}</Text>
                       {meal.items.length > 0 && (
                          <View style={{ backgroundColor: Colors.teal + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, marginLeft: Spacing.sm }}>
                             <Text style={{ fontSize: 10, color: Colors.teal, fontWeight: Typography.bold }}>Logged</Text>
                          </View>
                       )}
                    </View>
                    <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4 }}>
                       {meal.items.length > 0 ? meal.items.join(', ') : 'Not logged yet - AI suggestion ready'}
                    </Text>
                 </View>
                 <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    {meal.items.length > 0 ? (
                      <>
                        <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary }}>{meal.calories}</Text>
                        <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>kcal · {meal.name === 'Breakfast' ? '7:30 AM' : meal.name === 'Lunch' ? '12:45 PM' : '4:00 PM'}</Text>
                      </>
                    ) : (
                      <TouchableOpacity style={{ paddingHorizontal: Spacing.md, paddingVertical: 6, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: Typography.xs, color: Colors.textPrimary, fontWeight: Typography.bold, marginRight: 4 }}>Log</Text>
                        <Text style={{ fontSize: 12, color: Colors.textPrimary }}>↗</Text>
                      </TouchableOpacity>
                    )}
                 </View>
              </View>
              {index < mealsState.length - 1 && <View style={{ height: 1, backgroundColor: Colors.bgCardBorder, marginVertical: Spacing.xs }} />}
            </View>
          ))}
        </GlassCardView>

        {/* NEW SECTION: WATER INTAKE */}
        <SectionHeader title="WATER INTAKE" />
        <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
             <View>
               <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={{ fontSize: Typography.xl, fontWeight: Typography.extraBold, color: Colors.textPrimary }}>1.6</Text>
                  <Text style={{ fontSize: Typography.sm, color: Colors.textMuted, marginLeft: 2 }}>/ 2.5 L</Text>
               </View>
               <Text style={{ fontSize: Typography.xs, color: Colors.textSecondary }}>64% of daily goal</Text>
             </View>
             <TouchableOpacity style={{ backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.teal + '50', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, marginRight: 6 }}>💧</Text>
                <Text style={{ fontSize: Typography.xs, color: Colors.teal, fontWeight: Typography.bold }}>Stay hydrated</Text>
             </TouchableOpacity>
           </View>
           <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, justifyContent: 'space-between' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                 <View key={i} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: i < 6 ? Colors.bgCardBorder : 'transparent', borderWidth: i < 6 ? 0 : 1, borderColor: Colors.bgCardBorder, alignItems: 'center', justifyContent: 'center' }}>
                   {i >= 6 && <Text style={{ fontSize: 12, opacity: 0.3 }}>💧</Text>}
                 </View>
              ))}
           </View>
           <View style={{ flexDirection: 'row', gap: Spacing.md }}>
             <TouchableOpacity style={{ flex: 1, backgroundColor: Colors.bgCardBorder + '50', paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.teal, fontWeight: Typography.bold }}>+ 250 ml</Text>
             </TouchableOpacity>
             <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: Colors.bgCardBorder, paddingVertical: Spacing.md, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: Typography.semiBold }}>+ Custom</Text>
             </TouchableOpacity>
           </View>
        </GlassCardView>

        {/* NEW SECTION: AI MEAL SUGGESTIONS */}
        <SectionHeader title="AI MEAL SUGGESTIONS - DINNER" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl, justifyContent: 'space-between' }}>
           {AI_SUGGESTIONS.map((item, idx) => (
              <GlassCardView key={idx} style={{ width: '48.5%', padding: Spacing.sm, marginBottom: Spacing.sm }}>
                 <View style={{ backgroundColor: item.color + '20', height: 70, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }}>
                    <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                 </View>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <Text style={{ fontSize: Typography.sm, fontWeight: Typography.bold, color: Colors.textPrimary, flex: 1, marginRight: Spacing.xs, lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
                    <View style={{ backgroundColor: Colors.bgCardBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full }}>
                       <Text style={{ fontSize: 9, color: item.color, fontWeight: Typography.bold }}>{item.type}</Text>
                    </View>
                 </View>
                 <Text style={{ fontSize: 10, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 14 }} numberOfLines={2}>
                    {item.tags.join(' - ')}
                 </Text>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary }}>~{item.calories} <Text style={{ fontSize: 10, color: Colors.textMuted, fontWeight: 'normal' }}>kcal</Text></Text>
                    <View style={{ backgroundColor: item.color + '15', paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.full, borderWidth: 1, borderColor: item.color + '30' }}>
                       <Text style={{ fontSize: 9, color: item.color, fontWeight: Typography.bold }}>{item.highlight}</Text>
                    </View>
                 </View>
              </GlassCardView>
           ))}
        </View>

        {/* NEW SECTION: WEEKLY NUTRITION TREND */}
        <SectionHeader title="WEEKLY NUTRITION TREND" />
        <GlassCardView style={{ padding: Spacing.base, marginBottom: Spacing.xl }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl }}>
              <Text style={{ fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary }}>Calorie intake <Text style={{ color: Colors.textSecondary, fontWeight: 'normal' }}>— past 7 days</Text></Text>
              <View style={{ backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.purple, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center' }}>
                 <Text style={{ fontSize: 10, marginRight: 4 }}>✦</Text>
                 <Text style={{ fontSize: 10, color: Colors.purple, fontWeight: Typography.bold }}>AI analyzed Today</Text>
              </View>
           </View>
           
           <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 120, marginBottom: Spacing.sm, paddingHorizontal: Spacing.xs }}>
              {WEEKLY_TREND.map((day, idx) => (
                 <View key={idx} style={{ alignItems: 'center', width: '12%', height: '100%', justifyContent: 'flex-end' }}>
                    <View style={{ width: '100%', height: `${(day.val / 3000) * 100}%`, backgroundColor: day.today ? Colors.purple : day.val > 2000 ? Colors.amber : Colors.teal + '80', borderRadius: Radius.sm, minHeight: 20 }} />
                    <Text style={{ fontSize: 12, color: day.today ? Colors.purple : Colors.textSecondary, marginTop: Spacing.sm, fontWeight: day.today ? Typography.bold : 'normal' }}>{day.day}</Text>
                 </View>
              ))}
           </View>
           
           <View style={{ height: 1, backgroundColor: Colors.bgCardBorder, marginVertical: Spacing.md }} />

           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: Typography.sm, color: Colors.textSecondary }}>Avg this week: <Text style={{ color: Colors.textPrimary, fontWeight: Typography.bold }}>1,840 kcal</Text></Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.teal + '20', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.teal + '50' }}>
                 <Text style={{ fontSize: 10, color: Colors.teal, fontWeight: Typography.bold }}>✓ Within goal</Text>
              </View>
           </View>
        </GlassCardView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary, letterSpacing: -0.5 },
  sub: { fontSize: Typography.sm, color: Colors.amber, marginTop: 4, fontWeight: Typography.medium },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  
  aiCard: { padding: Spacing.base, marginBottom: Spacing.lg },
  iconWrapSm: { alignItems: 'center', justifyContent: 'center' },
  aiLabel: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5 },
  aiText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },

  photoUploadCard: { marginBottom: Spacing.lg, padding: Spacing.base },
  photoUploadArea: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.teal + '60',
    backgroundColor: Colors.teal + '10',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.teal + '20', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  photoUploadTitle: { fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, marginBottom: 4 },
  photoUploadSub: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },

  calorieCard: { padding: Spacing.lg, marginBottom: Spacing.xl },
  calorieRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gaugeWrap: { position: 'relative', width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  gaugeOuter: { width: 140, height: 140, borderRadius: 70, borderWidth: 12, alignItems: 'center', justifyContent: 'center' },
  gaugeInner: { width: 116, height: 116, borderRadius: 58, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bgCard },
  gaugeProgress: { position: 'absolute', top: 0, left: 0, width: 140, height: 140, borderRadius: 70, borderWidth: 12, borderTopColor: Colors.teal, borderRightColor: Colors.teal, borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  gaugeValue: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  gaugeUnit: { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  calorieStats: { flex: 1, marginLeft: Spacing.lg },
  calorieStat: { marginBottom: Spacing.xs },
  goalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: Colors.bgCardBorder, borderRadius: Radius.sm },
  editBtnText: { fontSize: 10, color: Colors.textSecondary },
  editGoalRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  editGoalInput: { flex: 1, backgroundColor: Colors.bg, color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold, borderRadius: Radius.sm, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.teal },
  saveGoalBtn: { marginLeft: 8, backgroundColor: Colors.teal, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveGoalBtnText: { color: Colors.bg, fontSize: Typography.sm, fontWeight: Typography.bold },
  calorieStatLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: 2 },
  calorieStatVal: { fontSize: Typography.base, fontWeight: Typography.bold },
  calorieDivider: { height: 1, backgroundColor: Colors.bgCardBorder, marginVertical: Spacing.xs },
  calorieProgressLabel: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm },

  macroCard: { padding: Spacing.base, marginBottom: Spacing.xl },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  macroItem: { width: '47%', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.base },
  macroVal: { fontSize: Typography.lg, fontWeight: Typography.bold, marginBottom: 2 },
  macroLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.xs },
  macroTarget: { fontSize: 10, color: Colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
});
