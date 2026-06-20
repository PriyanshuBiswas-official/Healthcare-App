import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

interface Props {
  onNext: (data: { age: string; gender: string; height: string; weight: string }) => void;
}

const BasicProfileStep: React.FC<Props> = ({ onNext }) => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    onNext({ age, gender, height, weight });
  };

  const isComplete = age.trim() !== '' && gender !== '' && height.trim() !== '' && weight.trim() !== '';

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Let's personalize your experience</Text>
            <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 28"
                placeholderTextColor="#52525B"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.row}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderButton, gender === g && styles.genderButtonSelected]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 175"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  value={height}
                  onChangeText={setHeight}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 70"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.primaryButton, !isComplete && styles.buttonDisabled]} 
            onPress={handleNext}
            disabled={!isComplete}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090B',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E4E4E7',
  },
  input: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    color: '#FFFFFF',
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: 'row',
  },
  genderButton: {
    flex: 1,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  genderButtonSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  genderText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
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

export default BasicProfileStep;
