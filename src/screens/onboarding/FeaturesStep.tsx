import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  onNext: () => void;
}

const FeaturesStep: React.FC<Props> = ({ onNext }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const features = [
    {
      id: 1,
      title: 'Health Tracking',
      description: 'Track cycles, symptoms, medications, and medical records.',
      icon: 'heart',
      color: '#EF4444',
    },
    {
      id: 2,
      title: 'Nutrition & Fitness',
      description: 'Log meals, calories, hydration, workouts, and activity.',
      icon: 'fitness',
      color: '#10B981',
    },
    {
      id: 3,
      title: 'AI Health Assistant',
      description: 'Analyze reports, answer health questions, and generate personalized insights.',
      icon: 'sparkles',
      color: '#3B82F6',
    },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Everything About Your Health, Connected</Text>
      </View>

      <View style={styles.cardsContainer}>
        {features.map((item, index) => (
          <View key={item.id} style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
              <Icon name={item.icon} size={28} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  cardsContainer: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 20,
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
});

export default FeaturesStep;
