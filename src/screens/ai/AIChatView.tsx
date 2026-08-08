import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  FlatList,
  Dimensions,
  Keyboard,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Typography, Spacing, Radius, Shadows } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import {
  sendAIChatMessage,
  getConversations,
  getArchivedConversations,
  getConversationMessages,
  createConversation,
  generateConversationTitle,
  deleteConversation,
  updateConversation,
  getAttachmentSignedUrl,
  Conversation,
  ChatHistoryItem,
  ChatAttachment,
} from '../../services/aiApi';
import { Copy, RotateCcw, Volume2, Share2, Paperclip, Mic, SendHorizonal, ArrowLeft, Menu, Plus, X, MessageSquare, Trash2, Pin, Archive, ChevronDown, ChevronRight, Camera, Image as ImageIcon, FileText } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import type { TabName } from '../../navigation/TabBar';

export type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  attachments?: {
    uri?: string;
    mimeType: string;
    fileName: string;
    storagePath?: string;
  }[];
};

const QUICK_PROMPTS = [
  { icon: '🍎', label: 'Analyze my nutrition' },
  { icon: '💪', label: 'Suggest a workout' },
  { icon: '🌙', label: 'Sleep optimization tips' },
  { icon: '💊', label: 'Supplement advice' },
  { icon: '🩺', label: 'Check my vitals trend' },
];

// ── Helpers ───────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── useChatState Hook ────────────────────────────────────────

export function useChatState() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const { session } = useAuth();

  const loadConversations = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingConversations(true);
    try {
      const data = await getConversations(session.access_token);
      setConversations(data);
    } catch (err: any) {
      console.warn('[ChatState] Failed to load conversations:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [session?.access_token]);

  const loadArchivedConversations = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const data = await getArchivedConversations(session.access_token);
      setArchivedConversations(data);
    } catch (err: any) {
      console.warn('[ChatState] Failed to load archived conversations:', err.message);
    }
  }, [session?.access_token]);

  const loadConversation = useCallback(async (id: number) => {
    if (!session?.access_token) return;
    try {
      setIsThinking(true);
      const detail = await getConversationMessages(session.access_token, id);
      const loadedMessages: Message[] = await Promise.all(
        detail.messages.map(async (m) => {
          const attachments: Message['attachments'] = [];
          if (m.attachments && m.attachments.length > 0) {
            for (const att of m.attachments) {
              if (att?.storage_path) {
                try {
                  const signedUrl = await getAttachmentSignedUrl(session.access_token!, att.storage_path);
                  attachments.push({
                    uri: signedUrl,
                    mimeType: att.file_type,
                    fileName: att.storage_path.split('/').pop() || 'attachment',
                    storagePath: att.storage_path,
                  });
                } catch {
                  // Attachment URL failed, skip silently
                }
              }
            }
          }
          return {
            id: m.message_id.toString(),
            role: m.role,
            text: m.message,
            time: new Date(m.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            attachments: attachments.length > 0 ? attachments : undefined,
          };
        }),
      );
      setMessages(loadedMessages);
      setConversationId(id);
      setInput('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    } catch (err: any) {
      console.warn('[ChatState] Failed to load conversation:', err.message);
    } finally {
      setIsThinking(false);
    }
  }, [session?.access_token]);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setInput('');
  }, []);

  const sendMessage = async (text: string) => {
    if ((!text.trim() && pendingAttachments.length === 0) || isThinking) return;

    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const userMsgAttachments = pendingAttachments.length > 0
      ? pendingAttachments.map(a => ({
          uri: a.uri,
          mimeType: a.type,
          fileName: a.name,
        }))
      : undefined;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim() || (pendingAttachments.length > 0 ? `Shared ${pendingAttachments.length} file(s)` : ''),
      time,
      attachments: userMsgAttachments,
    };

    const history: ChatHistoryItem[] = messages
      .filter(m => !m.text.includes('Google Gemini API error:') && !m.text.includes('having trouble connecting'))
      .map(m => ({ role: m.role, text: m.text }));

    const attachmentsToSend = [...pendingAttachments];
    setPendingAttachments([]);
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const token = session?.access_token || '';

      let activeConvId = conversationId;
      if (!activeConvId) {
        const conv = await createConversation(token);
        activeConvId = conv.conversation_id;
        setConversationId(activeConvId);
        generateConversationTitle(token, activeConvId, text).catch(() => {});
      }

      const aiResponse = await sendAIChatMessage(token, text || 'Please analyze these files', history, activeConvId, attachmentsToSend.length > 0 ? attachmentsToSend : undefined);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        text: aiResponse.text,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);

      // Refresh conversation list in background
      loadConversations().catch(() => {});
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
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.role === 'ai') return prev.slice(0, -1);
        return prev;
      });
      setTimeout(() => sendMessage(lastUser.text), 100);
    }
  };

  const handleDeleteConversation = useCallback(async (id: number) => {
    if (!session?.access_token) return;
    try {
      await deleteConversation(session.access_token, id);
      if (conversationId === id) {
        startNewChat();
      }
      setConversations(prev => prev.filter(c => c.conversation_id !== id));
    } catch (err: any) {
      console.warn('[ChatState] Failed to delete conversation:', err.message);
    }
  }, [session?.access_token, conversationId, startNewChat]);

  const handlePinConversation = useCallback(async (id: number, pinned: boolean) => {
    if (!session?.access_token) return;
    try {
      await updateConversation(session.access_token, id, { pinned });
      setConversations(prev =>
        prev.map(c => c.conversation_id === id ? { ...c, pinned } : c)
      );
    } catch (err: any) {
      console.warn('[ChatState] Failed to pin conversation:', err.message);
    }
  }, [session?.access_token]);

  const handleArchiveConversation = useCallback(async (id: number, archived: boolean) => {
    if (!session?.access_token) return;
    try {
      await updateConversation(session.access_token, id, { archived });
      setConversations(prev => prev.filter(c => c.conversation_id !== id));
      // Refresh archived list
      loadArchivedConversations().catch(() => {});
    } catch (err: any) {
      console.warn('[ChatState] Failed to archive conversation:', err.message);
    }
  }, [session?.access_token, loadArchivedConversations]);

  const handleUnarchiveConversation = useCallback(async (id: number) => {
    if (!session?.access_token) return;
    try {
      await updateConversation(session.access_token, id, { archived: false });
      setArchivedConversations(prev => prev.filter(c => c.conversation_id !== id));
      // Refresh active list
      loadConversations().catch(() => {});
    } catch (err: any) {
      console.warn('[ChatState] Failed to unarchive conversation:', err.message);
    }
  }, [session?.access_token, loadConversations]);

  return {
    messages, input, setInput, isThinking, sendMessage, retryLastMessage, scrollRef,
    conversationId, conversations, archivedConversations, loadingConversations,
    loadConversations, loadArchivedConversations, loadConversation, startNewChat,
    handleDeleteConversation, handlePinConversation, handleArchiveConversation, handleUnarchiveConversation,
  pendingAttachments, setPendingAttachments,
  };
}

// ── Props ─────────────────────────────────────────────────────

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
  conversationId?: number | null;
  conversations?: Conversation[];
  archivedConversations?: Conversation[];
  loadingConversations?: boolean;
  loadConversations?: () => Promise<void>;
  loadArchivedConversations?: () => Promise<void>;
  loadConversation?: (id: number) => Promise<void>;
  startNewChat?: () => void;
  handleDeleteConversation?: (id: number) => Promise<void>;
  handlePinConversation?: (id: number, pinned: boolean) => Promise<void>;
  handleArchiveConversation?: (id: number, archived: boolean) => Promise<void>;
  handleUnarchiveConversation?: (id: number) => Promise<void>;
  pendingAttachments?: ChatAttachment[];
  setPendingAttachments?: (attachments: ChatAttachment[]) => void;
};

// ── AI Action Buttons Row ────────────────────────────────────
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

        let isBullet = false;
        if (/^[\*\-\•]\s+/.test(trimmed)) {
          isBullet = true;
          trimmed = trimmed.replace(/^[\*\-\•]\s+/, '');
        }

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

// ── History Sidebar ──────────────────────────────────────────

type HistorySidebarProps = {
  visible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  archivedConversations: Conversation[];
  loading: boolean;
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: number) => void;
  onPinConversation: (id: number, pinned: boolean) => void;
  onArchiveConversation: (id: number, archived: boolean) => void;
  onUnarchiveConversation: (id: number) => void;
  onOpenArchived: () => void;
};

function HistorySidebar({
  visible,
  onClose,
  conversations,
  archivedConversations,
  loading,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onPinConversation,
  onArchiveConversation,
  onUnarchiveConversation,
  onOpenArchived,
}: HistorySidebarProps) {
  const { theme } = useTheme();
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; conversation: Conversation | null }>({
    visible: false,
    conversation: null,
  });
  const [archivedExpanded, setArchivedExpanded] = useState(false);

  const pinnedConversations = conversations.filter(c => c.pinned);
  const unpinnedConversations = conversations.filter(c => !c.pinned);

  const styles = useStyles((theme) => ({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 20,
    },
    panel: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.bg,
      zIndex: 21,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: Spacing.xl + Spacing.base,
      paddingHorizontal: Spacing.base,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
    },
    headerTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold as any,
      color: theme.colors.textPrimary,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bgCard,
    },
    newChatBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginHorizontal: Spacing.base,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      borderRadius: Radius.lg,
      backgroundColor: theme.colors.textPrimary + '10',
      borderWidth: 1,
      borderColor: theme.colors.textPrimary + '20',
    },
    newChatText: {
      fontSize: Typography.sm,
      fontWeight: Typography.semiBold as any,
      color: theme.colors.textPrimary,
    },
    listContent: {
      paddingHorizontal: Spacing.sm,
      paddingBottom: Spacing.xl,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: Spacing.xl * 2,
      paddingHorizontal: Spacing.xl,
    },
    emptyIcon: {
      marginBottom: Spacing.md,
      opacity: 0.4,
    },
    emptyText: {
      fontSize: Typography.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    sectionLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold as any,
      color: theme.colors.textMuted,
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      marginHorizontal: Spacing.xs,
      marginBottom: 2,
      borderRadius: Radius.lg,
      backgroundColor: 'transparent',
    },
    itemActive: {
      backgroundColor: theme.colors.textPrimary + '12',
    },
    itemIcon: {
      marginRight: Spacing.sm,
      opacity: 0.5,
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: Typography.base,
      fontWeight: Typography.medium as any,
      color: '#FFFFFF',
    },
    itemTitleActive: {
      color: 'rgba(255,255,255,0.55)',
      fontWeight: Typography.semiBold as any,
    },
    pinIcon: {
      marginLeft: Spacing.sm,
      opacity: 0.4,
    },
    separator: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginHorizontal: Spacing.md,
      opacity: 0.5,
    },
    // ── Archived section ──
    archivedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginHorizontal: Spacing.xs,
      marginTop: Spacing.sm,
      borderRadius: Radius.lg,
    },
    archivedToggleText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium as any,
      color: theme.colors.textMuted,
    },
    archivedCount: {
      fontSize: Typography.xs,
      color: theme.colors.textMuted,
      opacity: 0.6,
    },
    archivedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
      marginHorizontal: Spacing.xs,
      marginBottom: 1,
      borderRadius: Radius.lg,
      backgroundColor: 'transparent',
    },
    archivedItemTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium as any,
      color: 'rgba(255,255,255,0.45)',
      flex: 1,
    },
    // ── Context Menu ──
    contextBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
    },
    contextMenu: {
      position: 'absolute',
      backgroundColor: theme.colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      paddingVertical: Spacing.xs,
      minWidth: 180,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 15,
      zIndex: 31,
    },
    contextItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm + 2,
    },
    contextText: {
      fontSize: Typography.sm,
      color: theme.colors.textPrimary,
    },
    contextTextDestructive: {
      color: '#FF6B6B',
    },
    contextDivider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginVertical: 2,
    },
  }));

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, friction: 8, tension: 40 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: Dimensions.get('window').width, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const handleLongPress = (item: Conversation, event: any) => {
    event.target?.measure?.((_x: number, _y: number, width: number, height: number, pageX: number, pageY: number) => {
      setContextMenu({
        visible: true,
        conversation: { ...item, _menuX: pageX, _menuY: pageY + height } as any,
      });
    });
    if (!contextMenu.visible) {
      setTimeout(() => {
        setContextMenu(prev => {
          if (!prev.visible) {
            return { visible: true, conversation: { ...item, _menuX: Dimensions.get('window').width / 2 - 90, _menuY: 300 } as any };
          }
          return prev;
        });
      }, 50);
    }
  };

  const renderItem = (item: Conversation) => {
    const isActive = item.conversation_id === activeConversationId;
    return (
      <TouchableOpacity
        key={item.conversation_id}
        style={[styles.item, isActive && styles.itemActive]}
        onPress={() => { onSelectConversation(item.conversation_id); onClose(); }}
        onLongPress={(e) => handleLongPress(item, e)}
        activeOpacity={0.6}>
        <View style={styles.itemIcon}>
          <MessageSquare size={16} color={isActive ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)'} strokeWidth={1.5} />
        </View>
        <View style={styles.itemContent}>
          <Text
            numberOfLines={1}
            style={[styles.itemTitle, isActive && styles.itemTitleActive]}>
            {item.title || 'New Chat'}
          </Text>
        </View>
        {item.pinned && (
          <View style={styles.pinIcon}>
            <Pin size={12} color="rgba(255,255,255,0.35)" strokeWidth={1.5} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} onTouchStart={onClose} />
      <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chat History</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.newChatBtn} onPress={() => { onNewChat(); onClose(); }}>
          <Plus size={18} color={theme.colors.textPrimary} strokeWidth={2} />
          <Text style={styles.newChatText}>New Chat</Text>
        </TouchableOpacity>

        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="small" color={theme.colors.accentBlue} />
          </View>
        ) : conversations.length === 0 && archivedConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={36} color={theme.colors.textMuted} strokeWidth={1.5} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No conversations yet.{'\n'}Start a chat to begin your history.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {/* Pinned section */}
            {pinnedConversations.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Pinned</Text>
                {pinnedConversations.map(item => renderItem(item))}
              </>
            )}

            {/* Recent section */}
            {unpinnedConversations.length > 0 && (
              <>
                {pinnedConversations.length > 0 && <Text style={styles.sectionLabel}>Recent</Text>}
                {unpinnedConversations.map(item => renderItem(item))}
              </>
            )}

            {/* Archived section */}
            {archivedConversations.length > 0 && (
              <>
                <View style={styles.separator} />
                <TouchableOpacity
                  style={styles.archivedToggle}
                  onPress={() => {
                    setArchivedExpanded(!archivedExpanded);
                    if (!archivedExpanded) onOpenArchived();
                  }}>
                  {archivedExpanded ? (
                    <ChevronDown size={14} color={theme.colors.textMuted} strokeWidth={2} />
                  ) : (
                    <ChevronRight size={14} color={theme.colors.textMuted} strokeWidth={2} />
                  )}
                  <Text style={styles.archivedToggleText}>Archived</Text>
                  <Text style={styles.archivedCount}>{archivedConversations.length}</Text>
                </TouchableOpacity>
                {archivedExpanded && archivedConversations.map(item => (
                  <TouchableOpacity
                    key={item.conversation_id}
                    style={styles.archivedItem}
                    onPress={() => { onSelectConversation(item.conversation_id); onClose(); }}
                    onLongPress={(e) => handleLongPress(item, e)}
                    activeOpacity={0.6}>
                    <View style={styles.itemIcon}>
                      <Archive size={14} color="rgba(255,255,255,0.25)" strokeWidth={1.5} />
                    </View>
                    <Text numberOfLines={1} style={styles.archivedItemTitle}>
                      {item.title || 'New Chat'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </Animated.View>

      {/* ── Long Press Context Menu ── */}
      {contextMenu.visible && contextMenu.conversation && (
        <>
          <TouchableOpacity
            style={styles.contextBackdrop}
            activeOpacity={1}
            onPress={() => setContextMenu({ visible: false, conversation: null })}
          />
          <View
            style={[
              styles.contextMenu,
              {
                top: Math.min(
                  (contextMenu.conversation as any)._menuY || 300,
                  Dimensions.get('window').height - 200,
                ),
                left: Math.min(
                  (contextMenu.conversation as any)._menuX || Dimensions.get('window').width / 2 - 90,
                  Dimensions.get('window').width - 200,
                ),
              },
            ]}>
            <TouchableOpacity
              style={styles.contextItem}
              onPress={() => {
                onPinConversation(contextMenu.conversation!.conversation_id, !contextMenu.conversation!.pinned);
                setContextMenu({ visible: false, conversation: null });
              }}>
              <Pin size={16} color={theme.colors.textSecondary} strokeWidth={1.5} />
              <Text style={styles.contextText}>{contextMenu.conversation!.pinned ? 'Unpin' : 'Pin'}</Text>
            </TouchableOpacity>
            {contextMenu.conversation!.archived ? (
              <TouchableOpacity
                style={styles.contextItem}
                onPress={() => {
                  onUnarchiveConversation(contextMenu.conversation!.conversation_id);
                  setContextMenu({ visible: false, conversation: null });
                }}>
                <Archive size={16} color={theme.colors.textSecondary} strokeWidth={1.5} />
                <Text style={styles.contextText}>Unarchive</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.contextItem}
                onPress={() => {
                  onArchiveConversation(contextMenu.conversation!.conversation_id, true);
                  setContextMenu({ visible: false, conversation: null });
                }}>
                <Archive size={16} color={theme.colors.textSecondary} strokeWidth={1.5} />
                <Text style={styles.contextText}>Archive</Text>
              </TouchableOpacity>
            )}
            <View style={styles.contextDivider} />
            <TouchableOpacity
              style={styles.contextItem}
              onPress={() => {
                onDeleteConversation(contextMenu.conversation!.conversation_id);
                setContextMenu({ visible: false, conversation: null });
              }}>
              <Trash2 size={16} color="#FF6B6B" strokeWidth={1.5} />
              <Text style={[styles.contextText, styles.contextTextDestructive]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );
}

// ── Attachment Popup Menu ─────────────────────────────────────

type AttachMenuProps = {
  visible: boolean;
  onClose: () => void;
  onSelected: (attachment: ChatAttachment) => void;
  onSelectedMultiple?: (attachments: ChatAttachment[]) => void;
};

function AttachMenu({ visible, onClose, onSelected, onSelectedMultiple }: AttachMenuProps) {
  const { theme } = useTheme();

  const styles = useStyles((theme) => ({
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 30,
    },
    popup: {
      position: 'absolute',
      bottom: 70,
      left: Spacing.sm + 4,
      backgroundColor: '#1E1E1E',
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: '#333',
      paddingVertical: Spacing.sm,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 15,
      zIndex: 31,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    optionText: {
      fontSize: Typography.base,
      color: theme.colors.textPrimary,
      fontWeight: Typography.medium as any,
    },
  }));

  if (!visible) return null;

  const handleCamera = async () => {
    onClose();
    try {
      const { PermissionsAndroid } = require('react-native');
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          { title: 'Camera Permission', message: 'App needs access to your camera', buttonPositive: 'OK' },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
      }
      const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
      if (result.didCancel || result.errorCode || !result.assets?.[0]) return;
      const a = result.assets[0];
      onSelected({ uri: a.uri || '', type: a.type || 'image/jpeg', name: a.fileName || 'photo.jpg' });
    } catch (e: any) {
      console.warn('[Attach] Camera:', e.message);
    }
  };

  const handleGallery = async () => {
    onClose();
    try {
      const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 4, quality: 0.8 });
      if (result.didCancel || result.errorCode || !result.assets || result.assets.length === 0) return;
      const items: ChatAttachment[] = result.assets.map(a => ({
        uri: a.uri || '',
        type: a.type || 'image/jpeg',
        name: a.fileName || 'photo.jpg',
      }));
      if (items.length === 1) {
        onSelected(items[0]);
      } else if (items.length > 1 && onSelectedMultiple) {
        onSelectedMultiple(items);
      }
    } catch (e: any) {
      console.warn('[Attach] Gallery:', e.message);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.popup}>
        <TouchableOpacity style={styles.option} onPress={handleCamera} activeOpacity={0.6}>
          <Camera size={22} color={theme.colors.textSecondary} strokeWidth={1.5} />
          <Text style={styles.optionText}>Camera</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleGallery} activeOpacity={0.6}>
          <ImageIcon size={22} color={theme.colors.textSecondary} strokeWidth={1.5} />
          <Text style={styles.optionText}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={() => { onClose(); }} activeOpacity={0.6}>
          <FileText size={22} color={theme.colors.textSecondary} strokeWidth={1.5} />
          <Text style={styles.optionText}>Files</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Main Chat View ────────────────────────────────────────────
export default function AIChatView({
  messages, input, setInput, isThinking, sendMessage, retryLastMessage, scrollRef,
  initialQuery, autoFocus, onBack, originTab, navigateToTab,
  conversationId, conversations, archivedConversations, loadingConversations,
  loadConversations, loadArchivedConversations, loadConversation, startNewChat,
  handleDeleteConversation, handlePinConversation, handleArchiveConversation, handleUnarchiveConversation,
    pendingAttachments = [],
  setPendingAttachments,
}: AIChatViewProps) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [historyVisible, setHistoryVisible] = useState(false);
  const [attachSheetVisible, setAttachSheetVisible] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
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
    chatImagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 6,
    },
    chatImage: {
      width: 140,
      height: 110,
      borderRadius: Radius.md,
      marginBottom: 6,
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
    attachmentImageWrap: {
      position: 'relative',
      marginRight: Spacing.xs,
    },
    pendingAttachmentsScroll: {
      maxHeight: 90,
    },
    pendingAttachmentsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xs,
      paddingTop: Spacing.xs,
    },
    attachmentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.lg,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      alignSelf: 'flex-start',
      maxWidth: '80%',
    },
    attachmentThumb: {
      width: 80,
      height: 80,
      borderRadius: Radius.md,
    },
    attachmentImageRemove: {
      position: 'absolute',
      top: 2,
      right: 2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentPdfIcon: {
      width: 36,
      height: 36,
      borderRadius: Radius.md,
      backgroundColor: '#FF6B6B15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentName: {
      flex: 1,
      fontSize: Typography.xs,
      color: theme.colors.textPrimary,
    },
    attachmentRemove: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputContainer: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      paddingBottom: Spacing.md,
    },
    inputRow: {
      backgroundColor: theme.colors.bgCard,
      borderWidth: 1,
      borderColor: theme.colors.bgCardBorder,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 3,
      gap: 2,
    },
    inputBottomRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
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

    // ── Header ──
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
    fullScreenOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fullScreenImageWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
    },
    fullScreenImageContainer: {
      width: '95%',
      height: '85%',
    },
    fullScreenImage: {
      width: '100%',
      height: '100%',
    },
    fullScreenClose: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
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

  const openHistory = useCallback(() => {
    loadConversations?.();
    setHistoryVisible(true);
  }, [loadConversations]);

  return (
    <View style={styles.root}>
      {/* Header */}
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
            <TouchableOpacity style={styles.historyBtn} onPress={openHistory}>
              <Menu size={20} color={theme.colors.textSecondary} strokeWidth={1.5} />
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
                  <View style={[styles.msgRow, styles.msgRowUser]}>
                    <View style={styles.userBubble}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <View style={styles.chatImagesRow}>
                          {msg.attachments.map((att, i) => (
                            att.uri ? (
                              <TouchableOpacity key={i} onPress={() => setViewerImage(att.uri ?? null)} activeOpacity={0.8}>
                                <Image
                                  source={{ uri: att.uri }}
                                  style={styles.chatImage}
                                  resizeMode="cover"
                                />
                              </TouchableOpacity>
                            ) : null
                          ))}
                        </View>
                      )}
                      <Text style={styles.userMsgText}>{msg.text}</Text>
                      <Text style={styles.userMsgTime}>{msg.time}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.aiMsgContainer}>
                    <FormattedText text={msg.text} style={styles.aiMsgText} />
                    <AIActionRow
                      text={msg.text}
                      onRetry={isLastAi ? retryLastMessage : undefined}
                    />
                  </View>
                )}
              </View>
            );
          })}

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

      {/* Quick Prompts */}
      {!hasMessages && !isThinking && pendingAttachments.length === 0 && (
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
          {/* Multiple attachment previews inside input box */}
          {pendingAttachments.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pendingAttachmentsScroll} contentContainerStyle={styles.pendingAttachmentsContent}>
              {pendingAttachments.map((att, index) => (
                <View key={index} style={styles.attachmentImageWrap}>
                  <TouchableOpacity onPress={() => setViewerImage(att.uri)} activeOpacity={0.8}>
                    <Image source={{ uri: att.uri }} style={styles.attachmentThumb} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const next = pendingAttachments.filter((_, i) => i !== index);
                      setPendingAttachments?.(next);
                    }}
                    style={styles.attachmentImageRemove}>
                    <X size={14} color="#fff" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.inputBottomRow}>
            <TouchableOpacity style={styles.inputIconBtn} onPress={() => setAttachSheetVisible(true)}>
              <Paperclip size={20} color={theme.colors.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>

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

            {(input.trim() || pendingAttachments.length > 0) ? (
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

      {/* History Sidebar */}
      <HistorySidebar
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        conversations={conversations || []}
        archivedConversations={archivedConversations || []}
        loading={loadingConversations || false}
        activeConversationId={conversationId ?? null}
        onSelectConversation={(id) => loadConversation?.(id)}
        onNewChat={() => startNewChat?.()}
        onDeleteConversation={(id) => handleDeleteConversation?.(id)}
        onPinConversation={(id, pinned) => handlePinConversation?.(id, pinned)}
        onArchiveConversation={(id, archived) => handleArchiveConversation?.(id, archived)}
        onUnarchiveConversation={(id) => handleUnarchiveConversation?.(id)}
        onOpenArchived={() => loadArchivedConversations?.()}
      />

      {/* Attachment Popup */}
      <AttachMenu
        visible={attachSheetVisible}
        onClose={() => setAttachSheetVisible(false)}
        onSelected={(att) => {
          if (pendingAttachments.length < 4) {
            setPendingAttachments?.([...pendingAttachments, att]);
          }
        }}
        onSelectedMultiple={(atts) => {
          const remaining = 4 - pendingAttachments.length;
          if (remaining > 0) {
            setPendingAttachments?.([...pendingAttachments, ...atts.slice(0, remaining)]);
          }
        }}
      />

      {/* Full-Screen Image Viewer */}
      <Modal visible={!!viewerImage} transparent animationType="none" onRequestClose={() => setViewerImage(null)}>
        <TouchableOpacity style={styles.fullScreenOverlay} activeOpacity={1} onPress={() => setViewerImage(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.fullScreenImageWrap}>
            <View style={styles.fullScreenImageContainer}>
              <Image source={{ uri: viewerImage || '' }} style={styles.fullScreenImage} resizeMode="contain" />
              <TouchableOpacity style={styles.fullScreenClose} onPress={() => setViewerImage(null)}>
                <X size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
