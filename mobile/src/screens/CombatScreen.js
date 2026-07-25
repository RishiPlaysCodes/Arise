import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, Badge } from '../components/ui';
import { COMBAT_TYPES } from '../engine/constants';

const SKILLS = ['beginner', 'intermediate', 'advanced'];
const DURATIONS = [15, 30, 45, 60];

export default function CombatScreen() {
  const { repos, handleRewards } = useApp();
  const [selected, setSelected] = useState('boxing');
  const [skill, setSkill] = useState('beginner');
  const [duration, setDuration] = useState(30);
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => { setStats(await repos.CombatRepo.stats()); }, [repos]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const generate = () => {
    try { setSession(repos.CombatRepo.session(selected, skill, duration)); } catch (e) { /* noop */ }
  };

  const logSession = async () => {
    if (!session) return;
    const res = await repos.CombatRepo.log({
      combatType: session.combatKey, techniqueName: session.combatType,
      rounds: session.exercises.length, durationMinutes: session.totalDuration,
      intensity: 'moderate', skillLevel: session.skillLevel,
    });
    await handleRewards(res.rewards);
    setSession(null);
    await load();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenTitle title="COMBAT TRAINING" subtitle="Train for battle. Master the arts." />

        <Card>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="boxing-glove" size={18} color={colors.red} />
            <Text style={styles.cardTitle}>Choose Your Art</Text>
          </View>
          <View style={styles.grid}>
            {Object.entries(COMBAT_TYPES).map(([k, v]) => (
              <TouchableOpacity key={k} onPress={() => setSelected(k)} style={[styles.artBtn, selected === k && styles.artActive]}>
                <Text style={[styles.artName, selected === k && { color: colors.red }]}>{v.name}</Text>
                <Text style={styles.artCals}>{v.caloriesPerMinute} cal/min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Skill Level</Text>
          <View style={styles.chipRow}>
            {SKILLS.map((s) => (
              <TouchableOpacity key={s} onPress={() => setSkill(s)} style={[styles.chip, skill === s && styles.chipActive]}>
                <Text style={[styles.chipText, skill === s && { color: colors.purpleLight }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Duration</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity key={d} onPress={() => setDuration(d)} style={[styles.chip, duration === d && styles.chipActive]}>
                <Text style={[styles.chipText, duration === d && { color: colors.purpleLight }]}>{d}m</Text>
              </TouchableOpacity>
            ))}
          </View>

          <GradientButton title="Generate Session" onPress={generate} colors={[colors.red, colors.redDark]} style={{ marginTop: spacing.md }} icon={<MaterialCommunityIcons name="play" size={18} color={colors.white} />} />
        </Card>

        {session && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.sessionHead}>
              <View>
                <Text style={styles.sessionTitle}>{session.combatType}</Text>
                <Text style={styles.sessionSub}>{session.skillLevel} · {session.totalDuration}min · ~{session.caloriesEstimate} cal</Text>
              </View>
            </View>
            {session.exercises.map((ex, i) => (
              <View key={i} style={styles.exRow}>
                <View style={styles.exNum}><Text style={styles.exNumText}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exDesc}>{ex.description}</Text>
                </View>
                <Text style={styles.exDur}>{ex.duration}m</Text>
              </View>
            ))}
            <GradientButton title="Complete & Log" onPress={logSession} style={{ marginTop: spacing.md }} icon={<MaterialCommunityIcons name="check" size={18} color={colors.white} />} />
          </Card>
        )}

        {stats?.overall?.total_sessions > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="trophy" size={18} color={colors.gold} />
              <Text style={styles.cardTitle}>Combat Stats</Text>
            </View>
            <View style={styles.statRow}>
              <CStat value={stats.overall.total_sessions} label="Sessions" />
              <CStat value={stats.overall.total_minutes} label="Minutes" />
              <CStat value={Math.round(stats.overall.total_calories)} label="Calories" color={colors.orange} />
            </View>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {stats.byType.map((s) => (
                <View key={s.combat_type} style={styles.byTypeRow}>
                  <Text style={styles.byTypeName}>{(COMBAT_TYPES[s.combat_type]?.name) || s.combat_type}</Text>
                  <Text style={styles.byTypeStat}>{s.total_sessions} sessions · {s.total_minutes}min</Text>
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

function CStat({ value, label, color = colors.text }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.cStatVal, { color }]}>{value}</Text>
      <Text style={styles.cStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  artBtn: { width: '47%', flexGrow: 1, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDarker, alignItems: 'center' },
  artActive: { borderColor: colors.red, backgroundColor: `${colors.red}12` },
  artName: { color: colors.text, fontWeight: '700', fontSize: font.small },
  artCals: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  label: { color: colors.textDim, fontSize: font.small, marginTop: spacing.md, marginBottom: 6 },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, paddingVertical: 9, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bgDarker },
  chipActive: { borderColor: colors.purple, backgroundColor: `${colors.purple}18` },
  chipText: { color: colors.textDim, fontSize: font.tiny, textTransform: 'capitalize', fontWeight: '600' },
  sessionHead: { marginBottom: spacing.sm },
  sessionTitle: { color: colors.text, fontWeight: '800', fontSize: font.h3 },
  sessionSub: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  exNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: `${colors.red}22`, alignItems: 'center', justifyContent: 'center' },
  exNumText: { color: colors.red, fontWeight: '800', fontSize: font.tiny },
  exName: { color: colors.text, fontSize: font.small, fontWeight: '600', marginLeft: spacing.sm },
  exDesc: { color: colors.textMuted, fontSize: font.tiny, marginLeft: spacing.sm },
  exDur: { color: colors.textDim, fontSize: font.tiny },
  statRow: { flexDirection: 'row' },
  cStatVal: { fontSize: font.h2, fontWeight: '900' },
  cStatLabel: { color: colors.textMuted, fontSize: font.tiny },
  byTypeRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.sm, backgroundColor: colors.bgDarker, borderRadius: radius.sm },
  byTypeName: { color: colors.text, fontSize: font.small },
  byTypeStat: { color: colors.textMuted, fontSize: font.tiny },
});
