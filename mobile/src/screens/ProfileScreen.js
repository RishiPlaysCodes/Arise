import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, rankColors, font, spacing, radius } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, Badge } from '../components/ui';
import { BODY_TYPES, STAT_KEYS } from '../engine/constants';

const STAT_LABELS = {
  strength: 'Strength', agility: 'Agility', endurance: 'Endurance', vitality: 'Vitality',
  discipline: 'Discipline', combat_power: 'Combat Power', intelligence: 'Intelligence', perception: 'Perception',
};

export default function ProfileScreen() {
  const { profile, stats, body, repos, refreshCore } = useApp();
  const [plan, setPlan] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [history, setHistory] = useState([]);
  const [alloc, setAlloc] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, h] = await Promise.all([repos.ProfileRepo.getTransformationPlan(), repos.ProfileRepo.getWeightHistory()]);
    setPlan(p); setHistory(h);
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); refreshCore(); }, [load, refreshCore]));
  const onRefresh = async () => { setRefreshing(true); await load(); await refreshCore(); setRefreshing(false); };

  const allocTotal = Object.values(alloc).reduce((s, v) => s + (v || 0), 0);
  const available = stats?.stat_points_available || 0;

  const adjust = (key, delta) => {
    const next = (alloc[key] || 0) + delta;
    if (next < 0) return;
    if (Object.values({ ...alloc, [key]: next }).reduce((s, v) => s + v, 0) > available) return;
    setAlloc((a) => ({ ...a, [key]: next }));
  };

  const commitStats = async () => {
    if (allocTotal === 0) return;
    try {
      await repos.ProfileRepo.allocateStats(alloc);
      setAlloc({});
      await refreshCore();
    } catch (e) { Alert.alert('Error', e.message); }
  };

  const updateWeight = async () => {
    if (!weightInput) return;
    await repos.ProfileRepo.updateWeight(parseFloat(weightInput));
    setWeightInput('');
    await load(); await refreshCore();
  };

  if (!profile) return null;
  const rc = rankColors[profile.rank];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="HUNTER PROFILE" />

        <Card>
          <View style={styles.headRow}>
            <LinearGradient colors={[colors.purple, colors.blue]} style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={32} color={colors.white} />
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.name}>{profile.hunter_name}</Text>
              <Text style={styles.title}>{profile.title}</Text>
              <View style={styles.metaRow}>
                <Text style={[styles.rank, { color: rc }]}>{profile.rank}-Rank</Text>
                <Text style={styles.metaText}>Lv.{profile.level}</Text>
                <Text style={[styles.metaText, { color: colors.orange }]}>{profile.streak_days}d streak</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Stat allocation */}
        {available > 0 && (
          <Card style={{ marginTop: spacing.md, borderColor: `${colors.gold}44` }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="star-circle" size={18} color={colors.gold} />
              <Text style={styles.cardTitle}>Allocate Stat Points</Text>
              <Badge text={`${available - allocTotal} left`} color={colors.gold} />
            </View>
            {STAT_KEYS.map((key) => (
              <View key={key} style={styles.allocRow}>
                <Text style={styles.allocLabel}>{STAT_LABELS[key]}: {stats[key]}</Text>
                <View style={styles.allocControls}>
                  <TouchableOpacity onPress={() => adjust(key, -1)} style={styles.allocBtn}><MaterialCommunityIcons name="minus" size={16} color={colors.textDim} /></TouchableOpacity>
                  <Text style={styles.allocVal}>{alloc[key] || 0}</Text>
                  <TouchableOpacity onPress={() => adjust(key, 1)} style={styles.allocBtn}><MaterialCommunityIcons name="plus" size={16} color={colors.textDim} /></TouchableOpacity>
                </View>
              </View>
            ))}
            <GradientButton title="Confirm Allocation" onPress={commitStats} style={{ marginTop: spacing.sm }} colors={[colors.gold, colors.orange]} />
          </Card>
        )}

        {/* Body profile */}
        {body && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="human" size={18} color={colors.cyan} />
              <Text style={styles.cardTitle}>Body Profile</Text>
            </View>
            <View style={styles.bodyGrid}>
              <BodyStat label="Height" value={`${body.height_cm} cm`} />
              <BodyStat label="Weight" value={`${body.current_weight_kg} kg`} />
              <BodyStat label="Target" value={`${body.target_weight_kg} kg`} color={colors.green} />
              <BodyStat label="BMI" value={body.bmi} />
              <BodyStat label="Body Fat" value={`${body.body_fat_percentage?.toFixed?.(1) || '--'}%`} />
              <BodyStat label="BMR" value={`${body.bmr}`} />
              <BodyStat label="TDEE" value={`${body.tdee}`} />
              <BodyStat label="Goal Body" value={BODY_TYPES[body.target_body_type]?.name} color={colors.purpleLight} />
            </View>
            <View style={styles.weightRow}>
              <TextInput style={styles.weightInput} placeholder="Update weight (kg)" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={weightInput} onChangeText={setWeightInput} />
              <GradientButton title="Update" onPress={updateWeight} />
            </View>
          </Card>
        )}

        {/* Transformation plan */}
        {plan && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="target" size={18} color={colors.purpleLight} />
              <Text style={styles.cardTitle}>Transformation Plan</Text>
            </View>
            <View style={styles.planTop}>
              <BodyStat label="Direction" value={plan.direction} color={colors.blueGlow} />
              <BodyStat label="Rate/wk" value={`${plan.weeklyRate > 0 ? '+' : ''}${plan.weeklyRate}kg`} />
              <BodyStat label="Days Left" value={plan.targets.estimatedDays} color={colors.gold} />
            </View>
            <Text style={styles.subHead}>Phases</Text>
            {plan.training.phases.map((ph, i) => (
              <View key={i} style={styles.phaseRow}>
                <Text style={styles.phaseName}>{ph.name}</Text>
                <Text style={styles.phaseDetail}>{ph.duration} · {ph.focus}</Text>
              </View>
            ))}
            <Text style={styles.subHead}>Weekly Split</Text>
            <View style={styles.splitGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                <View key={d} style={styles.splitDay}>
                  <Text style={styles.splitLabel}>{d}</Text>
                  <Text style={styles.splitText}>{plan.training.trainingSplit.split[i]}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Weight history */}
        {history.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line" size={18} color={colors.green} />
              <Text style={styles.cardTitle}>Weight History</Text>
            </View>
            {history.slice(0, 10).map((h) => (
              <View key={h.id} style={styles.histRow}>
                <Text style={styles.histDate}>{new Date(h.log_date).toLocaleDateString()}</Text>
                <Text style={styles.histWeight}>{h.weight_kg} kg</Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BodyStat({ label, value, color = colors.text }) {
  return (
    <View style={styles.bodyStat}>
      <Text style={styles.bodyStatLabel}>{label}</Text>
      <Text style={[styles.bodyStatValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  headRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
  title: { color: colors.textDim, fontSize: font.small },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  rank: { fontSize: font.small, fontWeight: '800' },
  metaText: { color: colors.textDim, fontSize: font.small },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body, flex: 1 },
  allocRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  allocLabel: { color: colors.text, fontSize: font.small },
  allocControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  allocBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.bgDarker, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  allocVal: { color: colors.gold, fontWeight: '800', width: 20, textAlign: 'center' },
  bodyGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  bodyStat: { width: '25%', marginBottom: spacing.md },
  bodyStatLabel: { color: colors.textMuted, fontSize: font.tiny },
  bodyStatValue: { fontSize: font.small, fontWeight: '700', marginTop: 2, textTransform: 'capitalize' },
  weightRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  weightInput: { flex: 1, backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text },
  planTop: { flexDirection: 'row' },
  subHead: { color: colors.textDim, fontSize: font.small, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  phaseRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  phaseName: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  phaseDetail: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  splitGrid: { flexDirection: 'row', gap: 3 },
  splitDay: { flex: 1, backgroundColor: colors.bgDarker, borderRadius: radius.sm, padding: 4, alignItems: 'center' },
  splitLabel: { color: colors.textMuted, fontSize: 9 },
  splitText: { color: colors.text, fontSize: 8, textAlign: 'center', marginTop: 2 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  histDate: { color: colors.textDim, fontSize: font.small },
  histWeight: { color: colors.text, fontWeight: '700', fontSize: font.small },
});
