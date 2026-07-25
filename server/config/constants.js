// Solo Leveling Rank System
const RANKS = {
  E: { name: 'E-Rank', minLevel: 1, maxLevel: 10, title: 'Weakest Hunter', color: '#808080' },
  D: { name: 'D-Rank', minLevel: 11, maxLevel: 25, title: 'Novice Hunter', color: '#32CD32' },
  C: { name: 'C-Rank', minLevel: 26, maxLevel: 50, title: 'Intermediate Hunter', color: '#4169E1' },
  B: { name: 'B-Rank', minLevel: 51, maxLevel: 75, title: 'Advanced Hunter', color: '#9400D3' },
  A: { name: 'A-Rank', minLevel: 76, maxLevel: 100, title: 'Elite Hunter', color: '#FF8C00' },
  S: { name: 'S-Rank', minLevel: 101, maxLevel: 150, title: 'National Level Hunter', color: '#FF0000' },
  SS: { name: 'SS-Rank', minLevel: 151, maxLevel: 200, title: 'Shadow Monarch', color: '#000000' },
};

// Body Types with detailed descriptions
const BODY_TYPES = {
  lean_athletic: {
    id: 'lean_athletic',
    name: 'Lean Athletic',
    description: 'Low body fat (8-12%), visible muscle definition, functional strength. Think: soccer player, swimmer.',
    targetBodyFat: { male: 10, female: 18 },
    muscleEmphasis: 'balanced',
    trainingFocus: 'cardio_strength_mix',
    example: 'Cristiano Ronaldo / Serena Williams body type',
    metrics: { muscleMass: 'moderate', definition: 'high', flexibility: 'high' }
  },
  muscular_bulk: {
    id: 'muscular_bulk',
    name: 'Muscular & Bulky',
    description: 'High muscle mass, powerful build, size-focused. Think: bodybuilder, strongman.',
    targetBodyFat: { male: 14, female: 22 },
    muscleEmphasis: 'hypertrophy',
    trainingFocus: 'heavy_lifting',
    example: 'Chris Hemsworth / Gina Carano body type',
    metrics: { muscleMass: 'very_high', definition: 'moderate', flexibility: 'moderate' }
  },
  aesthetic_v_taper: {
    id: 'aesthetic_v_taper',
    name: 'Aesthetic V-Taper',
    description: 'Wide shoulders, narrow waist, proportional physique. The classic aesthetic ideal.',
    targetBodyFat: { male: 10, female: 17 },
    muscleEmphasis: 'upper_body_width',
    trainingFocus: 'aesthetic_proportions',
    example: 'Zyzz / Classic physique competitor',
    metrics: { muscleMass: 'high', definition: 'very_high', flexibility: 'moderate' }
  },
  swimmers_build: {
    id: 'swimmers_build',
    name: "Swimmer's Build",
    description: 'Broad shoulders, lean torso, long muscle lines, excellent cardio capacity.',
    targetBodyFat: { male: 9, female: 17 },
    muscleEmphasis: 'upper_back_shoulders',
    trainingFocus: 'endurance_strength',
    example: 'Michael Phelps / Katie Ledecky body type',
    metrics: { muscleMass: 'moderate', definition: 'high', flexibility: 'very_high' }
  },
  combat_fighter: {
    id: 'combat_fighter',
    name: 'Combat Fighter',
    description: 'Explosive power, functional muscle, agile and durable. Built for combat sports.',
    targetBodyFat: { male: 11, female: 19 },
    muscleEmphasis: 'functional_power',
    trainingFocus: 'combat_conditioning',
    example: 'Conor McGregor / Ronda Rousey body type',
    metrics: { muscleMass: 'high', definition: 'high', flexibility: 'high' }
  },
  calisthenics_master: {
    id: 'calisthenics_master',
    name: 'Calisthenics Master',
    description: 'Exceptional strength-to-weight ratio, gymnast-like physique, body control mastery.',
    targetBodyFat: { male: 9, female: 16 },
    muscleEmphasis: 'relative_strength',
    trainingFocus: 'bodyweight_mastery',
    example: 'Gymnast / Parkour athlete body type',
    metrics: { muscleMass: 'moderate', definition: 'very_high', flexibility: 'very_high' }
  },
  powerlifter: {
    id: 'powerlifter',
    name: 'Powerlifter',
    description: 'Maximum raw strength, thick dense muscle, built for lifting heavy.',
    targetBodyFat: { male: 16, female: 24 },
    muscleEmphasis: 'compound_strength',
    trainingFocus: 'strength_focused',
    example: 'Larry Wheels / Stefi Cohen body type',
    metrics: { muscleMass: 'very_high', definition: 'low', flexibility: 'low' }
  },
  shredded_model: {
    id: 'shredded_model',
    name: 'Shredded / Model',
    description: 'Very low body fat, extreme definition, lean muscle mass. Fashion/fitness model look.',
    targetBodyFat: { male: 7, female: 15 },
    muscleEmphasis: 'lean_mass',
    trainingFocus: 'cutting_maintaining',
    example: 'David Laid / Fitness model body type',
    metrics: { muscleMass: 'moderate', definition: 'extreme', flexibility: 'moderate' }
  },
  functional_athlete: {
    id: 'functional_athlete',
    name: 'Functional Athlete',
    description: 'All-round fitness, CrossFit-style, good at everything, jack of all trades.',
    targetBodyFat: { male: 12, female: 20 },
    muscleEmphasis: 'balanced_functional',
    trainingFocus: 'crossfit_style',
    example: 'Rich Froning / Tia-Clair Toomey body type',
    metrics: { muscleMass: 'high', definition: 'high', flexibility: 'high' }
  },
  endurance_runner: {
    id: 'endurance_runner',
    name: 'Endurance Runner',
    description: 'Lean, efficient, incredible cardio capacity, light frame optimized for distance.',
    targetBodyFat: { male: 8, female: 16 },
    muscleEmphasis: 'minimal_efficient',
    trainingFocus: 'endurance_focused',
    example: 'Eliud Kipchoge / Marathon runner body type',
    metrics: { muscleMass: 'low', definition: 'high', flexibility: 'high' }
  },
  spartan_warrior: {
    id: 'spartan_warrior',
    name: 'Spartan Warrior',
    description: 'Battle-ready physique, mix of strength, endurance, and combat readiness. Versatile warrior.',
    targetBodyFat: { male: 11, female: 19 },
    muscleEmphasis: 'warrior_balanced',
    trainingFocus: 'warrior_training',
    example: 'Gerard Butler in 300 / Athletic warrior build',
    metrics: { muscleMass: 'high', definition: 'high', flexibility: 'moderate' }
  },
  superhero: {
    id: 'superhero',
    name: 'Superhero Build',
    description: 'Hollywood superhero physique - muscular, proportional, impressive but achievable.',
    targetBodyFat: { male: 10, female: 18 },
    muscleEmphasis: 'movie_star',
    trainingFocus: 'hypertrophy_aesthetics',
    example: 'Henry Cavill Superman / Gal Gadot Wonder Woman',
    metrics: { muscleMass: 'high', definition: 'high', flexibility: 'moderate' }
  }
};

// Activity Levels
const ACTIVITY_LEVELS = {
  sedentary: { name: 'Sedentary', multiplier: 1.2, description: 'Little to no exercise, desk job' },
  lightly_active: { name: 'Lightly Active', multiplier: 1.375, description: 'Light exercise 1-3 days/week' },
  moderately_active: { name: 'Moderately Active', multiplier: 1.55, description: 'Moderate exercise 3-5 days/week' },
  very_active: { name: 'Very Active', multiplier: 1.725, description: 'Hard exercise 6-7 days/week' },
  extremely_active: { name: 'Extremely Active', multiplier: 1.9, description: 'Very hard exercise, physical job' }
};

// Quest Categories
const QUEST_CATEGORIES = {
  EXERCISE: 'exercise',
  CARDIO: 'cardio',
  DIET: 'diet',
  STEPS: 'steps',
  COMBAT: 'combat',
  FLEXIBILITY: 'flexibility',
  HYDRATION: 'hydration',
  SLEEP: 'sleep',
  MENTAL: 'mental'
};

// Combat Sports Types
const COMBAT_TYPES = {
  boxing: { name: 'Boxing', caloriesPerMinute: 12, skills: ['jab', 'cross', 'hook', 'uppercut', 'footwork', 'head_movement', 'combinations'] },
  muay_thai: { name: 'Muay Thai', caloriesPerMinute: 13, skills: ['elbow', 'knee', 'clinch', 'teep', 'roundhouse_kick', 'low_kick'] },
  bjj: { name: 'Brazilian Jiu-Jitsu', caloriesPerMinute: 10, skills: ['guard', 'mount', 'submissions', 'sweeps', 'escapes', 'takedowns'] },
  mma: { name: 'Mixed Martial Arts', caloriesPerMinute: 14, skills: ['striking', 'grappling', 'wrestling', 'ground_and_pound', 'cage_work'] },
  wrestling: { name: 'Wrestling', caloriesPerMinute: 11, skills: ['takedowns', 'pins', 'escapes', 'throws', 'clinch_work'] },
  karate: { name: 'Karate', caloriesPerMinute: 10, skills: ['kata', 'kumite', 'kicks', 'blocks', 'strikes', 'stances'] },
  kickboxing: { name: 'Kickboxing', caloriesPerMinute: 12, skills: ['roundhouse', 'front_kick', 'side_kick', 'combinations', 'footwork'] },
  krav_maga: { name: 'Krav Maga', caloriesPerMinute: 13, skills: ['self_defense', 'disarms', 'strikes', 'ground_defense', 'multiple_attackers'] }
};

// Punishment Types
const PUNISHMENT_TYPES = {
  SOCIAL_MEDIA_BLOCK: {
    id: 'social_media_block',
    name: 'Social Media Lockdown',
    description: 'All social media access blocked for the punishment duration',
    severity: 'high',
    defaultDurationHours: 24
  },
  ENTERTAINMENT_BLOCK: {
    id: 'entertainment_block',
    name: 'Entertainment Blackout',
    description: 'No gaming, streaming, or entertainment apps',
    severity: 'medium',
    defaultDurationHours: 12
  },
  EXTRA_WORKOUT: {
    id: 'extra_workout',
    name: 'Penalty Dungeon',
    description: 'Additional workout session required before day ends',
    severity: 'medium',
    defaultDurationHours: 6
  },
  COLD_SHOWER: {
    id: 'cold_shower',
    name: 'Ice Penalty',
    description: '5-minute cold shower as punishment',
    severity: 'low',
    defaultDurationHours: 1
  },
  XP_PENALTY: {
    id: 'xp_penalty',
    name: 'XP Drain',
    description: 'Lose experience points for failed quests',
    severity: 'high',
    defaultDurationHours: 0
  },
  RANK_THREAT: {
    id: 'rank_threat',
    name: 'Rank Demotion Warning',
    description: '3 consecutive failures = rank demotion',
    severity: 'critical',
    defaultDurationHours: 0
  },
  FULL_DEVICE_BLOCK: {
    id: 'full_device_block',
    name: 'System Shutdown',
    description: 'Complete device lockdown except essential apps (calls, emergencies)',
    severity: 'critical',
    defaultDurationHours: 24
  }
};

// XP Requirements per level
function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

// Get rank from level
function getRankFromLevel(level) {
  for (const [rank, data] of Object.entries(RANKS)) {
    if (level >= data.minLevel && level <= data.maxLevel) {
      return rank;
    }
  }
  return 'SS';
}

module.exports = {
  RANKS,
  BODY_TYPES,
  ACTIVITY_LEVELS,
  QUEST_CATEGORIES,
  COMBAT_TYPES,
  PUNISHMENT_TYPES,
  getXPForLevel,
  getRankFromLevel
};
