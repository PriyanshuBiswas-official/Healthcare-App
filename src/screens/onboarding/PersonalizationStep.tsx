import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';

interface Props {
  onNext: (data: { goals: string[] }) => void;
  initialData?: string[];
}

const PersonalizationStep: React.FC<Props> = ({ onNext, initialData = [] }) => {
  const [selected, setSelected] = useState<string[]>(initialData);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const options = [
    "Women's Health",
    "Men's Health",
    "Weight Loss",
    "Muscle Building",
    "Nutrition",
    "Fitness",
    "Better Sleep",
    "Medication Management",
    "General Wellness",
    "Stress Relief"
  ];

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      setSelected(selected.filter((item) => item !== opt));
    } else {
      setSelected([...selected, opt]);
    }
  };

  const handleNext = () => {
    onNext({ goals: selected });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>What would you like help with?</Text>
        <Text style={styles.subtitle}>Select all that apply.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.chipsContainer} showsVerticalScrollIndicator={false}>
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              activeOpacity={0.7}
              onPress={() => toggleOption(opt)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected
              ]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.primaryButton, selected.length === 0 && styles.buttonDisabled]} 
          onPress={handleNext}
          disabled={selected.length === 0}
        >
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
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 40,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  chipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  },
  chipText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
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

export default PersonalizationStep;
