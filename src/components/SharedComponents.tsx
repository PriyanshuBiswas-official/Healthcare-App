import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, Radius, Spacing, Typography, GlassCard, Shadows } from '../theme/theme';

// ─── Glass Card ─────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: object;
  accentColor?: string;
}

export const GlassCardView: React.FC<GlassCardProps> = ({
  children,
  style,
  accentColor,
}) => (
  <View
    style={[
      GlassCard,
      accentColor && { borderColor: accentColor + '40' },
      style,
    ]}>
    {children}
  </View>
);

// ─── Section Header ──────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  onAction,
}) => (
  <View style={sharedStyles.sectionHeader}>
    <View>
      <Text style={sharedStyles.sectionTitle}>{title}</Text>
      {subtitle && (
        <Text style={sharedStyles.sectionSubtitle}>{subtitle}</Text>
      )}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={sharedStyles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─── Stat Pill ───────────────────────────────────────────────────────────────
interface StatPillProps {
  label: string;
  value: string;
  color: string;
}

export const StatPill: React.FC<StatPillProps> = ({ label, value, color }) => (
  <View style={[sharedStyles.statPill, { borderColor: color + '50', backgroundColor: color + '18' }]}>
    <Text style={[sharedStyles.statValue, { color }]}>{value}</Text>
    <Text style={sharedStyles.statLabel}>{label}</Text>
  </View>
);

// ─── Progress Bar ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  progress: number; // 0–1
  color: string;
  height?: number;
  style?: object;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color,
  height = 6,
  style,
}) => (
  <View style={[sharedStyles.progressTrack, { height }, style]}>
    <View
      style={[
        sharedStyles.progressFill,
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

export const CircularRing: React.FC<RingProps> = ({
  size,
  strokeWidth,
  progress,
  color,
  label,
  value,
  unit,
}) => {
  const clampedProgress = Math.max(0, Math.min(progress, 1));

  return (
    <View style={[ringStyles.container, { width: size, height: size }]}>
      {/* SVG-like ring using border trick */}
      <View
        style={[
          ringStyles.track,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color + '25',
          },
        ]}
      />
      <View style={ringStyles.center}>
        <Text style={[ringStyles.value, { color }]}>{value}</Text>
        {unit && <Text style={[ringStyles.unit, { color: color + 'BB' }]}>{unit}</Text>}
        <Text style={ringStyles.label}>{label}</Text>
      </View>
      {/* Progress arc indicator dot */}
      <View style={[
        ringStyles.glowDot,
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
};

// ─── Chip / Tag ──────────────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
  icon?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected,
  color = Colors.teal,
  onPress,
  icon,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      chipStyles.chip,
      selected && { backgroundColor: color + '28', borderColor: color },
      !selected && { borderColor: Colors.bgCardBorder },
    ]}>
    {icon && <Text style={chipStyles.icon}>{icon}</Text>}
    <Text style={[chipStyles.label, selected && { color }]}>{label}</Text>
  </TouchableOpacity>
);

// ─── Primary Button ──────────────────────────────────────────────────────────
interface PrimaryButtonProps extends TouchableOpacityProps {
  label: string;
  color?: string;
  icon?: string;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  color = Colors.teal,
  icon,
  style,
  ...rest
}) => (
  <TouchableOpacity
    style={[btnStyles.btn, { backgroundColor: color }, Shadows.teal, style as any]}
    activeOpacity={0.8}
    {...rest}>
    {icon && <Text style={btnStyles.icon}>{icon}</Text>}
    <Text style={btnStyles.label}>{label}</Text>
  </TouchableOpacity>
);

// ─── Shared Styles ───────────────────────────────────────────────────────────
const sharedStyles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: Typography.sm,
    color: Colors.teal,
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
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    backgroundColor: Colors.bgCardBorder,
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

const ringStyles = StyleSheet.create({
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
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
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

const chipStyles = StyleSheet.create({
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
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  icon: {
    fontSize: 13,
    marginRight: 4,
  },
});

const btnStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
  },
  icon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.bg,
    letterSpacing: 0.3,
  },
});
