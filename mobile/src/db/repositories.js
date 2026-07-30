// ============================================================================
// REPOSITORIES - All data access + business logic (offline-first)
// Wires the pure engines to the on-device SQLite store.
// ============================================================================

import { getDB, uid } from './database';
import TransformationEngine from '../engine/transformationEngine';
import CombatEngine from '../engine/combatEngine';
import BodyMetrics from '../engine/bodyMetrics';
import AdaptiveEngine from '../engine/adaptiveEngine';
import {
  getXPForLevel, getRankFromLevel, RANKS, todayStr,
  PUNISHMENT_TYPES, SOCIAL_MEDIA_APPS, ENTERTAINMENT_APPS,
} from '../engine/constants';

const TITLES = {
  E: 'Weakest Hunter', D: 'Novice Hunter', C: 'Intermediate Hunter',
  B: 'Advanced Hunter', A: 'Elite Hunter', S: 'National Level Hunter', SS: 'Shadow Monarch',
};

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------
export const ProfileRepo = {
  async get() {
    const db = await getDB();
    return db.getFirstAsync('SELECT * FROM player_profile WHERE id = 1');
  },

  async getStats() {
    const db = await getDB();
    return db.getFirstAsync('SELECT * FROM player_stats WHERE id = 1');
  },

  async getBody() {
    const db = await getDB();
    return db.getFirstAsync('SELECT * FROM body_profile WHERE id = 1');
  },

  async createHunter(hunterName) {
    const db = await getDB();
    const existing = await this.get();
    if (existing) return existing;
    await db.runAsync(
      `INSERT INTO player_profile (id, hunter_name, rank, level, experience, experience_to_next_level, title)
       VALUES (1, ?, 'E', 1, 0, 100, 'Weakest Hunter')`,
      [hunterName || 'Hunter']
    );
    return this.get();
  },

  async setupBody(input) {
    const db = await getDB();
    const {
      heightCm, currentWeightKg, age, gender, activityLevel,
      targetBodyType, bodyFatPercentage,
      neckCm, waistCm, hipCm, wristCm, ankleCm,
      experience = 'beginner', dietaryPrefs = [],
    } = input;

    // Prefer the accurate US Navy tape body-fat when measurements are provided.
    const navyBF = BodyMetrics.navyBodyFat({ gender, heightCm, neckCm, waistCm, hipCm });
    const effectiveBF = bodyFatPercentage || navyBF || null;
    const bfMethod = bodyFatPercentage ? 'user' : navyBF ? 'navy' : 'estimated';

    const plan = TransformationEngine.generateTransformationPlan({
      heightCm, currentWeightKg, age, gender,
      activityLevel: activityLevel || 'sedentary', targetBodyType,
      bodyFatPercentage: effectiveBF, experience,
    });

    // Natural muscular potential (Casey Butt) when wrist+ankle provided.
    const potential = BodyMetrics.naturalPotential({
      heightCm, wristCm, ankleCm, targetBodyFat: plan.targets.bodyFat, gender,
    });

    const bmi = TransformationEngine.calculateBMI(currentWeightKg, heightCm);
    const bmr = effectiveBF
      ? TransformationEngine.calculateBMRKatchMcArdle(currentWeightKg, effectiveBF)
      : TransformationEngine.calculateBMR(currentWeightKg, heightCm, age, gender);
    const tdee = TransformationEngine.calculateTDEE(bmr, activityLevel || 'sedentary');

    const existing = await this.getBody();
    const storedBF = effectiveBF || plan.currentStats.estimatedBodyFat;
    const params = [
      heightCm, currentWeightKg, plan.targets.weight,
      storedBF, plan.targets.bodyFat,
      age, gender, activityLevel || 'sedentary', targetBodyType,
      Math.round(bmi * 10) / 10, Math.round(bmr), Math.round(tdee),
      plan.targets.estimatedDays,
      plan.nutrition.dailyCalories, plan.nutrition.protein, plan.nutrition.carbs,
      plan.nutrition.fats, plan.nutrition.fiber, plan.nutrition.water,
      plan.training.dailyStepTarget,
      neckCm ?? null, waistCm ?? null, hipCm ?? null, wristCm ?? null, ankleCm ?? null,
      experience, JSON.stringify(dietaryPrefs || []), bfMethod,
      potential?.maxLeanBodyMassKg ?? null, plan.direction,
    ];

    if (existing) {
      await db.runAsync(
        `UPDATE body_profile SET height_cm=?, current_weight_kg=?, target_weight_kg=?,
         body_fat_percentage=?, target_body_fat=?, age=?, gender=?, activity_level=?,
         target_body_type=?, bmi=?, bmr=?, tdee=?, estimated_days_to_goal=?,
         daily_calories=?, protein_g=?, carbs_g=?, fats_g=?, fiber_g=?, water_liters=?,
         daily_step_target=?, neck_cm=?, waist_cm=?, hip_cm=?, wrist_cm=?, ankle_cm=?,
         experience=?, dietary_prefs=?, bf_method=?, natural_potential_kg=?, goal_direction=?,
         updated_at=datetime('now') WHERE id=1`,
        params
      );
    } else {
      await db.runAsync(
        `INSERT INTO body_profile (id, height_cm, current_weight_kg, target_weight_kg,
         body_fat_percentage, target_body_fat, age, gender, activity_level, target_body_type,
         bmi, bmr, tdee, estimated_days_to_goal, daily_calories, protein_g, carbs_g, fats_g,
         fiber_g, water_liters, daily_step_target, neck_cm, waist_cm, hip_cm, wrist_cm, ankle_cm,
         experience, dietary_prefs, bf_method, natural_potential_kg, goal_direction)
         VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params
      );
    }

    // Log initial weight (+ body fat) and initial measurements if provided.
    await db.runAsync(
      `INSERT INTO weight_history (id, log_date, weight_kg, body_fat_percentage) VALUES (?,?,?,?)`,
      [uid(), todayStr(), currentWeightKg, storedBF || null]
    );
    if (neckCm || waistCm || hipCm || wristCm || ankleCm) {
      await db.runAsync(
        `INSERT INTO body_measurements (id, log_date, neck_cm, waist_cm, hip_cm, wrist_cm, ankle_cm, body_fat_percentage)
         VALUES (?,?,?,?,?,?,?,?)`,
        [uid(), todayStr(), neckCm ?? null, waistCm ?? null, hipCm ?? null, wristCm ?? null, ankleCm ?? null, storedBF || null]
      );
    }

    return { plan, body: await this.getBody(), potential, navyBF };
  },

  async getTransformationPlan() {
    const body = await this.getBody();
    if (!body) return null;
    return TransformationEngine.generateTransformationPlan({
      heightCm: body.height_cm, currentWeightKg: body.current_weight_kg,
      age: body.age, gender: body.gender, activityLevel: body.activity_level,
      targetBodyType: body.target_body_type, bodyFatPercentage: body.body_fat_percentage,
      experience: body.experience || 'beginner',
    });
  },

  async getNaturalPotential() {
    const body = await this.getBody();
    if (!body || !body.wrist_cm || !body.ankle_cm) return null;
    return BodyMetrics.naturalPotential({
      heightCm: body.height_cm, wristCm: body.wrist_cm, ankleCm: body.ankle_cm,
      targetBodyFat: body.target_body_fat || 10, gender: body.gender,
    });
  },

  async updateWeight(weightKg, bodyFatPercentage) {
    const db = await getDB();
    await db.runAsync(
      `UPDATE body_profile SET current_weight_kg=?, body_fat_percentage=?, updated_at=datetime('now') WHERE id=1`,
      [weightKg, bodyFatPercentage ?? null]
    );
    const body = await this.getBody();
    const bmi = TransformationEngine.calculateBMI(weightKg, body.height_cm);
    await db.runAsync('UPDATE body_profile SET bmi=? WHERE id=1', [Math.round(bmi * 10) / 10]);
    await db.runAsync(
      `INSERT INTO weight_history (id, log_date, weight_kg, body_fat_percentage) VALUES (?,?,?,?)`,
      [uid(), todayStr(), weightKg, bodyFatPercentage ?? null]
    );
    return this.getBody();
  },

  async getWeightHistory(limit = 90) {
    const db = await getDB();
    return db.getAllAsync('SELECT * FROM weight_history ORDER BY log_date DESC LIMIT ?', [limit]);
  },

  async allocateStats(alloc) {
    const db = await getDB();
    const stats = await this.getStats();
    const total = Object.values(alloc).reduce((s, v) => s + (v || 0), 0);
    if (total > stats.stat_points_available) {
      throw new Error(`Not enough points. Available: ${stats.stat_points_available}`);
    }
    await db.runAsync(
      `UPDATE player_stats SET
        strength=strength+?, agility=agility+?, endurance=endurance+?, vitality=vitality+?,
        discipline=discipline+?, combat_power=combat_power+?, intelligence=intelligence+?,
        perception=perception+?, stat_points_available=stat_points_available-? WHERE id=1`,
      [
        alloc.strength || 0, alloc.agility || 0, alloc.endurance || 0, alloc.vitality || 0,
        alloc.discipline || 0, alloc.combat_power || 0, alloc.intelligence || 0,
        alloc.perception || 0, total,
      ]
    );
    return this.getStats();
  },

  // XP + level-up engine. Returns { leveledUp, newLevel, newRank }
  async awardXP(xp) {
    const db = await getDB();
    const p = await this.get();
    if (!p) return null;
    let newXP = p.experience + xp;
    let level = p.level;
    let xpToNext = p.experience_to_next_level;
    let leveledUp = false;
    while (newXP >= xpToNext) {
      newXP -= xpToNext;
      level++;
      xpToNext = getXPForLevel(level);
      leveledUp = true;
    }
    const rank = getRankFromLevel(level);
    if (leveledUp) {
      await db.runAsync('UPDATE player_stats SET stat_points_available = stat_points_available + ? WHERE id=1', [3 * (level - p.level)]);
    }
    await db.runAsync(
      `UPDATE player_profile SET experience=?, level=?, rank=?, experience_to_next_level=?, title=?, updated_at=datetime('now') WHERE id=1`,
      [newXP, level, rank, xpToNext, TITLES[rank], p.id]
    );
    return { leveledUp, newLevel: level, newRank: rank, prevLevel: p.level, prevRank: p.rank };
  },

  async drainXP(amount) {
    const db = await getDB();
    const p = await this.get();
    if (!p) return;
    const newXP = Math.max(0, p.experience - amount);
    await db.runAsync('UPDATE player_profile SET experience=? WHERE id=1', [newXP]);
  },
};

// ---------------------------------------------------------------------------
// QUESTS
// ---------------------------------------------------------------------------
export const QuestRepo = {
  async ensureToday() {
    const db = await getDB();
    const date = todayStr();
    const count = await db.getFirstAsync('SELECT COUNT(*) as c FROM daily_quests WHERE quest_date = ?', [date]);
    if (count.c > 0) return this.getToday();

    const plan = await ProfileRepo.getTransformationPlan();
    const profile = await ProfileRepo.get();
    if (!plan || !profile) return [];

    const templates = TransformationEngine.generateDailyQuestTemplates(plan, new Date().getDay(), profile.level);
    for (const q of templates) {
      await db.runAsync(
        `INSERT INTO daily_quests (id, quest_date, quest_type, quest_category, title, description, target_value, unit, xp_reward, difficulty, is_bonus)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [uid(), date, q.type, q.category, q.title, q.description, q.targetValue, q.unit, q.xpReward, q.difficulty, q.isBonus]
      );
    }
    return this.getToday();
  },

  async getToday() {
    const db = await getDB();
    return db.getAllAsync(
      'SELECT * FROM daily_quests WHERE quest_date = ? ORDER BY is_bonus ASC, quest_category ASC',
      [todayStr()]
    );
  },

  async setProgress(questId, value) {
    const db = await getDB();
    const q = await db.getFirstAsync('SELECT * FROM daily_quests WHERE id = ?', [questId]);
    if (!q || q.is_completed) return { alreadyDone: !!q?.is_completed };
    const current = Math.min(value, q.target_value);
    const done = value >= q.target_value;
    await db.runAsync(
      'UPDATE daily_quests SET current_value=?, is_completed=?, completed_at=? WHERE id=?',
      [current, done ? 1 : 0, done ? new Date().toISOString() : null, questId]
    );
    let levelInfo = null;
    if (done) levelInfo = await ProfileRepo.awardXP(q.xp_reward);
    return { done, xp: done ? q.xp_reward : 0, levelInfo };
  },

  async addProgress(questId, delta) {
    const db = await getDB();
    const q = await db.getFirstAsync('SELECT * FROM daily_quests WHERE id = ?', [questId]);
    if (!q) return null;
    return this.setProgress(questId, q.current_value + delta);
  },

  async complete(questId) {
    const db = await getDB();
    const q = await db.getFirstAsync('SELECT * FROM daily_quests WHERE id = ?', [questId]);
    if (!q) throw new Error('Quest not found');
    if (q.is_completed) return { alreadyDone: true };
    await db.runAsync(
      'UPDATE daily_quests SET current_value=target_value, is_completed=1, completed_at=? WHERE id=?',
      [new Date().toISOString(), questId]
    );
    const levelInfo = await ProfileRepo.awardXP(q.xp_reward);
    return { done: true, xp: q.xp_reward, levelInfo };
  },

  // Sync category-based quest progress (called by diet/steps/combat repos)
  async syncCategory(category, matcher) {
    const db = await getDB();
    const quests = await db.getAllAsync(
      'SELECT * FROM daily_quests WHERE quest_date = ? AND quest_category = ? AND is_completed = 0',
      [todayStr(), category]
    );
    const results = [];
    for (const q of quests) {
      const { value, complete } = matcher(q);
      if (value === undefined) continue;
      const current = Math.min(value, q.target_value);
      const done = complete !== undefined ? complete : value >= q.target_value;
      await db.runAsync(
        'UPDATE daily_quests SET current_value=?, is_completed=?, completed_at=? WHERE id=?',
        [current, done ? 1 : 0, done ? new Date().toISOString() : null, q.id]
      );
      if (done) {
        const levelInfo = await ProfileRepo.awardXP(q.xp_reward);
        results.push({ questId: q.id, xp: q.xp_reward, levelInfo });
      }
    }
    return results;
  },

  async getHistory(days = 7) {
    const db = await getDB();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return db.getAllAsync(
      `SELECT quest_date,
        COUNT(*) as total_quests,
        SUM(CASE WHEN is_completed=1 THEN 1 ELSE 0 END) as completed_quests,
        SUM(CASE WHEN is_completed=1 THEN xp_reward ELSE 0 END) as xp_earned
       FROM daily_quests WHERE quest_date >= ? GROUP BY quest_date ORDER BY quest_date DESC`,
      [todayStr(start)]
    );
  },
};

// ---------------------------------------------------------------------------
// DIET
// ---------------------------------------------------------------------------
export const DietRepo = {
  async log(entry) {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO diet_logs (id, log_date, meal_type, food_name, calories, protein_g, carbs_g, fats_g, fiber_g, quantity, unit)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uid(), todayStr(), entry.mealType, entry.foodName,
        entry.calories || 0, entry.protein || 0, entry.carbs || 0, entry.fats || 0,
        entry.fiber || 0, entry.quantity || 1, entry.unit || 'serving',
      ]
    );
    return this.syncQuests();
  },

  async totals(date = todayStr()) {
    const db = await getDB();
    const r = await db.getFirstAsync(
      `SELECT COALESCE(SUM(calories),0) total_calories, COALESCE(SUM(protein_g),0) total_protein,
        COALESCE(SUM(carbs_g),0) total_carbs, COALESCE(SUM(fats_g),0) total_fats,
        COALESCE(SUM(fiber_g),0) total_fiber, COUNT(*) total_items
       FROM diet_logs WHERE log_date = ?`, [date]
    );
    return r;
  },

  async today() {
    const db = await getDB();
    const meals = await db.getAllAsync('SELECT * FROM diet_logs WHERE log_date = ? ORDER BY created_at ASC', [todayStr()]);
    const totals = await this.totals();
    const body = await ProfileRepo.getBody();
    const targets = body ? {
      daily_calories: body.daily_calories, protein_g: body.protein_g,
      carbs_g: body.carbs_g, fats_g: body.fats_g, water_liters: body.water_liters,
    } : null;
    return { meals, totals, targets };
  },

  async remove(id) {
    const db = await getDB();
    await db.runAsync('DELETE FROM diet_logs WHERE id = ?', [id]);
    return this.syncQuests();
  },

  async syncQuests() {
    const totals = await this.totals();
    const rewards = [];
    // protein quests
    rewards.push(...await QuestRepo.syncCategory('diet', (q) => {
      if (q.quest_type === 'nutrition') return { value: totals.total_protein };
      if (q.quest_type === 'calories') {
        const within = Math.abs(totals.total_calories - q.target_value) <= 100;
        const enough = totals.total_calories >= q.target_value * 0.8;
        return { value: totals.total_calories, complete: within && enough };
      }
      return {};
    }));
    return { totals, rewards };
  },

  async mealPlan() {
    const body = await ProfileRepo.getBody();
    if (!body) return null;
    let prefs = {};
    try {
      const raw = body.dietary_prefs ? JSON.parse(body.dietary_prefs) : [];
      // dietary_prefs stored as ['diet:veg','allergy:nuts',...] or {diet, allergies}
      if (Array.isArray(raw)) {
        const diet = raw.find((x) => typeof x === 'string' && x.startsWith('diet:'));
        prefs.diet = diet ? diet.split(':')[1] : 'non_veg';
        prefs.allergies = raw.filter((x) => typeof x === 'string' && x.startsWith('allergy:')).map((x) => x.split(':')[1]);
      } else if (raw && typeof raw === 'object') {
        prefs = raw;
      }
    } catch { prefs = {}; }
    const dietPref = await SettingsRepo.get('diet_pref', null);
    if (dietPref) prefs.diet = dietPref;
    const allergyPref = await SettingsRepo.get('allergies', null);
    if (allergyPref) prefs.allergies = allergyPref.split(',').map((s) => s.trim()).filter(Boolean);

    const meals = TransformationEngine.generateMealPlan({
      dailyCalories: body.daily_calories, protein: body.protein_g,
      carbs: body.carbs_g, fats: body.fats_g,
    }, prefs);
    return {
      meals, prefs,
      totalCalories: meals.reduce((s, m) => s + m.calories, 0),
      totalProtein: meals.reduce((s, m) => s + m.protein, 0),
    };
  },
};

// ---------------------------------------------------------------------------
// STEPS
// ---------------------------------------------------------------------------
export const StepRepo = {
  async today() {
    const db = await getDB();
    const row = await db.getFirstAsync('SELECT * FROM step_logs WHERE log_date = ?', [todayStr()]);
    const body = await ProfileRepo.getBody();
    const target = body?.daily_step_target || 10000;
    const steps = row?.steps || 0;
    return {
      ...(row || { steps: 0, distance_km: 0, calories_burned: 0, active_minutes: 0 }),
      target, progress: target ? Math.round((steps / target) * 100) : 0,
    };
  },

  computeMetrics(steps, heightCm = 175, weightKg = 70) {
    const strideM = (0.415 * heightCm) / 100;
    const distanceKm = Math.round(((steps * strideM) / 1000) * 100) / 100;
    const calories = Math.round(0.57 * weightKg * distanceKm);
    const activeMinutes = Math.round(steps / 100);
    return { distanceKm, calories, activeMinutes };
  },

  // Set today's absolute step total (from hardware sensor)
  async setSteps(steps, sensorBaseline = null) {
    const db = await getDB();
    const body = await ProfileRepo.getBody();
    const { distanceKm, calories, activeMinutes } = this.computeMetrics(
      steps, body?.height_cm || 175, body?.current_weight_kg || 70
    );
    const date = todayStr();
    const existing = await db.getFirstAsync('SELECT log_date FROM step_logs WHERE log_date = ?', [date]);
    if (existing) {
      await db.runAsync(
        `UPDATE step_logs SET steps=?, distance_km=?, calories_burned=?, active_minutes=?,
         sensor_baseline=COALESCE(?, sensor_baseline), last_updated=datetime('now') WHERE log_date=?`,
        [steps, distanceKm, calories, activeMinutes, sensorBaseline, date]
      );
    } else {
      await db.runAsync(
        `INSERT INTO step_logs (log_date, steps, distance_km, calories_burned, active_minutes, sensor_baseline)
         VALUES (?,?,?,?,?,?)`,
        [date, steps, distanceKm, calories, activeMinutes, sensorBaseline]
      );
    }
    const rewards = await QuestRepo.syncCategory('steps', () => ({ value: steps }));
    return { steps, distanceKm, calories, activeMinutes, rewards };
  },

  async getBaseline() {
    const db = await getDB();
    const row = await db.getFirstAsync('SELECT sensor_baseline, steps FROM step_logs WHERE log_date = ?', [todayStr()]);
    return row || null;
  },

  async addManual(delta) {
    const cur = await this.today();
    return this.setSteps((cur.steps || 0) + delta);
  },

  async weekly() {
    const db = await getDB();
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const logs = await db.getAllAsync('SELECT * FROM step_logs WHERE log_date >= ? ORDER BY log_date ASC', [todayStr(start)]);
    const totalSteps = logs.reduce((s, l) => s + l.steps, 0);
    return {
      dailyLogs: logs,
      totalSteps,
      averageSteps: logs.length ? Math.round(totalSteps / logs.length) : 0,
      totalDistanceKm: Math.round(logs.reduce((s, l) => s + l.distance_km, 0) * 100) / 100,
      totalCaloriesBurned: Math.round(logs.reduce((s, l) => s + l.calories_burned, 0)),
    };
  },
};

// ---------------------------------------------------------------------------
// ACTIVITY
// ---------------------------------------------------------------------------
export const ActivityRepo = {
  async log(a) {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO activity_logs (id, log_date, activity_type, activity_name, duration_minutes, calories_burned, sets, reps, weight_kg, distance_km, intensity, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uid(), todayStr(), a.activityType, a.activityName, a.durationMinutes || 0,
        a.caloriesBurned || 0, a.sets ?? null, a.reps ?? null, a.weightKg ?? null,
        a.distanceKm ?? null, a.intensity || 'moderate', a.notes || '',
      ]
    );
    const rewards = await QuestRepo.syncCategory('exercise', (q) => {
      if (q.unit === 'session') return { value: q.target_value };
      if (q.unit === 'minutes') return { value: q.current_value + (a.durationMinutes || 0) };
      return {};
    });
    return { rewards };
  },

  async today() {
    const db = await getDB();
    const activities = await db.getAllAsync('SELECT * FROM activity_logs WHERE log_date = ? ORDER BY created_at DESC', [todayStr()]);
    return {
      activities,
      totalCaloriesBurned: activities.reduce((s, a) => s + (a.calories_burned || 0), 0),
      totalMinutes: activities.reduce((s, a) => s + (a.duration_minutes || 0), 0),
    };
  },
};

// ---------------------------------------------------------------------------
// COMBAT
// ---------------------------------------------------------------------------
export const CombatRepo = {
  session(combatType, skillLevel, duration) {
    return CombatEngine.generateSession(combatType, skillLevel, duration);
  },

  async log(data) {
    const db = await getDB();
    const cals = CombatEngine.caloriesFor(data.combatType, data.durationMinutes, data.intensity);
    await db.runAsync(
      `INSERT INTO combat_training (id, log_date, combat_type, technique_name, rounds, duration_minutes, intensity, calories_burned, skill_level, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        uid(), todayStr(), data.combatType, data.techniqueName || data.combatType,
        data.rounds || 0, data.durationMinutes, data.intensity || 'moderate',
        cals, data.skillLevel || 'beginner', data.notes || '',
      ]
    );
    // also record as activity
    await ActivityRepo.log({
      activityType: 'combat', activityName: `${data.combatType} Training`,
      durationMinutes: data.durationMinutes, caloriesBurned: cals, intensity: data.intensity,
    });
    const rewards = await QuestRepo.syncCategory('combat', (q) => ({ value: q.current_value + data.durationMinutes }));
    return { caloriesBurned: cals, rewards };
  },

  async stats() {
    const db = await getDB();
    const byType = await db.getAllAsync(
      `SELECT combat_type, COUNT(*) total_sessions, SUM(duration_minutes) total_minutes,
        SUM(calories_burned) total_calories, SUM(rounds) total_rounds
       FROM combat_training GROUP BY combat_type`
    );
    const overall = await db.getFirstAsync(
      `SELECT COUNT(*) total_sessions, COALESCE(SUM(duration_minutes),0) total_minutes,
        COALESCE(SUM(calories_burned),0) total_calories FROM combat_training`
    );
    return { byType, overall };
  },
};

// ---------------------------------------------------------------------------
// PUNISHMENT
// ---------------------------------------------------------------------------
let _punishCleanupTs = 0;
export const PunishmentRepo = {
  // Tidy-up of expired flags — THROTTLED (max once/60s) so it never floods the
  // DB with writes on every screen focus. Reads below stay correct regardless
  // because they filter by time directly.
  async deactivateExpired(force = false) {
    const now = Date.now();
    if (!force && now - _punishCleanupTs < 60000) return;
    _punishCleanupTs = now;
    try {
      const db = await getDB();
      await db.runAsync("UPDATE punishments SET is_active=0 WHERE is_active=1 AND ends_at <= datetime('now')");
      await db.runAsync("UPDATE blocked_apps SET is_active=0 WHERE is_active=1 AND blocked_until <= datetime('now')");
    } catch (e) { /* noop */ }
  },

  async getActive() {
    this.deactivateExpired(); // fire-and-forget, throttled
    const db = await getDB();
    // Read-only + time-filtered = always correct, zero writes on the hot path.
    return db.getAllAsync("SELECT * FROM punishments WHERE is_active=1 AND ends_at > datetime('now') ORDER BY started_at DESC");
  },

  async getBlockedApps() {
    const db = await getDB();
    return db.getAllAsync("SELECT * FROM blocked_apps WHERE is_active=1 AND blocked_until > datetime('now') ORDER BY app_name ASC");
  },

  async status() {
    const active = await this.getActive();
    const blocked = await this.getBlockedApps();
    const order = ['low', 'medium', 'high', 'critical'];
    let severity = 'low';
    for (const p of active) {
      const t = PUNISHMENT_TYPES[p.punishment_type];
      if (t && order.indexOf(t.severity) > order.indexOf(severity)) severity = t.severity;
    }
    const messages = {
      low: 'Minor penalty active. Complete tasks to avoid escalation.',
      medium: 'Restrictions active. Some apps blocked. Prove your discipline.',
      high: 'Severe punishment active. Social media locked. Focus on redemption.',
      critical: 'SYSTEM LOCKDOWN. Critical failure. Complete the redemption task to unlock.',
    };
    return {
      isRestricted: active.length > 0,
      activePunishments: active.length,
      blockedApps: blocked.length,
      highestSeverity: severity,
      punishments: active,
      blocked,
      hasLockdown: active.some((p) => p.punishment_type === 'FULL_DEVICE_BLOCK' && !p.redeemed),
      message: active.length > 0 ? messages[severity] : 'No active punishments. Stay disciplined, Hunter.',
    };
  },

  async apply(type, reason, durationHours = null, redemptionTask = null) {
    const db = await getDB();
    const def = PUNISHMENT_TYPES[type];
    if (!def) throw new Error('Invalid punishment');
    const hours = durationHours ?? def.defaultDurationHours;
    const id = uid();
    const now = new Date();
    const ends = new Date(now.getTime() + hours * 3600 * 1000);
    await db.runAsync(
      `INSERT INTO punishments (id, punishment_date, punishment_type, description, duration_hours, triggered_by, started_at, ends_at, redemption_task)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, todayStr(), type, def.description, hours, reason, now.toISOString(), ends.toISOString(), redemptionTask]
    );
    if (type === 'SOCIAL_MEDIA_BLOCK' || type === 'FULL_DEVICE_BLOCK' || type === 'ENTERTAINMENT_BLOCK') {
      await this.blockApps(type, ends);
    }
    return { id, type, endsAt: ends.toISOString(), reason };
  },

  async blockApps(type, until) {
    const db = await getDB();
    let apps;
    if (type === 'FULL_DEVICE_BLOCK') apps = [...SOCIAL_MEDIA_APPS, ...ENTERTAINMENT_APPS];
    else if (type === 'SOCIAL_MEDIA_BLOCK') apps = SOCIAL_MEDIA_APPS;
    else apps = ENTERTAINMENT_APPS;
    await db.runAsync('UPDATE blocked_apps SET is_active=0');
    for (const a of apps) {
      await db.runAsync('INSERT INTO blocked_apps (id, app_name, blocked_until, is_active) VALUES (?,?,?,1)', [uid(), a, until.toISOString()]);
    }
    // If the native accessibility blocker is installed, enforce system-wide too.
    try {
      const AppBlockerService = require('../services/appBlocker').default;
      const { toPackageNames } = require('../services/appBlocker');
      if (AppBlockerService.isNativeAvailable()) {
        await AppBlockerService.setBlockedApps(toPackageNames(apps), until.toISOString());
      }
    } catch (e) { /* native module absent — in-app lockdown still applies */ }
    return apps;
  },

  async redeemLockdown() {
    const db = await getDB();
    await db.runAsync("UPDATE punishments SET is_active=0, redeemed=1 WHERE punishment_type='FULL_DEVICE_BLOCK' AND is_active=1");
    await db.runAsync('UPDATE blocked_apps SET is_active=0');
    try {
      const AppBlockerService = require('../services/appBlocker').default;
      if (AppBlockerService.isNativeAvailable()) await AppBlockerService.clearBlocks();
    } catch (e) { /* noop */ }
    return true;
  },

  async history(limit = 30) {
    const db = await getDB();
    return db.getAllAsync('SELECT * FROM punishments ORDER BY started_at DESC LIMIT ?', [limit]);
  },
};

// ---------------------------------------------------------------------------
// DAY PROCESSING (streaks + punishment evaluation)
// ---------------------------------------------------------------------------
export const DayProcessor = {
  async alreadyProcessed(date) {
    const db = await getDB();
    const r = await db.getFirstAsync('SELECT log_date FROM day_processed WHERE log_date = ?', [date]);
    return !!r;
  },

  // Evaluate a given date (defaults to yesterday). Idempotent per date.
  async processDate(date) {
    const db = await getDB();
    if (await this.alreadyProcessed(date)) return { skipped: true };

    const quests = await db.getAllAsync('SELECT * FROM daily_quests WHERE quest_date = ? AND is_bonus = 0', [date]);
    if (quests.length === 0) {
      await db.runAsync('INSERT OR REPLACE INTO day_processed (log_date, completion_rate, completed, total) VALUES (?,?,?,?)', [date, 0, 0, 0]);
      return { noQuests: true };
    }

    const completed = quests.filter((q) => q.is_completed).length;
    const total = quests.length;
    const rate = completed / total;
    const failed = total - completed;

    const profile = await ProfileRepo.get();
    let streak = profile.streak_days;

    if (rate >= 0.7) {
      streak += 1;
      await db.runAsync(
        `UPDATE player_profile SET streak_days=?, longest_streak=MAX(longest_streak,?),
         total_quests_completed=total_quests_completed+?, updated_at=datetime('now') WHERE id=1`,
        [streak, streak, completed]
      );
    } else {
      streak = 0;
      await db.runAsync("UPDATE player_profile SET streak_days=0, updated_at=datetime('now') WHERE id=1");
    }

    const applied = [];
    if (rate < 0.7) {
      const punishments = TransformationEngine.determinePunishment(failed, total, streak, profile.level);
      for (const p of punishments) {
        if (p.type === 'XP_PENALTY') {
          await ProfileRepo.drainXP(p.xpLoss || 0);
          applied.push({ type: 'XP_PENALTY', xpLost: p.xpLoss, reason: p.reason });
        } else {
          const redemption = p.type === 'FULL_DEVICE_BLOCK' ? 'Complete a 30-minute workout to unlock' : null;
          const res = await PunishmentRepo.apply(p.type, p.reason, p.durationHours, redemption);
          applied.push(res);
        }
      }
    }

    await db.runAsync('INSERT OR REPLACE INTO day_processed (log_date, completion_rate, completed, total) VALUES (?,?,?,?)', [date, Math.round(rate * 100), completed, total]);

    return { date, completionRate: Math.round(rate * 100), completed, total, streak, punishments: applied };
  },

  // Called on app open: process any unprocessed past days (offline catch-up)
  async catchUp() {
    const db = await getDB();
    const today = todayStr();
    const rows = await db.getAllAsync(
      'SELECT DISTINCT quest_date FROM daily_quests WHERE quest_date < ? ORDER BY quest_date ASC',
      [today]
    );
    const results = [];
    for (const r of rows) {
      if (!(await this.alreadyProcessed(r.quest_date))) {
        results.push(await this.processDate(r.quest_date));
      }
    }
    return results;
  },
};


// ---------------------------------------------------------------------------
// MEASUREMENTS - circumference tracking over time (accurate progress signal)
// ---------------------------------------------------------------------------
export const MeasurementRepo = {
  async log(m) {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO body_measurements (id, log_date, neck_cm, chest_cm, waist_cm, hip_cm,
        left_bicep_cm, right_bicep_cm, forearm_cm, left_thigh_cm, right_thigh_cm, calf_cm,
        shoulder_cm, wrist_cm, ankle_cm, body_fat_percentage)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        uid(), todayStr(), m.neck ?? null, m.chest ?? null, m.waist ?? null, m.hip ?? null,
        m.leftBicep ?? null, m.rightBicep ?? null, m.forearm ?? null, m.leftThigh ?? null,
        m.rightThigh ?? null, m.calf ?? null, m.shoulder ?? null, m.wrist ?? null,
        m.ankle ?? null, m.bodyFat ?? null,
      ]
    );

    // If neck+waist(+hip) present, recompute Navy body fat and persist to profile.
    const body = await ProfileRepo.getBody();
    if (body && m.neck && m.waist && (body.gender === 'male' || m.hip)) {
      const bf = BodyMetrics.navyBodyFat({
        gender: body.gender, heightCm: body.height_cm,
        neckCm: m.neck, waistCm: m.waist, hipCm: m.hip,
      });
      if (bf) {
        const db2 = await getDB();
        await db2.runAsync(
          "UPDATE body_profile SET body_fat_percentage=?, bf_method='navy', neck_cm=?, waist_cm=?, hip_cm=COALESCE(?,hip_cm), updated_at=datetime('now') WHERE id=1",
          [bf, m.neck, m.waist, m.hip ?? null]
        );
      }
    }
    return this.latest();
  },

  async latest() {
    const db = await getDB();
    return db.getFirstAsync('SELECT * FROM body_measurements ORDER BY log_date DESC, created_at DESC LIMIT 1');
  },

  async history(limit = 60) {
    const db = await getDB();
    return db.getAllAsync('SELECT * FROM body_measurements ORDER BY log_date DESC LIMIT ?', [limit]);
  },

  // Compare latest vs oldest to show change per site.
  async progress() {
    const db = await getDB();
    const rows = await db.getAllAsync('SELECT * FROM body_measurements ORDER BY log_date ASC');
    if (rows.length < 2) return null;
    const first = rows[0];
    const last = rows[rows.length - 1];
    const sites = ['neck_cm', 'chest_cm', 'waist_cm', 'hip_cm', 'left_bicep_cm', 'right_bicep_cm', 'left_thigh_cm', 'calf_cm', 'shoulder_cm'];
    const deltas = {};
    for (const s of sites) {
      if (first[s] != null && last[s] != null) {
        deltas[s] = Math.round((last[s] - first[s]) * 10) / 10;
      }
    }
    return { first, last, deltas };
  },
};

// ---------------------------------------------------------------------------
// CHECK-IN - weekly adaptive recalibration (self-correcting accuracy)
// ---------------------------------------------------------------------------
export const CheckinRepo = {
  async run(apply = true) {
    const body = await ProfileRepo.getBody();
    if (!body) return null;
    const weights = await ProfileRepo.getWeightHistory(120);
    const intakeLogs = await DietRepo.dailyIntakeHistory(30);
    const result = AdaptiveEngine.runCheckin({ body, weights, intakeLogs });

    if (apply && result.newCalorieTarget) {
      // Recompute macros around the new calorie target, keep protein high.
      const db = await getDB();
      const proteinG = BodyMetrics.proteinTargetG(
        body.current_weight_kg,
        BodyMetrics.bodyComposition(body.current_weight_kg, body.body_fat_percentage)?.leanMassKg,
        result.direction
      );
      const proteinCals = proteinG * 4;
      const fatCals = result.newCalorieTarget * 0.25;
      const fatsG = Math.round(fatCals / 9);
      const carbsG = Math.max(Math.round((result.newCalorieTarget - proteinCals - fatCals) / 4), 50);
      await db.runAsync(
        `UPDATE body_profile SET daily_calories=?, protein_g=?, carbs_g=?, fats_g=?,
         adaptive_maintenance=?, estimated_days_to_goal=COALESCE(?, estimated_days_to_goal),
         updated_at=datetime('now') WHERE id=1`,
        [
          result.newCalorieTarget, proteinG, carbsG, fatsG,
          result.empiricalMaintenance ?? null, result.projection?.days ?? null,
        ]
      );
      await db.runAsync(
        `INSERT INTO checkins (id, checkin_date, empirical_maintenance, formula_tdee, used_maintenance,
          confidence, days_of_data, observed_weekly_rate, new_calorie_target, projected_weeks)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          uid(), todayStr(), result.empiricalMaintenance ?? null, result.formulaTDEE,
          result.usedMaintenance, result.confidence, result.daysOfData,
          result.observedWeeklyRateKg ?? null, result.newCalorieTarget, result.projection?.weeks ?? null,
        ]
      );
    }
    return result;
  },

  async last() {
    const db = await getDB();
    return db.getFirstAsync('SELECT * FROM checkins ORDER BY created_at DESC LIMIT 1');
  },

  async history(limit = 20) {
    const db = await getDB();
    return db.getAllAsync('SELECT * FROM checkins ORDER BY created_at DESC LIMIT ?', [limit]);
  },
};

// ---------------------------------------------------------------------------
// WATER + SLEEP quick loggers (feed hydration/sleep quests)
// ---------------------------------------------------------------------------
export const WaterRepo = {
  async today() {
    const db = await getDB();
    const row = await db.getFirstAsync('SELECT * FROM water_logs WHERE log_date = ?', [todayStr()]);
    return row || { log_date: todayStr(), liters: 0 };
  },
  async add(liters) {
    const db = await getDB();
    const cur = await this.today();
    const total = Math.round((cur.liters + liters) * 100) / 100;
    await db.runAsync(
      `INSERT INTO water_logs (log_date, liters, last_updated) VALUES (?,?,datetime('now'))
       ON CONFLICT(log_date) DO UPDATE SET liters=?, last_updated=datetime('now')`,
      [todayStr(), total, total]
    );
    const rewards = await QuestRepo.syncCategory('hydration', () => ({ value: total }));
    return { liters: total, rewards };
  },
};

export const SleepRepo = {
  async today() {
    const db = await getDB();
    const row = await db.getFirstAsync('SELECT * FROM sleep_logs WHERE log_date = ?', [todayStr()]);
    return row || { log_date: todayStr(), hours: 0 };
  },
  async set(hours, quality = null) {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO sleep_logs (log_date, hours, quality, last_updated) VALUES (?,?,?,datetime('now'))
       ON CONFLICT(log_date) DO UPDATE SET hours=?, quality=?, last_updated=datetime('now')`,
      [todayStr(), hours, quality, hours, quality]
    );
    const rewards = await QuestRepo.syncCategory('sleep', () => ({ value: hours }));
    return { hours, rewards };
  },
};

// ---------------------------------------------------------------------------
// SETTINGS (key/value)
// ---------------------------------------------------------------------------
export const SettingsRepo = {
  async get(key, fallback = null) {
    const db = await getDB();
    const r = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
    return r ? r.value : fallback;
  },
  async set(key, value) {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO settings (key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=?`,
      [key, String(value), String(value)]
    );
  },
};

// ---------------------------------------------------------------------------
// ACHIEVEMENTS - unlockable badges. Checked after key events.
// ---------------------------------------------------------------------------
const ACHIEVEMENT_DEFS = [
  { id: 'first_quest', name: 'First Steps', desc: 'Complete your first quest', test: (c) => c.totalQuests >= 1 },
  { id: 'streak_7', name: 'Week Warrior', desc: '7-day streak', test: (c) => c.streak >= 7 },
  { id: 'streak_30', name: 'Unbreakable', desc: '30-day streak', test: (c) => c.streak >= 30 },
  { id: 'streak_100', name: 'Monarch\'s Will', desc: '100-day streak', test: (c) => c.streak >= 100 },
  { id: 'level_10', name: 'D-Rank Rising', desc: 'Reach Level 10', test: (c) => c.level >= 10 },
  { id: 'level_25', name: 'C-Rank Hunter', desc: 'Reach Level 25', test: (c) => c.level >= 25 },
  { id: 'level_50', name: 'B-Rank Elite', desc: 'Reach Level 50', test: (c) => c.level >= 50 },
  { id: 'level_100', name: 'S-Rank Legend', desc: 'Reach Level 100', test: (c) => c.level >= 100 },
  { id: 'quests_100', name: 'Century', desc: 'Complete 100 quests total', test: (c) => c.totalQuests >= 100 },
  { id: 'combat_10', name: 'Fighter', desc: '10 combat sessions', test: (c) => c.combatSessions >= 10 },
  { id: 'steps_1m', name: 'Marathoner', desc: '1,000,000 lifetime steps', test: (c) => c.lifetimeSteps >= 1000000 },
];

export const AchievementRepo = {
  async unlocked() {
    const db = await getDB();
    return db.getAllAsync('SELECT * FROM achievements ORDER BY unlocked_at DESC');
  },

  // Evaluate all achievement conditions; unlock any newly-earned ones.
  async check() {
    const db = await getDB();
    const profile = await ProfileRepo.get();
    if (!profile) return [];
    const combat = await db.getFirstAsync('SELECT COUNT(*) c FROM combat_training');
    const steps = await db.getFirstAsync('SELECT COALESCE(SUM(steps),0) s FROM step_logs');
    const ctx = {
      level: profile.level,
      streak: profile.streak_days,
      totalQuests: profile.total_quests_completed,
      combatSessions: combat?.c || 0,
      lifetimeSteps: steps?.s || 0,
    };
    const already = new Set((await this.unlocked()).map((a) => a.id));
    const newly = [];
    for (const def of ACHIEVEMENT_DEFS) {
      if (!already.has(def.id) && def.test(ctx)) {
        await db.runAsync('INSERT OR IGNORE INTO achievements (id, name, description) VALUES (?,?,?)', [def.id, def.name, def.desc]);
        newly.push(def);
      }
    }
    return newly;
  },

  allDefs() {
    return ACHIEVEMENT_DEFS.map(({ id, name, desc }) => ({ id, name, desc }));
  },
};

// ---------------------------------------------------------------------------
// Extend DietRepo with daily intake history (needed by the adaptive engine).
// ---------------------------------------------------------------------------
DietRepo.dailyIntakeHistory = async function (days = 30) {
  const db = await getDB();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return db.getAllAsync(
    `SELECT log_date, SUM(calories) as total_calories
     FROM diet_logs WHERE log_date >= ? GROUP BY log_date ORDER BY log_date ASC`,
    [todayStr(start)]
  );
};


// ---------------------------------------------------------------------------
// STRENGTH / 1RM TRACKING (progressive overload)
// Epley formula: 1RM = weight * (1 + reps/30)
// ---------------------------------------------------------------------------
export const StrengthRepo = {
  estimate1RM(weightKg, reps) {
    if (!weightKg || !reps) return 0;
    if (reps === 1) return Math.round(weightKg * 10) / 10;
    return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
  },

  async log({ exercise, sets, reps, weightKg, notes }) {
    const db = await getDB();
    const oneRm = this.estimate1RM(weightKg, reps);
    await db.runAsync(
      `INSERT INTO strength_logs (id, log_date, exercise, sets, reps, weight_kg, estimated_1rm, notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [uid(), todayStr(), exercise, sets || 1, reps || 1, weightKg || 0, oneRm, notes || '']
    );
    // Log as an activity so it counts toward exercise quests.
    const rewards = await QuestRepo.syncCategory('exercise', (q) => {
      if (q.unit === 'session') return { value: q.target_value };
      return {};
    });
    return { estimated1RM: oneRm, rewards };
  },

  async history(exercise = null, limit = 100) {
    const db = await getDB();
    if (exercise) {
      return db.getAllAsync('SELECT * FROM strength_logs WHERE exercise = ? ORDER BY log_date DESC, created_at DESC LIMIT ?', [exercise, limit]);
    }
    return db.getAllAsync('SELECT * FROM strength_logs ORDER BY created_at DESC LIMIT ?', [limit]);
  },

  async exercises() {
    const db = await getDB();
    const rows = await db.getAllAsync('SELECT DISTINCT exercise FROM strength_logs ORDER BY exercise ASC');
    return rows.map((r) => r.exercise);
  },

  // Personal records per exercise (max estimated 1RM + best set).
  async personalRecords() {
    const db = await getDB();
    return db.getAllAsync(
      `SELECT exercise, MAX(estimated_1rm) as best_1rm, MAX(weight_kg) as top_weight, COUNT(*) as sessions
       FROM strength_logs GROUP BY exercise ORDER BY best_1rm DESC`
    );
  },

  // 1RM progression over time for a given exercise (for charts).
  async progression(exercise) {
    const db = await getDB();
    return db.getAllAsync(
      `SELECT log_date, MAX(estimated_1rm) as one_rm FROM strength_logs
       WHERE exercise = ? GROUP BY log_date ORDER BY log_date ASC`, [exercise]
    );
  },
};

// ---------------------------------------------------------------------------
// PROGRESS PHOTOS (local URIs; never uploaded unless user enables sync)
// ---------------------------------------------------------------------------
export const PhotoRepo = {
  async add(uri, pose = 'front', weightKg = null) {
    const db = await getDB();
    await db.runAsync(
      'INSERT INTO progress_photos (id, log_date, uri, pose, weight_kg) VALUES (?,?,?,?,?)',
      [uid(), todayStr(), uri, pose, weightKg]
    );
  },
  async all() {
    const db = await getDB();
    return db.getAllAsync('SELECT * FROM progress_photos ORDER BY log_date DESC, created_at DESC');
  },
  async remove(id) {
    const db = await getDB();
    await db.runAsync('DELETE FROM progress_photos WHERE id = ?', [id]);
  },
};

// ---------------------------------------------------------------------------
// EXPORT - dump all user data to CSV/JSON strings (offline, no upload)
// ---------------------------------------------------------------------------
export const ExportRepo = {
  async allData() {
    const db = await getDB();
    const tables = ['player_profile', 'body_profile', 'player_stats', 'daily_quests',
      'diet_logs', 'step_logs', 'activity_logs', 'combat_training', 'weight_history',
      'body_measurements', 'checkins', 'strength_logs', 'sleep_logs', 'water_logs', 'achievements'];
    const out = {};
    for (const t of tables) {
      out[t] = await db.getAllAsync(`SELECT * FROM ${t}`);
    }
    return out;
  },

  toCSV(rows) {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [headers.join(',')];
    for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(','));
    return lines.join('\n');
  },

  async weightHistoryCSV() {
    const db = await getDB();
    const rows = await db.getAllAsync('SELECT log_date, weight_kg, body_fat_percentage FROM weight_history ORDER BY log_date ASC');
    return this.toCSV(rows);
  },
};
