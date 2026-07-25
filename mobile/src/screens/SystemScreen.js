import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, Badge } from '../components/ui';
import AppBlockerService from '../services/appBlocker';

const SEVERITY_COLOR = { low: colors.gold, medium: colors.orange, high: colors.red, critical: colors.redDark };

export default function SystemScreen() {
  const { repos, refreshCore, services } = useApp();
  const [status, setStatus] = useState(null);
  const [blocked, setBlocked] = useState([]);
  const [history, setHistory] = useState([]);
  const [capability, setCapability] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [s, b, h, cap] = await Promise.all([
      repos.PunishmentRepo.status(),
      repos.PunishmentRepo.getBlockedApps(),
      repos.PunishmentRepo.history(),
      AppBlockerService.getCapability(),
    ]);
    setStatus(s); setBlocked(b); setHistory(h); setCapability(cap);
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); await refreshCore(); setRefreshing(false); };

  const runCheck = async () => {
    // Manual "process yesterday" - useful for testing / catching up
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const y = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const res = await repos.DayProcessor.processDate(y);
    await load(); await refreshCore();
    Alert.alert('Day Processed', res?.skipped ? 'Already processed.' : res?.noQuests ? 'No quests that day.' : `Completion: ${res.completionRate}% · Streak: ${res.streak}`);
  };

  const enableSystemBlocking = async () => {
    const ok = await AppBlockerService.requestSystemPermission();
    if (!ok) {
      Alert.alert('Accessibility Permission', 'Open Settings > Accessibility and enable Solo Levelling to allow system-wide app blocking during punishments.');
    }
    setTimeout(load, 1000);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="THE SYSTEM" subtitle="Discipline enforced. No excuses." />

        {/* Status */}
        <Card style={{ borderColor: status?.isRestricted ? `${colors.red}55` : `${colors.green}44` }}>
          <View style={styles.statusRow}>
            <View style={[styles.statusIcon, { backgroundColor: status?.isRestricted ? `${colors.red}22` : `${colors.green}22` }]}>
              <MaterialCommunityIcons name={status?.isRestricted ? 'lock' : 'shield-check'} size={24} color={status?.isRestricted ? colors.red : colors.green} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[styles.statusTitle, { color: status?.isRestricted ? colors.red : colors.green }]}>
                {status?.isRestricted ? 'RESTRICTIONS ACTIVE' : 'NO ACTIVE PUNISHMENTS'}
              </Text>
              <Text style={styles.statusMsg}>{status?.message}</Text>
            </View>
          </View>
        </Card>

        {/* Enforcement capability - honest disclosure */}
        {capability && (
          <Card style={{ marginTop: spacing.md, borderColor: `${colors.blue}33` }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cellphone-lock" size={18} color={colors.blueGlow} />
              <Text style={styles.cardTitle}>App Blocking Enforcement</Text>
            </View>
            <View style={styles.capRow}>
              <Badge text={capability.level.replace(/_/g, ' ')} color={capability.level === 'system_wide' ? colors.green : capability.level === 'permission_needed' ? colors.orange : colors.textDim} />
            </View>
            <Text style={styles.capReason}>{capability.reason}</Text>
            {capability.level !== 'system_wide' && (
              <GradientButton title="Enable System-Wide Blocking" onPress={enableSystemBlocking} colors={[colors.blue, colors.cyan]} style={{ marginTop: spacing.md }} />
            )}
          </Card>
        )}

        {/* Blocked apps */}
        {blocked.length > 0 && (
          <Card style={{ marginTop: spacing.md, borderColor: `${colors.red}33` }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cancel" size={18} color={colors.red} />
              <Text style={styles.cardTitle}>Blocked Apps ({blocked.length})</Text>
            </View>
            <View style={styles.blockGrid}>
              {blocked.map((a) => (
                <View key={a.id} style={styles.blockChip}>
                  <MaterialCommunityIcons name="lock" size={12} color={colors.red} />
                  <Text style={styles.blockText}>{a.app_name}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Active punishments */}
        {status?.punishments?.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="skull" size={18} color={colors.red} />
              <Text style={styles.cardTitle}>Active Punishments</Text>
            </View>
            {status.punishments.map((p) => (
              <View key={p.id} style={[styles.punishRow, { borderLeftColor: SEVERITY_COLOR[p.severity] || colors.orange }]}>
                <Text style={styles.punishType}>{p.punishment_type.replace(/_/g, ' ')}</Text>
                <Text style={styles.punishDesc}>{p.description}</Text>
                <Text style={styles.punishMeta}>Ends: {new Date(p.ends_at).toLocaleString()}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Rules */}
        <Card style={{ marginTop: spacing.md, borderColor: `${colors.purple}33` }}>
          <Text style={styles.rulesTitle}>System Rules</Text>
          {[
            'Complete <70% quests = punishment activated',
            '50%+ failure = social media blocked 24h',
            '70%+ failure = FULL LOCKDOWN + XP drain',
            'Breaking a 7-day streak = ice penalty',
            'Lockdown lifts only after redemption workout',
            'The System processes missed days automatically.',
          ].map((r, i) => (
            <View key={i} style={styles.ruleRow}>
              <MaterialCommunityIcons name="circle-small" size={18} color={colors.red} />
              <Text style={styles.ruleText}>{r}</Text>
            </View>
          ))}
        </Card>

        <GradientButton title="Process Yesterday (Catch-up)" onPress={runCheck} colors={[colors.panel, colors.panelLight]} style={{ marginTop: spacing.md }} />

        {/* History */}
        {history.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.cardTitle}>Punishment History</Text>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              {history.map((p) => (
                <View key={p.id} style={styles.histRow}>
                  <Text style={styles.histType}>{p.punishment_type.replace(/_/g, ' ')}</Text>
                  <Text style={[styles.histStatus, { color: p.is_active ? colors.red : colors.textMuted }]}>{p.is_active ? 'Active' : 'Expired'}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontWeight: '800', fontSize: font.small },
  statusMsg: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  capRow: { flexDirection: 'row', marginBottom: spacing.sm },
  capReason: { color: colors.textDim, fontSize: font.tiny, lineHeight: 16 },
  blockGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  blockChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: `${colors.red}0d`, borderWidth: 1, borderColor: `${colors.red}22` },
  blockText: { color: colors.textDim, fontSize: font.tiny },
  punishRow: { borderLeftWidth: 3, paddingLeft: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm },
  punishType: { color: colors.text, fontWeight: '700', fontSize: font.small, textTransform: 'capitalize' },
  punishDesc: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  punishMeta: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  rulesTitle: { color: colors.purpleLight, fontWeight: '800', fontSize: font.body, marginBottom: spacing.sm },
  ruleRow: { flexDirection: 'row', alignItems: 'center' },
  ruleText: { color: colors.textDim, fontSize: font.small, flex: 1 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  histType: { color: colors.text, fontSize: font.small, textTransform: 'capitalize' },
  histStatus: { fontSize: font.tiny, fontWeight: '600' },
});
