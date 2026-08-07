import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Clipboard,
  Share,
  Animated,
  Platform,
} from 'react-native';
import { Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { sendAIChatMessage, ChatHistoryItem } from '../../services/aiApi';
import { Copy, RotateCcw, Volume2, Share2, Paperclip, Mic, SendHorizonal, ArrowLeft, History } from 'lucide-react-native';
import type { TabName } from '../../navigation/TabBar';

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
  { icon: '💊', label: 'Supplement advice' },
  { icon: '🩺', label: 'Check my vitals trend' },
];

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { session } = useAuth();

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, time };

    // Build chat history for LLM (excluding error messages)
    const history: ChatHistoryItem[] = messages
      .filter(m => !m.text.includes('Google Gemini API error:') && !m.text.includes('having trouble connecting'))
      .map(m => ({
        role: m.role,
        text: m.text,
      }));

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const token = session?.access_token || '';
      const aiResponse = await sendAIChatMessage(token, text, history);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiResponse.text,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.warn('[AIChatView Error]:', err.message);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: err.message || "I'm having trouble connecting to my servers right now. Please check your connection and try again.",
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const retryLastMessage = () => {
    // Find the last user message and resend it
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      // Remove the last AI response
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'ai') return prev.slice(0, -1);
        return prev;
      });
      setTimeout(() => sendMessage(lastUser.text), 100);
    }
  };

  return { messages, input, setInput, isThinking, sendMessage, retryLastMessage, scrollRef };
}

type AIChatViewProps = {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isThinking?: boolean;
  sendMessage: (text: string) => void;
  retryLastMessage?: () => void;
  scrollRef: React.RefObject<ScrollView | null>;
  initialQuery?: string;
  autoFocus?: boolean;
  onBack?: () => void;
  originTab?: TabName;
  navigateToTab?: (tab: TabName) => void;
};

// ── AI Action Buttons Row ────────────────────────────────────────
function AIActionRow({ text, onRetry }: { text: string; onRetry?: () => void }) {
  const { theme } = useTheme();
  const styles = useStyles((theme) => ({
    row: {
      flexDirection: 'row',
      gap: 2,
      marginTop: Spacing.xs,
      marginBottom: Spacing.sm,
      marginLeft: 4,
    },
    btn: {
      width: 40,
      height: 36,
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));
  const handleCopy = () => {
    Clipboard.setString(text);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: text });
    } catch { }
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={handleCopy}>
        <Copy size={18} color={theme.colors.textMuted} strokeWidth={1.5} />
      </TouchableOpacity>
      {onRetry && (
        <TouchableOpacity style={styles.btn} onPress={onRetry}>
          <RotateCcw size={18} color={theme.colors.textMuted} strokeWidth={1.5} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.btn} onPress={() => { /* Speak aloud - TTS integration later */ }}>
        <Volume2 size={18} color={theme.colors.textMuted} strokeWidth={1.5} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={handleShare}>
        <Share2 size={18} color={theme.colors.textMuted} strokeWidth={1.5} />
      </TouchableOpacity>
    </View>
  );
}

// ── Welcome Placeholder ────────────────────────────────────────
function WelcomePlaceholder() {
  const { theme } = useTheme();
  const styles = useStyles((theme) => ({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xl * 2,
      paddingBottom: 80,
    },
    sparkle: {
      fontSize: 40,
      color: theme.colors.accentBlue,
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold as any,
      color: theme.colors.textPrimary,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: Typography.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
  }));
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.sparkle}>✦</Text>
      <Text style={styles.title}>What can I help you with?</Text>
      <Text style={styles.subtitle}>
        Ask me about your health, nutrition, workouts, sleep patterns, or anything wellness related.
      </Text>
    </Animated.View>
  );
}

// ── Formatted Markdown Text Component ───────────────────────────────
function FormattedText({ text, style }: { text: string; style?: any }) {
  const { theme } = useTheme();
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <View style={{ width: '100%' }}>
      {lines.map((line, lineIdx) => {
        let trimmed = line.trim();

        if (trimmed === '---') {
          return (
            <View
              key={lineIdx}
              style={{
                height: 1,
                backgroundColor: theme.colors.divider,
                marginVertical: Spacing.sm,
              }}
            />
          );
        }

        // Check if line is a bullet item (* or - or • followed by space)
        let isBullet = false;
        if (/^[\*\-\•]\s+/.test(trimmed)) {
          isBullet = true;
          trimmed = trimmed.replace(/^[\*\-\•]\s+/, '');
        }

        // Split by ** to safely isolate bold text blocks
        const boldSegments = trimmed.split('**');

        return (
          <Text key={lineIdx} style={[style, { marginBottom: trimmed === '' ? 6 : 4 }]}>
            {isBullet && <Text style={{ color: theme.colors.accentBlue, fontWeight: 'bold' }}>• </Text>}
            {boldSegments.map((segment, bIdx) => {
              const isBold = bIdx % 2 === 1;

              if (isBold) {
                return (
                  <Text
                    key={bIdx}
                    style={{
                      fontWeight: '900',
                      color: '#FFFFFF',
                      fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined,
                    }}>
                    {segment}
                  </Text>
                );
              }

              // Parse single * italic inside plain text segments (must be a valid pair)
              const italicSegments = segment.split('*');
              const hasValidItalicPair = italicSegments.length >= 3 && italicSegments.length % 2 === 1;

              if (hasValidItalicPair) {
                return (
                  <React.Fragment key={bIdx}>
                    {italicSegments.map((itSeg, iIdx) => {
                      const isItalic = iIdx % 2 === 1;
                      return isItalic ? (
                        <Text
                          key={iIdx}
                          style={{
                            fontStyle: 'italic',
                            color: theme.colors.textPrimary,
                            fontFamily: Platform.OS === 'android' ? 'sans-serif-italic' : undefined,
                          }}>
                          {itSeg}
                        </Text>
                      ) : (
                        <Text key={iIdx}>{itSeg}</Text>
                      );
                    })}
                  </React.Fragment>
                );
              }

              return <Text key={bIdx}>{segment}</Text>;
            })}
          </Text>
        );
      })}
    </View>
  );
}

// ── Main Chat View ────────────────────────────────────────────
export default function AIChatView({ messages, input, setInput, isThinking, sendMessage, retryLastMessage, scrollRef, initialQuery, autoFocus, onBack, originTab, navigateToTab }: AIChatViewProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const styles = useStyles((theme) => ({
    // ── Quick Prompts ──
    quickScroll: {
      maxHeight: 50,
      marginBottom: Spacing.xs,
    },
    quickContent: {
      paddingHorizontal: Spacing.base,
      gap: Spacing.sm,
      flexDirection: 'row',
    },
    quickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
    quickChipText: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      fontWeight: Typography.medium as any,
    },

    // ── Chat Area ──
    chatScroll: { flex: 1 },
    chatContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.base, paddingBottom: Spacing.sm },

    // ── User Message (boxed) ──
    msgRow: {
      flexDirection: 'row',
      marginBottom: Spacing.md,
      alignItems: 'flex-end',
    },
    msgRowUser: { flexDirection: 'row-reverse' },
    userBubble: {
      maxWidth: '78%',
      padding: Spacing.md,
      backgroundColor: theme.colors.accentBlue,
      borderRadius: Radius.lg,
      borderBottomRightRadius: 4,
      ...Shadows.teal,
    },
    userMsgText: {
      fontSize: Typography.sm,
      color: theme.colors.bg,
      lineHeight: 20,
    },
    userMsgTime: {
      fontSize: 10,
      color: theme.colors.bg + '80',
      marginTop: 4,
      alignSelf: 'flex-end',
    },

    // ── AI Message (flat / no box) ──
    aiMsgContainer: {
      marginBottom: Spacing.xs,
      paddingLeft: 4,
    },
    aiAvatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    aiAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.colors.accentBlue + '20',
      borderWidth: 1,
      borderColor: theme.colors.accentBlue + '50',
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiLabel: {
      fontSize: 11,
      fontWeight: Typography.semiBold as any,
      color: theme.colors.accentBlue,
    },
    aiTime: {
      fontSize: 10,
      color: theme.colors.textMuted,
      marginLeft: 'auto',
    },
    aiMsgText: {
      fontSize: Typography.base,
      color: theme.colors.textPrimary,
      lineHeight: 24,
      paddingLeft: 4,
    },

    // ── Thinking ──
    thinkingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingLeft: 4,
      paddingVertical: Spacing.xs,
    },
    thinkingText: {
      fontSize: Typography.xs,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },

    // ── Input Area ──
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 3,
      gap: 2,
    },
    inputIconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    input: {
      flex: 1,
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
      maxHeight: 100,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    sendBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.accentBlue,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    micBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Header (when rendered as overlay) ──
    root: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.base,
      paddingTop: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      backgroundColor: theme.colors.bg,
    },
    backBtn: {
      padding: Spacing.sm,
      marginRight: Spacing.xs,
    },
    headerTextWrap: {
      flex: 1,
    },
    greeting: { fontSize: Typography.xl, fontWeight: Typography.bold, color: theme.colors.textPrimary },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    historyBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
    },
  }));
  const hasSentInitial = useRef(false);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (initialQuery && !hasSentInitial.current) {
      hasSentInitial.current = true;
      setTimeout(() => sendMessage(initialQuery), 300);
    }
  }, [initialQuery]);

  return (
    <View style={styles.root}>
      {/* Header — only when rendered as overlay (onBack provided) */}
      {onBack && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigateToTab && originTab && originTab !== 'AI') {
                navigateToTab(originTab);
              }
              onBack();
            }}
            style={styles.backBtn}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.greeting}>Chat with Cureto</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.historyBtn} onPress={() => { /* Chat history - future */ }}>
              <History size={20} color={theme.colors.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Messages or Welcome */}
      {!hasMessages && !isThinking ? (
        <View style={styles.chatScroll}>
          <WelcomePlaceholder />
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.chatScroll}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}>
          {messages.map((msg, index) => {
            const isLastAi = msg.role === 'ai' && (index === messages.length - 1 || messages[index + 1]?.role === 'user');
            return (
              <View key={msg.id}>
                {msg.role === 'user' ? (
                  /* ── User message: boxed ── */
                  <View style={[styles.msgRow, styles.msgRowUser]}>
                    <View style={styles.userBubble}>
                      <Text style={styles.userMsgText}>{msg.text}</Text>
                      <Text style={styles.userMsgTime}>{msg.time}</Text>
                    </View>
                  </View>
                ) : (
                  /* ── AI message: flat on background ── */
                  <View style={styles.aiMsgContainer}>
                    <FormattedText text={msg.text} style={styles.aiMsgText} />
                    {/* Action buttons: show on last AI message or each AI msg */}
                    <AIActionRow
                      text={msg.text}
                      onRetry={isLastAi ? retryLastMessage : undefined}
                    />
                  </View>
                )}
              </View>
            );
          })}

          {/* Loading Indicator when AI is generating response */}
          {isThinking && (
            <View style={styles.aiMsgContainer}>
              <View style={styles.thinkingRow}>
                <ActivityIndicator size="small" color={theme.colors.accentBlue} />
                <Text style={styles.thinkingText}>Analyzing your health metrics...</Text>
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Quick Prompts — shown above input only when no messages yet */}
      {!hasMessages && !isThinking && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
          {QUICK_PROMPTS.map(p => (
            <TouchableOpacity
              key={p.label}
              onPress={() => sendMessage(p.label)}
              disabled={isThinking}
              style={[styles.quickChip, isThinking && { opacity: 0.6 }]}>
              <Text style={{ fontSize: Typography.xs }}>{p.icon}</Text>
              <Text style={styles.quickChipText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          {/* Attachment button */}
          <TouchableOpacity style={styles.inputIconBtn} onPress={() => { /* File upload - future */ }}>
            <Paperclip size={20} color={theme.colors.textMuted} strokeWidth={1.5} />
          </TouchableOpacity>

          {/* Text input */}
          <TextInput
            style={styles.input}
            placeholder="Ask anything about your health..."
            placeholderTextColor={theme.colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage(input)}
            returnKeyType="send"
            multiline
            editable={!isThinking}
            autoFocus={autoFocus}
          />

          {/* Mic or Send button */}
          {input.trim() ? (
            <TouchableOpacity
              style={[styles.sendBtn, { opacity: isThinking ? 0.5 : 1 }]}
              onPress={() => sendMessage(input)}
              disabled={isThinking}>
              {isThinking ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <SendHorizonal size={18} color={theme.colors.white} strokeWidth={2} />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micBtn} onPress={() => { /* Voice input - future */ }}>
              <Mic size={20} color={theme.colors.textSecondary} strokeWidth={1.5} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
