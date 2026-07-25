import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, GradientButton, OutlineButton, Badge } from '../components/ui';
import MonetizationService, { PRODUCTS, PRO_FEATURES } from '../services/monetization';

export default function PaywallScreen({ navigation }) {
  const [isPro, setIsPro] = useState(false);
  const [selected, setSelected] = useState('YEARLY');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { setIsPro(await MonetizationService.isPro()); }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const purchase = async () => {
    setBusy(true);
    try {
      // Attempt real IAP if RevenueCat is installed; otherwise dev-unlock.
      let Purchases;
      try { Purchases = require('react-native-purchases').default; } catch { Purchases = null; }
      if (Purchases) {
        // Provider wiring point — configure + purchase the selected package.
        Alert.alert('Purchase', 'Connect your RevenueCat offering here to complete the purchase.');
      } else {
        await MonetizationService.setPro(true);
        setIsPro(true);
        Alert.alert('Hunter Pro Unlocked', 'All premium features are now active. (Dev unlock — wire an IAP provider for production.)');
      }
    } finally { setBusy(false); }
  };

  const restore = async () => {
    let Purchases;
    try { Purchases = require('react-native-purchases').default; } catch { Purchases = null; }
    if (Purchases) {
      Alert.alert('Restore', 'Restoring purchases via your IAP provider…');
    } else {
      Alert.alert('Restore', 'No IAP provider configured in this build.');
    }
  };

  if (isPro) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.proWrap}>
          <LinearGradient colors={[colors.gold, colors.orange]} style={styles.crown}>
            <MaterialCommunityIcons name="crown" size={48} color={colors.white} />
          </LinearGradient>
          <Text style={styles.proTitle}>HUNTER PRO ACTIVE</Text>
          <Text style={styles.proSub}>All premium powers unlocked. Rise, Monarch.</Text>
          <OutlineButton title="Manage / Restore" onPress={restore} style={{ marginTop: spacing.lg }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={[colors.purple, colors.blue]} style={styles.hero}>
          <MaterialCommunityIcons name="crown" size={40} color={colors.white} />
          <Text style={styles.heroTitle}>HUNTER PRO</Text>
          <Text style={styles.heroSub}>Unlock the full power of the System.</Text>
        </LinearGradient>

        <Card style={{ marginTop: spacing.md }}>
          {PRO_FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.green} />
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </Card>

        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {Object.entries(PRODUCTS).map(([key, p]) => (
            <TouchableOpacity key={key} onPress={() => setSelected(key)} activeOpacity={0.85}>
              <Card style={[styles.planCard, selected === key && styles.planActive]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{key === 'MONTHLY' ? 'Monthly' : key === 'YEARLY' ? 'Yearly' : 'Lifetime'}</Text>
                  {p.badge ? <Badge text={p.badge} color={colors.gold} /> : null}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.planPrice}>{p.price}</Text>
                  <Text style={styles.planPeriod}>/{p.period}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <GradientButton title={busy ? 'Processing…' : 'Unlock Hunter Pro'} onPress={purchase} disabled={busy} style={{ marginTop: spacing.md }} colors={[colors.gold, colors.orange]} />
        <TouchableOpacity onPress={restore} style={{ marginTop: spacing.md }}>
          <Text style={styles.restore}>Restore Purchases</Text>
        </TouchableOpacity>
        <Text style={styles.legal}>
          The free tier stays fully usable forever. Pro unlocks convenience + advanced tools.
          Prices are placeholders — set your real offerings in your IAP provider.
        </Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  hero: { borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  heroTitle: { color: colors.white, fontSize: font.h1, fontWeight: '900', letterSpacing: 2, marginTop: spacing.sm },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: font.small, marginTop: 4 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
  featureText: { color: colors.textDim, fontSize: font.small, flex: 1 },
  planCard: { flexDirection: 'row', alignItems: 'center' },
  planActive: { borderColor: colors.gold },
  planName: { color: colors.text, fontWeight: '700', fontSize: font.body, marginBottom: 4 },
  planPrice: { color: colors.text, fontWeight: '900', fontSize: font.h3 },
  planPeriod: { color: colors.textMuted, fontSize: font.tiny },
  restore: { color: colors.purpleLight, textAlign: 'center', fontSize: font.small },
  legal: { color: colors.textMuted, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.lg, lineHeight: 15 },
  proWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  crown: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  proTitle: { color: colors.gold, fontSize: font.h2, fontWeight: '900', letterSpacing: 2, marginTop: spacing.lg },
  proSub: { color: colors.textDim, fontSize: font.body, marginTop: spacing.sm, textAlign: 'center' },
});
