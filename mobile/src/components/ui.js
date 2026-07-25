// ============================================================================
// Reusable UI primitives (Solo Levelling themed)
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, font, shadow } from '../theme/theme';

export function Card({ children, style, glow }) {
  return <View style={[styles.card, glow && shadow.glow, style]}>{children}</View>;
}

export function GradientButton({ title, onPress, disabled, colors: c = [colors.purple, colors.blue], style, icon }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[{ opacity: disabled ? 0.5 : 1 }, style]}>
      <LinearGradient colors={c} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {icon}
        <Text style={styles.btnText}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function OutlineButton({ title, onPress, style }) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={[styles.outlineBtn, style]}>
      <Text style={styles.outlineText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function ProgressBar({ progress, height = 10, gradient = [colors.purple, colors.blue] }) {
  const pct = Math.max(0, Math.min(100, progress || 0));
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct}%`, height: '100%', borderRadius: height / 2 }} />
    </View>
  );
}

export function Badge({ text, color = colors.purple, bg }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg || `${color}22`, borderColor: `${color}55` }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function Loader({ label }) {
  return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={colors.purple} />
      {label ? <Text style={styles.loaderText}>{label}</Text> : null}
    </View>
  );
}

export function ScreenTitle({ title, subtitle }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatPill({ label, value, color = colors.text }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue(color)}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.panel,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    gap: 8,
  },
  btnText: { color: colors.white, fontWeight: '700', fontSize: font.body },
  outlineBtn: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingVertical: 13, paddingHorizontal: spacing.xl, alignItems: 'center',
  },
  outlineText: { color: colors.textDim, fontWeight: '600', fontSize: font.body },
  progressTrack: { backgroundColor: colors.bgDarker, overflow: 'hidden', width: '100%' },
  badge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, alignSelf: 'flex-start',
  },
  badgeText: { fontSize: font.tiny, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  loaderText: { color: colors.purpleLight, marginTop: spacing.md, fontSize: font.body },
  screenTitle: { color: colors.text, fontSize: font.h1, fontWeight: '900', letterSpacing: 1 },
  screenSubtitle: { color: colors.textDim, fontSize: font.small, marginTop: 4 },
  statPill: { alignItems: 'center', flex: 1 },
  statValue: (color) => ({ color, fontSize: font.h3, fontWeight: '800' }),
  statLabel: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
