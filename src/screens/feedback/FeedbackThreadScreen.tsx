import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendHorizonal, Paperclip, X } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { GlassCardView, BackButton, LoadingSpinner } from '../../components/SharedComponents';
import * as feedbackService from '../../services/feedbackService';
import type { FeedbackThread, FeedbackMessage, FeedbackAttachment } from '../../types/feedback';
import { CATEGORY_META, STATUS_META } from '../../types/feedback';

type Attachment = { uri: string; type: string; name: string };

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FeedbackThreadScreen({
  threadId,
  onBack,
}: {
  threadId: number;
  onBack: () => void;
}) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [thread, setThread] = useState<FeedbackThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: Spacing.base, paddingTop: insets.top + Spacing.base, borderBottomWidth: 1, borderBottomColor: t.colors.divider, backgroundColor: t.colors.bg },
    headerTitle: { flex: 1, fontSize: Typography.md, fontWeight: Typography.bold, color: t.colors.textPrimary, textAlign: 'center' },
    headerBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm },
    headerBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semiBold },
    scrollArea: { flex: 1 },
    scrollContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.base, paddingBottom: Spacing.sm },
    dateSeparator: { alignItems: 'center', marginVertical: Spacing.md },
    dateSeparatorText: { fontSize: Typography.xs, color: t.colors.textMuted, backgroundColor: t.colors.bg, paddingHorizontal: Spacing.sm },
    messageRow: { flexDirection: 'row', marginBottom: Spacing.md, alignItems: 'flex-end' },
    msgRowUser: { flexDirection: 'row-reverse' },
    msgRowAdmin: { flexDirection: 'row' },
    userBubble: { maxWidth: '78%', padding: Spacing.md, backgroundColor: t.colors.textSecondary + '30', borderRadius: Radius.lg },
    userMsgText: { fontSize: Typography.sm, color: t.colors.textPrimary, lineHeight: 20 },
    userMsgTime: { fontSize: 10, color: t.colors.textSecondary, marginTop: 4, alignSelf: 'flex-end' },
    adminLabel: { fontSize: 11, fontWeight: Typography.semiBold, color: t.colors.accentBlue, marginBottom: Spacing.xs, paddingLeft: 4 },
    adminMsgText: { fontSize: Typography.base, color: t.colors.textPrimary, lineHeight: 24, paddingLeft: 4 },
    adminMsgTime: { fontSize: 10, color: t.colors.textMuted, marginTop: 4, marginLeft: 4 },
    attachmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6, paddingLeft: 4 },
    attachmentThumb: { width: 140, height: 110, borderRadius: Radius.md, overflow: 'hidden' },
    inputContainer: { borderTopWidth: 1, borderTopColor: t.colors.divider, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, paddingBottom: Spacing.md },
    inputRow: { backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder, borderRadius: Radius.xl, paddingHorizontal: Spacing.xs, paddingVertical: 3, gap: 2 },
    inputBottomRow: { flexDirection: 'row', alignItems: 'flex-end' },
    textInput: { flex: 1, fontSize: Typography.sm, color: t.colors.textPrimary, maxHeight: 100, paddingVertical: 8, paddingHorizontal: 4 },
    inputIconBtn: { width: 40, height: 40, alignItems: 'center' as const, justifyContent: 'center' as const },
    sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.accentBlue, alignItems: 'center' as const, justifyContent: 'center' as const, marginBottom: 2 },
    sendBtnDisabled: { opacity: 0.5 },
    previewBar: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: 4 },
    previewThumb: { width: 80, height: 80, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' as const },
    previewImage: { width: 80, height: 80 },
    removePreview: { position: 'absolute', top: 2, right: 2, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' as const, justifyContent: 'center' as const },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.xxxl },
    emptyText: { fontSize: Typography.sm, color: t.colors.textMuted, marginTop: Spacing.sm },
  }));

  const fetchThread = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const data = await feedbackService.getThread(session.access_token, threadId);
      setThread(data);
    } catch (e) {
      console.error('[FeedbackThread] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, threadId]);

  useEffect(() => { fetchThread(); }, [fetchThread]);

  useEffect(() => {
    if (thread?.messages?.length) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [thread?.messages?.length]);

  const handleAddAttachment = () => {
    Alert.alert('Add Screenshot', 'Choose an option', [
      {
        text: 'Camera',
        onPress: async () => {
          const result = await launchCamera({ mediaType: 'photo', quality: 0.8 });
          if (result.assets?.[0]) {
            const a = result.assets[0];
            setAttachments(prev => [...prev, { uri: a.uri || '', type: a.type || 'image/jpeg', name: a.fileName || 'photo.jpg' }]);
          }
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
          if (result.assets?.[0]) {
            const a = result.assets[0];
            setAttachments(prev => [...prev, { uri: a.uri || '', type: a.type || 'image/jpeg', name: a.fileName || 'photo.jpg' }]);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSend = async () => {
    if (!session?.access_token || (!inputText.trim() && attachments.length === 0)) return;
    setSending(true);
    try {
      let uploadedAttachments: { storage_path: string; file_type: string; file_size?: number }[] | undefined;

      if (attachments.length > 0) {
        uploadedAttachments = await feedbackService.uploadAttachments(session.access_token, attachments);
      }

      await feedbackService.addMessage(session.access_token, threadId, inputText.trim(), uploadedAttachments);
      setInputText('');
      setAttachments([]);
      await fetchThread();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (msg: FeedbackMessage, idx: number) => {
    const isUser = msg.sender === 'user';
    const showDate = idx === 0 || formatDate(msg.created_at) !== formatDate(thread!.messages![idx - 1].created_at);

    return (
      <React.Fragment key={msg.feedback_message_id}>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(msg.created_at)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isUser ? styles.msgRowUser : styles.msgRowAdmin]}>
          {isUser ? (
            <View>
              <View style={styles.userBubble}>
                <Text style={styles.userMsgText}>{msg.message}</Text>
              </View>
              {msg.attachments && msg.attachments.length > 0 && (
                <View style={styles.attachmentRow}>
                  {msg.attachments.map((att: FeedbackAttachment) => (
                    <TouchableOpacity key={att.feedback_attachment_id} onPress={() => setPreviewImage(att.storage_path)} activeOpacity={0.8}>
                      <View style={styles.attachmentThumb}>
                        <AttachmentImage storagePath={att.storage_path} token={session?.access_token} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.userMsgTime}>{formatTime(msg.created_at)}</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text style={styles.adminLabel}>Admin</Text>
              <Text style={styles.adminMsgText}>{msg.message}</Text>
              {msg.attachments && msg.attachments.length > 0 && (
                <View style={styles.attachmentRow}>
                  {msg.attachments.map((att: FeedbackAttachment) => (
                    <TouchableOpacity key={att.feedback_attachment_id} onPress={() => setPreviewImage(att.storage_path)} activeOpacity={0.8}>
                      <View style={styles.attachmentThumb}>
                        <AttachmentImage storagePath={att.storage_path} token={session?.access_token} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.adminMsgTime}>{formatTime(msg.created_at)}</Text>
            </View>
          )}
        </View>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <LoadingSpinner />
      </View>
    );
  }

  const catMeta = thread ? CATEGORY_META[thread.category] : null;
  const statusMeta = thread ? STATUS_META[thread.status] : null;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={onBack} color={theme.colors.textPrimary} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{thread?.subject}</Text>
          {statusMeta && (
            <View style={[styles.headerBadge, { backgroundColor: statusMeta.color + '20', alignSelf: 'center', marginTop: 4 }]}>
              <Text style={[styles.headerBadgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {thread?.messages && thread.messages.length > 0 ? (
          thread.messages.map((msg, idx) => renderMessage(msg, idx))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet. Start the conversation below.</Text>
          </View>
        )}
      </ScrollView>

      {/* Attachment preview bar */}
      {attachments.length > 0 && (
        <View style={styles.previewBar}>
          {attachments.map((att, i) => (
            <View key={i} style={styles.previewThumb}>
              <Image source={{ uri: att.uri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removePreview}
                onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
              >
                <X size={10} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input bar */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <View style={styles.inputBottomRow}>
            <TouchableOpacity style={styles.inputIconBtn} onPress={handleAddAttachment} activeOpacity={0.7}>
              <Paperclip size={20} color={theme.colors.textMuted} strokeWidth={1.5} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={2000}
            />
            {(inputText.trim() || attachments.length > 0) && (
              <TouchableOpacity
                style={[styles.sendBtn, sending && styles.sendBtnDisabled]}
                onPress={handleSend}
                activeOpacity={0.8}
                disabled={sending}
              >
                {sending ? (
                  <LoadingSpinner size="small" color={theme.colors.white} />
                ) : (
                  <SendHorizonal size={18} color={theme.colors.white} strokeWidth={2} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Full image preview modal */}
      <Modal visible={!!previewImage} transparent animationType="fade" onRequestClose={() => setPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 1 }} onPress={() => setPreviewImage(null)}>
            <X size={28} color="#fff" />
          </TouchableOpacity>
          {previewImage && (
            <AttachmentImageFull storagePath={previewImage} token={session?.access_token} />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── Attachment image components ────────────────────────────

function AttachmentImage({ storagePath, token }: { storagePath: string; token?: string }) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    feedbackService.getAttachmentSignedUrl(token, storagePath).then(setUri).catch(() => {});
  }, [storagePath, token]);

  if (!uri) return <View style={{ flex: 1, backgroundColor: '#333' }} />;
  return <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />;
}

function AttachmentImageFull({ storagePath, token }: { storagePath: string; token?: string }) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    feedbackService.getAttachmentSignedUrl(token, storagePath).then(setUri).catch(() => {});
  }, [storagePath, token]);

  if (!uri) return <LoadingSpinner />;
  return <Image source={{ uri }} style={{ width: '90%', height: '70%', borderRadius: Radius.md }} resizeMode="contain" />;
}
