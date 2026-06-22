import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

interface Props {
  onNext: (data: { dateOfBirth: string; gender: string; height: string; weight: string }) => void;
  initialData?: { dateOfBirth?: string; gender?: string; height?: string; weight?: string };
}

function isValidDate(d: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return false;
  const [day, month, year] = d.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) return false;
  const now = new Date();
  if (date > now) return false;
  const age = now.getFullYear() - year - (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day) ? 1 : 0);
  return age >= 10 && age <= 120;
}

const BasicProfileStep: React.FC<Props> = ({ onNext, initialData }) => {
  const [dobDay, setDobDay] = useState(initialData?.dateOfBirth?.split('/')[0] ?? '');
  const [dobMonth, setDobMonth] = useState(initialData?.dateOfBirth?.split('/')[1] ?? '');
  const [dobYear, setDobYear] = useState(initialData?.dateOfBirth?.split('/')[2] ?? '');
  const [gender, setGender] = useState(initialData?.gender ?? '');
  const [height, setHeight] = useState(initialData?.height ?? '');
  const [weight, setWeight] = useState(initialData?.weight ?? '');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const dob = `${dobDay}/${dobMonth}/${dobYear}`;
  const dobValid = isValidDate(dob);
  const heightNum = parseFloat(height);
  const weightNum = parseFloat(weight);
  const heightValid = height.length > 0 && !isNaN(heightNum) && heightNum >= 50 && heightNum <= 300;
  const weightValid = weight.length > 0 && !isNaN(weightNum) && weightNum >= 20 && weightNum <= 500;

  const handleNext = () => {
    onNext({ dateOfBirth: dob, gender, height, weight });
  };

  const isComplete = dobValid && gender !== '' && heightValid && weightValid;

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
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="DD"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  maxLength={2}
                  value={dobDay}
                  onChangeText={(t) => setDobDay(t.replace(/[^0-9]/g, ''))}
                />
                <Text style={styles.dobSeparator}>/</Text>
                <TextInput
                  style={[styles.input, styles.dobInput]}
                  placeholder="MM"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  maxLength={2}
                  value={dobMonth}
                  onChangeText={(t) => setDobMonth(t.replace(/[^0-9]/g, ''))}
                />
                <Text style={styles.dobSeparator}>/</Text>
                <TextInput
                  style={[styles.input, styles.dobInput, { flex: 2 }]}
                  placeholder="YYYY"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  maxLength={4}
                  value={dobYear}
                  onChangeText={(t) => setDobYear(t.replace(/[^0-9]/g, ''))}
                />
              </View>
              {dobDay.length + dobMonth.length + dobYear.length > 0 && !dobValid && (
                <Text style={styles.errorText}>Enter a valid date (DD/MM/YYYY)</Text>
              )}
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
                  maxLength={5}
                  value={height}
                  onChangeText={(t) => setHeight(t.replace(/[^0-9.]/g, ''))}
                />
                {height.length > 0 && !heightValid && (
                  <Text style={styles.errorText}>50–300 cm</Text>
                )}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 70"
                  placeholderTextColor="#52525B"
                  keyboardType="numeric"
                  maxLength={5}
                  value={weight}
                  onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ''))}
                />
                {weight.length > 0 && !weightValid && (
                  <Text style={styles.errorText}>20–500 kg</Text>
                )}
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
  dobRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dobInput: {
    flex: 1,
    textAlign: 'center',
  },
  dobSeparator: {
    color: '#52525B',
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 6,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5E5E',
    marginTop: 4,
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
