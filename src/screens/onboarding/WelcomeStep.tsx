import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

const WelcomeStep: React.FC<Props> = ({ onNext, onSkip }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Animated.View style={[styles.glowCircle, { transform: [{ translateY: floatAnim }] }]}>
             <Icon name="sparkles" size={60} color="#3B82F6" />
          </Animated.View>
          {/* Floating Icons */}
          <Animated.View style={[styles.floatingIcon, styles.iconLeft, { transform: [{ translateY: floatAnim }] }]}>
            <Icon name="heart" size={24} color="#EF4444" />
          </Animated.View>
          <Animated.View style={[styles.floatingIcon, styles.iconRight, { transform: [{ translateY: floatAnim }] }]}>
            <Icon name="fitness" size={24} color="#10B981" />
          </Animated.View>
          <Animated.View style={[styles.floatingIcon, styles.iconBottom, { transform: [{ translateY: floatAnim }] }]}>
            <Icon name="document-text" size={24} color="#8B5CF6" />
          </Animated.View>
        </View>

        <Text style={styles.title}>Your AI Health Companion</Text>
        <Text style={styles.subtitle}>
          Track your health, fitness, nutrition, medications, and appointments in one intelligent platform.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onSkip}>
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  glowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  floatingIcon: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#18181B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  iconLeft: {
    left: -10,
    top: 40,
  },
  iconRight: {
    right: -10,
    top: 20,
  },
  iconBottom: {
    bottom: 20,
    right: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#A1A1AA',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WelcomeStep;
