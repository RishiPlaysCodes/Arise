import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, Badge } from '../components/ui';
import LineChart from '../components/LineChart';

const COMMON = ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Weighted Dip'];

export default function StrengthScreen() {
  const { repos, handleRewards } = useApp();
  const [prs, setPrs] = useState([]);
  const [recent, setRecent] = useState([]);
  const [form, setForm] = useState({ exercise: '', sets: '', reps: '', weightKg: '' });
  const [selectedEx, setSelectedEx] = useState(null);
  const [progression, setProgression] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [p, r] = await Promise.all([repos.StrengthRepo.personalRecords(), repos.StrengthRepo.history(null, 20)]);
    setPrs(p); setRecent(r);
    if (selectedEx) setProgression(await repos.StrengthRepo.progression(selectedEx));
  }, [repos, selectedEx]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const estimated = repos.StrengthRepo.estimate1RM(parseFloat(form.weightKg) || 0, parseInt(form.reps, 10) || 0);

  const logSet = async () => {
    if (!form.exercise || !form.weightKg || !form.reps) return;
    const res = await repos.StrengthRepo.log({
      exercise: form.exercise.trim(),
      sets: parseInt(form.sets, 10) || 1,
      reps: parseInt(form.reps, 10) || 1,
      weightKg: parseFloat(form.weightKg) || 0,
    });
    await handleRewards(res.rewards);
    setForm({ exercise: '', sets: '', reps: '', weightKg: '' });
    await load();
  };

  const viewProgression = async (ex) => {
    setSelectedEx(ex);
    setProgression(await repos.StrengthRepo.progression(ex));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="STRENGTH" subtitle="Progressive overload = guaranteed growth." />

        <Card>
          <Text style={styles.cardTitle}>Log a Set</Text>
          <View style={styles.chipWrap}>
            {COMMON.map((ex) => (
              <TouchableOpacity key={ex} onPress={() => setForm((f) => ({ ...f, exercise: ex }))} style={[styles.chip, form.exercise === ex && styles.chipActive]}>
                <Text style={[styles.chipText, form.exercise === ex && { color: colors.purpleLight }]}>{ex}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Exercise name" placeholderTextColor={colors.textMuted} value={form.exercise} onChangeText={(v) => setForm((f) => ({ ...f, exercise: v }))} />
          <View style={styles.row}>
            <Field label="Sets" value={form.sets} onChange={(v) => setForm((f) => ({ ...f, sets: v }))} />
            <Field label="Reps" value={form.reps} onChange={(v) => setForm((f) => ({ ...f, reps: v }))} />
            <Field label="Weight (kg)" value={form.weightKg} onChange={(v) => setForm((f) => ({ ...f, weightKg: v }))} />
          </View>
          {estimated > 0 && (
            <View style={styles.estBox}>
              <MaterialCommunityIcons name="chart-line" size={16} color={colors.gold} />
              <Text style={styles.estText}>Estimated 1RM: <Text style={{ color: colors.gold, fontWeight: '800' }}>{estimated} kg</Text> (Epley)</Text>
            </View>
          )}
          <GradientButton title="Log Set" onPress={logSet} style={{ marginTop: spacing.sm }} />
        </Card>

        {selectedEx && progression.length >= 2 && (
          <Card style={{ marginTop: spacing.md }}>
            <LineChart
              title={`${selectedEx} — 1RM progression`}
              data={progression.map((p) => ({ label: p.log_date.slice(5), value: p.one_rm }))}
              color={colors.gold}
              unit="kg"
            />
          </Card>
        )}

        {prs.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.cardTitle}>Personal Records</Text>
            <View style={{ marginTop: spacing.sm }}>
              {prs.map((pr) => (
                <TouchableOpacity key={pr.exercise} onPress={() => viewProgression(pr.exercise)} style={styles.prRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.prName}>{pr.exercise}</Text>
                    <Text style={styles.prSub}>{pr.sessions} sessions · top {pr.top_weight}kg</Text>
                  </View>
                  <Badge text={`1RM ${pr.best_1rm}kg`} color={colors.gold} />
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>Tap an exercise to see its progression chart.</Text>
          </Card>
        )}

        {recent.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.cardTitle}>Recent Sets</Text>
            {recent.map((s) => (
              <View key={s.id} style={styles.recentRow}>
                <Text style={styles.recentEx}>{s.exercise}</Text>
                <Text style={styles.recentDetail}>{s.sets}×{s.reps} @ {s.weight_kg}kg</Text>
                <Text style={styles.recentDate}>{s.log_date.slice(5)}</Text>
              </View>
            ))}
          </Card>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={value} onChangeText={onChange} placeholder="0" placeholderTextColor={colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm, marginBottom: spacing.sm },
  chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDarker },
  chipActive: { borderColor: colors.purple, backgroundColor: `${colors.purple}18` },
  chipText: { color: colors.textDim, fontSize: font.tiny, fontWeight: '600' },
  input: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  fieldLabel: { color: colors.textMuted, fontSize: font.tiny, marginBottom: 4 },
  estBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${colors.gold}0d`, borderRadius: radius.sm, padding: spacing.sm },
  estText: { color: colors.textDim, fontSize: font.small },
  hint: { color: colors.textMuted, fontSize: font.tiny, marginTop: spacing.sm },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  prName: { color: colors.text, fontWeight: '600', fontSize: font.small },
  prSub: { color: colors.textMuted, fontSize: font.tiny },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  recentEx: { color: colors.text, fontSize: font.small, flex: 1 },
  recentDetail: { color: colors.textDim, fontSize: font.small, marginRight: spacing.md },
  recentDate: { color: colors.textMuted, fontSize: font.tiny },
});
