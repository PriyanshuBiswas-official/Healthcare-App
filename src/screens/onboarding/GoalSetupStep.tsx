import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';

interface Props {
  onNext: (data: { primaryGoal: string }) => void;
}

const GoalSetupStep: React.FC<Props> = ({ onNext }) => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    if (selectedGoal) {
      onNext({ primaryGoal: selectedGoal });
    }
  };

  const goals = [
    { id: 'lose_weight', title: 'Lose Weight', emoji: '🔥' },
    { id: 'build_muscle', title: 'Build Muscle', emoji: '💪' },
    { id: 'improve_health', title: 'Improve Overall Health', emoji: '❤️' },
    { id: 'track_cycle', title: 'Track Cycle', emoji: '🌸' },
    { id: 'manage_conditions', title: 'Manage Medical Conditions', emoji: '🩺' },
    { id: 'eat_better', title: 'Eat Better', emoji: '🥗' },
    { id: 'improve_sleep', title: 'Improve Sleep', emoji: '😴' },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Primary Goal</Text>
        <Text style={styles.subtitle}>This becomes the foundation for future AI recommendations.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.goalsContainer} showsVerticalScrollIndicator={false}>
        {goals.map((item) => {
          const isSelected = selectedGoal === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => setSelectedGoal(item.id)}
              style={[
                styles.goalCard,
                isSelected && styles.goalCardSelected
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={[styles.goalTitle, isSelected && styles.goalTitleSelected]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, !selectedGoal && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={!selectedGoal}
        >
          <Text style={styles.primaryButtonText}>Finish Setup</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    lineHeight: 22,
  },
  goalsContainer: {
    gap: 12,
    paddingBottom: 40,
  },
  goalCard: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  goalCardSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  emoji: {
    fontSize: 28,
    marginRight: 16,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E4E4E7',
  },
  goalTitleSelected: {
    color: '#3B82F6',
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 16,
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
  buttonDisabled: {
    backgroundColor: '#27272A',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoalSetupStep;
