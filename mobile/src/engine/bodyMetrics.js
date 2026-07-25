// ============================================================================
// BODY METRICS ENGINE (Pure, on-device)
//
// Evidence-based body-composition math. Every function is deterministic and
// documents the formula + its accuracy caveats. These feed the transformation
// engine so goals are realistic (not fantasy) and predictions self-correct.
//
// Units: cm / kg unless noted. Circumferences in cm.
// ============================================================================

const CM_PER_IN = 2.54;
const KG_PER_LB = 0.45359237;
const KCAL_PER_KG = 7700; // approx energy in 1 kg of body-mass change

// ---------------------------------------------------------------------------
// US NAVY BODY FAT (tape method) - far more accurate than BMI-based estimates.
// Requires neck + waist (+ hip for women). Accuracy ~±3-4% vs DEXA.
// ---------------------------------------------------------------------------
export function navyBodyFat({ gender, heightCm, neckCm, waistCm, hipCm }) {
  if (!heightCm || !neckCm || !waistCm) return null;
  if (gender === 'female' && !hipCm) return null;
  try {
    let bf;
    if (gender === 'male') {
      const val = 1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm);
      bf = 495 / val - 450;
    } else {
      const val = 1.29579 - 0.35004 * Math.log10(waistCm + hipCm - neckCm) + 0.22100 * Math.log10(heightCm);
      bf = 495 / val - 450;
    }
    if (!isFinite(bf) || bf <= 0) return null;
    return Math.round(Math.max(3, Math.min(bf, 60)) * 10) / 10;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// FRAME SIZE via wrist circumference (r = height / wrist).
// ---------------------------------------------------------------------------
export function frameSize({ gender, heightCm, wristCm }) {
  if (!heightCm || !wristCm) return null;
  const r = heightCm / wristCm;
  if (gender === 'male') {
    if (r > 10.4) return 'small';
    if (r >= 9.6) return 'medium';
    return 'large';
  }
  if (r > 11.0) return 'small';
  if (r >= 10.1) return 'medium';
  return 'large';
}

// ---------------------------------------------------------------------------
// CASEY BUTT NATURAL MUSCULAR POTENTIAL
// Predicts realistic max lean body mass (drug-free) at a target body-fat %.
// LBM(lb) = H^1.5 * (sqrt(wrist)/22.667 + sqrt(ankle)/17.0104) * (bf/224 + 1)
//   H, wrist, ankle in INCHES. Returns kg. Also derives max bodyweight at bf%.
// This is the most respected natural-limit model; keeps "goals" honest.
// ---------------------------------------------------------------------------
export function naturalPotential({ heightCm, wristCm, ankleCm, targetBodyFat = 10, gender = 'male' }) {
  if (!heightCm || !wristCm || !ankleCm) return null;
  const H = heightCm / CM_PER_IN;
  const wrist = wristCm / CM_PER_IN;
  const ankle = ankleCm / CM_PER_IN;
  let lbmLb = Math.pow(H, 1.5) * (Math.sqrt(wrist) / 22.667 + Math.sqrt(ankle) / 17.0104) * (targetBodyFat / 224 + 1);
  // Female lean-mass potential is roughly 0.80-0.85 of the male model
  if (gender === 'female') lbmLb *= 0.82;
  const maxLbmKg = lbmLb * KG_PER_LB;
  const maxWeightKg = maxLbmKg / (1 - targetBodyFat / 100);
  return {
    maxLeanBodyMassKg: Math.round(maxLbmKg * 10) / 10,
    maxWeightAtBodyFatKg: Math.round(maxWeightKg * 10) / 10,
    atBodyFat: targetBodyFat,
  };
}

// Casey Butt max muscular measurements (drug-free), derived from wrist/ankle.
export function maxMeasurements({ wristCm, ankleCm }) {
  if (!wristCm || !ankleCm) return null;
  const w = wristCm / CM_PER_IN;
  const a = ankleCm / CM_PER_IN;
  const base = (w + a) / 2;
  const inch = (v) => Math.round(v * CM_PER_IN * 10) / 10; // back to cm
  return {
    chestCm: inch(w * 6.5),
    bicepCm: inch(w * 2.5),
    forearmCm: inch(w * 2.0),
    neckCm: inch(w * 2.4),
    thighCm: inch(a * 2.6),
    calfCm: inch(a * 1.9),
    waistCm: inch(base * 3.0),
  };
}

// ---------------------------------------------------------------------------
// LEAN BODY MASS + FAT MASS from weight & body-fat %.
// ---------------------------------------------------------------------------
export function bodyComposition(weightKg, bodyFatPct) {
  if (!weightKg || bodyFatPct == null) return null;
  const fatMass = weightKg * (bodyFatPct / 100);
  const leanMass = weightKg - fatMass;
  return { fatMassKg: Math.round(fatMass * 10) / 10, leanMassKg: Math.round(leanMass * 10) / 10 };
}

// ---------------------------------------------------------------------------
// REALISTIC MUSCLE-GAIN RATE (Lyle McDonald / Alan Aragon models).
// Returns realistic lean-mass gain per MONTH (kg) given training age.
// Novice gain far faster than advanced; women ~half the male rate.
// ---------------------------------------------------------------------------
export function monthlyMuscleGainKg(experience = 'beginner', gender = 'male') {
  const male = { beginner: 1.0, novice: 1.0, intermediate: 0.5, advanced: 0.25, elite: 0.1 };
  const rate = male[experience] ?? 0.5;
  return gender === 'female' ? Math.round(rate * 0.5 * 100) / 100 : rate;
}

// Realistic fat-loss rate: 0.5-1% of bodyweight per week is sustainable.
// Higher body fat can lose faster; leaner people must go slower to keep muscle.
export function weeklyFatLossKg(weightKg, bodyFatPct, gender = 'male') {
  let pct; // % of bodyweight per week
  if (bodyFatPct == null) pct = 0.0075;
  else if (gender === 'male') {
    if (bodyFatPct > 25) pct = 0.011;
    else if (bodyFatPct > 18) pct = 0.009;
    else if (bodyFatPct > 12) pct = 0.007;
    else pct = 0.005;
  } else {
    if (bodyFatPct > 32) pct = 0.011;
    else if (bodyFatPct > 25) pct = 0.009;
    else if (bodyFatPct > 20) pct = 0.007;
    else pct = 0.005;
  }
  return Math.round(weightKg * pct * 100) / 100;
}

// ---------------------------------------------------------------------------
// HEALTHY WEIGHT RANGE (BMI 18.5-24.9) as a sanity band.
// ---------------------------------------------------------------------------
export function healthyWeightRange(heightCm) {
  const h = heightCm / 100;
  return {
    minKg: Math.round(18.5 * h * h * 10) / 10,
    maxKg: Math.round(24.9 * h * h * 10) / 10,
  };
}

// ---------------------------------------------------------------------------
// WATER TARGET (ml) - 35 ml/kg baseline + activity bump.
// ---------------------------------------------------------------------------
export function waterTargetLiters(weightKg, activityLevel = 'sedentary') {
  const bump = { sedentary: 0, lightly_active: 0.3, moderately_active: 0.5, very_active: 0.8, extremely_active: 1.0 }[activityLevel] || 0;
  return Math.round((weightKg * 0.035 + bump) * 10) / 10;
}

// ---------------------------------------------------------------------------
// IDEAL PROTEIN (g) for body recomposition: 1.6-2.2 g/kg lean mass (or BW).
// ---------------------------------------------------------------------------
export function proteinTargetG(weightKg, leanMassKg, goal = 'recomp') {
  const base = leanMassKg || weightKg;
  const mult = goal === 'cut' ? 2.4 : goal === 'bulk' ? 1.9 : 2.1;
  return Math.round((leanMassKg ? base * mult : weightKg * (mult - 0.2)));
}

export const CONSTANTS = { CM_PER_IN, KG_PER_LB, KCAL_PER_KG };

export default {
  navyBodyFat, frameSize, naturalPotential, maxMeasurements, bodyComposition,
  monthlyMuscleGainKg, weeklyFatLossKg, healthyWeightRange, waterTargetLiters,
  proteinTargetG, CONSTANTS,
};
