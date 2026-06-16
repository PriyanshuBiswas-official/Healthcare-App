import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, GlassCard, Shadows } from '../theme/theme';
import { GlassCardView, SectionHeader, ProfileAvatarButton } from '../components/SharedComponents';
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

export default function AIAdvisorScreen({ onProfilePress }: { onProfilePress?: () => void }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [bookedSlot, setBookedSlot] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');
  const [isBookingExpanded, setIsBookingExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { setForceHidden, onScroll } = useScrollVisibility();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (activeTab === 'chat') {
      setForceHidden(true);
    } else {
      setForceHidden(false);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
    return () => setForceHidden(false);
  }, [activeTab, setForceHidden, fadeAnim, slideAnim]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, time };
    const aiText = AI_RESPONSES[text] || "I'm analyzing your health data to provide personalized insights. For complex queries, consider booking a consultation with one of our partnered doctors. Is there anything specific you'd like to focus on?";
    const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: aiText, time };
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}>
      
      {/* Header */}
      <View style={styles.header}>
        {activeTab === 'chat' && (
          <TouchableOpacity onPress={() => setActiveTab('overview')} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        )}
        
        {activeTab === 'overview' ? (
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>AI Health Advisor</Text>
            <Text style={styles.subGreeting}>Your personalized health hub</Text>
          </View>
        ) : (
          <View style={styles.headerTextWrap}>
             <Text style={styles.greeting}>Chat with AI</Text>
             <View style={styles.onlineRow}>
               <View style={styles.onlineDot} />
               <Text style={styles.onlineText}>Online · Powered by Health AI</Text>
             </View>
          </View>
        )}
        
        <ProfileAvatarButton onPress={onProfilePress} />
      </View>

      {activeTab === 'overview' ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} onScroll={onScroll} scrollEventThrottle={16}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* Health Summary Card */}
            <GlassCardView style={styles.summaryCard} accentColor={Colors.purple}>
               <View style={styles.summaryHeader}>
                 <Text style={styles.summaryTitle}>AI Health Summary</Text>
                 <View style={styles.aiBadgeIcon}><Text style={{fontSize: 14, color: Colors.purple}}>✦</Text></View>
               </View>
               <Text style={styles.summaryText}>Your vitals are stable. Based on your activity patterns, prioritizing sleep tonight will optimize your recovery.</Text>
            </GlassCardView>

            {/* Chat Banner */}
            <GlassCardView style={styles.chatBanner}>
              <Text style={styles.chatBannerTitle}>Have something specific to ask?</Text>
              <TouchableOpacity style={styles.chatBannerBtn} onPress={() => setActiveTab('chat')}>
                 <Text style={styles.chatBannerBtnText}>Chat with AI</Text>
              </TouchableOpacity>
            </GlassCardView>

            {/* APPOINTMENTS */}
            <SectionHeader title="Appointments" />
            <GlassCardView style={styles.cardItem}>
               <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: Colors.purple + '20' }]}>
                     <Text style={{fontSize: 20}}>🩺</Text>
                  </View>
                  <View style={{flex: 1}}>
                     <Text style={styles.itemTitle}>Cardiology checkup</Text>
                     <Text style={styles.itemSub}>Dr. Mehta · City Heart Clinic</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                     <View style={[styles.badgeAI, { backgroundColor: Colors.purple + '20' }]}><Text style={[styles.badgeAIText, {color: Colors.purple}]}>AI synced</Text></View>
                     <View style={[styles.badgeTime, { backgroundColor: Colors.amber + '20' }]}><Text style={[styles.badgeTimeText, {color: Colors.amber}]}>Tomorrow, 10:30 AM</Text></View>
                     <Text style={styles.itemMeta}>Reminder set</Text>
                  </View>
               </View>
            </GlassCardView>
            
            <GlassCardView style={styles.cardItem}>
               <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: Colors.teal + '20' }]}>
                     <Text style={{fontSize: 20}}>🧪</Text>
                  </View>
                  <View style={{flex: 1}}>
                     <Text style={styles.itemTitle}>Blood lab panel</Text>
                     <Text style={styles.itemSub}>Lab Corp · Fasting required</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                     <View style={[styles.badgeTime, { backgroundColor: Colors.teal + '20' }]}><Text style={[styles.badgeTimeText, {color: Colors.teal}]}>Jun 20, 8 AM</Text></View>
                     <Text style={styles.itemMeta}>Pre-prep checklist</Text>
                  </View>
               </View>
            </GlassCardView>

            <GlassCardView style={styles.cardItem}>
               <View style={styles.row}>
                  <View style={[styles.iconWrap, { backgroundColor: Colors.amber + '20' }]}>
                     <Text style={{fontSize: 20}}>🧠</Text>
                  </View>
                  <View style={{flex: 1}}>
                     <Text style={styles.itemTitle}>Neurology consult</Text>
                     <Text style={styles.itemSub}>Dr. Kapoor · Telehealth</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                     <View style={[styles.badgeTime, { backgroundColor: Colors.teal + '20' }]}><Text style={[styles.badgeTimeText, {color: Colors.teal}]}>Jun 28, 3 PM</Text></View>
                     <Text style={styles.itemMeta}>Video link ready</Text>
                  </View>
               </View>
            </GlassCardView>

            <TouchableOpacity style={styles.bookBtnAction} onPress={() => setIsBookingExpanded(!isBookingExpanded)}>
              <Text style={styles.bookBtnActionText}>Book new appointment with AI ↗</Text>
            </TouchableOpacity>

            {isBookingExpanded && (
              <View style={styles.bookingExpanded}>
                <Text style={styles.scheduleTitle}>Book Appointment</Text>
                <Text style={styles.scheduleSub}>AI-matched to your cycle & health history</Text>
                <GlassCardView style={styles.scheduleSuggestion} accentColor={Colors.purple}>
                  <Text style={[styles.scheduleAILabel, { color: Colors.purple }]}>✦ AI RECOMMENDATION</Text>
                  <Text style={styles.scheduleAIText}>
                    Based on your cycle (Day 14 · Ovulation), scheduling a gynecology check-up this week is optimal. Your last visit was 6 months ago.
                  </Text>
                </GlassCardView>
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
                          styles.bookBtnInline,
                          bookedSlot === `${slot.doctor}-${slot.time}`
                            ? { backgroundColor: Colors.teal + '30', borderColor: Colors.teal }
                            : { backgroundColor: Colors.purple + '25', borderColor: Colors.purple + '60' },
                          !slot.available && { backgroundColor: Colors.bgCardBorder, borderColor: Colors.bgCardBorder },
                        ]}>
                        <Text style={[
                          styles.bookBtnInlineText,
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
              </View>
            )}

            {/* AI TOOLS */}
            <SectionHeader title="AI Tools" />
            <View style={styles.toolsGrid}>
              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: Colors.purple + '15' }]} />
                <Text style={styles.toolTitle}>OCR scanner</Text>
                <Text style={styles.toolSub}>Scan prescriptions, reports & lab results instantly</Text>
                <Text style={styles.toolActionText}>Tap to scan or upload</Text>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Prescriptions</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Lab reports</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Insurance</Text></View>
                </View>
              </GlassCardView>

              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: Colors.pink + '15' }]} />
                <Text style={styles.toolTitle}>Disease classifier</Text>
                <Text style={styles.toolSub}>AI image analysis for skin, eye, and X-ray conditions</Text>
                <View style={styles.toolFlexRow}>
                   <Text style={styles.toolMetaText}>Last scan: skin lesion</Text>
                   <View style={[styles.badgeAI, { backgroundColor: Colors.teal + '20' }]}><Text style={[styles.badgeAIText, { color: Colors.teal }]}>98%</Text></View>
                </View>
                <View style={styles.progressBar}><View style={[styles.progressFill, { width: '98%', backgroundColor: Colors.teal }]} /></View>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Dermatology</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>X-ray</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Retina</Text></View>
                </View>
              </GlassCardView>

              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: Colors.teal + '15' }]} />
                <Text style={styles.toolTitle}>Medication tracker</Text>
                <Text style={styles.toolSub}>AI reminders, interaction checks & refill alerts</Text>
                <View style={styles.medRow}>
                   <Text style={styles.medText}>Metformin 500mg</Text>
                   <View style={[styles.badgeTime, { backgroundColor: Colors.amber + '20' }]}><Text style={[styles.badgeTimeText, {color: Colors.amber}]}>8 PM</Text></View>
                </View>
                <View style={styles.medRow}>
                   <Text style={styles.medText}>Lisinopril 10mg</Text>
                   <View style={[styles.badgeTime, { backgroundColor: Colors.teal + '20' }]}><Text style={[styles.badgeTimeText, {color: Colors.teal}]}>Taken</Text></View>
                </View>
              </GlassCardView>

              <GlassCardView style={styles.toolCard}>
                <View style={[styles.toolIconWrap, { backgroundColor: Colors.amber + '15' }]} />
                <Text style={styles.toolTitle}>Health trends</Text>
                <Text style={styles.toolSub}>AI pattern recognition across vitals & symptoms</Text>
                <View style={styles.chartBars}>
                   {[24, 30, 20, 36, 40, 48, 56].map((h, i) => (
                      <View key={i} style={[styles.chartBar, { height: h, backgroundColor: Colors.teal, opacity: 0.3 + (i * 0.1) }]} />
                   ))}
                </View>
                <View style={styles.toolTagsRow}>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>7 days</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>Monthly</Text></View>
                   <View style={styles.toolTag}><Text style={styles.toolTagText}>AI report</Text></View>
                </View>
              </GlassCardView>
            </View>

            {/* RECENT AI INSIGHTS */}
            <SectionHeader title="Recent AI Insights" />
            <GlassCardView style={styles.insightCard}>
               <View style={styles.insightRow}>
                 <View style={[styles.insightIcon, { backgroundColor: Colors.purple + '15' }]} />
                 <View style={{flex: 1}}>
                   <Text style={styles.insightTitle}>Sleep pattern anomaly detected</Text>
                   <Text style={styles.insightSub}>Your average sleep has dropped 22% this week. AI recommends discussing this at your next cardiology visit.</Text>
                   <View style={[styles.badgeAI, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: Colors.purple + '20' }]}><Text style={[styles.badgeAIText, {color: Colors.purple}]}>AI recommendation</Text></View>
                 </View>
               </View>
            </GlassCardView>
            <GlassCardView style={styles.insightCard}>
               <View style={styles.insightRow}>
                 <View style={[styles.insightIcon, { backgroundColor: Colors.pink + '15' }]} />
                 <View style={{flex: 1}}>
                   <Text style={styles.insightTitle}>OCR scan complete — CBC report</Text>
                   <Text style={styles.insightSub}>Hemoglobin: 13.4 g/dL (slightly below range). AI flagged for Dr. Mehta review.</Text>
                   <View style={[styles.badgeAI, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: Colors.pink + '20' }]}><Text style={[styles.badgeAIText, { color: Colors.pink }]}>Needs attention</Text></View>
                 </View>
               </View>
            </GlassCardView>

            <View style={{ height: 100 }} />
          </Animated.View>
        </ScrollView>
      ) : (
        /* Chat View */
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
  backBtn: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
  backIcon: {
    fontSize: 24,
    color: Colors.textPrimary,
  },
  headerTextWrap: {
    flex: 1,
  },
  greeting: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary },
  subGreeting: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success, marginRight: 5, shadowColor: Colors.success, shadowRadius: 4, shadowOpacity: 1 },
  onlineText: { fontSize: Typography.xs, color: Colors.textSecondary },
  
  scroll: { padding: Spacing.base },
  
  summaryCard: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  aiBadgeIcon: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.purple + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  chatBanner: {
    padding: Spacing.base,
    marginBottom: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.purple + '40',
  },
  chatBannerTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chatBannerBtn: {
    backgroundColor: Colors.purple,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    ...Shadows.teal,
  },
  chatBannerBtnText: {
    color: Colors.bg,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },

  cardItem: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  itemTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  itemMeta: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  badgeAI: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeAIText: {
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  badgeTime: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  badgeTimeText: {
    fontSize: 10,
    fontWeight: Typography.semiBold,
  },

  bookBtnAction: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bookBtnActionText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    color: Colors.purple,
  },

  bookingExpanded: {
    marginBottom: Spacing.lg,
  },
  scheduleTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
  scheduleSub: { fontSize: Typography.sm, color: Colors.purple, marginTop: 4, marginBottom: Spacing.md },
  scheduleSuggestion: { padding: Spacing.base, marginBottom: Spacing.md },
  scheduleAILabel: { fontSize: 10, fontWeight: Typography.bold, letterSpacing: 1.5, marginBottom: Spacing.sm },
  scheduleAIText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  slotCard: { padding: Spacing.base, marginBottom: Spacing.sm },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotDoctor: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: Colors.textPrimary },
  slotSpec: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  slotMeta: { flexDirection: 'row', marginTop: Spacing.sm },
  slotTime: { fontSize: Typography.xs, color: Colors.textSecondary },
  slotDate: { fontSize: Typography.xs, color: Colors.textSecondary },
  bookBtnInline: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
  },
  bookBtnInlineText: { fontSize: Typography.sm, color: Colors.purple, fontWeight: Typography.bold },
  confirmedCard: { padding: Spacing.xl, marginTop: Spacing.base, alignItems: 'center' },
  confirmedTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.teal, marginTop: Spacing.md, textAlign: 'center' },
  confirmedSub: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center', lineHeight: 20 },

  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toolCard: {
    width: '47%',
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  toolIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  toolTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  toolSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    height: 45,
  },
  toolActionText: {
    fontSize: 10,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  toolTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 'auto',
  },
  toolTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgCardBorder,
  },
  toolTagText: {
    fontSize: 8,
    color: Colors.textSecondary,
  },
  toolFlexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toolMetaText: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.bgCardBorder,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  medRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  medText: {
    fontSize: 10,
    color: Colors.textPrimary,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
    marginBottom: Spacing.sm,
  },
  chartBar: {
    width: 14,
    borderRadius: 2,
  },

  insightCard: {
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  insightIcon: {
    width: 32, height: 32, borderRadius: 8,
  },
  insightTitle: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  insightSub: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

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
});
