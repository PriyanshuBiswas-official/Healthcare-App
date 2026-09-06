import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme/theme';
import { useStyles } from '../providers/ThemeProvider';
import { Play, Pause, Square } from 'lucide-react-native';
import { GlassCardView } from '../components/SharedComponents';
import type { TimerStatus } from '../hooks/useWorkoutTimer';

interface WorkoutTimerProps {
  status: TimerStatus;
  formatted: string;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function WorkoutTimer({ status, formatted, onStart, onPause, onResume, onStop }: WorkoutTimerProps) {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status === 'paused') {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [status, blinkAnim]);

  const styles = useStyles((theme: any) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.base,
      marginBottom: Spacing.base,
      borderWidth: 1,
    },
    timeSection: {
      flex: 1,
    },
    label: {
      fontSize: Typography.xs,
      fontWeight: Typography.semiBold,
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: Typography.lsWide,
      marginBottom: 2,
    },
    time: {
      fontSize: 32,
      fontWeight: Typography.extraBold,
      fontVariant: ['tabular-nums'],
      letterSpacing: 1,
    },
    statusText: {
      fontSize: Typography.xs,
      fontWeight: Typography.medium,
      marginTop: 2,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    controlBtn: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  const timeColor = isIdle ? Colors.textMuted : '#FFFFFF';
  const statusColor = isIdle ? Colors.textMuted : '#FFFFFF';

  const statusLabel = isRunning
    ? 'In Progress'
    : isPaused
      ? 'Paused'
      : 'Ready to start';

  return (
    <GlassCardView style={[styles.container, { borderColor: isRunning ? Colors.teal + '30' : Colors.bgCardBorder }]}>
      <View style={styles.timeSection}>
        <Text style={styles.label}>Session Timer</Text>
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', opacity: isPaused ? blinkAnim : 1 }}>
          <Text style={[styles.time, { color: timeColor }]}>{formatted}</Text>
        </Animated.View>
        <Animated.View style={{ opacity: isPaused ? blinkAnim : 1 }}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </Animated.View>
      </View>

      <View style={styles.controls}>
        {isIdle && (
          <TouchableOpacity onPress={onStart} style={styles.controlBtn} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Play size={34} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        )}

        {isRunning && (
          <TouchableOpacity onPress={onPause} style={styles.controlBtn} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Pause size={34} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        )}

        {isPaused && (
          <TouchableOpacity onPress={onResume} style={styles.controlBtn} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Play size={34} color="#FFFFFF" fill="#FFFFFF" />
          </TouchableOpacity>
        )}

        {(isRunning || isPaused) && (
          <TouchableOpacity onPress={onStop} style={styles.controlBtn} activeOpacity={0.7} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Square size={30} color={Colors.danger} fill={Colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </GlassCardView>
  );
}
