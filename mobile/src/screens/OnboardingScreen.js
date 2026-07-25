import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../store/AppContext';
import { colors, font, spacing, radius } from '../theme/theme';
import { Card, GradientButton, OutlineButton, ProgressBar } from '../components/ui';
import { BODY_TYPES, ACTIVITY_LEVELS } from '../engine/constants';

export default function OnboardingScreen() {
  const { createHunter, setupBody } = useApp();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState(null);
  const [form, setForm] = useState({
    hunterName: '', heightCm: '', currentWeightKg: '', age: '', gender: 'male',
    activityLevel: 'sedentary', targetBodyType: '', bodyFatPercentage: '',
    experience: 'beginner',
    neck: '', waist: '', hip: '', wrist: '', ankle: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => { setError(''); setStep((s) => s + 1); };
  const back = () => { setError(''); setStep((s) => s - 1); };

  const finish = async () => {
    setBusy(true);
    setError('');
    try {
      await createHunter(form.hunterName || 'Hunter');
      const num = (v) => (v ? parseFloat(v) : undefined);
      const res = await setupBody({
        heightCm: parseFloat(form.heightCm),
        currentWeightKg: parseFloat(form.currentWeightKg),
        age: parseInt(form.age, 10),
        gender: form.gender,
        activityLevel: form.activityLevel,
        targetBodyType: form.targetBodyType,
        bodyFatPercentage: num(form.bodyFatPercentage),
        experience: form.experience,
        neckCm: num(form.neck),
        waistCm: num(form.waist),
        hipCm: num(form.hip),
        wristCm: num(form.wrist),
        ankleCm: num(form.ankle),
      });
      setPlan(res.plan);
      setStep(4);
    } catch (e) {
      setError(e.message || 'Setup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Progress dots */}
          <View style={styles.dots}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
            ))}
          </View>

          {step === 0 && (
            <View>
              <LinearGradient colors={[colors.purple, colors.blue]} style={styles.logo}>
                <MaterialCommunityIcons name="shield-crown" size={44} color={colors.white} />
              </LinearGradient>
              <Text style={styles.brand}>SOLO LEVELLING</Text>
              <Text style={styles.tagline}>Rise from the weakest to the strongest.</Text>
              <Card style={{ marginTop: spacing.xl }}>
                <Text style={styles.label}>What shall we call you, Hunter?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your hunter name"
                  placeholderTextColor={colors.textMuted}
                  value={form.hunterName}
                  onChangeText={(v) => set('hunterName', v)}
                />
                <GradientButton
                  title="Begin"
                  onPress={() => { if (form.hunterName.trim()) next(); else setError('Enter a hunter name'); }}
                  style={{ marginTop: spacing.lg }}
                />
                {!!error && <Text style={styles.error}>{error}</Text>}
              </Card>
            </View>
          )}

          {step === 1 && (
            <View>
              <Text style={styles.stepTitle}>BODY ASSESSMENT</Text>
              <Text style={styles.stepSub}>Be honest — the System sees all.</Text>
              <Card style={{ marginTop: spacing.lg }}>
                <Field label="Height (cm)" value={form.heightCm} onChange={(v) => set('heightCm', v)} keyboardType="numeric" placeholder="175" />
                <Field label="Current Weight (kg)" value={form.currentWeightKg} onChange={(v) => set('currentWeightKg', v)} keyboardType="numeric" placeholder="70" />
                <Field label="Age" value={form.age} onChange={(v) => set('age', v)} keyboardType="numeric" placeholder="25" />
                <Text style={styles.label}>Gender</Text>
                <View style={styles.row}>
                  {['male', 'female'].map((g) => (
                    <Chip key={g} active={form.gender === g} label={g[0].toUpperCase() + g.slice(1)} onPress={() => set('gender', g)} />
                  ))}
                </View>
                <Field label="Body Fat % (optional)" value={form.bodyFatPercentage} onChange={(v) => set('bodyFatPercentage', v)} keyboardType="numeric" placeholder="e.g. 20" />
                <Text style={[styles.label, { marginTop: spacing.md }]}>Activity Level</Text>
                {Object.entries(ACTIVITY_LEVELS).map(([k, v]) => (
                  <SelectRow key={k} active={form.activityLevel === k} title={v.name} desc={v.description} onPress={() => set('activityLevel', k)} />
                ))}

                <Text style={[styles.label, { marginTop: spacing.md }]}>Training Experience</Text>
                <View style={styles.row}>
                  {[['beginner', 'Beginner'], ['intermediate', 'Intermediate'], ['advanced', 'Advanced']].map(([k, l]) => (
                    <Chip key={k} active={form.experience === k} label={l} onPress={() => set('experience', k)} />
                  ))}
                </View>
                <Text style={styles.helper}>Sets realistic muscle-gain speed (novices gain much faster).</Text>

                {/* Optional precision data */}
                <View style={styles.precisionHead}>
                  <MaterialCommunityIcons name="target" size={14} color={colors.cyan} />
                  <Text style={styles.precisionTitle}>Precision Data (optional, boosts accuracy)</Text>
                </View>
                <Text style={styles.helper}>
                  Tape measurements unlock the accurate US-Navy body-fat method and your natural
                  muscular potential. Skip if you don't have a tape — you can add these later.
                </Text>
                <View style={styles.measureGrid}>
                  <MiniField label="Neck (cm)" value={form.neck} onChange={(v) => set('neck', v)} />
                  <MiniField label="Waist (cm)" value={form.waist} onChange={(v) => set('waist', v)} />
                  {form.gender === 'female' && <MiniField label="Hip (cm)" value={form.hip} onChange={(v) => set('hip', v)} />}
                  <MiniField label="Wrist (cm)" value={form.wrist} onChange={(v) => set('wrist', v)} />
                  <MiniField label="Ankle (cm)" value={form.ankle} onChange={(v) => set('ankle', v)} />
                </View>

                {!!error && <Text style={styles.error}>{error}</Text>}
                <View style={styles.navRow}>
                  <OutlineButton title="Back" onPress={back} style={{ flex: 1 }} />
                  <GradientButton title="Next" onPress={() => {
                    if (form.heightCm && form.currentWeightKg && form.age) next();
                    else setError('Fill height, weight and age');
                  }} style={{ flex: 1 }} />
                </View>
              </Card>
            </View>
          )}

          {step === 2 && (
            <View>
              <Text style={styles.stepTitle}>CHOOSE YOUR DESTINY</Text>
              <Text style={styles.stepSub}>Select your target physique.</Text>
              <View style={{ marginTop: spacing.md }}>
                {Object.values(BODY_TYPES).map((bt) => (
                  <TouchableOpacity key={bt.id} activeOpacity={0.8} onPress={() => set('targetBodyType', bt.id)}>
                    <Card style={[styles.bodyCard, form.targetBodyType === bt.id && styles.bodyCardActive]}>
                      <View style={styles.bodyIcon(form.targetBodyType === bt.id)}>
                        <MaterialCommunityIcons name={bt.icon} size={22} color={form.targetBodyType === bt.id ? colors.purpleLight : colors.textDim} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bodyName}>{bt.name}</Text>
                        <Text style={styles.bodyDesc}>{bt.description}</Text>
                        <Text style={styles.bodyExample}>{bt.example}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.navRow}>
                <OutlineButton title="Back" onPress={back} style={{ flex: 1 }} />
                <GradientButton title="Next" onPress={() => { if (form.targetBodyType) next(); else setError('Select a body type'); }} style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <Text style={styles.stepTitle}>CONFIRM AWAKENING</Text>
              <Text style={styles.stepSub}>Review your details.</Text>
              <Card style={{ marginTop: spacing.lg }}>
                <Review label="Hunter" value={form.hunterName} />
                <Review label="Height" value={`${form.heightCm} cm`} />
                <Review label="Weight" value={`${form.currentWeightKg} kg`} />
                <Review label="Age" value={form.age} />
                <Review label="Gender" value={form.gender} />
                <Review label="Activity" value={ACTIVITY_LEVELS[form.activityLevel].name} />
                <Review label="Target Body" value={BODY_TYPES[form.targetBodyType]?.name} last />
              </Card>
              {!!error && <Text style={styles.error}>{error}</Text>}
              <View style={styles.navRow}>
                <OutlineButton title="Back" onPress={back} style={{ flex: 1 }} />
                <GradientButton title={busy ? 'Awakening...' : 'Activate System'} onPress={finish} disabled={busy} style={{ flex: 1 }} />
              </View>
            </View>
          )}

          {step === 4 && plan && (
            <View>
              <LinearGradient colors={[colors.green, colors.emerald]} style={styles.logo}>
                <MaterialCommunityIcons name="check-bold" size={44} color={colors.white} />
              </LinearGradient>
              <Text style={styles.stepTitle}>SYSTEM ACTIVATED</Text>
              <Text style={styles.stepSub}>Your transformation plan is ready.</Text>
              <Card style={{ marginTop: spacing.lg }}>
                <Review label="Target Weight" value={`${plan.targets.weight} kg`} />
                <Review label="Target Body Fat" value={`${plan.targets.bodyFat}%`} />
                <Review label="Estimated Time" value={`${plan.targets.estimatedWeeks} weeks`} />
                <Review label="Daily Calories" value={`${plan.nutrition.dailyCalories} kcal`} />
                <Review label="Daily Protein" value={`${plan.nutrition.protein} g`} />
                <Review label="Daily Steps" value={plan.training.dailyStepTarget.toLocaleString()} last />
              </Card>
              <GradientButton title="Enter the System" onPress={() => { /* Root auto-switches once profile+body exist */ }} style={{ marginTop: spacing.lg }} />
              <Text style={styles.enterNote}>Loading your dashboard...</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, keyboardType, placeholder }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboardType} placeholder={placeholder} placeholderTextColor={colors.textMuted} />
    </View>
  );
}

function MiniField({ label, value, onChange }) {
  return (
    <View style={styles.miniField}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput style={styles.miniInput} value={value} onChangeText={onChange} keyboardType="numeric" placeholder="--" placeholderTextColor={colors.textMuted} />
    </View>
  );
}

function Chip({ active, label, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: colors.purpleLight }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SelectRow({ active, title, desc, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.selectRow, active && styles.selectRowActive]}>
      <MaterialCommunityIcons name={active ? 'radiobox-marked' : 'radiobox-blank'} size={18} color={active ? colors.purpleLight : colors.textMuted} />
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={styles.selectTitle}>{title}</Text>
        <Text style={styles.selectDesc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Review({ label, value, last }) {
  return (
    <View style={[styles.reviewRow, !last && styles.reviewBorder]}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.purple, width: 20 },
  logo: { width: 84, height: 84, borderRadius: 22, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  brand: { color: colors.purpleLight, fontSize: font.h1, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginTop: spacing.md },
  tagline: { color: colors.textDim, textAlign: 'center', marginTop: spacing.xs, fontSize: font.small },
  stepTitle: { color: colors.text, fontSize: font.h2, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  stepSub: { color: colors.textDim, textAlign: 'center', marginTop: 4, fontSize: font.small },
  label: { color: colors.textDim, fontSize: font.small, marginBottom: 6 },
  input: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, color: colors.text, fontSize: font.body },
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  chip: { flex: 1, paddingVertical: 12, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bgDarker },
  chipActive: { borderColor: colors.purple, backgroundColor: `${colors.purple}18` },
  chipText: { color: colors.textDim, fontWeight: '600' },
  selectRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm, backgroundColor: colors.bgDarker },
  selectRowActive: { borderColor: colors.purple, backgroundColor: `${colors.purple}12` },
  selectTitle: { color: colors.text, fontWeight: '600', fontSize: font.small },
  selectDesc: { color: colors.textMuted, fontSize: font.tiny },
  bodyCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.md },
  bodyCardActive: { borderColor: colors.purple },
  bodyIcon: (a) => ({ width: 44, height: 44, borderRadius: radius.md, backgroundColor: a ? `${colors.purple}22` : colors.bgDarker, alignItems: 'center', justifyContent: 'center' }),
  bodyName: { color: colors.text, fontWeight: '700', fontSize: font.body },
  bodyDesc: { color: colors.textDim, fontSize: font.tiny, marginTop: 2 },
  bodyExample: { color: colors.purpleLight, fontSize: font.tiny, marginTop: 2 },
  navRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md },
  reviewBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { color: colors.textDim, fontSize: font.small },
  reviewValue: { color: colors.text, fontWeight: '700', fontSize: font.small, textTransform: 'capitalize' },
  error: { color: colors.red, fontSize: font.small, marginTop: spacing.sm, textAlign: 'center' },
  enterNote: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, fontSize: font.small },
  helper: { color: colors.textMuted, fontSize: font.tiny, marginTop: 4, lineHeight: 15 },
  precisionHead: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.lg },
  precisionTitle: { color: colors.cyan, fontSize: font.small, fontWeight: '700' },
  measureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  miniField: { width: '30%', flexGrow: 1 },
  miniLabel: { color: colors.textMuted, fontSize: font.tiny, marginBottom: 3 },
  miniInput: { backgroundColor: colors.bgDarker, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, color: colors.text },
});
