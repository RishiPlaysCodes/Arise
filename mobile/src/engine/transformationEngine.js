// ============================================================================
// TRANSFORMATION ENGINE (Pure, on-device AI)
// Scientific formulas: Mifflin-St Jeor, Katch-McArdle, Navy body-fat estimate.
// 100% deterministic. Runs offline. No external calls.
// ============================================================================

import { BODY_TYPES, ACTIVITY_LEVELS } from './constants';
import BodyMetrics from './bodyMetrics';

export const TransformationEngine = {
  calculateBMR(weightKg, heightCm, age, gender) {
    return gender === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  },

  calculateBMRKatchMcArdle(weightKg, bodyFatPercentage) {
    const leanMass = weightKg * (1 - bodyFatPercentage / 100);
    return 370 + 21.6 * leanMass;
  },

  calculateTDEE(bmr, activityLevel) {
    const m = ACTIVITY_LEVELS[activityLevel]?.multiplier || 1.2;
    return bmr * m;
  },

  calculateBMI(weightKg, heightCm) {
    const h = heightCm / 100;
    return weightKg / (h * h);
  },

  estimateBodyFat(gender, weightKg, heightCm, age) {
    const bmi = this.calculateBMI(weightKg, heightCm);
    const bf = gender === 'male'
      ? 1.2 * bmi + 0.23 * age - 16.2
      : 1.2 * bmi + 0.23 * age - 5.4;
    return Math.max(4, Math.min(bf, 55));
  },

  calculateTargetWeight(heightCm, gender, targetBodyType) {
    const h = heightCm / 100;
    const bmiMap = {
      lean_athletic: { male: 23, female: 21 },
      muscular_bulk: { male: 27, female: 24 },
      aesthetic_v_taper: { male: 25, female: 22 },
      swimmers_build: { male: 23.5, female: 21.5 },
      combat_fighter: { male: 24.5, female: 22 },
      calisthenics_master: { male: 22.5, female: 20.5 },
      powerlifter: { male: 28, female: 25 },
      shredded_model: { male: 22, female: 20 },
      functional_athlete: { male: 25, female: 22.5 },
      endurance_runner: { male: 20.5, female: 19 },
      spartan_warrior: { male: 25, female: 22 },
      superhero: { male: 26, female: 23 },
    };
    const targetBMI = (bmiMap[targetBodyType] || { male: 24, female: 22 })[gender] || 24;
    return Math.round(targetBMI * h * h * 10) / 10;
  },

  generateTransformationPlan(profile) {
    const {
      heightCm, currentWeightKg, age, gender, activityLevel, targetBodyType,
      bodyFatPercentage, experience = 'beginner',
    } = profile;
    const bodyType = BODY_TYPES[targetBodyType] || BODY_TYPES.lean_athletic;

    const bmr = bodyFatPercentage
      ? this.calculateBMRKatchMcArdle(currentWeightKg, bodyFatPercentage)
      : this.calculateBMR(currentWeightKg, heightCm, age, gender);
    const tdee = this.calculateTDEE(bmr, activityLevel);
    const bmi = this.calculateBMI(currentWeightKg, heightCm);
    const estimatedBF = bodyFatPercentage || this.estimateBodyFat(gender, currentWeightKg, heightCm, age);
    const targetWeight = this.calculateTargetWeight(heightCm, gender, targetBodyType);
    const targetBF = bodyType.targetBodyFat[gender] ?? bodyType.targetBodyFat.male;
    const comp = BodyMetrics.bodyComposition(currentWeightKg, estimatedBF);
    const leanMassKg = comp?.leanMassKg;

    const weightDiff = targetWeight - currentWeightKg;
    const losing = weightDiff < -0.5;
    const gaining = weightDiff > 0.5;

    // Realistic, evidence-based rates (not naive fixed numbers):
    //  - fat loss scales with current body fat (leaner = slower to keep muscle)
    //  - muscle gain scales with training age (novice fast, advanced slow)
    let weeklyRate;
    if (losing) {
      weeklyRate = -BodyMetrics.weeklyFatLossKg(currentWeightKg, estimatedBF, gender);
    } else if (gaining) {
      const monthly = BodyMetrics.monthlyMuscleGainKg(experience, gender);
      // Lean-bulk: muscle gain + a small fat allowance (~40% extra mass)
      weeklyRate = Math.max(0.15, (monthly / 4.33) * 1.4);
    } else {
      weeklyRate = 0;
    }
    const weeksToGoal = weeklyRate !== 0 ? Math.ceil(Math.abs(weightDiff) / Math.abs(weeklyRate)) : 12;
    const daysToGoal = weeksToGoal * 7;

    // Calorie target from energy balance of the chosen rate.
    const dailyDelta = (Math.abs(weeklyRate) * BodyMetrics.CONSTANTS.KCAL_PER_KG) / 7;
    let dailyCalories = losing ? tdee - dailyDelta : gaining ? tdee + dailyDelta : tdee;
    dailyCalories = Math.max(dailyCalories, gender === 'male' ? 1500 : 1200); // safety floor

    const macros = this.calculateMacros(dailyCalories, currentWeightKg, targetBodyType, losing);
    // Prefer lean-mass-based protein + bodyweight-based water for accuracy
    const proteinG = BodyMetrics.proteinTargetG(currentWeightKg, leanMassKg, losing ? 'cut' : gaining ? 'bulk' : 'recomp');
    const waterL = BodyMetrics.waterTargetLiters(currentWeightKg, activityLevel);
    const phases = this.generatePhases(weightDiff, estimatedBF, targetBF, daysToGoal);
    const dailyStepTarget = this.calculateDailyStepTarget(activityLevel, targetBodyType);
    const trainingSplit = this.generateTrainingSplit(targetBodyType);

    return {
      currentStats: {
        weight: currentWeightKg,
        bmi: Math.round(bmi * 10) / 10,
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        estimatedBodyFat: Math.round(estimatedBF * 10) / 10,
        leanMassKg: leanMassKg || null,
      },
      targets: {
        weight: targetWeight, bodyFat: targetBF, bodyType: bodyType.name,
        estimatedDays: daysToGoal, estimatedWeeks: weeksToGoal,
      },
      nutrition: {
        dailyCalories: Math.round(dailyCalories),
        protein: Math.max(proteinG, macros.protein - 20), carbs: macros.carbs, fats: macros.fats,
        fiber: macros.fiber, water: waterL,
      },
      training: { dailyStepTarget, trainingSplit, phases },
      weeklyRate: Math.round(weeklyRate * 100) / 100,
      direction: losing ? 'cut' : gaining ? 'bulk' : 'recomp',
    };
  },

  calculateMacros(dailyCalories, weightKg, targetBodyType, isLosing) {
    let proteinMult, fatPct;
    switch (targetBodyType) {
      case 'muscular_bulk': case 'powerlifter': proteinMult = isLosing ? 2.4 : 2.0; fatPct = 0.25; break;
      case 'aesthetic_v_taper': case 'shredded_model': case 'superhero': proteinMult = isLosing ? 2.6 : 2.2; fatPct = 0.22; break;
      case 'combat_fighter': case 'spartan_warrior': proteinMult = isLosing ? 2.3 : 1.9; fatPct = 0.25; break;
      case 'endurance_runner': case 'swimmers_build': proteinMult = isLosing ? 2.0 : 1.6; fatPct = 0.22; break;
      case 'calisthenics_master': proteinMult = isLosing ? 2.4 : 2.0; fatPct = 0.23; break;
      default: proteinMult = isLosing ? 2.2 : 1.8; fatPct = 0.25;
    }
    const protein = Math.round(weightKg * proteinMult);
    const proteinCals = protein * 4;
    const fatCals = dailyCalories * fatPct;
    const fats = Math.round(fatCals / 9);
    const carbs = Math.max(Math.round((dailyCalories - proteinCals - fatCals) / 4), 50);
    return { protein, carbs, fats, fiber: 30, water: 3.5 };
  },

  generatePhases(weightDiff, currentBF, targetBF, totalDays) {
    const phases = [];
    if (Math.abs(weightDiff) < 2 && Math.abs(currentBF - targetBF) < 3) {
      phases.push({ name: 'Recomposition', duration: `${totalDays || 90} days`, focus: 'Lose fat while building muscle at maintenance', calorieAdjustment: 'Maintenance with calorie cycling' });
    } else if (weightDiff < -10) {
      phases.push({ name: 'Phase 1: Foundation', duration: '4 weeks', focus: 'Build habit, moderate deficit, learn movements', calorieAdjustment: '-300 from TDEE' });
      phases.push({ name: 'Phase 2: Accelerated Cut', duration: `${Math.max(1, Math.ceil((totalDays - 56) / 7))} weeks`, focus: 'Safe aggressive fat loss, higher volume', calorieAdjustment: '-500 from TDEE' });
      phases.push({ name: 'Phase 3: Lean Gains', duration: '4 weeks', focus: 'Reverse diet, build muscle on target frame', calorieAdjustment: '+200 from new TDEE' });
    } else if (weightDiff > 5) {
      phases.push({ name: 'Phase 1: Clean Bulk', duration: '6 weeks', focus: 'Progressive overload, strength building', calorieAdjustment: '+300 from TDEE' });
      phases.push({ name: 'Phase 2: Hypertrophy', duration: `${Math.max(1, Math.ceil((totalDays - 84) / 7))} weeks`, focus: 'Volume training, targeted growth', calorieAdjustment: '+400 from TDEE' });
      phases.push({ name: 'Phase 3: Definition Cut', duration: '6 weeks', focus: 'Mini-cut to reveal gains', calorieAdjustment: '-400 from TDEE' });
    } else {
      phases.push({ name: 'Phase 1: Recomposition', duration: `${Math.max(1, Math.ceil(totalDays / 7)) || 12} weeks`, focus: 'Simultaneous fat loss + muscle gain', calorieAdjustment: 'Calorie cycling: surplus on training days' });
    }
    return phases;
  },

  calculateDailyStepTarget(activityLevel, bodyType) {
    const base = { sedentary: 8000, lightly_active: 10000, moderately_active: 12000, very_active: 14000, extremely_active: 16000 }[activityLevel] || 10000;
    const mult = {
      endurance_runner: 1.4, lean_athletic: 1.2, swimmers_build: 1.1, combat_fighter: 1.1,
      functional_athlete: 1.2, spartan_warrior: 1.2, calisthenics_master: 1.0,
      muscular_bulk: 0.9, powerlifter: 0.8, aesthetic_v_taper: 1.0, shredded_model: 1.2, superhero: 1.1,
    }[bodyType] || 1.0;
    return Math.round((base * mult) / 500) * 500;
  },

  generateTrainingSplit(bodyType) {
    const splits = {
      lean_athletic: { days: 5, split: ['Upper Body + HIIT', 'Lower Body', 'Cardio + Core', 'Upper Body', 'Lower + Cardio', 'Active Recovery', 'Rest'] },
      muscular_bulk: { days: 6, split: ['Chest + Triceps', 'Back + Biceps', 'Legs', 'Shoulders + Arms', 'Chest + Back', 'Legs + Core', 'Rest'] },
      aesthetic_v_taper: { days: 5, split: ['Shoulders + Back Width', 'Chest + Arms', 'Legs', 'Back + Rear Delts', 'Arms + Core', 'Cardio', 'Rest'] },
      swimmers_build: { days: 5, split: ['Swim + Upper Pull', 'Legs + Core', 'Swim + Cardio', 'Upper Push + Back', 'Full Body + Swim', 'Light Cardio', 'Rest'] },
      combat_fighter: { days: 6, split: ['Combat + Conditioning', 'Strength (Upper)', 'Combat Drills + Cardio', 'Strength (Lower)', 'Sparring + Technique', 'Recovery + Mobility', 'Rest'] },
      calisthenics_master: { days: 5, split: ['Push Progressions', 'Pull Progressions', 'Legs + Skills', 'Push + Core', 'Pull + Skills', 'Mobility', 'Rest'] },
      powerlifter: { days: 4, split: ['Squat Focus', 'Bench Focus', 'Rest', 'Deadlift Focus', 'Accessories', 'Rest', 'Rest'] },
      shredded_model: { days: 6, split: ['Push + HIIT', 'Pull + Abs', 'Legs', 'Upper + Cardio', 'Lower + HIIT', 'Full Body Circuit', 'Rest'] },
      functional_athlete: { days: 5, split: ['Strength + Metcon', 'Oly Lifts + Cardio', 'Gymnastics + Core', 'Strength + HIIT', 'Full Body WOD', 'Recovery', 'Rest'] },
      endurance_runner: { days: 6, split: ['Easy Run + Strength', 'Tempo Run', 'Cross-train', 'Intervals', 'Easy Run + Core', 'Long Run', 'Rest'] },
      spartan_warrior: { days: 6, split: ['Combat + Strength', 'Endurance Run', 'Full Body Functional', 'Combat + HIIT', 'Strength + Obstacle', 'Long Cardio', 'Rest'] },
      superhero: { days: 5, split: ['Chest + Shoulders', 'Back + Arms', 'Legs + Core', 'Push + Pull', 'Full Body + Cardio', 'Recovery', 'Rest'] },
    };
    return splits[bodyType] || splits.lean_athletic;
  },

  generateDailyQuestTemplates(plan, dayOfWeek, playerLevel) {
    const quests = [];
    const todayTraining = plan.training.trainingSplit.split[dayOfWeek];
    const isRest = todayTraining === 'Rest';

    if (!isRest) {
      quests.push({ type: 'exercise', category: 'exercise', title: `Complete: ${todayTraining}`, description: `Today's training: ${todayTraining}. Give it your all, Hunter.`, targetValue: 1, unit: 'session', xpReward: 50 + playerLevel * 5, difficulty: 'normal', isBonus: 0 });
    } else {
      quests.push({ type: 'recovery', category: 'exercise', title: 'Active Recovery', description: 'Stretch, foam roll, or a leisurely walk. Growth happens in rest.', targetValue: 20, unit: 'minutes', xpReward: 25 + playerLevel * 2, difficulty: 'easy', isBonus: 0 });
    }

    quests.push({ type: 'steps', category: 'steps', title: `Walk ${plan.training.dailyStepTarget.toLocaleString()} Steps`, description: 'Every step is progress. A hunter never stops moving.', targetValue: plan.training.dailyStepTarget, unit: 'steps', xpReward: 30 + playerLevel * 3, difficulty: 'normal', isBonus: 0 });
    quests.push({ type: 'nutrition', category: 'diet', title: `Hit Protein: ${plan.nutrition.protein}g`, description: `Consume at least ${plan.nutrition.protein}g protein. Fuel the machine.`, targetValue: plan.nutrition.protein, unit: 'grams', xpReward: 35 + playerLevel * 3, difficulty: 'normal', isBonus: 0 });
    quests.push({ type: 'hydration', category: 'hydration', title: `Drink ${plan.nutrition.water}L Water`, description: 'Hydration is the foundation of vitality.', targetValue: plan.nutrition.water, unit: 'liters', xpReward: 20 + playerLevel * 2, difficulty: 'easy', isBonus: 0 });
    quests.push({ type: 'calories', category: 'diet', title: `Stay Near ${plan.nutrition.dailyCalories} kcal`, description: `Target ${plan.nutrition.dailyCalories} kcal (+/-100). Discipline separates hunters from prey.`, targetValue: plan.nutrition.dailyCalories, unit: 'calories', xpReward: 40 + playerLevel * 3, difficulty: 'normal', isBonus: 0 });
    quests.push({ type: 'sleep', category: 'sleep', title: 'Sleep 7+ Hours', description: 'Recovery happens during sleep. A rested hunter is a dangerous hunter.', targetValue: 7, unit: 'hours', xpReward: 25 + playerLevel * 2, difficulty: 'normal', isBonus: 0 });

    if (playerLevel >= 5) {
      quests.push({ type: 'bonus_combat', category: 'combat', title: 'Shadow Combat Training', description: '15 min shadow boxing or combat drills. Channel the Shadow Monarch.', targetValue: 15, unit: 'minutes', xpReward: 60 + playerLevel * 5, difficulty: 'hard', isBonus: 1 });
    }
    return quests;
  },

  determinePunishment(failedQuests, totalQuests, streak, playerLevel) {
    const rate = totalQuests > 0 ? failedQuests / totalQuests : 0;
    const p = [];
    if (rate >= 0.7) {
      p.push({ type: 'FULL_DEVICE_BLOCK', durationHours: 24, reason: `Critical failure: ${failedQuests}/${totalQuests} quests missed` });
      p.push({ type: 'XP_PENALTY', xpLoss: playerLevel * 25, reason: 'Severe discipline failure' });
    } else if (rate >= 0.5) {
      p.push({ type: 'SOCIAL_MEDIA_BLOCK', durationHours: 24, reason: `Major failure: ${failedQuests}/${totalQuests} quests missed` });
      p.push({ type: 'EXTRA_WORKOUT', durationHours: 6, reason: 'Penalty workout required' });
    } else if (rate >= 0.3) {
      p.push({ type: 'ENTERTAINMENT_BLOCK', durationHours: 12, reason: 'Missed important quests today' });
    }
    if (streak >= 7 && rate > 0.3) p.push({ type: 'COLD_SHOWER', durationHours: 1, reason: 'Broke your winning streak. Ice penalty.' });
    return p;
  },

  generateMealPlan(nutrition) {
    const { dailyCalories } = nutrition;
    const dist = [0.25, 0.30, 0.15, 0.30];
    const templates = {
      breakfast: [
        { name: 'Protein Oats Power Bowl', b: { cal: 450, p: 35, c: 55, f: 12 } },
        { name: 'Egg White & Avocado Toast', b: { cal: 400, p: 30, c: 40, f: 15 } },
        { name: 'Greek Yogurt Parfait + Nuts', b: { cal: 380, p: 32, c: 42, f: 10 } },
        { name: 'Protein Pancakes + Berries', b: { cal: 440, p: 38, c: 50, f: 10 } },
      ],
      lunch: [
        { name: 'Grilled Chicken Rice Bowl', b: { cal: 550, p: 45, c: 60, f: 12 } },
        { name: 'Salmon & Quinoa Salad', b: { cal: 520, p: 40, c: 45, f: 18 } },
        { name: 'Lean Beef Burrito Bowl', b: { cal: 560, p: 43, c: 55, f: 16 } },
        { name: 'Tuna Steak + Sweet Potato', b: { cal: 500, p: 45, c: 50, f: 10 } },
      ],
      snack: [
        { name: 'Protein Shake + Almonds', b: { cal: 300, p: 35, c: 15, f: 12 } },
        { name: 'Cottage Cheese & Fruit', b: { cal: 250, p: 28, c: 22, f: 6 } },
        { name: 'Boiled Eggs & Hummus', b: { cal: 270, p: 22, c: 15, f: 14 } },
      ],
      dinner: [
        { name: 'Herb Chicken & Veggies', b: { cal: 500, p: 48, c: 35, f: 14 } },
        { name: 'Grilled Fish + Brown Rice', b: { cal: 480, p: 42, c: 45, f: 12 } },
        { name: 'Lean Steak + Roasted Veg', b: { cal: 550, p: 50, c: 30, f: 20 } },
        { name: 'Baked Salmon + Asparagus', b: { cal: 490, p: 44, c: 25, f: 18 } },
      ],
    };
    const times = { breakfast: '7:00 AM', lunch: '12:30 PM', snack: '4:00 PM', dinner: '7:30 PM' };
    return ['breakfast', 'lunch', 'snack', 'dinner'].map((type, i) => {
      const opts = templates[type];
      const sel = opts[Math.floor(Math.random() * opts.length)];
      const scale = (dailyCalories * dist[i]) / sel.b.cal;
      return {
        mealType: type, name: sel.name, time: times[type],
        calories: Math.round(sel.b.cal * scale), protein: Math.round(sel.b.p * scale),
        carbs: Math.round(sel.b.c * scale), fats: Math.round(sel.b.f * scale),
      };
    });
  },
};

export default TransformationEngine;
