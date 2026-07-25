// ============================================================================
// OFFLINE DATABASE - expo-sqlite (async API)
// The entire app works offline. This is the single source of truth on-device.
// ============================================================================

import * as SQLite from 'expo-sqlite';

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('sololevelling.db');
  await dbInstance.execAsync('PRAGMA journal_mode = WAL;');
  await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
  return dbInstance;
}

export async function initDatabase() {
  const db = await getDB();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS player_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hunter_name TEXT NOT NULL DEFAULT 'Hunter',
      rank TEXT NOT NULL DEFAULT 'E',
      level INTEGER NOT NULL DEFAULT 1,
      experience INTEGER NOT NULL DEFAULT 0,
      experience_to_next_level INTEGER NOT NULL DEFAULT 100,
      title TEXT NOT NULL DEFAULT 'Weakest Hunter',
      streak_days INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      total_quests_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS body_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      height_cm REAL NOT NULL,
      current_weight_kg REAL NOT NULL,
      target_weight_kg REAL,
      body_fat_percentage REAL,
      target_body_fat REAL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      activity_level TEXT NOT NULL DEFAULT 'sedentary',
      target_body_type TEXT NOT NULL,
      bmi REAL, bmr REAL, tdee REAL,
      estimated_days_to_goal INTEGER,
      daily_calories REAL, protein_g REAL, carbs_g REAL, fats_g REAL,
      fiber_g REAL DEFAULT 30, water_liters REAL DEFAULT 3.5,
      daily_step_target INTEGER DEFAULT 10000,
      transformation_start_date TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      strength INTEGER DEFAULT 10, agility INTEGER DEFAULT 10,
      endurance INTEGER DEFAULT 10, vitality INTEGER DEFAULT 10,
      discipline INTEGER DEFAULT 10, combat_power INTEGER DEFAULT 10,
      intelligence INTEGER DEFAULT 10, perception INTEGER DEFAULT 10,
      stat_points_available INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_quests (
      id TEXT PRIMARY KEY,
      quest_date TEXT NOT NULL,
      quest_type TEXT NOT NULL,
      quest_category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      unit TEXT NOT NULL,
      xp_reward INTEGER NOT NULL,
      is_completed INTEGER DEFAULT 0,
      is_bonus INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'normal',
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS diet_logs (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL DEFAULT 0, protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0, fats_g REAL DEFAULT 0, fiber_g REAL DEFAULT 0,
      quantity REAL DEFAULT 1, unit TEXT DEFAULT 'serving',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS step_logs (
      log_date TEXT PRIMARY KEY,
      steps INTEGER DEFAULT 0,
      distance_km REAL DEFAULT 0,
      calories_burned REAL DEFAULT 0,
      active_minutes INTEGER DEFAULT 0,
      sensor_baseline INTEGER,
      last_updated TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 0,
      calories_burned REAL DEFAULT 0,
      sets INTEGER, reps INTEGER, weight_kg REAL, distance_km REAL,
      intensity TEXT DEFAULT 'moderate',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS combat_training (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL,
      combat_type TEXT NOT NULL,
      technique_name TEXT NOT NULL,
      rounds INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      intensity TEXT DEFAULT 'moderate',
      calories_burned REAL DEFAULT 0,
      skill_level TEXT DEFAULT 'beginner',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS punishments (
      id TEXT PRIMARY KEY,
      punishment_date TEXT NOT NULL,
      punishment_type TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_hours INTEGER DEFAULT 24,
      is_active INTEGER DEFAULT 1,
      triggered_by TEXT NOT NULL,
      started_at TEXT DEFAULT (datetime('now')),
      ends_at TEXT NOT NULL,
      redemption_task TEXT,
      redeemed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blocked_apps (
      id TEXT PRIMARY KEY,
      app_name TEXT NOT NULL,
      blocked_until TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS weight_history (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      body_fat_percentage REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS day_processed (
      log_date TEXT PRIMARY KEY,
      completion_rate INTEGER,
      completed INTEGER,
      total INTEGER,
      processed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity TEXT NOT NULL,
      op TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL,
      neck_cm REAL, chest_cm REAL, waist_cm REAL, hip_cm REAL,
      left_bicep_cm REAL, right_bicep_cm REAL, forearm_cm REAL,
      left_thigh_cm REAL, right_thigh_cm REAL, calf_cm REAL,
      shoulder_cm REAL, wrist_cm REAL, ankle_cm REAL,
      body_fat_percentage REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id TEXT PRIMARY KEY,
      checkin_date TEXT NOT NULL,
      empirical_maintenance INTEGER,
      formula_tdee INTEGER,
      used_maintenance INTEGER,
      confidence TEXT,
      days_of_data INTEGER,
      observed_weekly_rate REAL,
      new_calorie_target INTEGER,
      projected_weeks INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS progress_photos (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL,
      uri TEXT NOT NULL,
      pose TEXT DEFAULT 'front',
      weight_kg REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS sleep_logs (
      log_date TEXT PRIMARY KEY,
      hours REAL DEFAULT 0,
      quality TEXT,
      last_updated TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      log_date TEXT PRIMARY KEY,
      liters REAL DEFAULT 0,
      last_updated TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_quests_date ON daily_quests(quest_date);
    CREATE INDEX IF NOT EXISTS idx_diet_date ON diet_logs(log_date);
    CREATE INDEX IF NOT EXISTS idx_activity_date ON activity_logs(log_date);
    CREATE INDEX IF NOT EXISTS idx_combat_date ON combat_training(log_date);
    CREATE INDEX IF NOT EXISTS idx_punish_active ON punishments(is_active);
    CREATE INDEX IF NOT EXISTS idx_weight_date ON weight_history(log_date);
    CREATE INDEX IF NOT EXISTS idx_measure_date ON body_measurements(log_date);
  `);

  await runMigrations(db);

  // Ensure singleton stats row exists
  const stats = await db.getFirstAsync('SELECT id FROM player_stats WHERE id = 1');
  if (!stats) {
    await db.runAsync('INSERT INTO player_stats (id) VALUES (1)');
  }
  return db;
}

// Additive, idempotent column migrations for existing installs.
async function runMigrations(db) {
  const cols = await db.getAllAsync("PRAGMA table_info(body_profile)");
  const existing = new Set(cols.map((c) => c.name));
  const additions = [
    ['neck_cm', 'REAL'], ['waist_cm', 'REAL'], ['hip_cm', 'REAL'],
    ['wrist_cm', 'REAL'], ['ankle_cm', 'REAL'],
    ['experience', "TEXT DEFAULT 'beginner'"],
    ['dietary_prefs', "TEXT DEFAULT '[]'"],
    ['bf_method', "TEXT DEFAULT 'estimated'"],
    ['adaptive_maintenance', 'INTEGER'],
    ['natural_potential_kg', 'REAL'],
    ['goal_direction', 'TEXT'],
  ];
  for (const [name, type] of additions) {
    if (!existing.has(name)) {
      try { await db.execAsync(`ALTER TABLE body_profile ADD COLUMN ${name} ${type};`); } catch (e) { /* already exists */ }
    }
  }
}

// Utility: generate a lightweight unique id (no external dep, offline-safe)
export function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function resetDatabase() {
  const db = await getDB();
  await db.execAsync(`
    DELETE FROM player_profile; DELETE FROM body_profile; DELETE FROM daily_quests;
    DELETE FROM diet_logs; DELETE FROM step_logs; DELETE FROM activity_logs;
    DELETE FROM combat_training; DELETE FROM punishments; DELETE FROM blocked_apps;
    DELETE FROM weight_history; DELETE FROM achievements; DELETE FROM day_processed;
    DELETE FROM sync_queue; DELETE FROM body_measurements; DELETE FROM checkins;
    DELETE FROM progress_photos; DELETE FROM settings; DELETE FROM sleep_logs; DELETE FROM water_logs;
    UPDATE player_stats SET strength=10, agility=10, endurance=10,
    vitality=10, discipline=10, combat_power=10, intelligence=10, perception=10, stat_points_available=0 WHERE id=1;
  `);
}
