import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, rankColors, font, spacing, radius } from '../theme/theme';
import { Card } from '../components/ui';

const ITEMS = [
  { route: 'Combat', icon: 'boxing-glove', label: 'Combat Training', desc: '8 martial arts, generated sessions', color: colors.red },
  { route: 'Strength', icon: 'weight-lifter', label: 'Strength & 1RM', desc: 'Progressive overload + PRs', color: colors.orange },
  { route: 'System', icon: 'skull', label: 'The System', desc: 'Punishments & enforcement', color: colors.red },
  { route: 'Profile', icon: 'account', label: 'Profile', desc: 'Stats, body, transformation plan', color: colors.purpleLight },
  { route: 'Paywall', icon: 'crown', label: 'Hunter Pro', desc: 'Unlock premium powers', color: colors.gold },
  { route: 'Settings', icon: 'cog', label: 'Settings', desc: 'Sync, units, diet, data', color: colors.textDim },
];

export default function MoreScreen({ navigation }) {
  const { profile } = useApp();
  const rc = profile ? (rankColors[profile.rank] || colors.purpleLight) : colors.purpleLight;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>MORE</Text>

        {profile && (
          <Card style={styles.hunterCard}>
            <LinearGradient colors={[colors.purple, colors.blue]} style={styles.rankCircle}>
              <Text style={styles.rankText}>{profile.rank}</Text>
            </LinearGradient>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={styles.hunterName}>{profile.hunter_name}</Text>
              <Text style={[styles.hunterTitle, { color: rc }]}>{profile.title} · Lv.{profile.level}</Text>
            </View>
          </Card>
        )}

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {ITEMS.map((it) => (
            <TouchableOpacity key={it.route} activeOpacity={0.8} onPress={() => navigation.navigate(it.route)}>
              <Card style={styles.item}>
                <View style={[styles.iconWrap, { backgroundColor: `${it.color}22` }]}>
                  <MaterialCommunityIcons name={it.icon} size={22} color={it.color} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.itemLabel}>{it.label}</Text>
                  <Text style={styles.itemDesc}>{it.desc}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  title: { color: colors.text, fontSize: font.h1, fontWeight: '900', letterSpacing: 1, marginBottom: spacing.lg },
  hunterCard: { flexDirection: 'row', alignItems: 'center' },
  rankCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  rankText: { color: colors.white, fontWeight: '900', fontSize: font.h3 },
  hunterName: { color: colors.text, fontWeight: '800', fontSize: font.body },
  hunterTitle: { fontSize: font.small, marginTop: 2 },
  item: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { color: colors.text, fontWeight: '700', fontSize: font.body },
  itemDesc: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
