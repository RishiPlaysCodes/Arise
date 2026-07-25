import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, ProgressBar, ScreenTitle, GradientButton, Badge } from '../components/ui';
import { searchFoods, scaleFood, defaultServing } from '../data/foods';
import BarcodeScanner from '../components/BarcodeScanner';

const MEALS = ['breakfast', 'lunch', 'snack', 'dinner'];

export default function DietScreen() {
  const { repos, handleRewards } = useApp();
  const [today, setToday] = useState(null);
  const [plan, setPlan] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ mealType: 'breakfast', foodName: '', calories: '', protein: '', carbs: '', fats: '' });
  const [foodQuery, setFoodQuery] = useState('');
  const [grams, setGrams] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedFood, setScannedFood] = useState(null);
  const [scannedGrams, setScannedGrams] = useState('100');
  const foodResults = searchFoods(foodQuery, 12);

  const load = useCallback(async () => {
    const [t, p] = await Promise.all([repos.DietRepo.today(), repos.DietRepo.mealPlan()]);
    setToday(t); setPlan(p);
  }, [repos]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const logFood = async () => {
    if (!form.foodName) return;
    const res = await repos.DietRepo.log({
      mealType: form.mealType, foodName: form.foodName,
      calories: parseFloat(form.calories) || 0, protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0, fats: parseFloat(form.fats) || 0,
    });
    await handleRewards(res.rewards);
    setForm({ mealType: 'breakfast', foodName: '', calories: '', protein: '', carbs: '', fats: '' });
    setShowForm(false);
    await load();
  };

  const remove = async (id) => { const res = await repos.DietRepo.remove(id); await handleRewards(res.rewards); await load(); };

  const quickAddFood = async (food, gramsAmount) => {
    const amt = gramsAmount || defaultServing(food);
    const macros = scaleFood(food, amt);
    const res = await repos.DietRepo.log({
      mealType: form.mealType, foodName: `${food.name} (${amt}g)`,
      calories: macros.calories, protein: macros.protein, carbs: macros.carbs, fats: macros.fats,
      quantity: amt, unit: 'g',
    });
    await handleRewards(res.rewards);
    setFoodQuery(''); setSelectedFood(null); setGrams('');
    await load();
  };

  const t = today?.totals || {};
  const tg = today?.targets;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.purple} />}>
        <View style={styles.headerRow}>
          <ScreenTitle title="NUTRITION" subtitle="Fuel your transformation." />
          <TouchableOpacity onPress={() => setShowForm((s) => !s)} style={styles.addBtn}>
            <MaterialCommunityIcons name={showForm ? 'close' : 'plus'} size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        {tg && (
          <View style={styles.macroGrid}>
            <MacroCard icon="fire" color={colors.orange} label="Calories" value={Math.round(t.total_calories || 0)} target={tg.daily_calories} unit="" />
            <MacroCard icon="arm-flex" color={colors.red} label="Protein" value={Math.round(t.total_protein || 0)} target={tg.protein_g} unit="g" />
            <MacroCard icon="barley" color={colors.gold} label="Carbs" value={Math.round(t.total_carbs || 0)} target={tg.carbs_g} unit="g" />
            <MacroCard icon="oil" color={colors.blue} label="Fats" value={Math.round(t.total_fats || 0)} target={tg.fats_g} unit="g" />
          </View>
        )}

        {showForm && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.formTitle}>Log Food</Text>
            <View style={styles.chipRow}>
              {MEALS.map((m) => (
                <TouchableOpacity key={m} onPress={() => setForm((f) => ({ ...f, mealType: m }))} style={[styles.chip, form.mealType === m && styles.chipActive]}>
                  <Text style={[styles.chipText, form.mealType === m && { color: colors.purpleLight }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} placeholder="Food name" placeholderTextColor={colors.textMuted} value={form.foodName} onChangeText={(v) => setForm((f) => ({ ...f, foodName: v }))} />
            <View style={styles.inputRow}>
              <TextInput style={[styles.input, styles.inputSmall]} placeholder="Cal" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={form.calories} onChangeText={(v) => setForm((f) => ({ ...f, calories: v }))} />
              <TextInput style={[styles.input, styles.inputSmall]} placeholder="Protein" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={form.protein} onChangeText={(v) => setForm((f) => ({ ...f, protein: v }))} />
            </View>
            <View style={styles.inputRow}>
              <TextInput style={[styles.input, styles.inputSmall]} placeholder="Carbs" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={form.carbs} onChangeText={(v) => setForm((f) => ({ ...f, carbs: v }))} />
              <TextInput style={[styles.input, styles.inputSmall]} placeholder="Fats" placeholderTextColor={colors.textMuted} keyboardType="numeric" value={form.fats} onChangeText={(v) => setForm((f) => ({ ...f, fats: v }))} />
            </View>
            <GradientButton title="Save" onPress={logFood} style={{ marginTop: spacing.sm }} />
          </Card>
        )}

        {/* Quick add from offline food database */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="database-search" size={18} color={colors.green} />
            <Text style={styles.cardTitle}>Quick Add (Food Database)</Text>
          </View>
          <View style={styles.chipRow}>
            {MEALS.map((m) => (
              <TouchableOpacity key={m} onPress={() => setForm((f) => ({ ...f, mealType: m }))} style={[styles.chip, form.mealType === m && styles.chipActive]}>
                <Text style={[styles.chipText, form.mealType === m && { color: colors.purpleLight }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Search foods (e.g. chicken, rice, banana)"
              placeholderTextColor={colors.textMuted} value={foodQuery} onChangeText={(v) => { setFoodQuery(v); setSelectedFood(null); }}
            />
            <TouchableOpacity onPress={() => setShowScanner(true)} style={styles.scanBtn}>
              <MaterialCommunityIcons name="barcode-scan" size={22} color={colors.white} />
            </TouchableOpacity>
          </View>

          {scannedFood && (
            <View style={styles.scannedBox}>
              <Text style={styles.scannedName}>{scannedFood.name}</Text>
              <Text style={styles.foodMacros}>{scannedFood.cal}cal · P{scannedFood.p} · C{scannedFood.c} · F{scannedFood.f} /100g</Text>
              <View style={styles.gramsRow}>
                <TextInput style={styles.gramsInput} keyboardType="numeric" value={scannedGrams} onChangeText={setScannedGrams} placeholder="grams" placeholderTextColor={colors.textMuted} />
                <GradientButton title="Add" colors={[colors.green, colors.emerald]} onPress={() => { quickAddFood(scannedFood, parseFloat(scannedGrams) || 100); setScannedFood(null); }} />
              </View>
            </View>
          )}
          {foodQuery.length > 0 && (
            <View style={styles.foodResults}>
              {foodResults.map((food, i) => {
                const isSel = selectedFood?.name === food.name;
                const per = scaleFood(food, defaultServing(food));
                return (
                  <View key={i}>
                    <TouchableOpacity style={styles.foodRow} onPress={() => { setSelectedFood(food); setGrams(String(defaultServing(food))); }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodMacros}>{per.calories}cal · P{per.protein} · C{per.carbs} · F{per.fats} /{defaultServing(food)}g</Text>
                      </View>
                      <MaterialCommunityIcons name={isSel ? 'chevron-up' : 'plus-circle-outline'} size={20} color={colors.green} />
                    </TouchableOpacity>
                    {isSel && (
                      <View style={styles.gramsRow}>
                        <TextInput style={styles.gramsInput} keyboardType="numeric" value={grams} onChangeText={setGrams} placeholder="grams" placeholderTextColor={colors.textMuted} />
                        <GradientButton title="Add" onPress={() => quickAddFood(food, parseFloat(grams) || defaultServing(food))} colors={[colors.green, colors.emerald]} />
                      </View>
                    )}
                  </View>
                );
              })}
              {foodResults.length === 0 && <Text style={styles.empty}>No match. Use "Log Food" for a custom entry.</Text>}
            </View>
          )}
        </Card>

        {/* Today's log */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-list" size={18} color={colors.purpleLight} />
            <Text style={styles.cardTitle}>Today's Log</Text>
          </View>
          {today?.meals?.length ? today.meals.map((m) => (
            <View key={m.id} style={styles.mealRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.mealHead}>
                  <Badge text={m.meal_type} color={colors.purpleLight} />
                  <Text style={styles.mealName}>{m.food_name}</Text>
                </View>
                <Text style={styles.mealMacros}>{Math.round(m.calories)}cal · P{Math.round(m.protein_g)} · C{Math.round(m.carbs_g)} · F{Math.round(m.fats_g)}</Text>
              </View>
              <TouchableOpacity onPress={() => remove(m.id)} hitSlop={10}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )) : <Text style={styles.empty}>No food logged yet. Tap + to start.</Text>}
        </Card>

        {/* AI meal plan */}
        {plan && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="chef-hat" size={18} color={colors.cyan} />
              <Text style={styles.cardTitle}>AI Meal Plan</Text>
            </View>
            {plan.meals.map((m, i) => (
              <View key={i} style={styles.planRow}>
                <View style={styles.planHead}>
                  <Badge text={m.mealType} color={colors.blueGlow} />
                  <Text style={styles.planTime}>{m.time}</Text>
                </View>
                <Text style={styles.planName}>{m.name}</Text>
                <Text style={styles.mealMacros}>{m.calories}cal · P{m.protein} · C{m.carbs} · F{m.fats}</Text>
              </View>
            ))}
            <Text style={styles.planTotal}>Total: {plan.totalCalories} cal · {plan.totalProtein}g protein</Text>
          </Card>
        )}
        <View style={{ height: spacing.xl }} />
      </ScrollView>

      <BarcodeScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onResolved={(food) => { setScannedFood(food); setScannedGrams('100'); setFoodQuery(''); }}
      />
    </SafeAreaView>
  );
}

function MacroCard({ icon, color, label, value, target, unit }) {
  const pct = target ? Math.min((value / target) * 100, 100) : 0;
  const over = target && value > target * 1.1;
  return (
    <Card style={styles.macroCard}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={styles.macroValue}>{value}{unit}</Text>
      <Text style={styles.macroTarget}>/ {target}{unit}</Text>
      <ProgressBar progress={pct} height={4} gradient={over ? [colors.red, colors.red] : [color, color]} />
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  macroCard: { width: '47%', flexGrow: 1 },
  macroValue: { color: colors.text, fontSize: font.h3, fontWeight: '900', marginTop: 4 },
  macroTarget: { color: colors.textMuted, fontSize: font.tiny, marginBottom: 6 },
  formTitle: { color: colors.text, fontWeight: '700', fontSize: font.body, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: spacing.sm },
  chip: { flex: 1, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bgDarker },
  chipActive: { borderColor: colors.purple, backgroundColor: `${colors.purple}18` },
  chipText: { color: colors.textDim, fontSize: font.tiny, textTransform: 'capitalize', fontWeight: '600' },
  input: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  inputSmall: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: font.body },
  mealRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  mealHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mealName: { color: colors.text, fontWeight: '600', fontSize: font.small, flexShrink: 1 },
  mealMacros: { color: colors.textMuted, fontSize: font.tiny, marginTop: 3 },
  empty: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md, fontSize: font.small },
  foodResults: { marginTop: spacing.sm },
  foodRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  foodName: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  foodMacros: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
  gramsRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.sm },
  gramsInput: { flex: 1, backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.text },
  searchRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  scanBtn: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center' },
  scannedBox: { marginTop: spacing.sm, padding: spacing.md, backgroundColor: `${colors.green}0d`, borderRadius: radius.md, borderWidth: 1, borderColor: `${colors.green}33` },
  scannedName: { color: colors.text, fontWeight: '700', fontSize: font.small },
  planRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTime: { color: colors.textMuted, fontSize: font.tiny },
  planName: { color: colors.text, fontWeight: '600', fontSize: font.small, marginTop: 4 },
  planTotal: { color: colors.textDim, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.sm },
});
