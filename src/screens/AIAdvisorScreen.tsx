import React, { useState, useRef } from 'react';
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
import { Colors, Typography, Spacing, Radius, GlassCard, Shadows } from '../theme/theme';
import { GlassCardView, SectionHeader } from '../components/SharedComponents';
import { useScrollVisibility } from '../navigation/ScrollVisibilityContext';

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
};

const QUICK_PROMPTS = [
  { icon: '🍎', label: 'Analyze my nutrition' },
  { icon: '💪', label: 'Suggest a workout' },
  { icon: '🌙', label: 'Sleep optimization tips' },
  { icon: '📅', label: 'Book appointment' },
  { icon: '💊', label: 'Supplement advice' },
  { icon: '🩺', label: 'Check my vitals trend' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'ai',
    text: "Hello! I'm your AI health advisor. I can analyze your health data, suggest workout plans, track your cycle, and even book appointments for you. How can I help you today?",
    time: '09:30 AM',
  },
];

const APPOINTMENT_SLOTS = [
  { time: '10:00 AM', date: 'Thu, Jun 12', doctor: 'Dr. Priya Sharma', spec: 'Gynecologist', available: true },
  { time: '2:30 PM', date: 'Thu, Jun 12', doctor: 'Dr. Ramesh Nair', spec: 'General Physician', available: true },
  { time: '11:00 AM', date: 'Fri, Jun 13', doctor: 'Dr. Priya Sharma', spec: 'Gynecologist', available: false },
  { time: '4:00 PM', date: 'Fri, Jun 13', doctor: 'Dr. Arun Pillai', spec: 'Nutritionist', available: true },
];

const AI_RESPONSES: Record<string, string> = {
  'Analyze my nutrition': "Based on today's log, your protein intake is 32% below target (82g vs 120g goal). Your carb intake is well-balanced. I recommend adding a protein-rich snack like a Greek yogurt or protein shake. Overall caloric deficit looks healthy for your current goals! 📊",
  'Suggest a workout': "Given your current Push-Day streak and the fact that tomorrow is Day 15 of your cycle (high energy phase), I recommend a full Upper Body Strength session:\n• Bench Press: 4×8 @ 80kg\n• OHP: 3×10 @ 50kg\n• Pull-ups: 3×12\n• Cable flys: 3×15\n\nExpected burn: ~450 kcal 💪",
  'Book appointment': "I found 3 available slots for you nearby. Check the scheduler below. I can auto-confirm your preferred slot and send a reminder 1 hour before! 📅",
  'Sleep optimization tips': "Your avg sleep is 7.2 hours — just below the optimal 7.5–9 hours. Given your cycle phase (Day 14, luteal transition incoming), you may experience disrupted sleep soon. Tips: avoid screens after 10 PM, try magnesium glycinate supplementation, and maintain a consistent wake time. 🌙",
  'Check my vitals trend': "Over the past 30 days: Resting heart rate averaged 68 bpm ✅, Steps averaged 7,400/day (88% of goal), Sleep quality improving by 12%. Your overall health score this month: 78 / 100 — Great progress! 🩺",
  'Supplement advice': "Based on your cycle phase and activity level, I recommend:\n• Iron: 18mg/day (especially during menstrual phase)\n• Magnesium: 300mg (for sleep & muscle recovery)\n• Vitamin D: 2000 IU (your levels are slightly low)\n• Omega-3: 1g EPA+DHA daily for inflammation 💊",
};

export default function AIAdvisorScreen() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'schedule'>('chat');
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, time };
    const aiText = AI_RESPONSES[text] || "I'm analyzing your health data to provide personalized insights. For complex queries, consider booking a consultation with one of our partnered doctors. Is there anything specific you'd like to focus on?";
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: aiText, time };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    if (text === 'Book appointment') setActiveTab('schedule');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiAvatar}>
          <Text style={{ fontSize: 22 }}>✦</Text>
        </View>
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <Text style={styles.title}>AI Health Advisor</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online · Powered by Health AI</Text>
          </View>
        </View>
        {/* Tab Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            onPress={() => setActiveTab('chat')}
            style={[styles.tabBtn, activeTab === 'chat' && { backgroundColor: Colors.purple + '30', borderColor: Colors.purple }]}>
            <Text style={[styles.tabBtnText, activeTab === 'chat' && { color: Colors.purple }]}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('schedule')}
            style={[styles.tabBtn, activeTab === 'schedule' && { backgroundColor: Colors.teal + '30', borderColor: Colors.teal }]}>
            <Text style={[styles.tabBtnText, activeTab === 'schedule' && { color: Colors.teal }]}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'chat' ? (
        <>
          {/* Quick Prompts */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
            {QUICK_PROMPTS.map(p => (
              <TouchableOpacity
                key={p.label}
                onPress={() => sendMessage(p.label)}
                style={styles.quickChip}>
                <Text style={{ fontSize: 14 }}>{p.icon}</Text>
                <Text style={styles.quickChipText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            onScroll={useScrollVisibility().onScroll}
            scrollEventThrottle={16}>
            {messages.map(msg => (
              <View
                key={msg.id}
                style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
                {msg.role === 'ai' && (
                  <View style={styles.msgAvatar}>
                    <Text style={{ fontSize: 12, color: Colors.purple }}>✦</Text>
                  </View>
                )}
                <View style={[
                  styles.msgBubble,
                  msg.role === 'ai' ? styles.aiBubble : styles.userBubble,
                ]}>
                  <Text style={[styles.msgText, msg.role === 'user' && { color: Colors.bg }]}>{msg.text}</Text>
                  <Text style={[styles.msgTime, msg.role === 'user' && { color: Colors.bg + '99' }]}>{msg.time}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything about your health..."
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() ? Colors.purple : Colors.bgCardBorder }]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim()}>
              <Text style={{ fontSize: 18 }}>↑</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* Appointment Scheduler */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scheduleScroll}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleTitle}>Book Appointment</Text>
            <Text style={styles.scheduleSub}>AI-matched to your cycle & health history</Text>
          </View>

          {/* AI Suggestion */}
          <GlassCardView style={styles.scheduleSuggestion} accentColor={Colors.purple}>
            <Text style={[styles.scheduleAILabel, { color: Colors.purple }]}>✦ AI RECOMMENDATION</Text>
            <Text style={styles.scheduleAIText}>
              Based on your cycle (Day 14 · Ovulation), scheduling a gynecology check-up this week is optimal. Your last visit was 6 months ago.
            </Text>
          </GlassCardView>

          <SectionHeader title="Available Slots" subtitle="Nearby clinics · Verified doctors" />

          {APPOINTMENT_SLOTS.map((slot, i) => (
            <GlassCardView
              key={i}
              style={[
                styles.slotCard,
                bookedSlot === `${slot.doctor}-${slot.time}` && { borderColor: Colors.teal + '80' },
                !slot.available && { opacity: 0.5 },
              ]}>
              <View style={styles.slotRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotDoctor}>{slot.doctor}</Text>
                  <Text style={styles.slotSpec}>{slot.spec}</Text>
                  <View style={styles.slotMeta}>
                    <Text style={styles.slotTime}>🕐 {slot.time}</Text>
                    <Text style={styles.slotDate}>  📅 {slot.date}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  disabled={!slot.available}
                  onPress={() => setBookedSlot(`${slot.doctor}-${slot.time}`)}
                  style={[
                    styles.bookBtn,
                    bookedSlot === `${slot.doctor}-${slot.time}`
                      ? { backgroundColor: Colors.teal + '30', borderColor: Colors.teal }
                      : { backgroundColor: Colors.purple + '25', borderColor: Colors.purple + '60' },
                    !slot.available && { backgroundColor: Colors.bgCardBorder, borderColor: Colors.bgCardBorder },
                  ]}>
                  <Text style={[
                    styles.bookBtnText,
                    bookedSlot === `${slot.doctor}-${slot.time}` && { color: Colors.teal },
                    !slot.available && { color: Colors.textMuted },
                  ]}>
                    {!slot.available ? 'Full' : bookedSlot === `${slot.doctor}-${slot.time}` ? '✓ Booked' : 'Book'}
                  </Text>
                </TouchableOpacity>
              </View>
            </GlassCardView>
          ))}

          {bookedSlot && (
            <GlassCardView style={styles.confirmedCard} accentColor={Colors.teal}>
              <Text style={{ fontSize: 24, textAlign: 'center' }}>✅</Text>
              <Text style={styles.confirmedTitle}>Appointment Confirmed!</Text>
              <Text style={styles.confirmedSub}>A reminder has been set 1 hour before. Your health records will be shared securely with the doctor.</Text>
            </GlassCardView>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  aiAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.purple + '30',
    borderWidth: 2, borderColor: Colors.purple,
    alignItems: 'center', justifyContent: 'center',
    ...Shadows.teal,
  },
  title: { fontSize: Typography.md, fontWeight: Typography.bold, color: Colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success, marginRight: 5, shadowColor: Colors.success, shadowRadius: 4, shadowOpacity: 1 },
  onlineText: { fontSize: Typography.xs, color: Colors.textSecondary },
  tabToggle: { flexDirection: 'row', gap: Spacing.xs },
  tabBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  tabBtnText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.semiBold },
  quickScroll: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  quickContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  quickChip: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.xs, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, borderRadius: Radius.full,
    backgroundColor: Colors.bgCard, borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  quickChipText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: Typography.medium },
  chatScroll: { flex: 1 },
  chatContent: { padding: Spacing.base },
  msgRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.purple + '25', borderWidth: 1,
    borderColor: Colors.purple + '60', alignItems: 'center',
    justifyContent: 'center', marginRight: Spacing.sm,
  },
  msgBubble: {
    maxWidth: '78%', padding: Spacing.md,
    borderRadius: Radius.lg, borderBottomLeftRadius: 4,
  },
  aiBubble: { ...GlassCard, borderBottomLeftRadius: 4 },
  userBubble: {
    backgroundColor: Colors.purple, borderRadius: Radius.lg,
    borderBottomRightRadius: 4, ...Shadows.teal,
  },
  msgText: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  msgTime: { fontSize: 10, color: Colors.textMuted, marginTop: 5, alignSelf: 'flex-end' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: Spacing.base, borderTopWidth: 1,
    borderTopColor: Colors.divider, gap: Spacing.sm,
  },
  input: {
    flex: 1, ...GlassCard, padding: Spacing.md,
    fontSize: Typography.sm, color: Colors.textPrimary,
    maxHeight: 120, borderRadius: Radius.lg,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  scheduleScroll: { padding: Spacing.base },
  scheduleHeader: { marginBottom: Spacing.xl },
  scheduleTitle: { fontSize: Typography.xxl, fontWeight: Typography.extraBold, color: Colors.textPrimary },
  scheduleSub: { fontSize: Typography.sm, color: Colors.purple, marginTop: 4 },
  scheduleSuggestion: { padding: Spacing.base, marginBottom: Spacing.xl },
  scheduleAILabel: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5, marginBottom: Spacing.sm },
  scheduleAIText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  slotCard: { padding: Spacing.base, marginBottom: Spacing.md },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotDoctor: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  slotSpec: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  slotMeta: { flexDirection: 'row', marginTop: Spacing.sm },
  slotTime: { fontSize: Typography.xs, color: Colors.textSecondary },
  slotDate: { fontSize: Typography.xs, color: Colors.textSecondary },
  bookBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
  },
  bookBtnText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.bold },
  confirmedCard: { padding: Spacing.xl, marginTop: Spacing.base, alignItems: 'center' },
  confirmedTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.teal, marginTop: Spacing.md, textAlign: 'center' },
  confirmedSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 20 },
});
