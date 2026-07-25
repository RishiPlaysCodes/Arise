import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ProgressBar, ScreenTitle, Badge } from '../components/ui';

const DIFFICULTY = {
  easy: colors.green, normal: colors.blue, hard: colors.orange, extreme: colors.red,
};

export default function QuestsScreen() {
  const { repos, handleRewards } = useApp();
  const [quests, setQuests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await repos.QuestRepo.ensureToday();
    setQuests(await repos.QuestRepo.getToday());
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const completeQuest = async (q) => {
    if (q.is_completed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    let res;
    if (q.unit === 'session') {
      // exercise-type: log an activity that satisfies it
      res = await repos.ActivityRepo.log({
        activityType: q.quest_category, activityName: q.title, durationMinutes: 45, intensity: 'moderate',
      });
    } else {
      res = await repos.QuestRepo.complete(q.id);
    }
    await handleRewards(res?.rewards || res);
    await load();
  };

  const completed = quests.filter((q) => q.is_completed).length;
  const total = quests.filter((q) => !q.is_bonus).length;
  const pct = quests.length ? Math.round((completed / quests.length) * 100) : 0;
  const onTrack = pct >= 70;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <ScreenTitle title="DAILY QUESTS" subtitle="Complete before midnight or face punishment." />

        <Card style={{ marginBottom: spacing.md }}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressCount}>{completed}/{quests.length} completed</Text>
            <Text style={[styles.progressStatus, { color: onTrack ? colors.green : colors.red }]}>
              {onTrack ? 'On Track' : 'Behind Schedule'}
            </Text>
          </View>
          <ProgressBar progress={pct} height={14} gradient={onTrack ? [colors.green, colors.emerald] : [colors.red, colors.orange]} />
        </Card>

        {quests.map((q) => (
          <TouchableOpacity key={q.id} activeOpacity={0.8} onPress={() => completeQuest(q)} disabled={q.is_completed}>
            <Card style={[styles.questCard, q.is_completed && styles.questDone]}>
              <View style={styles.questLeftBar(q.is_completed)} />
              <View style={styles.questRow}>
                <MaterialCommunityIcons
                  name={q.is_completed ? 'check-circle' : 'circle-outline'}
                  size={26}
                  color={q.is_completed ? colors.green : colors.textMuted}
                />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={styles.questTitleRow}>
                    <Text style={[styles.questTitle, q.is_completed && styles.strike]}>{q.title}</Text>
                  </View>
                  <Text style={styles.questDesc}>{q.description}</Text>
                  <View style={styles.tagRow}>
                    {q.is_bonus ? <Badge text="BONUS" color={colors.gold} /> : null}
                    <Badge text={q.difficulty} color={DIFFICULTY[q.difficulty] || colors.blue} />
                  </View>
                  {!q.is_completed && q.unit !== 'session' && (
                    <View style={{ marginTop: spacing.sm }}>
                      <View style={styles.qpLabels}>
                        <Text style={styles.qpText}>{formatVal(q.current_value)} / {formatVal(q.target_value)} {q.unit}</Text>
                        <Text style={styles.qpText}>{Math.round((q.current_value / q.target_value) * 100)}%</Text>
                      </View>
                      <ProgressBar progress={(q.current_value / q.target_value) * 100} height={5} />
                      <Text style={styles.tapHint}>Tap to mark complete</Text>
                    </View>
                  )}
                </View>
                <View style={styles.xpBox}>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color={colors.gold} />
                  <Text style={styles.xpValue}>{q.xp_reward}</Text>
                  <Text style={styles.xpLabel}>XP</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Card style={styles.warning}>
          <MaterialCommunityIcons name="clock-alert" size={20} color={colors.red} />
          <Text style={styles.warningText}>
            Failing to complete 70% of daily quests triggers punishment: social media block, entertainment blackout, or full lockdown.
          </Text>
        </Card>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function formatVal(v) {
  if (v >= 1000) return v.toLocaleString();
  return Number.isInteger(v) ? v : v.toFixed(1);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  progressCount: { color: colors.textDim, fontSize: font.small },
  progressStatus: { fontSize: font.small, fontWeight: '700' },
  questCard: { marginBottom: spacing.md, overflow: 'hidden', paddingLeft: spacing.lg + 4 },
  questDone: { opacity: 0.6 },
  questLeftBar: (done) => ({ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: done ? colors.green : colors.purple }),
  questRow: { flexDirection: 'row', alignItems: 'flex-start' },
  questTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  questTitle: { color: colors.text, fontWeight: '700', fontSize: font.body, flexShrink: 1 },
  strike: { textDecorationLine: 'line-through', color: colors.textMuted },
  questDesc: { color: colors.textDim, fontSize: font.tiny, marginTop: 3 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  qpLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  qpText: { color: colors.textMuted, fontSize: font.tiny },
  tapHint: { color: colors.purpleLight, fontSize: font.tiny, marginTop: 4 },
  xpBox: { alignItems: 'center', marginLeft: spacing.sm },
  xpValue: { color: colors.gold, fontWeight: '800', fontSize: font.small },
  xpLabel: { color: colors.textMuted, fontSize: 9 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderColor: `${colors.red}33`, backgroundColor: `${colors.red}0d`, marginTop: spacing.sm },
  warningText: { color: colors.textDim, fontSize: font.tiny, flex: 1, lineHeight: 16 },
});
