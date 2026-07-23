import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, ShieldAlert } from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { GlassCardView } from '../../components/SharedComponents';
import * as relationshipApi from '../../services/relationshipApi';

interface PermissionsModalProps {
  visible: boolean;
  relationshipId: number;
  token: string;
  partnerName: string;
  onClose: () => void;
}

export default function PermissionsModal({
  visible,
  relationshipId,
  token,
  partnerName,
  onClose,
}: PermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [permissions, setPermissions] = useState<Partial<relationshipApi.RelationshipPermissions>>({
    health_score: false,
    vitals: false,
    activity: false,
    workouts: false,
    nutrition: false,
    sleep: false,
    medications: false,
    appointments: false,
  });

  useEffect(() => {
    if (visible && relationshipId) {
      loadPermissions();
    }
  }, [visible, relationshipId]);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await relationshipApi.getPermissions(token, relationshipId);
      setPermissions(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load permissions');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof relationshipApi.RelationshipPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { permission_id, relationship_id, updated_at, ...payload } = permissions as any;
      await relationshipApi.updatePermissions(token, relationshipId, payload);
      Alert.alert('Success', 'Sharing permissions updated successfully');
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const permissionItems = [
    { key: 'health_score', label: 'Overall Health Score', desc: 'Allows sharing your rolling 7-day health score' },
    { key: 'vitals', label: 'Vitals Data', desc: 'Shares heart rate, blood pressure, oxygen levels, temperature' },
    { key: 'activity', label: 'Activity Logs', desc: 'Shares daily steps, active minutes, calories burned progress' },
    { key: 'workouts', label: 'Workout History', desc: 'Allows viewing of your logged exercises & workouts' },
    { key: 'nutrition', label: 'Nutrition & Diet', desc: 'Shares daily calorie intake, water levels' },
    { key: 'sleep', label: 'Sleep Tracking', desc: 'Shares sleep duration, cycles, and quality score' },
    { key: 'medications', label: 'Medications', desc: 'Shares active medication logs and schedules' },
    { key: 'appointments', label: 'Appointments', desc: 'Allows viewing of your upcoming doctor appointments' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <GlassCardView style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Text style={styles.title}>Sharing Permissions</Text>
              <Text style={styles.subtitle}>Control what {partnerName} can see</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={Colors.teal} />
              <Text style={styles.loadingText}>Fetching current sharing permissions...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              {/* Info Disclaimer */}
              <View style={styles.infoBox}>
                <ShieldAlert size={16} color={Colors.teal} style={{ marginRight: Spacing.sm }} />
                <Text style={styles.infoText}>
                  Your data remains secure. Only checked categories will be shared. You can revoke access at any time.
                </Text>
              </View>

              {/* Toggles */}
              <View style={styles.list}>
                {permissionItems.map((item) => {
                  const val = !!(permissions as any)[item.key];
                  return (
                    <View key={item.key} style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={styles.rowLabel}>{item.label}</Text>
                        <Text style={styles.rowDesc} numberOfLines={1}>{item.desc}</Text>
                      </View>
                      <Switch
                        value={val}
                        onValueChange={() => handleToggle(item.key as any)}
                        trackColor={{ false: Colors.chipBg, true: Colors.teal + '80' }}
                        thumbColor={val ? Colors.teal : Colors.textMuted}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Footer Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Permissions</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </GlassCardView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    height: '80%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.base,
    borderWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: Spacing.base,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.teal + '10',
    borderColor: Colors.teal + '30',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.base,
    alignItems: 'center',
  },
  infoText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 14,
  },
  list: {
    flex: 1,
    gap: Spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder + '30',
    paddingBottom: Spacing.sm,
  },
  rowText: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  rowLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.semiBold,
    color: Colors.textPrimary,
  },
  rowDesc: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: Colors.teal,
    borderRadius: Radius.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.base,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
});
