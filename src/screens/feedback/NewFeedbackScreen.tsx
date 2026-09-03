import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, X, Send, Bug, Lightbulb, HelpCircle, MessagesSquare } from 'lucide-react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { GlassCardView, BackButton, LoadingSpinner } from '../../components/SharedComponents';
import * as feedbackService from '../../services/feedbackService';
import type { FeedbackCategory } from '../../types/feedback';
import { CATEGORY_META } from '../../types/feedback';

const CATEGORIES: { key: FeedbackCategory; icon: React.ReactNode }[] = [
  { key: 'bug', icon: <Bug size={18} color="#EF4444" /> },
  { key: 'feature', icon: <Lightbulb size={18} color="#8B5CF6" /> },
  { key: 'question', icon: <HelpCircle size={18} color="#3B82F6" /> },
  { key: 'other', icon: <MessagesSquare size={18} color="#6B7280" /> },
];

type Attachment = { uri: string; type: string; name: string };

export default function NewFeedbackScreen({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: () => void;
}) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary },
    section: { marginBottom: Spacing.lg },
    label: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: t.colors.textSecondary, marginBottom: Spacing.sm },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 1.5 },
    categoryLabel: { fontSize: Typography.sm, fontWeight: Typography.semiBold, marginLeft: 6 },
    input: { backgroundColor: t.colors.bgCard, borderWidth: 1, borderColor: t.colors.bgCardBorder, borderRadius: Radius.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2, fontSize: Typography.base, color: t.colors.textPrimary, minHeight: 44 },
    textArea: { minHeight: 120, textAlignVertical: 'top', paddingTop: Spacing.sm },
    attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
    attachmentThumb: { width: 80, height: 80, borderRadius: Radius.sm, overflow: 'hidden', position: 'relative' as const },
    attachmentImage: { width: 80, height: 80 },
    removeAtt: { position: 'absolute', top: 2, right: 2, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center' as const, justifyContent: 'center' as const },
    addAttBtn: { width: 80, height: 80, borderRadius: Radius.sm, borderWidth: 1.5, borderColor: t.colors.teal + '50', borderStyle: 'dashed' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: t.colors.teal + '08' },
    addAttText: { fontSize: Typography.xs, color: t.colors.teal, marginTop: 4 },
    submitBtn: { backgroundColor: t.colors.teal, borderRadius: Radius.md, paddingVertical: Spacing.sm + 4, alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'center' as const },
    submitText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold },
    submitDisabled: { opacity: 0.5 },
  }));

  const canSubmit = category && subject.trim() && message.trim() && !saving;

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

  const handleSubmit = async () => {
    if (!session?.access_token || !category || !subject.trim() || !message.trim()) return;
    setSaving(true);
    try {
      let uploadedAttachments: { storage_path: string; file_type: string; file_size?: number }[] | undefined;

      if (attachments.length > 0) {
        uploadedAttachments = await feedbackService.uploadAttachments(session.access_token, attachments);
      }

      await feedbackService.createThread(session.access_token, {
        category,
        subject: subject.trim(),
        message: message.trim(),
        attachments: uploadedAttachments,
      });

      Alert.alert('Submitted', 'Your feedback has been submitted. We\'ll get back to you soon!', [
        { text: 'OK', onPress: onCreated },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <BackButton onPress={onBack} color={theme.colors.textPrimary} />
          <Text style={styles.title}>New Feedback</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((c) => {
              const meta = CATEGORY_META[c.key];
              const selected = category === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  onPress={() => setCategory(c.key)}
                  activeOpacity={0.7}
                  style={[styles.categoryChip, { borderColor: selected ? meta.color : theme.colors.bgCardBorder, backgroundColor: selected ? meta.color + '15' : theme.colors.bgCard }]}
                >
                  {c.icon}
                  <Text style={[styles.categoryLabel, { color: selected ? meta.color : theme.colors.textSecondary }]}>{meta.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief summary of your feedback"
            placeholderTextColor={theme.colors.textMuted}
            maxLength={100}
          />
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Tell us more about your experience, issue, or idea..."
            placeholderTextColor={theme.colors.textMuted}
            multiline
            maxLength={2000}
          />
          <Text style={{ fontSize: Typography.xs, color: theme.colors.textMuted, textAlign: 'right', marginTop: 4 }}>
            {message.length}/2000
          </Text>
        </View>

        {/* Attachments */}
        <View style={styles.section}>
          <Text style={styles.label}>Screenshots (optional)</Text>
          <View style={styles.attachmentsRow}>
            {attachments.map((att, i) => (
              <View key={i} style={styles.attachmentThumb}>
                <Image source={{ uri: att.uri }} style={styles.attachmentImage} />
                <TouchableOpacity
                  style={styles.removeAtt}
                  onPress={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {attachments.length < 4 && (
              <TouchableOpacity style={styles.addAttBtn} onPress={handleAddAttachment} activeOpacity={0.7}>
                <Camera size={24} color={theme.colors.teal} />
                <Text style={styles.addAttText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitDisabled]}
          onPress={handleSubmit}
          activeOpacity={0.8}
          disabled={!canSubmit}
        >
          {saving ? (
            <LoadingSpinner size="small" color="#fff" />
          ) : (
            <>
              <Send size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
