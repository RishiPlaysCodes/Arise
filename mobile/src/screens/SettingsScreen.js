import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ScreenTitle, GradientButton, OutlineButton } from '../components/ui';

const DIETS = [['non_veg', 'Non-Veg'], ['eggetarian', 'Eggetarian'], ['veg', 'Vegetarian'], ['vegan', 'Vegan']];

export default function SettingsScreen() {
  const { repos, services, refreshCore } = useApp();
  const [units, setUnits] = useState('kg');
  const [diet, setDiet] = useState('non_veg');
  const [allergies, setAllergies] = useState('');
  const [notif, setNotif] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [backendUrl, setBackendUrl] = useState('');
  const [token, setToken] = useState('');

  const load = useCallback(async () => {
    setUnits((await repos.SettingsRepo.get('units', 'kg')));
    setDiet((await repos.SettingsRepo.get('diet_pref', 'non_veg')));
    setAllergies((await repos.SettingsRepo.get('allergies', '')) || '');
    setNotif((await repos.SettingsRepo.get('notifications', 'true')) === 'true');
    const cfg = await services.SyncService.getConfig();
    setSyncEnabled(cfg.enabled); setBackendUrl(cfg.backendUrl); setToken(cfg.token);
  }, [repos, services]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveDiet = async (d) => { setDiet(d); await repos.SettingsRepo.set('diet_pref', d); };
  const saveUnits = async (u) => { setUnits(u); await repos.SettingsRepo.set('units', u); };
  const saveAllergies = async () => { await repos.SettingsRepo.set('allergies', allergies); Alert.alert('Saved', 'Dietary preferences updated. Meal plans will adapt.'); };

  const toggleNotif = async (v) => {
    setNotif(v);
    await repos.SettingsRepo.set('notifications', v ? 'true' : 'false');
    if (v) await services.NotificationService.scheduleDailyReminders();
    else await services.NotificationService.cancelAll();
  };

  const saveSync = async () => {
    await services.SyncService.configure({ backendUrl, token, enabled: syncEnabled });
    if (syncEnabled) {
      const online = await services.SyncService.isOnline();
      Alert.alert('Sync', online ? 'Connected. Your data will sync in the background.' : 'Saved, but backend not reachable right now — will retry automatically.');
    } else {
      Alert.alert('Sync', 'Cloud sync disabled. App remains fully functional offline.');
    }
  };

  const exportData = async () => {
    try {
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');
      const csv = await repos.ExportRepo.weightHistoryCSV();
      const json = JSON.stringify(await repos.ExportRepo.allData(), null, 2);
      const dir = FileSystem.documentDirectory;
      const csvPath = `${dir}arise-weight-history.csv`;
      const jsonPath = `${dir}arise-full-export.json`;
      await FileSystem.writeAsStringAsync(csvPath, csv);
      await FileSystem.writeAsStringAsync(jsonPath, json);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(jsonPath);
      } else {
        Alert.alert('Exported', `Saved to app documents:\n${jsonPath}`);
      }
    } catch (e) {
      Alert.alert('Export', 'Export saved locally. (Sharing unavailable on this device.)');
    }
  };

  const resetData = () => {
    Alert.alert('Reset Everything', 'This permanently deletes ALL your data and cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All', style: 'destructive', onPress: async () => {
          const { resetDatabase } = require('../db/database');
          await resetDatabase();
          await refreshCore();
          Alert.alert('Done', 'All data cleared. Restart the app to begin again.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenTitle title="SETTINGS" subtitle="Configure your System." />

        {/* Units */}
        <Card>
          <Text style={styles.cardTitle}>Units</Text>
          <View style={styles.chipRow}>
            {[['kg', 'Metric (kg/cm)'], ['lb', 'Imperial (lb/in)']].map(([k, l]) => (
              <TouchableOpacity key={k} onPress={() => saveUnits(k)} style={[styles.chip, units === k && styles.chipActive]}>
                <Text style={[styles.chipText, units === k && { color: colors.purpleLight }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.hint}>Display unit. Data is stored in metric internally.</Text>
        </Card>

        {/* Dietary preferences */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>Dietary Preferences</Text>
          <View style={styles.chipWrap}>
            {DIETS.map(([k, l]) => (
              <TouchableOpacity key={k} onPress={() => saveDiet(k)} style={[styles.chipSm, diet === k && styles.chipActive]}>
                <Text style={[styles.chipText, diet === k && { color: colors.purpleLight }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Allergies (comma separated)</Text>
          <TextInput style={styles.input} value={allergies} onChangeText={setAllergies} placeholder="e.g. nuts, dairy, soy, fish, gluten" placeholderTextColor={colors.textMuted} />
          <GradientButton title="Save Preferences" onPress={saveAllergies} style={{ marginTop: spacing.sm }} />
          <Text style={styles.hint}>AI meal plans will exclude these and match your diet.</Text>
        </Card>

        {/* Notifications */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Notifications</Text>
              <Text style={styles.hint}>Quest reminders + System warnings (offline).</Text>
            </View>
            <Switch value={notif} onValueChange={toggleNotif} trackColor={{ true: colors.purple, false: colors.border }} thumbColor={colors.white} />
          </View>
        </Card>

        {/* Cloud sync */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Cloud Sync (optional)</Text>
              <Text style={styles.hint}>App works fully offline. Enable to back up + sync across devices.</Text>
            </View>
            <Switch value={syncEnabled} onValueChange={setSyncEnabled} trackColor={{ true: colors.purple, false: colors.border }} thumbColor={colors.white} />
          </View>
          {syncEnabled && (
            <View style={{ marginTop: spacing.sm }}>
              <Text style={styles.label}>Backend URL</Text>
              <TextInput style={styles.input} value={backendUrl} onChangeText={setBackendUrl} placeholder="https://your-server.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
              <Text style={styles.label}>Auth Token</Text>
              <TextInput style={styles.input} value={token} onChangeText={setToken} placeholder="JWT token" placeholderTextColor={colors.textMuted} autoCapitalize="none" secureTextEntry />
            </View>
          )}
          <GradientButton title="Save Sync Settings" onPress={saveSync} style={{ marginTop: spacing.sm }} colors={[colors.blue, colors.cyan]} />
        </Card>

        {/* Data */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>Your Data</Text>
          <GradientButton title="Export My Data" onPress={exportData} style={{ marginTop: spacing.sm }} colors={[colors.panelLight, colors.panel]} icon={<MaterialCommunityIcons name="download" size={18} color={colors.white} />} />
          <OutlineButton title="Reset All Data" onPress={resetData} style={{ marginTop: spacing.sm, borderColor: `${colors.red}55` }} />
          <Text style={styles.hint}>Export gives you a full JSON + weight CSV. Reset wipes everything.</Text>
        </Card>

        <Text style={styles.footer}>Arise v1.0 · Offline-first · Your data stays on your device.</Text>
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  label: { color: colors.textDim, fontSize: font.small, marginTop: spacing.sm, marginBottom: 4 },
  input: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bgDarker },
  chipSm: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgDarker },
  chipActive: { borderColor: colors.purple, backgroundColor: `${colors.purple}18` },
  chipText: { color: colors.textDim, fontSize: font.small, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hint: { color: colors.textMuted, fontSize: font.tiny, marginTop: 6, lineHeight: 15 },
  footer: { color: colors.textMuted, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.lg },
});
