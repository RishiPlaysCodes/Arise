// ============================================================================
// SOLO LEVELLING - CORE CONSTANTS (Pure, framework-agnostic)
// Runs fully on-device. No network required.
// ============================================================================

export const RANKS = {
  E: { name: 'E-Rank', minLevel: 1, maxLevel: 10, title: 'Weakest Hunter', color: '#8b8b9e' },
  D: { name: 'D-Rank', minLevel: 11, maxLevel: 25, title: 'Novice Hunter', color: '#32CD32' },
  C: { name: 'C-Rank', minLevel: 26, maxLevel: 50, title: 'Intermediate Hunter', color: '#4169E1' },
  B: { name: 'B-Rank', minLevel: 51, maxLevel: 75, title: 'Advanced Hunter', color: '#a78bfa' },
  A: { name: 'A-Rank', minLevel: 76, maxLevel: 100, title: 'Elite Hunter', color: '#FF8C00' },
  S: { name: 'S-Rank', minLevel: 101, maxLevel: 150, title: 'National Level Hunter', color: '#ef4444' },
  SS: { name: 'SS-Rank', minLevel: 151, maxLevel: 999, title: 'Shadow Monarch', color: '#fbbf24' },
};

export const BODY_TYPES = {
  lean_athletic: {
    id: 'lean_athletic', name: 'Lean Athletic',
    description: 'Low body fat (8-12%), visible definition, functional strength. Soccer/swimmer build.',
    targetBodyFat: { male: 10, female: 18 }, example: 'Athletic footballer physique',
    icon: 'run-fast', metrics: { muscleMass: 'moderate', definition: 'high', flexibility: 'high' },
  },
  muscular_bulk: {
    id: 'muscular_bulk', name: 'Muscular & Bulky',
    description: 'High muscle mass, powerful size-focused build. Bodybuilder / strongman.',
    targetBodyFat: { male: 14, female: 22 }, example: 'Bodybuilder mass',
    icon: 'arm-flex', metrics: { muscleMass: 'very_high', definition: 'moderate', flexibility: 'moderate' },
  },
  aesthetic_v_taper: {
    id: 'aesthetic_v_taper', name: 'Aesthetic V-Taper',
    description: 'Wide shoulders, narrow waist, proportional. The classic aesthetic ideal.',
    targetBodyFat: { male: 10, female: 17 }, example: 'Classic physique competitor',
    icon: 'triangle-outline', metrics: { muscleMass: 'high', definition: 'very_high', flexibility: 'moderate' },
  },
  swimmers_build: {
    id: 'swimmers_build', name: "Swimmer's Build",
    description: 'Broad shoulders, lean torso, long muscle lines, elite cardio capacity.',
    targetBodyFat: { male: 9, female: 17 }, example: 'Olympic swimmer',
    icon: 'swim', metrics: { muscleMass: 'moderate', definition: 'high', flexibility: 'very_high' },
  },
  combat_fighter: {
    id: 'combat_fighter', name: 'Combat Fighter',
    description: 'Explosive power, functional muscle, agile and durable. Built for combat sports.',
    targetBodyFat: { male: 11, female: 19 }, example: 'MMA fighter',
    icon: 'boxing-glove', metrics: { muscleMass: 'high', definition: 'high', flexibility: 'high' },
  },
  calisthenics_master: {
    id: 'calisthenics_master', name: 'Calisthenics Master',
    description: 'Exceptional strength-to-weight ratio, gymnast physique, body-control mastery.',
    targetBodyFat: { male: 9, female: 16 }, example: 'Street workout athlete',
    icon: 'gymnastics', metrics: { muscleMass: 'moderate', definition: 'very_high', flexibility: 'very_high' },
  },
  powerlifter: {
    id: 'powerlifter', name: 'Powerlifter',
    description: 'Maximum raw strength, thick dense muscle, built to move heavy weight.',
    targetBodyFat: { male: 16, female: 24 }, example: 'Competitive powerlifter',
    icon: 'weight-lifter', metrics: { muscleMass: 'very_high', definition: 'low', flexibility: 'low' },
  },
  shredded_model: {
    id: 'shredded_model', name: 'Shredded / Model',
    description: 'Very low body fat, extreme definition, lean mass. Fitness-model look.',
    targetBodyFat: { male: 7, female: 15 }, example: 'Fitness cover model',
    icon: 'star-four-points', metrics: { muscleMass: 'moderate', definition: 'extreme', flexibility: 'moderate' },
  },
  functional_athlete: {
    id: 'functional_athlete', name: 'Functional Athlete',
    description: 'All-round fitness, CrossFit-style, good at everything.',
    targetBodyFat: { male: 12, female: 20 }, example: 'CrossFit competitor',
    icon: 'dumbbell', metrics: { muscleMass: 'high', definition: 'high', flexibility: 'high' },
  },
  endurance_runner: {
    id: 'endurance_runner', name: 'Endurance Runner',
    description: 'Lean, efficient, incredible cardio capacity, light optimized frame.',
    targetBodyFat: { male: 8, female: 16 }, example: 'Marathon runner',
    icon: 'run', metrics: { muscleMass: 'low', definition: 'high', flexibility: 'high' },
  },
  spartan_warrior: {
    id: 'spartan_warrior', name: 'Spartan Warrior',
    description: 'Battle-ready mix of strength, endurance and combat readiness.',
    targetBodyFat: { male: 11, female: 19 }, example: '300-style warrior build',
    icon: 'shield-sword', metrics: { muscleMass: 'high', definition: 'high', flexibility: 'moderate' },
  },
  superhero: {
    id: 'superhero', name: 'Superhero Build',
    description: 'Hollywood superhero physique — muscular, proportional, impressive.',
    targetBodyFat: { male: 10, female: 18 }, example: 'Movie superhero',
    icon: 'flash', metrics: { muscleMass: 'high', definition: 'high', flexibility: 'moderate' },
  },
};

export const ACTIVITY_LEVELS = {
  sedentary: { name: 'Sedentary', multiplier: 1.2, description: 'Little/no exercise, desk job' },
  lightly_active: { name: 'Lightly Active', multiplier: 1.375, description: 'Light exercise 1-3 days/week' },
  moderately_active: { name: 'Moderately Active', multiplier: 1.55, description: 'Moderate exercise 3-5 days/week' },
  very_active: { name: 'Very Active', multiplier: 1.725, description: 'Hard exercise 6-7 days/week' },
  extremely_active: { name: 'Extremely Active', multiplier: 1.9, description: 'Very hard exercise / physical job' },
};

export const COMBAT_TYPES = {
  boxing: { name: 'Boxing', caloriesPerMinute: 12 },
  muay_thai: { name: 'Muay Thai', caloriesPerMinute: 13 },
  bjj: { name: 'Brazilian Jiu-Jitsu', caloriesPerMinute: 10 },
  mma: { name: 'Mixed Martial Arts', caloriesPerMinute: 14 },
  wrestling: { name: 'Wrestling', caloriesPerMinute: 11 },
  karate: { name: 'Karate', caloriesPerMinute: 10 },
  kickboxing: { name: 'Kickboxing', caloriesPerMinute: 12 },
  krav_maga: { name: 'Krav Maga', caloriesPerMinute: 13 },
};

export const PUNISHMENT_TYPES = {
  SOCIAL_MEDIA_BLOCK: { id: 'social_media_block', name: 'Social Media Lockdown', description: 'Social media apps blocked', severity: 'high', defaultDurationHours: 24 },
  ENTERTAINMENT_BLOCK: { id: 'entertainment_block', name: 'Entertainment Blackout', description: 'Gaming/streaming apps blocked', severity: 'medium', defaultDurationHours: 12 },
  EXTRA_WORKOUT: { id: 'extra_workout', name: 'Penalty Dungeon', description: 'Extra workout required', severity: 'medium', defaultDurationHours: 6 },
  COLD_SHOWER: { id: 'cold_shower', name: 'Ice Penalty', description: '5-minute cold shower', severity: 'low', defaultDurationHours: 1 },
  XP_PENALTY: { id: 'xp_penalty', name: 'XP Drain', description: 'Lose experience points', severity: 'high', defaultDurationHours: 0 },
  RANK_THREAT: { id: 'rank_threat', name: 'Rank Demotion Warning', description: 'Continued failure = demotion', severity: 'critical', defaultDurationHours: 0 },
  FULL_DEVICE_BLOCK: { id: 'full_device_block', name: 'System Shutdown', description: 'App lockdown until redemption task done', severity: 'critical', defaultDurationHours: 24 },
};

export const SOCIAL_MEDIA_APPS = ['Instagram', 'Twitter/X', 'Facebook', 'TikTok', 'Snapchat', 'Reddit', 'YouTube'];
export const ENTERTAINMENT_APPS = ['Netflix', 'Disney+', 'Prime Video', 'Spotify', 'Games', 'Twitch'];

export const STAT_KEYS = ['strength', 'agility', 'endurance', 'vitality', 'discipline', 'combat_power', 'intelligence', 'perception'];

export function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function getRankFromLevel(level) {
  for (const [rank, data] of Object.entries(RANKS)) {
    if (level >= data.minLevel && level <= data.maxLevel) return rank;
  }
  return 'SS';
}

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
