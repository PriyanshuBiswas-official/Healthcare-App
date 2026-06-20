import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MainStackParamList = {
  Home: undefined;
  Success: undefined;
};

type SuccessScreenProp = NativeStackNavigationProp<MainStackParamList, 'Success'>;

const SuccessScreen = () => {
  const navigation = useNavigation<SuccessScreenProp>();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });
  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const handleComplete = () => {
    navigation.replace('Home');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Animated.View
            style={[
              styles.glowBackdrop,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }]
              }
            ]}
          />
          <View style={styles.iconCircle}>
            <Icon name="checkmark-done" size={60} color="#10B981" />
          </View>
        </Animated.View>

        <Text style={styles.title}>Your HealthAI Companion is Ready</Text>
        <Text style={styles.subtitle}>
          We've personalized your experience and your AI assistant is ready to help.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
          <Text style={styles.primaryButtonText}>Go To Dashboard</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: 160,
    height: 160,
  },
  glowBackdrop: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 30,
    elevation: 10,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#10B981',
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
});

export default SuccessScreen;
