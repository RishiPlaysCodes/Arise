const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const TransformationEngine = require('../services/transformationEngine');
const { BODY_TYPES } = require('../config/constants');

const router = express.Router();

// GET /api/profile/body-types - Get all available body types
router.get('/body-types', (req, res) => {
  res.json({
    bodyTypes: Object.values(BODY_TYPES),
    total: Object.keys(BODY_TYPES).length
  });
});

// POST /api/profile/setup - Set up body profile (initial setup)
router.post('/setup', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      heightCm, currentWeightKg, age, gender,
      activityLevel, targetBodyType, bodyFatPercentage,
      medicalConditions, injuries
    } = req.body;

    // Validation
    if (!heightCm || !currentWeightKg || !age || !gender || !targetBodyType) {
      return res.status(400).json({ 
        error: 'Required: heightCm, currentWeightKg, age, gender, targetBodyType' 
      });
    }

    if (!BODY_TYPES[targetBodyType]) {
      return res.status(400).json({ 
        error: 'Invalid body type', 
        validTypes: Object.keys(BODY_TYPES) 
      });
    }

    // Generate transformation plan
    const plan = TransformationEngine.generateTransformationPlan({
      heightCm, currentWeightKg, age, gender,
      activityLevel: activityLevel || 'sedentary',
      targetBodyType,
      bodyFatPercentage
    });

    // Calculate BMI & BMR
    const bmi = TransformationEngine.calculateBMI(currentWeightKg, heightCm);
    const bmr = TransformationEngine.calculateBMR(currentWeightKg, heightCm, age, gender);
    const tdee = TransformationEngine.calculateTDEE(bmr, activityLevel || 'sedentary');

    // Upsert body profile
    const existing = db.prepare('SELECT id FROM body_profiles WHERE user_id = ?').get(userId);
    
    if (existing) {
      db.prepare(`
        UPDATE body_profiles SET
          height_cm = ?, current_weight_kg = ?, target_weight_kg = ?,
          body_fat_percentage = ?, target_body_fat = ?, age = ?, gender = ?,
          activity_level = ?, target_body_type = ?, medical_conditions = ?,
          injuries = ?, bmi = ?, bmr = ?, tdee = ?,
          estimated_days_to_goal = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        heightCm, currentWeightKg, plan.targets.weight,
        bodyFatPercentage || plan.currentStats.estimatedBodyFat,
        plan.targets.bodyFat, age, gender,
        activityLevel || 'sedentary', targetBodyType,
        JSON.stringify(medicalConditions || []),
        JSON.stringify(injuries || []),
        Math.round(bmi * 10) / 10, Math.round(bmr), Math.round(tdee),
        plan.targets.estimatedDays, userId
      );
    } else {
      db.prepare(`
        INSERT INTO body_profiles (id, user_id, height_cm, current_weight_kg, target_weight_kg, body_fat_percentage, target_body_fat, age, gender, activity_level, target_body_type, medical_conditions, injuries, bmi, bmr, tdee, estimated_days_to_goal)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), userId, heightCm, currentWeightKg, plan.targets.weight,
        bodyFatPercentage || plan.currentStats.estimatedBodyFat,
        plan.targets.bodyFat, age, gender,
        activityLevel || 'sedentary', targetBodyType,
        JSON.stringify(medicalConditions || []),
        JSON.stringify(injuries || []),
        Math.round(bmi * 10) / 10, Math.round(bmr), Math.round(tdee),
        plan.targets.estimatedDays
      );
    }

    // Set up diet targets
    const dietExisting = db.prepare('SELECT id FROM diet_targets WHERE user_id = ?').get(userId);
    if (dietExisting) {
      db.prepare(`
        UPDATE diet_targets SET
          daily_calories = ?, protein_g = ?, carbs_g = ?, fats_g = ?,
          fiber_g = ?, water_liters = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(
        plan.nutrition.dailyCalories, plan.nutrition.protein,
        plan.nutrition.carbs, plan.nutrition.fats,
        plan.nutrition.fiber, plan.nutrition.water, userId
      );
    } else {
      db.prepare(`
        INSERT INTO diet_targets (id, user_id, daily_calories, protein_g, carbs_g, fats_g, fiber_g, water_liters)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), userId, plan.nutrition.dailyCalories, plan.nutrition.protein,
        plan.nutrition.carbs, plan.nutrition.fats,
        plan.nutrition.fiber, plan.nutrition.water
      );
    }

    // Log initial weight
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT OR IGNORE INTO weight_history (id, user_id, log_date, weight_kg, body_fat_percentage)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, today, currentWeightKg, bodyFatPercentage || null);

    res.json({
      message: 'Body profile set up successfully. Your transformation begins now, Hunter.',
      plan,
      bodyType: BODY_TYPES[targetBodyType]
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({ error: 'Profile setup failed' });
  }
});

// GET /api/profile/transformation-plan
router.get('/transformation-plan', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const bodyProfile = db.prepare('SELECT * FROM body_profiles WHERE user_id = ?').get(userId);
    
    if (!bodyProfile) {
      return res.status(404).json({ error: 'Body profile not set up yet' });
    }

    const plan = TransformationEngine.generateTransformationPlan({
      heightCm: bodyProfile.height_cm,
      currentWeightKg: bodyProfile.current_weight_kg,
      age: bodyProfile.age,
      gender: bodyProfile.gender,
      activityLevel: bodyProfile.activity_level,
      targetBodyType: bodyProfile.target_body_type,
      bodyFatPercentage: bodyProfile.body_fat_percentage
    });

    res.json({ plan, bodyType: BODY_TYPES[bodyProfile.target_body_type] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate transformation plan' });
  }
});

// PUT /api/profile/update-weight
router.put('/update-weight', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { weightKg, bodyFatPercentage } = req.body;

    if (!weightKg) {
      return res.status(400).json({ error: 'weightKg is required' });
    }

    // Update body profile
    db.prepare(`
      UPDATE body_profiles SET current_weight_kg = ?, body_fat_percentage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(weightKg, bodyFatPercentage || null, userId);

    // Log weight history
    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO weight_history (id, user_id, log_date, weight_kg, body_fat_percentage)
      VALUES (?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, today, weightKg, bodyFatPercentage || null);

    // Recalculate plan
    const bodyProfile = db.prepare('SELECT * FROM body_profiles WHERE user_id = ?').get(userId);
    const newBMI = TransformationEngine.calculateBMI(weightKg, bodyProfile.height_cm);
    
    db.prepare('UPDATE body_profiles SET bmi = ? WHERE user_id = ?').run(
      Math.round(newBMI * 10) / 10, userId
    );

    res.json({
      message: 'Weight updated. Keep pushing, Hunter.',
      currentWeight: weightKg,
      bmi: Math.round(newBMI * 10) / 10,
      targetWeight: bodyProfile.target_weight_kg,
      remaining: Math.round((bodyProfile.target_weight_kg - weightKg) * 10) / 10
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update weight' });
  }
});

// GET /api/profile/weight-history
router.get('/weight-history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const history = db.prepare(`
      SELECT * FROM weight_history WHERE user_id = ? ORDER BY log_date DESC LIMIT 90
    `).all(userId);
    
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weight history' });
  }
});

// GET /api/profile/stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
    const profile = db.prepare('SELECT * FROM player_profiles WHERE user_id = ?').get(userId);
    
    res.json({ stats, profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// PUT /api/profile/allocate-stats
router.put('/allocate-stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { strength, agility, endurance, vitality, discipline, combat_power, intelligence, perception } = req.body;

    const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
    if (!stats) return res.status(404).json({ error: 'Stats not found' });

    const totalAllocation = (strength || 0) + (agility || 0) + (endurance || 0) + 
      (vitality || 0) + (discipline || 0) + (combat_power || 0) + (intelligence || 0) + (perception || 0);

    if (totalAllocation > stats.stat_points_available) {
      return res.status(400).json({ 
        error: `Not enough stat points. Available: ${stats.stat_points_available}, Requested: ${totalAllocation}` 
      });
    }

    db.prepare(`
      UPDATE player_stats SET
        strength = strength + ?, agility = agility + ?, endurance = endurance + ?,
        vitality = vitality + ?, discipline = discipline + ?, combat_power = combat_power + ?,
        intelligence = intelligence + ?, perception = perception + ?,
        stat_points_available = stat_points_available - ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      strength || 0, agility || 0, endurance || 0,
      vitality || 0, discipline || 0, combat_power || 0,
      intelligence || 0, perception || 0, totalAllocation, userId
    );

    const updated = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
    res.json({ message: 'Stats allocated!', stats: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to allocate stats' });
  }
});

module.exports = router;
