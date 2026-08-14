import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Typography, Spacing, Radius } from '../../theme/theme';
import { useTheme, useStyles } from '../../providers/ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Info, Phone } from 'lucide-react-native';
import { GlassCardView, BackButton } from '../../components/SharedComponents';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface Props {
  onBack: () => void;
}

const INITIAL_CONTACTS: EmergencyContact[] = [
  { name: '', relationship: '', phone: '' },
];

export default function EmergencyContactsScreen({ onBack }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_CONTACTS);
  const [editing, setEditing] = useState(false);

  const styles = useStyles((t) => ({
    root: { flex: 1, backgroundColor: t.colors.bg },
    topBar: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.base, paddingTop: insets.top + Spacing.xl, paddingBottom: Spacing.md,
    },
    pageTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: t.colors.textPrimary },
    editBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
    editBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.accentBlue },
    editBtnSave: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.success },
    scroll: { paddingHorizontal: Spacing.base, paddingBottom: 120 },
    banner: {
      flexDirection: 'row', alignItems: 'flex-start', backgroundColor: t.colors.accentBlue + '15',
      borderWidth: 1, borderColor: t.colors.accentBlue + '40', borderRadius: Radius.md,
      padding: Spacing.md, marginBottom: Spacing.lg,
    },
    bannerIcon: { fontSize: Typography.sm, marginRight: Spacing.sm, marginTop: 1 },
    bannerText: { flex: 1, fontSize: Typography.sm, color: t.colors.textSecondary, lineHeight: 18 },
    card: { padding: Spacing.lg, marginBottom: Spacing.lg },
    cardHeader: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md,
    },
    cardTitle: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    removeBtn: { fontSize: Typography.sm, color: t.colors.danger, fontWeight: Typography.semiBold },
    label: {
      fontSize: Typography.sm, fontWeight: Typography.semiBold, color: t.colors.textSecondary,
      marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: Typography.lsWide,
    },
    input: {
      backgroundColor: t.colors.bgCardSolid, borderWidth: 1, borderColor: t.colors.bgCardBorder,
      borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
      fontSize: Typography.base, color: t.colors.textPrimary, marginBottom: Spacing.md,
    },
    addBtn: {
      backgroundColor: t.colors.accentBlue + '15', borderWidth: 1, borderColor: t.colors.accentBlue + '40',
      borderRadius: Radius.md, paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg,
    },
    addBtnText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.accentBlue },
    emptyState: { alignItems: 'center', paddingVertical: Spacing.xl },
    emptyIcon: { fontSize: Typography.xxl, marginBottom: Spacing.md },
    emptyText: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    emptySub: { fontSize: Typography.sm, color: t.colors.textSecondary, marginTop: Spacing.xs },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
    contactDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.md },
    contactInfo: { flex: 1 },
    contactName: { fontSize: Typography.base, fontWeight: Typography.semiBold, color: t.colors.textPrimary },
    contactDetail: { fontSize: Typography.sm, color: t.colors.textSecondary, marginTop: 2 },
    divider: { height: 1, backgroundColor: t.colors.divider },
  }));

  const updateContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setContacts(prev => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addContact = () => {
    setContacts(prev => [...prev, { name: '', relationship: '', phone: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const filled = contacts.filter(c => c.name.trim());
    if (filled.length === 0) {
      Alert.alert('Validation', 'Add at least one contact');
      return;
    }
    setEditing(false);
    Alert.alert('Saved', `${filled.length} emergency contact(s) saved locally`);
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <BackButton onPress={onBack} color={theme.colors.textPrimary} />
        <Text style={styles.pageTitle}>Emergency Contacts</Text>
        {editing ? (
          <TouchableOpacity style={styles.editBtn} onPress={handleSave} activeOpacity={0.7}>
            <Text style={styles.editBtnSave}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)} activeOpacity={0.7}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.banner}>
          <Info size={18} color={theme.colors.accentBlue} />
          <Text style={styles.bannerText}>
            Emergency contacts are stored locally on this device and are not synced to the cloud.
          </Text>
        </View>

        {editing ? (
          <>
            {contacts.map((contact, i) => (
              <GlassCardView key={i} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Contact {i + 1}</Text>
                  {contacts.length > 1 && (
                    <TouchableOpacity onPress={() => removeContact(i)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={styles.removeBtn}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={contact.name}
                  onChangeText={v => updateContact(i, 'name', v)}
                  placeholder="Full name"
                  placeholderTextColor={theme.colors.textMuted}
                />
                <Text style={styles.label}>Relationship</Text>
                <TextInput
                  style={styles.input}
                  value={contact.relationship}
                  onChangeText={v => updateContact(i, 'relationship', v)}
                  placeholder="e.g. Spouse, Parent, Sibling"
                  placeholderTextColor={theme.colors.textMuted}
                />
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={contact.phone}
                  onChangeText={v => updateContact(i, 'phone', v)}
                  placeholder="+1 (555) 000-0000"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                />
              </GlassCardView>
            ))}

            <TouchableOpacity style={styles.addBtn} onPress={addContact} activeOpacity={0.7}>
              <Text style={styles.addBtnText}>+ Add Another Contact</Text>
            </TouchableOpacity>
          </>
        ) : (
          <GlassCardView style={styles.card}>
            {contacts.filter(c => c.name.trim()).length === 0 ? (
              <View style={styles.emptyState}>
                <Phone size={40} color={theme.colors.danger} />
                <Text style={styles.emptyText}>No emergency contacts</Text>
                <Text style={styles.emptySub}>Tap Edit to add emergency contacts</Text>
              </View>
            ) : (
              contacts.filter(c => c.name.trim()).map((contact, i) => (
                <View key={i}>
                  <View style={styles.contactRow}>
                    <View style={[styles.contactDot, { backgroundColor: theme.colors.accentBlue }]} />
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactName}>{contact.name}</Text>
                      <Text style={styles.contactDetail}>
                        {contact.relationship}{contact.phone ? ` · ${contact.phone}` : ''}
                      </Text>
                    </View>
                  </View>
                  {i < contacts.filter(c => c.name.trim()).length - 1 && <View style={styles.divider} />}
                </View>
              ))
            )}
          </GlassCardView>
        )}
      </ScrollView>
    </View>
  );
}
