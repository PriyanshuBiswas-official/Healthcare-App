import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  Image,
  ActivityIndicator,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Bell, ChevronLeft } from 'lucide-react-native';
import { Radius, Spacing, Typography, Shadows } from '../theme/theme';
import { useTheme, useStyles } from '../providers/ThemeProvider';

// ─── Glass Card ─────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: object;
  accentColor?: string;
}

const glassCardStyles = (theme: { colors: { bgCard: string; bgCardBorder: string } }) => ({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.bgCardBorder,
    borderRadius: Radius.lg,
  },
});

export const GlassCardView: React.FC<GlassCardProps> = React.memo(({
  children,
  style,
  accentColor,
}) => {
  const s = useStyles(glassCardStyles);
  return (
    <View
      style={[
        s.card,
        accentColor && { borderColor: accentColor + '40' },
        style,
      ]}>
      {children}
    </View>
  );
});

// ─── Profile Avatar Button ───────────────────────────────────────────────────
export const ProfileAvatarButton: React.FC<{
  onPress?: () => void;
  userName?: string;
  avatarUrl?: string;
}> = React.memo(({ onPress, userName, avatarUrl }) => {
  const styles = useStyles(profileAvatarStyles);
  return (
    <TouchableOpacity style={styles.avatar} onPress={onPress} activeOpacity={0.8}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>
          {(userName || 'A').charAt(0).toUpperCase()}
        </Text>
      )}
    </TouchableOpacity>
  );
});

// ─── Notification Icon Button ────────────────────────────────────────────────
export const NotificationIconButton: React.FC<{ onPress?: () => void; unreadCount?: number; iconColor?: string }> = React.memo(({
  onPress,
  unreadCount = 0,
  iconColor,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(notifIconStyles);
  return (
    <TouchableOpacity style={styles.btn} onPress={onPress} activeOpacity={0.8}>
      <Bell size={30} color={iconColor || theme.colors.text} strokeWidth={2} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Section Header ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(({
  title,
  subtitle,
  action,
  onAction,
}) => {
  const styles = useStyles(sharedStyleCreator);
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        )}
      </View>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={styles.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ─── Stat Pill ───────────────────────────────────────────────────────────────
interface StatPillProps {
  label: string;
  value: string;
  color: string;
}

export const StatPill: React.FC<StatPillProps> = React.memo(({ label, value, color }) => {
  const styles = useStyles(sharedStyleCreator);
  return (
    <View style={[styles.statPill, { borderColor: color + '50', backgroundColor: color + '18' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
});

// ─── Activity Rings & Card ───────────────────────────────────────────────────
export function ActivityRings({ steps, exercise, calories }: { steps: number; exercise: number; calories: number }) {
  const { theme } = useTheme();
  const size = 120;
  const strokeWidth = 10;
  const center = size / 2;

  const drawRing = (radius: number, color: string, percentage: number) => {
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 1) * circumference);
    const dotR = strokeWidth / 2;
    return (
      <G rotation="-90" origin={`${center}, ${center}`}>
        <Circle cx={center} cy={center} r={radius} stroke={color + '33'} strokeWidth={strokeWidth} fill="none" />
        <Circle cx={center} cy={center} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        {percentage <= 0 && <Circle cx={center + radius} cy={center} r={dotR} fill={color} />}
      </G>
    );
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {drawRing(50, theme.colors.pink, steps)}
        {drawRing(36, theme.colors.teal, calories)}
        {drawRing(22, theme.colors.blue, exercise)}
      </Svg>
    </View>
  );
}

export const ActivityProgressCard = React.memo(({
  steps, stepsTarget,
  exercise, exerciseTarget,
  calories, caloriesTarget
}: {
  steps: number; stepsTarget: number;
  exercise: number; exerciseTarget: number;
  calories: number; caloriesTarget: number;
}) => {
  const { theme } = useTheme();
  const styles = useStyles(activityCardStyleCreator);
  const stepsPct = stepsTarget > 0 ? steps / stepsTarget : 0;
  const exercisePct = exerciseTarget > 0 ? exercise / exerciseTarget : 0;
  const caloriesPct = caloriesTarget > 0 ? calories / caloriesTarget : 0;

  return (
    <View style={styles.activityRow}>
      <ActivityRings steps={stepsPct} exercise={exercisePct} calories={caloriesPct} />
      <View style={styles.activityLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.pink }]} />
          <View style={styles.legendTextWrap}>
            <Text style={styles.legendLabel}>Steps</Text>
            <Text style={styles.legendValue}>{steps.toLocaleString()} <Text style={styles.legendTarget}>/ {stepsTarget.toLocaleString()}</Text></Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.blue }]} />
          <View style={styles.legendTextWrap}>
            <Text style={styles.legendLabel}>Active Min</Text>
            <Text style={styles.legendValue}>{exercise.toLocaleString()} <Text style={styles.legendTarget}>/ {exerciseTarget.toLocaleString()}</Text></Text>
          </View>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.teal }]} />
          <View style={styles.legendTextWrap}>
            <Text style={styles.legendLabel}>Calories</Text>
            <Text style={styles.legendValue}>{calories.toLocaleString()} <Text style={styles.legendTarget}>/ {caloriesTarget.toLocaleString()}</Text></Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// ─── Progress Bar ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0–1
  color: string;
  height?: number;
  style?: object;
}

export const ProgressBar: React.FC<ProgressBarProps> = React.memo(({
  progress,
  color,
  height = 6,
  style,
}) => {
  const styles = useStyles(sharedStyleCreator);
  return (
    <View style={[styles.progressTrack, { height }, style]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${Math.min(progress * 100, 100)}%`,
            height,
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
    </View>
  );
});

// ─── Circular Ring ───────────────────────────────────────────────────────────
interface RingProps {
  size: number;
  strokeWidth: number;
  progress: number; // 0–1
  color: string;
  label: string;
  value: string;
  unit?: string;
}

export const CircularRing: React.FC<RingProps> = React.memo(({
  size,
  strokeWidth,
  progress,
  color,
  label,
  value,
  unit,
}) => {
  const styles = useStyles(ringStyleCreator);
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* SVG-like ring using border trick */}
      <View
        style={[
          styles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color + '25',
          },
        ]}
      />
      <View style={styles.center}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit && <Text style={[styles.unit, { color: color + 'BB' }]}>{unit}</Text>}
        <Text style={styles.label}>{label}</Text>
      </View>
      {/* Progress arc indicator dot */}
      <View style={[
        styles.glowDot,
        {
          backgroundColor: color,
          opacity: clampedProgress,
          shadowColor: color,
          top: strokeWidth / 2,
          right: size / 2 - strokeWidth / 2 - 2,
        },
      ]} />
    </View>
  );
});

// ─── Chip / Tag ──────────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
  icon?: string;
}

export const Chip: React.FC<ChipProps> = React.memo(({
  label,
  selected,
  color,
  onPress,
  icon,
}) => {
  const { theme } = useTheme();
  const styles = useStyles(chipStyleCreator);
  const resolvedColor = color || theme.colors.teal;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        selected && { backgroundColor: resolvedColor + '28', borderColor: resolvedColor },
        !selected && { borderColor: theme.colors.bgCardBorder },
      ]}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.label, selected && { color: resolvedColor }]}>{label}</Text>
    </TouchableOpacity>
  );
});

// ─── Primary Button ──────────────────────────────────────────────────────────
interface PrimaryButtonProps extends TouchableOpacityProps {
  label: string;
  color?: string;
  icon?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = React.memo(({
  label,
  color,
  icon,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = useStyles(btnStyleCreator);
  const resolvedColor = color || theme.colors.teal;
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: resolvedColor }, Shadows.teal, style as any]}
      activeOpacity={0.8}
      {...rest}>
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
});

// ─── Style Creators ──────────────────────────────────────────────────────────
const sharedStyleCreator = (theme: any) => StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: theme.colors.textPrimary,
    letterSpacing: Typography.lsWide,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: Typography.sm,
    color: theme.colors.teal,
    fontWeight: Typography.semiBold,
  },
  statPill: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statValue: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    backgroundColor: theme.colors.bgCardBorder,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
});

const ringStyleCreator = (theme: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: Typography.md,
    fontWeight: Typography.extraBold,
  },
  unit: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
    marginTop: -2,
  },
  label: {
    fontSize: Typography.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
    letterSpacing: Typography.lsWide,
    textTransform: 'uppercase',
  },
  glowDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
});

const chipStyleCreator = (theme: any) => StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.sm,
    color: theme.colors.textSecondary,
    fontWeight: Typography.medium,
  },
  icon: {
    fontSize: Typography.sm,
  },
});

const profileAvatarStyles = (theme: any) => StyleSheet.create({
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.teal + '30',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: theme.colors.teal,
  },
});

const notifIconStyles = (theme: any) => StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 1,
    right: -1,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.pink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.bg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: theme.colors.bg,
    lineHeight: 14,
  },
});

const btnStyleCreator = (theme: any) => StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  icon: {
    fontSize: Typography.base,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: theme.colors.bg,
    letterSpacing: Typography.lsWide,
  },
});

const activityCardStyleCreator = (theme: any) => StyleSheet.create({
  activityCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityLegend: {
    flex: 1,
    marginLeft: Spacing.lg,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  legendTextWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendLabel: {
    fontSize: Typography.sm,
    color: theme.colors.textSecondary,
  },
  legendValue: {
    fontSize: Typography.sm,
    color: theme.colors.white,
    fontWeight: Typography.bold,
  },
  legendTarget: {
    color: theme.colors.textMuted,
    fontWeight: 'normal',
  },
});

// ─── Back Button ──────────────────────────────────────────────────────────────
interface BackButtonProps {
  onPress: () => void;
  color?: string;
}

const backBtnStyles = (theme: { colors: { bgCard: string; bgCardBorder: string } }) => ({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.bgCardBorder,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});

export const BackButton: React.FC<BackButtonProps> = React.memo(({ onPress, color }) => {
  const s = useStyles(backBtnStyles);
  return (
    <TouchableOpacity style={s.btn} activeOpacity={0.7} onPress={onPress}>
      <ChevronLeft size={25} color={color} strokeWidth={3} />
    </TouchableOpacity>
  );
});

// ─── Loading Spinner ────────────────────────────────────────────────────────
interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = React.memo(({
  size = 'large',
  color,
  text,
  overlay = false,
}) => {
  const { theme } = useTheme();
  const spinnerColor = color || theme.colors.accentBlue;

  if (overlay) {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
        <View style={{ backgroundColor: theme.colors.bgCardSolid, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', gap: Spacing.md }}>
          <ActivityIndicator size="large" color={spinnerColor} />
          {text && (
            <Text style={{ fontSize: Typography.base, fontWeight: Typography.semiBold, color: theme.colors.textPrimary }}>{text}</Text>
          )}
        </View>
      </View>
    );
  }

  if (text && size === 'small') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs }}>
        <ActivityIndicator size="small" color={spinnerColor} />
        <Text style={{ fontSize: Typography.xs, color: theme.colors.textSecondary, fontStyle: 'italic' }}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xl }}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text && (
        <Text style={{ fontSize: Typography.sm, color: theme.colors.textSecondary, marginTop: Spacing.sm, fontStyle: 'italic' }}>{text}</Text>
      )}
    </View>
  );
});
