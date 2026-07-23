import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  UserPlus,
  Key,
  Check,
  X,
  UserCheck,
  Shield,
  Trash2,
  Copy,
  Clock,
} from 'lucide-react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme/theme';
import { GlassCardView, SectionHeader } from '../../components/SharedComponents';
import { useAuth } from '../../providers/AuthProvider';
import * as relationshipApi from '../../services/relationshipApi';
import PermissionsModal from './PermissionsModal';

interface RelationshipsScreenProps {
  onBack: () => void;
  onPartnerPress?: (relationshipId: string) => void;
}

export default function RelationshipsScreen({ onBack, onPartnerPress }: RelationshipsScreenProps) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const token = session?.access_token || '';

  const [loading, setLoading] = useState(false);
  const [relationships, setRelationships] = useState<relationshipApi.Relationship[]>([]);
  
  // Invite states
  const [inviteRole, setInviteRole] = useState<'partner' | 'doctor' | 'coach' | 'caregiver'>('partner');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [inviteExpiry, setInviteExpiry] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  // Redeem states
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // Permissions modal states
  const [selectedRelId, setSelectedRelId] = useState<number | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState('');
  const [permissionsVisible, setPermissionsVisible] = useState(false);

  const fetchRelationships = async () => {
    setLoading(true);
    try {
      const data = await relationshipApi.listRelationships(token);
      setRelationships(data);
    } catch (err: any) {
      console.error('[RelationshipsScreen] Error fetching relationships:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRelationships();
    }
  }, [token]);

  const handleGenerateInvite = async () => {
    setGenerating(true);
    try {
      const res = await relationshipApi.createInvite(token, inviteRole);
      setGeneratedCode(res.invite_code);
      setInviteExpiry(
        new Date(res.expires_at).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
      Alert.alert('Success', 'Invite code generated! Share it with your partner.');
      fetchRelationships();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to generate invite code');
    } finally {
      setGenerating(false);
    }
  };

  const handleRedeemInvite = async () => {
    if (!redeemCode.trim()) {
      return Alert.alert('Warning', 'Please enter a valid invite code');
    }
    setRedeeming(true);
    try {
      await relationshipApi.redeemInvite(token, redeemCode.trim());
      Alert.alert('Success', 'Invite redeemed! A pending request has been sent to the partner.');
      setRedeemCode('');
      fetchRelationships();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to redeem invite code');
    } finally {
      setRedeeming(false);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await relationshipApi.acceptRelationship(token, id);
      Alert.alert('Success', 'Relationship request accepted!');
      fetchRelationships();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept request');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await relationshipApi.rejectRelationship(token, id);
      Alert.alert('Success', 'Relationship request rejected');
      fetchRelationships();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reject request');
    }
  };

  const handleRevoke = async (id: number, partnerName: string) => {
    Alert.alert(
      'Revoke Relationship',
      `Are you sure you want to end your relationship with ${partnerName}? Access to shared health reports will be terminated immediately.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await relationshipApi.revokeRelationship(token, id);
              Alert.alert('Success', 'Relationship revoked');
              fetchRelationships();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to revoke relationship');
            }
          },
        },
      ]
    );
  };

  const copyToClipboard = () => {
    Clipboard.setString(generatedCode);
    Alert.alert('Copied', 'Code copied to clipboard');
  };

  const activeConnections = relationships.filter(r => r.status === 'accepted');
  const pendingRequests = relationships.filter(r => r.status === 'pending' && r.role === 'owner'); // Received requests needing action

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Relationships</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* SECTION 1: Pending Incoming Requests */}
        {pendingRequests.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Pending Requests" subtitle="Users requesting to view your health data" />
            {pendingRequests.map(rel => (
              <GlassCardView key={rel.relationship_id} style={styles.relCard}>
                <View style={styles.cardInfoRow}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{rel.partner.avatar}</Text>
                  </View>
                  <View style={styles.metaWrap}>
                    <Text style={styles.partnerName}>{rel.partner.name}</Text>
                    <Text style={styles.partnerRole}>wants to connect as {rel.relationship_type}</Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.acceptBtn]}
                    onPress={() => handleAccept(rel.relationship_id)}
                    activeOpacity={0.8}
                  >
                    <Check size={14} color={Colors.white} style={{ marginRight: 4 }} />
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.smallBtn, styles.rejectBtn]}
                    onPress={() => handleReject(rel.relationship_id)}
                    activeOpacity={0.8}
                  >
                    <X size={14} color={Colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.btnText, { color: Colors.textMuted }]}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </GlassCardView>
            ))}
          </View>
        )}

        {/* SECTION 2: Active Connections */}
        <View style={styles.section}>
          <SectionHeader title="Active Connections" subtitle="Shared profiles & active health reports" />
          {loading ? (
            <ActivityIndicator size="small" color={Colors.teal} style={{ marginVertical: Spacing.md }} />
          ) : activeConnections.length === 0 ? (
            <GlassCardView style={styles.emptyCard}>
              <UserCheck size={32} color={Colors.textMuted} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No active connections</Text>
              <Text style={styles.emptyText}>Generate a code to invite a partner or enter their code below.</Text>
            </GlassCardView>
          ) : (
            activeConnections.map(rel => (
              <GlassCardView key={rel.relationship_id} style={styles.relCard}>
                <View style={styles.cardInfoRow}>
                  <View style={styles.avatarWrap}>
                    <Text style={styles.avatarText}>{rel.partner.avatar}</Text>
                  </View>
                  <View style={styles.metaWrap}>
                    <Text style={styles.partnerName}>{rel.partner.name}</Text>
                    <Text style={styles.partnerRole}>
                      {rel.relationship_type.charAt(0).toUpperCase() + rel.relationship_type.slice(1)} ·{' '}
                      {rel.role === 'owner' ? 'Sharing your data' : 'Viewing health report'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  {rel.role === 'viewer' && onPartnerPress ? (
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.primaryBtn]}
                      onPress={() => onPartnerPress(String(rel.relationship_id))}
                      activeOpacity={0.8}
                    >
                      <UserCheck size={14} color={Colors.white} style={{ marginRight: 4 }} />
                      <Text style={styles.btnText}>View Report</Text>
                    </TouchableOpacity>
                  ) : rel.role === 'owner' ? (
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.secBtn]}
                      onPress={() => {
                        setSelectedRelId(rel.relationship_id);
                        setSelectedPartnerName(rel.partner.name);
                        setPermissionsVisible(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <Shield size={14} color={Colors.teal} style={{ marginRight: 4 }} />
                      <Text style={[styles.btnText, { color: Colors.teal }]}>Permissions</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.smallBtn, styles.rejectBtn]}
                    onPress={() => handleRevoke(rel.relationship_id, rel.partner.name)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color={Colors.pink} style={{ marginRight: 4 }} />
                    <Text style={[styles.btnText, { color: Colors.pink }]}>Revoke</Text>
                  </TouchableOpacity>
                </View>
              </GlassCardView>
            ))
          )}
        </View>

        {/* SECTION 3: Create Invitation Code */}
        <View style={styles.section}>
          <SectionHeader title="Invite Partner" subtitle="Generate a temporary sharing authorization code" />
          <GlassCardView style={styles.inviteCard}>
            <Text style={styles.label}>Select Partner Role</Text>
            <View style={styles.pillRow}>
              {(['partner', 'doctor', 'coach', 'caregiver'] as const).map(role => (
                <TouchableOpacity
                  key={role}
                  style={[styles.pill, inviteRole === role && styles.activePill]}
                  onPress={() => {
                    setInviteRole(role);
                    setGeneratedCode('');
                  }}
                >
                  <Text style={[styles.pillText, inviteRole === role && styles.activePillText]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {generatedCode ? (
              <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Sharing Invite Code</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{generatedCode}</Text>
                  <TouchableOpacity onPress={copyToClipboard} style={styles.copyIconWrap}>
                    <Copy size={16} color={Colors.teal} />
                  </TouchableOpacity>
                </View>
                <View style={styles.expiryRow}>
                  <Clock size={12} color={Colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.expiryText}>Expires at {inviteExpiry}</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerateInvite}
                disabled={generating}
                activeOpacity={0.8}
              >
                {generating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Key size={16} color={Colors.white} style={{ marginRight: 6 }} />
                    <Text style={styles.generateBtnText}>Generate Code</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </GlassCardView>
        </View>

        {/* SECTION 4: Redeem Code */}
        <View style={styles.section}>
          <SectionHeader title="Connect via Code" subtitle="Redeem a code received from another user" />
          <GlassCardView style={styles.redeemCard}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. REL-8FA29BC"
              placeholderTextColor={Colors.textMuted}
              value={redeemCode}
              onChangeText={setRedeemCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.redeemBtn}
              onPress={handleRedeemInvite}
              disabled={redeeming}
              activeOpacity={0.8}
            >
              {redeeming ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <UserPlus size={16} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.redeemBtnText}>Redeem & Request</Text>
                </>
              )}
            </TouchableOpacity>
          </GlassCardView>
        </View>
      </ScrollView>

      {/* Permissions Modal */}
      {selectedRelId !== null && (
        <PermissionsModal
          visible={permissionsVisible}
          relationshipId={selectedRelId}
          token={token}
          partnerName={selectedPartnerName}
          onClose={() => {
            setPermissionsVisible(false);
            setSelectedRelId(null);
            fetchRelationships();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCardBorder + '30',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.chipBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: 60,
  },
  section: {
    marginTop: Spacing.base,
  },
  relCard: {
    padding: Spacing.base,
    borderRadius: Radius.md,
    marginBottom: Spacing.base,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.teal + '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.teal + '55',
  },
  avatarText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.teal,
  },
  metaWrap: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  partnerName: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  partnerRole: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.bgCardBorder + '15',
    paddingTop: Spacing.base,
  },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    height: 36,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: Colors.teal,
  },
  secBtn: {
    backgroundColor: Colors.teal + '20',
    borderWidth: 1,
    borderColor: Colors.teal + '45',
  },
  acceptBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  btnText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 16,
  },
  inviteCard: {
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
  label: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.base,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.chipBg,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
  },
  activePill: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  pillText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
  },
  activePillText: {
    color: Colors.white,
  },
  generateBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.teal,
    borderRadius: Radius.sm,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBtnText: {
    color: Colors.white,
    fontSize: Typography.xs + 1,
    fontWeight: Typography.bold,
  },
  codeContainer: {
    backgroundColor: Colors.chipBg,
    borderColor: Colors.bgCardBorder,
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: Spacing.base,
  },
  codeLabel: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  codeText: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    color: Colors.teal,
    letterSpacing: 1.5,
  },
  copyIconWrap: {
    marginLeft: Spacing.base,
    padding: 4,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  expiryText: {
    fontSize: Typography.xs - 1,
    color: Colors.textMuted,
  },
  redeemCard: {
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
  textInput: {
    backgroundColor: Colors.chipBg,
    borderColor: Colors.bgCardBorder,
    borderWidth: 1,
    borderRadius: Radius.sm,
    height: 40,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    marginBottom: Spacing.base,
  },
  redeemBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.teal,
    borderRadius: Radius.sm,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemBtnText: {
    color: Colors.white,
    fontSize: Typography.xs + 1,
    fontWeight: Typography.bold,
  },
});
