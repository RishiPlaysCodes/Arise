import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, font, spacing, radius } from '../theme/theme';
import { GradientButton, Card } from './ui';
import { useApp } from '../store/AppContext';

// Full-screen in-app lockdown. This is the app's own enforcement layer:
// while a FULL_DEVICE_BLOCK punishment is active and unredeemed, the app is
// locked to this screen. The only way out is to complete the redemption task
// (log a 30-minute workout), which reflects the "System" from Solo Leveling.
export default function LockdownOverlay() {
  const { repos, refreshCore } = useApp();
  const [lockdown, setLockdown] = useState(null);
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    (async () => {
      const status = await repos.PunishmentRepo.status();
      const ld = status.punishments.find((p) => p.punishment_type === 'FULL_DEVICE_BLOCK');
      setLockdown(ld);
    })();
  }, [repos]);

  useEffect(() => {
    if (!lockdown) return;
    const tick = () => {
      const ms = new Date(lockdown.ends_at).getTime() - Date.now();
      if (ms <= 0) { setRemaining('Expired — you may redeem now'); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setRemaining(`${h}h ${m}m remaining`);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [lockdown]);

  const redeem = async () => {
    // Redemption: log a 30-minute penalty workout, then lift lockdown
    await repos.ActivityRepo.log({
      activityType: 'penalty', activityName: 'Redemption Workout (Penalty Dungeon)',
      durationMinutes: 30, caloriesBurned: 250, intensity: 'high',
      notes: 'Completed to lift System Lockdown',
    });
    await repos.PunishmentRepo.redeemLockdown();
    await refreshCore();
  };

  return (
    <Modal visible transparent={false} animationType="fade">
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="lock" size={64} color={colors.red} />
          </View>
          <Text style={styles.title}>SYSTEM LOCKDOWN</Text>
          <Text style={styles.subtitle}>
            You failed to complete your daily quests. The System has locked your access.
          </Text>

          <Card style={styles.infoCard}>
            <Text style={styles.reason}>{lockdown?.triggered_by || 'Critical quest failure'}</Text>
            <Text style={styles.timer}>{remaining}</Text>
          </Card>

          <Card style={styles.redeemCard}>
            <Text style={styles.redeemTitle}>Redemption Task</Text>
            <Text style={styles.redeemDesc}>
              Complete a 30-minute penalty workout to prove your resolve and lift the lockdown immediately.
            </Text>
            <GradientButton
              title="I Completed a 30-min Workout"
              colors={[colors.red, colors.redDark]}
              onPress={redeem}
              style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
              icon={<MaterialCommunityIcons name="fire" size={18} color={colors.white} />}
            />
          </Card>

          <Text style={styles.footer}>
            Discipline is the bridge between goals and achievement. Rise, Hunter.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgDarker },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  iconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: `${colors.red}18`, borderWidth: 2, borderColor: `${colors.red}44`, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  title: { color: colors.red, fontSize: font.h1, fontWeight: '900', letterSpacing: 2 },
  subtitle: { color: colors.textDim, fontSize: font.body, textAlign: 'center', marginTop: spacing.md, lineHeight: 22 },
  infoCard: { alignSelf: 'stretch', marginTop: spacing.xl, borderColor: `${colors.red}44`, alignItems: 'center' },
  reason: { color: colors.text, fontSize: font.body, textAlign: 'center' },
  timer: { color: colors.red, fontSize: font.h3, fontWeight: '800', marginTop: spacing.sm },
  redeemCard: { alignSelf: 'stretch', marginTop: spacing.lg },
  redeemTitle: { color: colors.gold, fontSize: font.h3, fontWeight: '800' },
  redeemDesc: { color: colors.textDim, fontSize: font.small, marginTop: spacing.sm, lineHeight: 20 },
  footer: { color: colors.textMuted, fontSize: font.small, textAlign: 'center', marginTop: spacing.xl, fontStyle: 'italic' },
});
