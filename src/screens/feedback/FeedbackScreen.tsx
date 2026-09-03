import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare, Plus, Bug, Lightbulb, HelpCircle, MessagesSquare } from 'lucide-react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useAuth } from '../../providers/AuthProvider';
import { GlassCardView, SectionHeader, BackButton, LoadingSpinner } from '../../components/SharedComponents';
import { useScrollVisibility } from '../../navigation/ScrollVisibilityContext';
import * as feedbackService from '../../services/feedbackService';
import type { FeedbackThread, FeedbackCategory } from '../../types/feedback';
import { CATEGORY_META } from '../../types/feedback';

const CATEGORY_ICONS: Record<FeedbackCategory, React.ReactNode> = {
  bug: <Bug size={16} color="#EF4444" />,
  feature: <Lightbulb size={16} color="#8B5CF6" />,
  question: <HelpCircle size={16} color="#3B82F6" />,
  other: <MessagesSquare size={16} color="#6B7280" />,
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function FeedbackScreen({
  onBack,
  onNewFeedback,
  onOpenThread,
}: {
  onBack: () => void;
  onNewFeedback: () => void;
  onOpenThread: (threadId: number) => void;
}) {
  const { theme } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollVisibility();
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    scroll: { paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
    title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary },
    threadCard: { marginBottom: Spacing.sm, padding: Spacing.base },
    threadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
    threadLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    categoryBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.sm, marginRight: Spacing.sm },
    categoryText: { fontSize: Typography.xs, fontWeight: Typography.semiBold, marginLeft: 4 },
    openLabel: { fontSize: Typography.xs, fontWeight: Typography.semiBold, color: t.colors.textMuted },
    threadSubject: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary, flex: 1 },
    threadTime: { fontSize: Typography.xs, color: t.colors.textMuted, marginTop: Spacing.sm },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
    emptyIcon: { marginBottom: Spacing.base },
    emptyTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: t.colors.textPrimary, marginBottom: Spacing.xs },
    emptySub: { fontSize: Typography.sm, color: t.colors.textSecondary, textAlign: 'center' },
    fab: { position: 'absolute', bottom: Spacing.xl, right: Spacing.base, width: 56, height: 56, borderRadius: 28, backgroundColor: t.colors.teal, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  }));

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const data = await feedbackService.getThreads(session.access_token);
      setThreads(data);
    } catch (e) {
      console.error('[FeedbackScreen] fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.access_token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <View style={styles.root}>
        <LoadingSpinner />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.teal} />}
      >
        <View style={styles.header}>
          <BackButton onPress={onBack} color={theme.colors.textPrimary} />
          <Text style={styles.title}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        {threads.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MessageSquare size={48} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No feedback yet</Text>
            <Text style={styles.emptySub}>Have a question, bug report, or feature request? Tap the button below to get started.</Text>
          </View>
        ) : (
          threads.map((thread) => {
            const catMeta = CATEGORY_META[thread.category];
            return (
              <TouchableOpacity
                key={thread.feedback_thread_id}
                onPress={() => onOpenThread(thread.feedback_thread_id)}
                activeOpacity={0.7}
              >
                <GlassCardView style={styles.threadCard}>
                  <View style={styles.threadHeader}>
                    <View style={styles.threadLeft}>
                      <View style={[styles.categoryBadge, { backgroundColor: catMeta.color + '20' }]}>
                        {CATEGORY_ICONS[thread.category]}
                        <Text style={[styles.categoryText, { color: catMeta.color }]}>{catMeta.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.openLabel}>Open</Text>
                  </View>
                  <Text style={styles.threadSubject} numberOfLines={1}>{thread.subject}</Text>
                  <Text style={styles.threadTime}>{formatDate(thread.updated_at)}</Text>
                </GlassCardView>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={onNewFeedback} activeOpacity={0.8}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
