import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, Badge } from '../components/ui';

const MEASURE_FIELDS = [
  ['neck', 'Neck'], ['shoulder', 'Shoulder'], ['chest', 'Chest'], ['waist', 'Waist'],
  ['hip', 'Hip'], ['leftBicep', 'L Bicep'], ['rightBicep', 'R Bicep'], ['forearm', 'Forearm'],
  ['leftThigh', 'L Thigh'], ['rightThigh', 'R Thigh'], ['calf', 'Calf'],
];

const CONF_COLOR = { high: colors.green, medium: colors.gold, low: colors.orange, insufficient: colors.textMuted };

export default function ProgressScreen() {
  const { repos, refreshCore } = useApp();
  const [checkin, setCheckin] = useState(null);
  const [lastCheckin, setLastCheckin] = useState(null);
  const [potential, setPotential] = useState(null);
  const [measureProgress, setMeasureProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [allAchievements, setAllAchievements] = useState([]);
  const [form, setForm] = useState({});
  const [showMeasure, setShowMeasure] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const [lc, pot, mp, ach] = await Promise.all([
      repos.CheckinRepo.last(),
      repos.ProfileRepo.getNaturalPotential(),
      repos.MeasurementRepo.progress(),
      repos.AchievementRepo.unlocked(),
    ]);
    setLastCheckin(lc); setPotential(pot); setMeasureProgress(mp); setAchievements(ach);
    setAllAchievements(repos.AchievementRepo.allDefs());
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const runCheckin = async () => {
    setRunning(true);
    try {
      const res = await repos.CheckinRepo.run(true);
      setCheckin(res);
      await load();
      await refreshCore();
    } finally { setRunning(false); }
  };

  const saveMeasurements = async () => {
    const parsed = {};
    Object.entries(form).forEach(([k, v]) => { if (v) parsed[k] = parseFloat(v); });
    if (Object.keys(parsed).length === 0) return;
    await repos.MeasurementRepo.log(parsed);
    setForm({}); setShowMeasure(false);
    await load(); await refreshCore();
  };

  const unlockedIds = new Set(achievements.map((a) => a.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="PROGRESS & CALIBRATION" subtitle="The System learns your body and self-corrects." />

        {/* Adaptive check-in */}
        <Card glow>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="tune-variant" size={18} color={colors.purpleLight} />
            <Text style={styles.cardTitle}>Adaptive Calibration</Text>
          </View>
          <Text style={styles.explain}>
            Log your weight daily + meals. The System computes your TRUE maintenance calories from
            real results — making predictions self-correct toward ~95%+ real-world accuracy.
          </Text>

          {(checkin || lastCheckin) && (
            <View style={styles.calibBox}>
              {(() => {
                const c = checkin || {
                  empiricalMaintenance: lastCheckin.empirical_maintenance,
                  formulaTDEE: lastCheckin.formula_tdee,
                  newCalorieTarget: lastCheckin.new_calorie_target,
                  confidence: lastCheckin.confidence,
                  observedWeeklyRateKg: lastCheckin.observed_weekly_rate,
                  daysOfData: lastCheckin.days_of_data,
                  projection: { weeks: lastCheckin.projected_weeks },
                  message: null,
                };
                return (
                  <>
                    <View style={styles.calibRow}>
                      <CalibStat label="Formula TDEE" value={`${c.formulaTDEE || '--'}`} />
                      <CalibStat label="Real Maintenance" value={c.empiricalMaintenance ? `${c.empiricalMaintenance}` : 'learning'} color={colors.cyan} />
                      <CalibStat label="New Target" value={`${c.newCalorieTarget || '--'}`} color={colors.green} />
                    </View>
                    <View style={styles.calibMeta}>
                      <Badge text={`confidence: ${c.confidence || 'n/a'}`} color={CONF_COLOR[c.confidence] || colors.textMuted} />
                      {c.observedWeeklyRateKg != null && (
                        <Badge text={`${c.observedWeeklyRateKg > 0 ? '+' : ''}${c.observedWeeklyRateKg} kg/wk`} color={colors.blueGlow} />
                      )}
                      {c.projection?.weeks && <Badge text={`ETA ~${c.projection.weeks} wk`} color={colors.gold} />}
                    </View>
                    {(checkin?.message) && <Text style={styles.calibMsg}>{checkin.message}</Text>}
                  </>
                );
              })()}
            </View>
          )}

          <GradientButton
            title={running ? 'Calibrating...' : 'Run Weekly Check-In'}
            onPress={runCheckin} disabled={running}
            style={{ marginTop: spacing.md }}
            icon={<MaterialCommunityIcons name="sync" size={18} color={colors.white} />}
          />
          <Text style={styles.hint}>Best run once every 7-14 days after consistent logging.</Text>
        </Card>

        {/* Natural potential */}
        {potential && (
          <Card style={{ marginTop: spacing.md, borderColor: `${colors.gold}33` }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="trophy-award" size={18} color={colors.gold} />
              <Text style={styles.cardTitle}>Your Natural Potential</Text>
            </View>
            <Text style={styles.explain}>
              Casey Butt model (from your wrist + ankle). This is your realistic drug-free ceiling —
              so your goals stay achievable, not fantasy.
            </Text>
            <View style={styles.calibRow}>
              <CalibStat label="Max Lean Mass" value={`${potential.maxLeanBodyMassKg} kg`} color={colors.gold} />
              <CalibStat label={`Max Weight @${potential.atBodyFat}%`} value={`${potential.maxWeightAtBodyFatKg} kg`} color={colors.green} />
            </View>
          </Card>
        )}

        {/* Measurements */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.rowBetween}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="tape-measure" size={18} color={colors.cyan} />
              <Text style={styles.cardTitle}>Body Measurements</Text>
            </View>
            <TouchableOpacity onPress={() => setShowMeasure((s) => !s)} style={styles.miniBtn}>
              <MaterialCommunityIcons name={showMeasure ? 'close' : 'plus'} size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {showMeasure && (
            <View style={{ marginTop: spacing.sm }}>
              <View style={styles.measureGrid}>
                {MEASURE_FIELDS.map(([key, label]) => (
                  <View key={key} style={styles.measureField}>
                    <Text style={styles.measureLabel}>{label} (cm)</Text>
                    <TextInput
                      style={styles.measureInput} keyboardType="numeric"
                      value={form[key] || ''} onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                      placeholder="--" placeholderTextColor={colors.textMuted}
                    />
                  </View>
                ))}
              </View>
              <GradientButton title="Save Measurements" onPress={saveMeasurements} style={{ marginTop: spacing.sm }} />
              <Text style={styles.hint}>Tip: enter neck + waist (+ hip for women) to auto-update body fat via the Navy method.</Text>
            </View>
          )}

          {measureProgress && Object.keys(measureProgress.deltas).length > 0 && (
            <View style={{ marginTop: spacing.md }}>
              <Text style={styles.subHead}>Change since start</Text>
              {Object.entries(measureProgress.deltas).map(([site, delta]) => (
                <View key={site} style={styles.deltaRow}>
                  <Text style={styles.deltaSite}>{site.replace(/_cm$/, '').replace(/_/g, ' ')}</Text>
                  <Text style={[styles.deltaVal, { color: delta === 0 ? colors.textDim : delta > 0 ? colors.green : colors.orange }]}>
                    {delta > 0 ? '+' : ''}{delta} cm
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Achievements */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="medal" size={18} color={colors.gold} />
            <Text style={styles.cardTitle}>Achievements ({achievements.length}/{allAchievements.length})</Text>
          </View>
          <View style={styles.achGrid}>
            {allAchievements.map((a) => {
              const got = unlockedIds.has(a.id);
              return (
                <View key={a.id} style={[styles.achChip, got && styles.achChipGot]}>
                  <MaterialCommunityIcons name={got ? 'medal' : 'medal-outline'} size={16} color={got ? colors.gold : colors.textMuted} />
                  <Text style={[styles.achName, got && { color: colors.text }]}>{a.name}</Text>
                  <Text style={styles.achDesc}>{a.desc}</Text>
                </View>
              );
            })}
          </View>
        </Card>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CalibStat({ label, value, color = colors.text }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.calibVal, { color }]}>{value}</Text>
      <Text style={styles.calibLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  explain: { color: colors.textDim, fontSize: font.tiny, lineHeight: 16, marginBottom: spacing.sm },
  calibBox: { backgroundColor: colors.bgDarker, borderRadius: radius.md, padding: spacing.md },
  calibRow: { flexDirection: 'row' },
  calibVal: { fontSize: font.h3, fontWeight: '800' },
  calibLabel: { color: colors.textMuted, fontSize: font.tiny, textAlign: 'center', marginTop: 2 },
  calibMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: spacing.sm, justifyContent: 'center' },
  calibMsg: { color: colors.textDim, fontSize: font.tiny, marginTop: spacing.sm, fontStyle: 'italic', textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: font.tiny, marginTop: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  miniBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  measureField: { width: '30%', flexGrow: 1 },
  measureLabel: { color: colors.textMuted, fontSize: font.tiny, marginBottom: 3 },
  measureInput: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.text },
  subHead: { color: colors.textDim, fontSize: font.small, fontWeight: '700', marginBottom: spacing.sm },
  deltaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.border },
  deltaSite: { color: colors.text, fontSize: font.small, textTransform: 'capitalize' },
  deltaVal: { fontSize: font.small, fontWeight: '700' },
  achGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  achChip: { width: '47%', flexGrow: 1, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDarker, opacity: 0.6 },
  achChipGot: { opacity: 1, borderColor: `${colors.gold}55`, backgroundColor: `${colors.gold}0d` },
  achName: { color: colors.textDim, fontWeight: '700', fontSize: font.small, marginTop: 4 },
  achDesc: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
