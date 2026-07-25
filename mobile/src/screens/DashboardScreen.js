import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, rankColors, font, spacing, radius } from '../theme/theme';
import { Card, ProgressBar, ScreenTitle } from '../components/ui';

const STAT_META = [
  { key: 'strength', label: 'STR', color: '#ef4444' },
  { key: 'agility', label: 'AGI', color: '#10b981' },
  { key: 'endurance', label: 'END', color: '#3b82f6' },
  { key: 'vitality', label: 'VIT', color: '#ec4899' },
  { key: 'discipline', label: 'DIS', color: '#f59e0b' },
  { key: 'combat_power', label: 'CMB', color: '#fb923c' },
  { key: 'intelligence', label: 'INT', color: '#06b6d4' },
  { key: 'perception', label: 'PER', color: '#a78bfa' },
];

export default function DashboardScreen() {
  const { profile, stats, body, punishmentStatus, repos, refreshCore } = useApp();
  const [data, setData] = useState({ quests: null, steps: null, diet: null });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [quests, steps, diet] = await Promise.all([
      repos.QuestRepo.getToday(),
      repos.StepRepo.today(),
      repos.DietRepo.today(),
    ]);
    const completed = quests.filter((q) => q.is_completed).length;
    setData({
      quests: { list: quests, completed, total: quests.length, pct: quests.length ? Math.round((completed / quests.length) * 100) : 0 },
      steps,
      diet,
    });
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); refreshCore(); }, [load, refreshCore]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshCore()]);
    setRefreshing(false);
  };

  if (!profile) return null;
  const xpPct = (profile.experience / profile.experience_to_next_level) * 100;
  const rc = rankColors[profile.rank] || colors.purpleLight;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="HUNTER STATUS" subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} />

        {punishmentStatus?.isRestricted && (
          <Card style={styles.alert}>
            <MaterialCommunityIcons name="alert" size={22} color={colors.red} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.alertTitle}>PUNISHMENT ACTIVE</Text>
              <Text style={styles.alertText}>{punishmentStatus.message}</Text>
            </View>
          </Card>
        )}

        {/* Player card */}
        <Card glow>
          <View style={styles.playerRow}>
            <LinearGradient colors={[colors.purple, colors.blue]} style={styles.rankCircle}>
              <Text style={styles.rankText}>{profile.rank}</Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.hunterName}>{profile.hunter_name}</Text>
              <Text style={[styles.title, { color: rc }]}>{profile.title}</Text>
              <View style={styles.metaRow}>
                <Meta icon="star-four-points" text={`Level ${profile.level}`} />
                <Meta icon="fire" text={`${profile.streak_days}d streak`} color={colors.orange} />
              </View>
            </View>
          </View>
          <View style={{ marginTop: spacing.md }}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpText}>XP {profile.experience}/{profile.experience_to_next_level}</Text>
              <Text style={styles.xpText}>Next: Lv.{profile.level + 1}</Text>
            </View>
            <ProgressBar progress={xpPct} />
          </View>
        </Card>

        {/* Stats grid */}
        {stats && (
          <View style={styles.statsGrid}>
            {STAT_META.map((s) => (
              <View key={s.key} style={styles.statBox}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statVal}>{stats[s.key]}</Text>
                <ProgressBar progress={Math.min(stats[s.key], 100)} height={4} gradient={[s.color, s.color]} />
              </View>
            ))}
          </View>
        )}

        {/* Quick stats */}
        <View style={styles.quickRow}>
          <QuickStat
            icon="sword-cross" iconColor={colors.purpleLight} title="Quests"
            main={`${data.quests?.completed || 0}/${data.quests?.total || 0}`}
            pct={data.quests?.pct || 0} gradient={data.quests?.pct >= 70 ? [colors.green, colors.emerald] : [colors.purple, colors.blue]}
          />
          <QuickStat
            icon="shoe-print" iconColor={colors.green} title="Steps"
            main={(data.steps?.steps || 0).toLocaleString()}
            sub={`/ ${(data.steps?.target || 10000).toLocaleString()}`}
            pct={data.steps?.progress || 0} gradient={[colors.green, colors.emerald]}
          />
        </View>
        <View style={styles.quickRow}>
          <QuickStat
            icon="fire" iconColor={colors.gold} title="Calories"
            main={`${Math.round(data.diet?.totals?.total_calories || 0)}`}
            sub={`/ ${data.diet?.targets?.daily_calories || '--'}`}
            pct={data.diet?.targets ? Math.min((data.diet.totals.total_calories / data.diet.targets.daily_calories) * 100, 100) : 0}
            gradient={[colors.gold, colors.orange]}
          />
          <QuickStat
            icon="arm-flex" iconColor={colors.red} title="Protein"
            main={`${Math.round(data.diet?.totals?.total_protein || 0)}g`}
            sub={`/ ${data.diet?.targets?.protein_g || '--'}g`}
            pct={data.diet?.targets ? Math.min((data.diet.totals.total_protein / data.diet.targets.protein_g) * 100, 100) : 0}
            gradient={[colors.red, colors.redDark]}
          />
        </View>

        {/* Transformation progress */}
        {body && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chart-line-variant" size={18} color={colors.cyan} />
              <Text style={styles.cardTitle}>Transformation Progress</Text>
            </View>
            <View style={styles.transformRow}>
              <TransformStat label="Current" value={`${body.current_weight_kg} kg`} />
              <TransformStat label="Target" value={`${body.target_weight_kg} kg`} color={colors.green} />
              <TransformStat label="To Go" value={`${Math.abs(body.target_weight_kg - body.current_weight_kg).toFixed(1)} kg`} color={colors.purpleLight} />
              <TransformStat label="Days Left" value={`${body.estimated_days_to_goal || '--'}`} color={colors.blueGlow} />
            </View>
          </Card>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Meta({ icon, text, color = colors.textDim }) {
  return (
    <View style={styles.metaItem}>
      <MaterialCommunityIcons name={icon} size={13} color={color} />
      <Text style={[styles.metaText, { color }]}>{text}</Text>
    </View>
  );
}

function QuickStat({ icon, iconColor, title, main, sub, pct, gradient }) {
  return (
    <Card style={styles.quickCard}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        <Text style={styles.quickTitle}>{title}</Text>
      </View>
      <View style={styles.quickMainRow}>
        <Text style={styles.quickMain}>{main}</Text>
        {sub ? <Text style={styles.quickSub}>{sub}</Text> : null}
      </View>
      <ProgressBar progress={pct} height={6} gradient={gradient} />
    </Card>
  );
}

function TransformStat({ label, value, color = colors.text }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.transformLabel}>{label}</Text>
      <Text style={[styles.transformValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  alert: { flexDirection: 'row', alignItems: 'center', borderColor: `${colors.red}55`, backgroundColor: `${colors.red}12`, marginBottom: spacing.md },
  alertTitle: { color: colors.red, fontWeight: '800', fontSize: font.small },
  alertText: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  playerRow: { flexDirection: 'row', alignItems: 'center' },
  rankCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: colors.white, fontSize: font.h2, fontWeight: '900' },
  hunterName: { color: colors.text, fontSize: font.h3, fontWeight: '800' },
  title: { fontSize: font.small, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: font.tiny },
  xpLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  xpText: { color: colors.textMuted, fontSize: font.tiny },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  statBox: { width: '23%', backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  statLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: '700' },
  statVal: { color: colors.text, fontSize: font.h3, fontWeight: '800', marginVertical: 2 },
  quickRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  quickCard: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  quickTitle: { color: colors.textDim, fontSize: font.small, fontWeight: '600' },
  quickMainRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: spacing.sm },
  quickMain: { color: colors.text, fontSize: font.h2, fontWeight: '900' },
  quickSub: { color: colors.textMuted, fontSize: font.tiny, marginBottom: 3 },
  transformRow: { flexDirection: 'row' },
  transformLabel: { color: colors.textMuted, fontSize: font.tiny },
  transformValue: { fontSize: font.h3, fontWeight: '800', marginTop: 2 },
});
