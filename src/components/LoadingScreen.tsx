import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Typography } from '../theme/theme';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH * 0.55;
const QUOTE_INTERVAL = 2400;

const QUOTES = [
  '"Health is wealth."',
  '"A healthy outside starts from the inside."',
  '"Take care of your body. It\'s the only place you have to live."',
  '"The greatest wealth is health."',
  '"Your body hears everything your mind says."',
  '"Small steps every day lead to big results."',
  '"Wellness is the complete integration of body, mind, and spirit."',
  '"An ounce of prevention is worth a pound of cure."',
];

const LoadingScreen: React.FC = () => {
  const { loadProgress } = useAuth();
  const { theme } = useTheme();
  const c = theme.colors;

  const [quoteIndex, setQuoteIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quoteFade = useRef(new Animated.Value(1)).current;
  const barScale = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-0.3)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerX, { toValue: 1.1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -0.3, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(quoteFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        Animated.timing(quoteFade, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }).start();
      });
    }, QUOTE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Animated.timing(barScale, {
      toValue: loadProgress / 100,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [loadProgress]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Background */}
      <View style={[styles.gradient, { backgroundColor: c.bg }]} />

      <View style={styles.content}>
        <Animated.View style={[styles.quoteContainer, { opacity: quoteFade }]}>
          <Text style={[styles.quote, { color: c.textPrimary }]}>{QUOTES[quoteIndex]}</Text>
        </Animated.View>

        <View style={styles.barArea}>
          <View style={[styles.barTrack, { backgroundColor: c.bgCardBorder }]}>
            <Animated.View
              style={[
                styles.barFill,
                {
                  backgroundColor: c.blue,
                  transform: [{ scaleX: barScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.shimmer,
                { backgroundColor: 'rgba(255,255,255,0.25)', transform: [{ translateX: shimmerX }] },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.tagline, { color: c.textSecondary }]}>Loading your health journey...</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFill,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  quoteContainer: {
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 56,
    paddingHorizontal: 24,
  },
  quote: {
    fontSize: Typography.xl,
    fontWeight: Typography.semiBold,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 32,
    letterSpacing: Typography.lsNormal,
  },
  barArea: {
    width: BAR_WIDTH,
    height: 60,
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  barTrack: {
    width: BAR_WIDTH,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BAR_WIDTH,
    height: 14,
    borderRadius: 7,
    transformOrigin: 'left',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: BAR_WIDTH * 0.25,
    height: 14,
    borderRadius: 7,
  },
  tagline: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    letterSpacing: Typography.lsWide,
  },
});

export default LoadingScreen;
