import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  onNext: () => void;
}

const PermissionsStep: React.FC<Props> = ({ onNext }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [permissions, setPermissions] = useState({
    notifications: false,
    camera: false,
    health: false,
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions({ ...permissions, [key]: true });
  };

  const cards = [
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Receive medication reminders, appointment alerts, and AI recommendations.',
      icon: 'notifications',
      color: '#F59E0B',
    },
    {
      id: 'camera',
      title: 'Camera',
      description: 'Scan meals, prescriptions, lab reports, and medical documents.',
      icon: 'camera',
      color: '#EC4899',
    },
    {
      id: 'health',
      title: 'Health Data',
      description: 'Track workouts, activity, sleep, and health metrics.',
      icon: 'pulse',
      color: '#EF4444',
    },
  ];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Unlock Smart Features</Text>
        <Text style={styles.subtitle}>Allow permissions to get the most out of your AI companion.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.cardsContainer} showsVerticalScrollIndicator={false}>
        {cards.map((item) => {
          const isAllowed = permissions[item.id as keyof typeof permissions];
          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Icon name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
              </View>
              
              <View style={styles.cardActions}>
                {isAllowed ? (
                  <View style={styles.allowedBadge}>
                    <Icon name="checkmark" size={16} color="#10B981" />
                    <Text style={styles.allowedText}>Allowed</Text>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.laterButton}>
                      <Text style={styles.laterButtonText}>Later</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.allowButton}
                      onPress={() => togglePermission(item.id as keyof typeof permissions)}
                    >
                      <Text style={styles.allowButtonText}>Allow</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

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
  cardsContainer: {
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#18181B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#27272A',
    paddingTop: 16,
  },
  laterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  laterButtonText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '500',
  },
  allowButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  allowedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  allowedText: {
    color: '#10B981',
    fontSize: 15,
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
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PermissionsStep;
