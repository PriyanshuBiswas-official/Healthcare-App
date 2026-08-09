import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { ArrowLeft, Check, Crown, Sparkles, Zap, Shield } from 'lucide-react-native';
import { GlassCardView } from '../../components/SharedComponents';

interface Props {
  onBack: () => void;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: <Shield size={24} color="#6B7280" />,
    color: '#6B7280',
    features: [
      'Basic health tracking',
      'Limited AI chat (5 messages/day)',
      '1 user profile',
      'Basic reminders',
    ],
    current: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    icon: <Zap size={24} color="#F59E0B" />,
    color: '#F59E0B',
    features: [
      'Unlimited AI chat',
      'OCR scan & meal analysis',
      'Unlimited profiles',
      'Advanced health insights',
      'Priority support',
      'No ads',
    ],
    current: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$19.99',
    period: '/month',
    icon: <Crown size={24} color="#8B5CF6" />,
    color: '#8B5CF6',
    features: [
      'Everything in Pro',
      'Up to 5 family members',
      'Shared health dashboard',
      'Family medication reminders',
      'Pediatric growth tracking',
      'Dedicated support',
    ],
    current: false,
  },
];

export default function ManageSubscriptionsScreen({ onBack }: Props) {
  const { theme } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: Spacing.xl, paddingBottom: Spacing.md,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: Radius.md, backgroundColor: t.colors.bgCard,
      borderWidth: 1, borderColor: t.colors.bgCardBorder, alignItems: 'center', justifyContent: 'center',
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    headerCard: {
      padding: Spacing.lg, marginBottom: Spacing.lg, alignItems: 'center',
    },
    headerIcon: { marginBottom: Spacing.md },
    headerTitle: { fontSize: Typography.xl, fontWeight: Typography.bold, color: t.colors.textPrimary, marginBottom: Spacing.xs },
    headerSub: { fontSize: Typography.base, color: t.colors.textSecondary, textAlign: 'center' },
    planCard: {
      padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 2, borderColor: 'transparent',
    },
    planCardSelected: {
      borderColor: t.colors.teal,
    },
    planCardCurrent: {
      borderColor: t.colors.teal + '40',
      opacity: 0.6,
    },
    planHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md,
    },
    planNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    planName: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    currentBadge: {
      paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full,
      backgroundColor: t.colors.teal + '20',
    },
    currentBadgeText: { fontSize: Typography.xs, fontWeight: Typography.semiBold, color: t.colors.teal },
    planPrice: { flexDirection: 'row', alignItems: 'baseline', marginBottom: Spacing.lg },
    priceValue: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: t.colors.textPrimary },
    pricePeriod: { fontSize: Typography.base, color: t.colors.textSecondary, marginLeft: 4 },
    featureRow: {
      flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm,
    },
    featureCheck: { width: 18 },
    featureText: { fontSize: Typography.base, color: t.colors.textPrimary, flex: 1 },
    selectBtn: {
      marginTop: Spacing.md, paddingVertical: Spacing.md, borderRadius: Radius.lg,
      backgroundColor: t.colors.teal, alignItems: 'center',
    },
    selectBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: '#FFFFFF' },
    selectBtnCurrent: {
      backgroundColor: t.colors.bgCard,
    },
    selectBtnCurrentText: { color: t.colors.textSecondary },
    restoreLink: { alignItems: 'center', marginTop: Spacing.lg },
    restoreText: { fontSize: Typography.base, color: t.colors.teal, fontWeight: Typography.semiBold },
    legalText: {
      fontSize: Typography.sm, color: t.colors.textSecondary, textAlign: 'center',
      marginTop: Spacing.lg, lineHeight: 20,
    },
  }));

  const handleSelectPlan = (planId: string) => {
    const plan = PLANS.find(p => p.id === planId);
    if (plan?.current) return;

    setSelectedPlan(planId);
    Alert.alert(
      'Coming Soon',
      'Subscription management will be available in a future update. This is a preview of the available plans.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCardView style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Sparkles size={40} color={theme.colors.teal} />
          </View>
          <Text style={styles.headerTitle}>Upgrade Your Plan</Text>
          <Text style={styles.headerSub}>
            Unlock premium features for a healthier lifestyle
          </Text>
        </GlassCardView>

        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            activeOpacity={plan.current ? 1 : 0.7}
            onPress={() => handleSelectPlan(plan.id)}
          >
            <GlassCardView
              style={[
                styles.planCard,
                selectedPlan === plan.id && styles.planCardSelected,
                plan.current && styles.planCardCurrent,
              ]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planNameRow}>
                  {plan.icon}
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>
                {plan.current && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>

              <View style={styles.planPrice}>
                <Text style={styles.priceValue}>{plan.price}</Text>
                <Text style={styles.pricePeriod}>{plan.period}</Text>
              </View>

              {plan.features.map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Check size={16} color={plan.current ? theme.colors.textSecondary : theme.colors.teal} style={styles.featureCheck} />
                  <Text style={[styles.featureText, plan.current && { color: theme.colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.selectBtn, plan.current && styles.selectBtnCurrent]}
                activeOpacity={plan.current ? 1 : 0.7}
                onPress={() => handleSelectPlan(plan.id)}
                disabled={plan.current}
              >
                <Text style={[styles.selectBtnText, plan.current && styles.selectBtnCurrentText]}>
                  {plan.current ? 'Current Plan' : 'Select Plan'}
                </Text>
              </TouchableOpacity>
            </GlassCardView>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.restoreLink} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage your subscription in your account settings.
        </Text>
      </ScrollView>
    </View>
  );
}
