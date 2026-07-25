import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, OutlineButton, ProgressBar } from '../components/ui';

export default function StepsScreen() {
  const { repos, services, handleRewards, pedometerAvailable } = useApp();
  const [today, setToday] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [input, setInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [t, w] = await Promise.all([repos.StepRepo.today(), repos.StepRepo.weekly()]);
    setToday(t); setWeekly(w);
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Live sensor updates
  useEffect(() => {
    const unsub = services.PedometerService.onUpdate((data) => {
      setToday((prev) => ({ ...prev, ...data, steps: data.steps, calories_burned: data.calories, distance_km: data.distanceKm, active_minutes: data.activeMinutes }));
    });
    return unsub;
  }, [services]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const addSteps = async () => {
    if (!input) return;
    const res = await repos.StepRepo.addManual(parseInt(input, 10));
    await handleRewards(res.rewards);
    setInput('');
    await load();
  };
  const setSteps = async () => {
    if (!input) return;
    const res = await repos.StepRepo.setSteps(parseInt(input, 10));
    await handleRewards(res.rewards);
    setInput('');
    await load();
  };

  const steps = today?.steps || 0;
  const target = today?.target || 10000;
  const progress = Math.min((steps / target) * 100, 100);
  const R = 80;
  const C = 2 * Math.PI * R;
  const offset = C - (progress / 100) * C;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="STEP COUNTER" subtitle={pedometerAvailable ? 'Auto-tracking via device sensor' : 'Manual tracking (no step sensor found)'} />

        <Card style={styles.ringCard}>
          <View style={styles.ringWrap}>
            <Svg width={190} height={190}>
              <Circle cx={95} cy={95} r={R} stroke={colors.bgDarker} strokeWidth={12} fill="none" />
              <Circle cx={95} cy={95} r={R} stroke={colors.green} strokeWidth={12} fill="none"
                strokeLinecap="round" strokeDasharray={C} strokeDashoffset={offset}
                transform={`rotate(-90 95 95)`} />
            </Svg>
            <View style={styles.ringCenter}>
              <MaterialCommunityIcons name="shoe-print" size={22} color={colors.green} />
              <Text style={styles.ringSteps}>{steps.toLocaleString()}</Text>
              <Text style={styles.ringTarget}>/ {target.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.metricsRow}>
            <Metric icon="map-marker-distance" color={colors.blueGlow} value={today?.distance_km || 0} label="km" />
            <Metric icon="fire" color={colors.orange} value={Math.round(today?.calories_burned || 0)} label="cal" />
            <Metric icon="clock-outline" color={colors.purpleLight} value={today?.active_minutes || 0} label="min" />
          </View>
        </Card>

        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>Log Steps Manually</Text>
          <TextInput style={styles.input} placeholder="Enter step count" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={input} onChangeText={setInput} />
          <View style={styles.btnRow}>
            <GradientButton title="Add" onPress={addSteps} style={{ flex: 1 }} />
            <OutlineButton title="Set Total" onPress={setSteps} style={{ flex: 1 }} />
          </View>
          <Text style={styles.hint}>The sensor tracks automatically. Use this only to adjust.</Text>
        </Card>

        {weekly && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-bar" size={18} color={colors.green} />
              <Text style={styles.cardTitle}>This Week</Text>
            </View>
            <View style={styles.weekStats}>
              <WeekStat value={weekly.totalSteps.toLocaleString()} label="Total" />
              <WeekStat value={weekly.averageSteps.toLocaleString()} label="Avg/day" />
              <WeekStat value={`${weekly.totalDistanceKm}`} label="km" />
              <WeekStat value={`${weekly.totalCaloriesBurned}`} label="cal" />
            </View>
            <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
              {weekly.dailyLogs.map((l) => (
                <View key={l.log_date} style={styles.dayRow}>
                  <Text style={styles.dayLabel}>{new Date(l.log_date).toLocaleDateString(undefined, { weekday: 'short' })}</Text>
                  <View style={{ flex: 1, marginHorizontal: spacing.md }}>
                    <ProgressBar progress={Math.min((l.steps / target) * 100, 100)} height={8} gradient={[colors.green, colors.emerald]} />
                  </View>
                  <Text style={styles.daySteps}>{l.steps.toLocaleString()}</Text>
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

function Metric({ icon, color, value, label }) {
  return (
    <View style={styles.metric}>
      <MaterialCommunityIcons name={icon} size={16} color={color} />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}
function WeekStat({ value, label }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={styles.weekValue}>{value}</Text>
      <Text style={styles.weekLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  ringCard: { alignItems: 'center', paddingVertical: spacing.xl },
  ringWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringSteps: { color: colors.text, fontSize: 30, fontWeight: '900' },
  ringTarget: { color: colors.textMuted, fontSize: font.tiny },
  metricsRow: { flexDirection: 'row', marginTop: spacing.lg, width: '100%' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: colors.text, fontSize: font.h3, fontWeight: '800', marginTop: 4 },
  metricLabel: { color: colors.textMuted, fontSize: font.tiny },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  input: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.sm },
  btnRow: { flexDirection: 'row', gap: spacing.md },
  hint: { color: colors.textMuted, fontSize: font.tiny, marginTop: spacing.sm },
  weekStats: { flexDirection: 'row' },
  weekValue: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
  weekLabel: { color: colors.textMuted, fontSize: font.tiny },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayLabel: { color: colors.textDim, fontSize: font.tiny, width: 34 },
  daySteps: { color: colors.text, fontSize: font.tiny, width: 54, textAlign: 'right' },
});
