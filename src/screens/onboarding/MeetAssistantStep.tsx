import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  onNext: () => void;
}

const MeetAssistantStep: React.FC<Props> = ({ onNext }) => {
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

  const capabilities = [
    'Analyze meal photos',
    'Scan prescriptions',
    'Track medications',
    'Monitor cycles',
    'Suggest workouts',
    'Manage appointments',
    'Generate health insights',
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meet Your Personal Health AI</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarGlow}>
            <Icon name="planet" size={64} color="#8B5CF6" />
          </View>
        </View>

        <View style={styles.chatBubble}>
          <Text style={styles.chatText}>
            "Based on your goals, I can help you build healthier habits every day."
          </Text>
        </View>

        <View style={styles.capabilitiesContainer}>
          {capabilities.map((item, index) => (
            <View key={index} style={styles.capabilityRow}>
              <Icon name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.capabilityText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={onNext}>
          <Text style={styles.primaryButtonText}>Enable AI Assistant</Text>
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  chatBubble: {
    backgroundColor: '#18181B',
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#27272A',
    marginBottom: 32,
    width: '100%',
  },
  chatText: {
    color: '#E4E4E7',
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  capabilitiesContainer: {
    width: '100%',
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  capabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  capabilityText: {
    color: '#E4E4E7',
    fontSize: 15,
    marginLeft: 12,
  },
  footer: {
    paddingBottom: 40,
    paddingTop: 16,
  },
  primaryButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#8B5CF6',
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

export default MeetAssistantStep;
