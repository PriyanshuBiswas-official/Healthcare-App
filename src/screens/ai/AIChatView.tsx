import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, GlassCard, Shadows } from '../../theme/theme';

export type Message = {
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

const AI_RESPONSES: Record<string, string> = {
  'Analyze my nutrition': "Based on today's log, your protein intake is 32% below target (82g vs 120g goal). Your carb intake is well-balanced. I recommend adding a protein-rich snack like a Greek yogurt or protein shake. Overall caloric deficit looks healthy for your current goals! 📊",
  'Suggest a workout': "Given your current Push-Day streak and the fact that tomorrow is Day 15 of your cycle (high energy phase), I recommend a full Upper Body Strength session:\n• Bench Press: 4×8 @ 80kg\n• OHP: 3×10 @ 50kg\n• Pull-ups: 3×12\n• Cable flys: 3×15\n\nExpected burn: ~450 kcal 💪",
  'Book appointment': "I found 3 available slots for you nearby. Check the scheduler below. I can auto-confirm your preferred slot and send a reminder 1 hour before! 📅",
  'Sleep optimization tips': "Your avg sleep is 7.2 hours — just below the optimal 7.5–9 hours. Given your cycle phase (Day 14, luteal transition incoming), you may experience disrupted sleep soon. Tips: avoid screens after 10 PM, try magnesium glycinate supplementation, and maintain a consistent wake time. 🌙",
  'Check my vitals trend': "Over the past 30 days: Resting heart rate averaged 68 bpm ✅, Steps averaged 7,400/day (88% of goal), Sleep quality improving by 12%. Your overall health score this month: 78 / 100 — Great progress! 🩺",
  'Supplement advice': "Based on your cycle phase and activity level, I recommend:\n• Iron: 18mg/day (especially during menstrual phase)\n• Magnesium: 300mg (for sleep & muscle recovery)\n• Vitamin D: 2000 IU (your levels are slightly low)\n• Omega-3: 1g EPA+DHA daily for inflammation 💊",
};

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

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

  return { messages, input, setInput, sendMessage, scrollRef };
}

type AIChatViewProps = {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  sendMessage: (text: string) => void;
  scrollRef: React.RefObject<ScrollView | null>;
};

export default function AIChatView({ messages, input, setInput, sendMessage, scrollRef }: AIChatViewProps) {
  return (
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
  );
}

const styles = StyleSheet.create({
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
