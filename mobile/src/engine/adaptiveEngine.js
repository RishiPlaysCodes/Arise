// ============================================================================
// ADAPTIVE ENGINE (Pure, on-device) - THE ACCURACY CORE
//
// A static TDEE formula is only a starting guess. Real accuracy comes from
// measuring the user's ACTUAL response: energy balance says
//
//     maintenance = average_daily_intake - (weight_change_kcal / days)
//
// By comparing logged calories against the smoothed weight trend over a
// rolling window, we derive the user's TRUE maintenance - automatically
// accounting for metabolic adaptation, NEAT changes, water noise, and
// individual variation. This is the same principle behind the most accurate
// apps on the market. Predictions then self-correct every check-in.
//
// Honesty note: this needs ~10-14 days of consistent logging to converge.
// Before that we fall back to the formula estimate and say so.
// ============================================================================

import { CONSTANTS } from './bodyMetrics';

const KCAL_PER_KG = CONSTANTS.KCAL_PER_KG;

// ---------------------------------------------------------------------------
// EXPONENTIAL MOVING AVERAGE of daily weights -> removes water/food noise.
// weights: [{ date: 'YYYY-MM-DD', weight_kg }] ascending. alpha ~0.25.
// Returns { trend: [{date, raw, ema}], current, oldest }.
// ---------------------------------------------------------------------------
export function weightTrend(weights, alpha = 0.25) {
  if (!weights || weights.length === 0) return { trend: [], current: null };
  const sorted = [...weights].sort((a, b) => a.log_date.localeCompare(b.log_date));
  let ema = sorted[0].weight_kg;
  const trend = sorted.map((w) => {
    ema = alpha * w.weight_kg + (1 - alpha) * ema;
    return { date: w.log_date, raw: w.weight_kg, ema: Math.round(ema * 100) / 100 };
  });
  return {
    trend,
    current: trend[trend.length - 1].ema,
    oldest: trend[0].ema,
    rawCurrent: sorted[sorted.length - 1].weight_kg,
  };
}

function daysBetween(d1, d2) {
  const ms = new Date(d2).getTime() - new Date(d1).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

// ---------------------------------------------------------------------------
// EMPIRICAL MAINTENANCE from real data.
// intakeLogs: [{ log_date, total_calories }] (days actually logged)
// weights: raw weight history. windowDays: rolling window (default 14).
// Returns { maintenance, confidence, daysOfData, avgIntake, trendChangeKg }.
// ---------------------------------------------------------------------------
export function empiricalMaintenance(intakeLogs, weights, windowDays = 14) {
  if (!intakeLogs || !weights || intakeLogs.length < 5 || weights.length < 2) {
    return { maintenance: null, confidence: 'insufficient', daysOfData: intakeLogs?.length || 0 };
  }

  // Restrict to the window
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const intake = intakeLogs.filter((l) => l.log_date >= cutoffStr && l.total_calories > 0);
  const w = weights.filter((x) => x.log_date >= cutoffStr);
  if (intake.length < 5 || w.length < 2) {
    // widen to all-time if window too sparse
    return allTimeMaintenance(intakeLogs, weights);
  }

  const { trend } = weightTrend(w);
  const startW = trend[0].ema;
  const endW = trend[trend.length - 1].ema;
  const spanDays = daysBetween(trend[0].date, trend[trend.length - 1].date);

  const avgIntake = intake.reduce((s, l) => s + l.total_calories, 0) / intake.length;
  const weightChangeKg = endW - startW;
  const dailyBalance = (weightChangeKg * KCAL_PER_KG) / spanDays; // +surplus / -deficit
  const maintenance = Math.round(avgIntake - dailyBalance);

  const confidence = intake.length >= 12 && spanDays >= 12 ? 'high'
    : intake.length >= 8 ? 'medium' : 'low';

  return {
    maintenance: Math.max(1000, maintenance),
    confidence,
    daysOfData: intake.length,
    avgIntake: Math.round(avgIntake),
    trendChangeKg: Math.round(weightChangeKg * 100) / 100,
    spanDays,
  };
}

function allTimeMaintenance(intakeLogs, weights) {
  const intake = intakeLogs.filter((l) => l.total_calories > 0);
  if (intake.length < 5 || weights.length < 2) {
    return { maintenance: null, confidence: 'insufficient', daysOfData: intake.length };
  }
  const { trend } = weightTrend(weights);
  const spanDays = daysBetween(trend[0].date, trend[trend.length - 1].date);
  const avgIntake = intake.reduce((s, l) => s + l.total_calories, 0) / intake.length;
  const changeKg = trend[trend.length - 1].ema - trend[0].ema;
  const maintenance = Math.round(avgIntake - (changeKg * KCAL_PER_KG) / spanDays);
  return {
    maintenance: Math.max(1000, maintenance),
    confidence: 'low', daysOfData: intake.length,
    avgIntake: Math.round(avgIntake), trendChangeKg: Math.round(changeKg * 100) / 100, spanDays,
  };
}

// ---------------------------------------------------------------------------
// RECALIBRATE the calorie target from the (possibly adaptive) maintenance.
// direction: 'cut' | 'bulk' | 'recomp'. weeklyRateKg is desired |rate|.
// ---------------------------------------------------------------------------
export function recalibrateTarget(maintenance, direction, weeklyRateKg, gender = 'male') {
  const dailyDelta = (weeklyRateKg * KCAL_PER_KG) / 7;
  let target;
  if (direction === 'cut') target = maintenance - dailyDelta;
  else if (direction === 'bulk') target = maintenance + dailyDelta;
  else target = maintenance;
  const floor = gender === 'male' ? 1500 : 1200;
  return Math.round(Math.max(target, floor));
}

// ---------------------------------------------------------------------------
// PROJECT goal date from the CURRENT real trend (self-correcting ETA).
// Uses actual observed weekly rate if available, else planned rate.
// ---------------------------------------------------------------------------
export function projectGoalDate({ currentWeightKg, targetWeightKg, observedWeeklyRateKg, plannedWeeklyRateKg }) {
  const remaining = targetWeightKg - currentWeightKg; // sign matters
  const rate = (observedWeeklyRateKg && Math.abs(observedWeeklyRateKg) > 0.05)
    ? observedWeeklyRateKg
    : plannedWeeklyRateKg;
  // If moving the wrong direction, flag it
  if (!rate || Math.sign(rate) !== Math.sign(remaining) && Math.abs(remaining) > 0.3) {
    return { weeks: null, onTrack: false, note: 'Current trend is not moving toward your goal.' };
  }
  const weeks = Math.ceil(Math.abs(remaining) / Math.abs(rate));
  const eta = new Date();
  eta.setDate(eta.getDate() + weeks * 7);
  return {
    weeks,
    days: weeks * 7,
    etaDate: eta.toISOString().split('T')[0],
    onTrack: true,
    usingRealData: !!(observedWeeklyRateKg && Math.abs(observedWeeklyRateKg) > 0.05),
  };
}

// Observed weekly rate (kg/week) from the smoothed trend over its span.
export function observedWeeklyRate(weights) {
  if (!weights || weights.length < 3) return null;
  const { trend } = weightTrend(weights);
  const spanDays = daysBetween(trend[0].date, trend[trend.length - 1].date);
  if (spanDays < 5) return null;
  const changeKg = trend[trend.length - 1].ema - trend[0].ema;
  return Math.round((changeKg / spanDays) * 7 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Full weekly check-in evaluation.
// ---------------------------------------------------------------------------
export function runCheckin({ body, weights, intakeLogs }) {
  const maint = empiricalMaintenance(intakeLogs, weights);
  const obsRate = observedWeeklyRate(weights);
  const direction = body.target_weight_kg < body.current_weight_kg ? 'cut'
    : body.target_weight_kg > body.current_weight_kg ? 'bulk' : 'recomp';
  const plannedRate = direction === 'cut' ? 0.7 : direction === 'bulk' ? 0.35 : 0;

  const usableMaintenance = maint.maintenance || body.tdee;
  const newTarget = recalibrateTarget(usableMaintenance, direction, plannedRate, body.gender);
  const projection = projectGoalDate({
    currentWeightKg: body.current_weight_kg,
    targetWeightKg: body.target_weight_kg,
    observedWeeklyRateKg: obsRate,
    plannedWeeklyRateKg: direction === 'cut' ? -plannedRate : plannedRate,
  });

  return {
    direction,
    empiricalMaintenance: maint.maintenance,
    formulaTDEE: body.tdee,
    usedMaintenance: usableMaintenance,
    confidence: maint.confidence,
    daysOfData: maint.daysOfData,
    observedWeeklyRateKg: obsRate,
    plannedWeeklyRateKg: direction === 'cut' ? -plannedRate : plannedRate,
    newCalorieTarget: newTarget,
    projection,
    message: buildMessage(maint, obsRate, direction),
  };
}

function buildMessage(maint, obsRate, direction) {
  if (maint.confidence === 'insufficient') {
    return 'Log your weight and meals for ~10-14 days so the System can learn your true metabolism and lock in accurate predictions.';
  }
  const parts = [];
  if (maint.confidence === 'high') parts.push('High-confidence calibration from your real data.');
  else parts.push('Calibrating from your data — keep logging to sharpen accuracy.');
  if (obsRate != null) {
    const dir = obsRate < 0 ? 'losing' : obsRate > 0 ? 'gaining' : 'holding';
    parts.push(`You are ${dir} ~${Math.abs(obsRate)} kg/week.`);
  }
  return parts.join(' ');
}

export default {
  weightTrend, empiricalMaintenance, recalibrateTarget,
  projectGoalDate, observedWeeklyRate, runCheckin,
};
