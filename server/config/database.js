const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'solo_levelling.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS player_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      hunter_name TEXT NOT NULL,
      rank TEXT DEFAULT 'E',
      level INTEGER DEFAULT 1,
      experience INTEGER DEFAULT 0,
      experience_to_next_level INTEGER DEFAULT 100,
      title TEXT DEFAULT 'Weakest Hunter',
      streak_days INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      total_quests_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS body_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      height_cm REAL NOT NULL,
      current_weight_kg REAL NOT NULL,
      target_weight_kg REAL,
      body_fat_percentage REAL,
      target_body_fat REAL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      activity_level TEXT DEFAULT 'sedentary',
      target_body_type TEXT NOT NULL,
      medical_conditions TEXT DEFAULT '[]',
      injuries TEXT DEFAULT '[]',
      bmi REAL,
      bmr REAL,
      tdee REAL,
      estimated_days_to_goal INTEGER,
      transformation_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_quests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      quest_date DATE NOT NULL,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date DATE NOT NULL,
      meal_type TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories REAL DEFAULT 0,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fats_g REAL DEFAULT 0,
      fiber_g REAL DEFAULT 0,
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'serving',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS diet_targets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      daily_calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fats_g REAL NOT NULL,
      fiber_g REAL DEFAULT 25,
      water_liters REAL DEFAULT 3,
      meals_per_day INTEGER DEFAULT 4,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS step_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date DATE NOT NULL,
      steps INTEGER DEFAULT 0,
      distance_km REAL DEFAULT 0,
      calories_burned REAL DEFAULT 0,
      active_minutes INTEGER DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, log_date)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date DATE NOT NULL,
      activity_type TEXT NOT NULL,
      activity_name TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 0,
      calories_burned REAL DEFAULT 0,
      sets INTEGER,
      reps INTEGER,
      weight_kg REAL,
      distance_km REAL,
      intensity TEXT DEFAULT 'moderate',
      notes TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS combat_training (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date DATE NOT NULL,
      combat_type TEXT NOT NULL,
      technique_name TEXT NOT NULL,
      rounds INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0,
      intensity TEXT DEFAULT 'moderate',
      calories_burned REAL DEFAULT 0,
      skill_level TEXT DEFAULT 'beginner',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS punishments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      punishment_date DATE NOT NULL,
      punishment_type TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_hours INTEGER DEFAULT 24,
      is_active INTEGER DEFAULT 1,
      triggered_by TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ends_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blocked_apps (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      app_name TEXT NOT NULL,
      blocked_until DATETIME NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      strength INTEGER DEFAULT 10,
      agility INTEGER DEFAULT 10,
      endurance INTEGER DEFAULT 10,
      vitality INTEGER DEFAULT 10,
      discipline INTEGER DEFAULT 10,
      combat_power INTEGER DEFAULT 10,
      intelligence INTEGER DEFAULT 10,
      perception INTEGER DEFAULT 10,
      stat_points_available INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      achievement_name TEXT NOT NULL,
      achievement_description TEXT NOT NULL,
      achievement_type TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS weight_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      log_date DATE NOT NULL,
      weight_kg REAL NOT NULL,
      body_fat_percentage REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_date DATE NOT NULL,
      meal_type TEXT NOT NULL,
      meal_name TEXT NOT NULL,
      ingredients TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fats_g REAL NOT NULL,
      preparation_time_minutes INTEGER,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_daily_quests_user_date ON daily_quests(user_id, quest_date);
    CREATE INDEX IF NOT EXISTS idx_diet_logs_user_date ON diet_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_step_logs_user_date ON step_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON activity_logs(user_id, log_date);
    CREATE INDEX IF NOT EXISTS idx_punishments_user_active ON punishments(user_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_weight_history_user ON weight_history(user_id, log_date);
  `);

  console.log('[DATABASE] Schema initialized successfully');
}

initializeDatabase();

module.exports = db;
