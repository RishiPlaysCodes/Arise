const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const TransformationEngine = require('../services/transformationEngine');

const router = express.Router();

// Helper function to get day totals
function getDayTotals(userId, date) {
  return db.prepare(`
    SELECT 
      COALESCE(SUM(calories), 0) as total_calories,
      COALESCE(SUM(protein_g), 0) as total_protein,
      COALESCE(SUM(carbs_g), 0) as total_carbs,
      COALESCE(SUM(fats_g), 0) as total_fats,
      COALESCE(SUM(fiber_g), 0) as total_fiber,
      COUNT(*) as total_items
    FROM diet_logs
    WHERE user_id = ? AND log_date = ?
  `).get(userId, date);
}

// Update diet quests based on current intake
function updateDietQuests(userId, totals) {
  const today = new Date().toISOString().split('T')[0];
  
  // Update protein quest
  const proteinQuests = db.prepare(
    'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND quest_type = ? AND is_completed = 0'
  ).all(userId, today, 'nutrition');

  for (const quest of proteinQuests) {
    const isCompleted = totals.total_protein >= quest.target_value;
    db.prepare(`
      UPDATE daily_quests SET current_value = ?, is_completed = ?, completed_at = ? WHERE id = ?
    `).run(
      Math.min(totals.total_protein, quest.target_value),
      isCompleted ? 1 : 0,
      isCompleted ? new Date().toISOString() : null,
      quest.id
    );

    if (isCompleted) {
      const QuestEngine = require('../services/questEngine');
      QuestEngine.awardXP(userId, quest.xp_reward);
    }
  }

  // Update calorie quest
  const calorieQuests = db.prepare(
    'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND quest_type = ? AND is_completed = 0'
  ).all(userId, today, 'calories');

  for (const quest of calorieQuests) {
    const isWithinTarget = Math.abs(totals.total_calories - quest.target_value) <= 100;
    const hasEatenEnough = totals.total_calories >= quest.target_value * 0.8;
    const isCompleted = isWithinTarget && hasEatenEnough;

    db.prepare(`
      UPDATE daily_quests SET current_value = ?, is_completed = ?, completed_at = ? WHERE id = ?
    `).run(
      totals.total_calories,
      isCompleted ? 1 : 0,
      isCompleted ? new Date().toISOString() : null,
      quest.id
    );

    if (isCompleted) {
      const QuestEngine = require('../services/questEngine');
      QuestEngine.awardXP(userId, quest.xp_reward);
    }
  }
}

// POST /api/diet/log - Log a food item
router.post('/log', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { mealType, foodName, calories, protein, carbs, fats, fiber, quantity, unit } = req.body;

    if (!mealType || !foodName) {
      return res.status(400).json({ error: 'mealType and foodName are required' });
    }

    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO diet_logs (id, user_id, log_date, meal_type, food_name, calories, protein_g, carbs_g, fats_g, fiber_g, quantity, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, today, mealType, foodName,
      calories || 0, protein || 0, carbs || 0, fats || 0, fiber || 0,
      quantity || 1, unit || 'serving'
    );

    const totals = getDayTotals(userId, today);
    updateDietQuests(userId, totals);

    res.json({
      message: 'Food logged successfully',
      logged: { mealType, foodName, calories, protein, carbs, fats },
      todayTotals: totals
    });
  } catch (error) {
    console.error('Diet log error:', error);
    res.status(500).json({ error: 'Failed to log food' });
  }
});

// GET /api/diet/today - Get today's diet log
router.get('/today', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const logs = db.prepare(
      'SELECT * FROM diet_logs WHERE user_id = ? AND log_date = ? ORDER BY created_at ASC'
    ).all(userId, today);

    const totals = getDayTotals(userId, today);
    const targets = db.prepare('SELECT * FROM diet_targets WHERE user_id = ?').get(userId);

    res.json({
      date: today,
      meals: logs,
      totals,
      targets,
      progress: targets ? {
        calories: Math.round((totals.total_calories / targets.daily_calories) * 100),
        protein: Math.round((totals.total_protein / targets.protein_g) * 100),
        carbs: Math.round((totals.total_carbs / targets.carbs_g) * 100),
        fats: Math.round((totals.total_fats / targets.fats_g) * 100)
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diet logs' });
  }
});

// GET /api/diet/meal-plan - Get AI-generated meal plan
router.get('/meal-plan', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const targets = db.prepare('SELECT * FROM diet_targets WHERE user_id = ?').get(userId);

    if (!targets) {
      return res.status(404).json({ error: 'Set up your body profile first to get a meal plan' });
    }

    const mealPlan = TransformationEngine.generateMealPlan({
      dailyCalories: targets.daily_calories,
      protein: targets.protein_g,
      carbs: targets.carbs_g,
      fats: targets.fats_g
    });

    res.json({
      date: new Date().toISOString().split('T')[0],
      targets,
      meals: mealPlan,
      totalCalories: mealPlan.reduce((sum, m) => sum + m.calories, 0),
      totalProtein: mealPlan.reduce((sum, m) => sum + m.protein, 0)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate meal plan' });
  }
});

// DELETE /api/diet/log/:logId - Delete a food log entry
router.delete('/log/:logId', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { logId } = req.params;

    const result = db.prepare('DELETE FROM diet_logs WHERE id = ? AND user_id = ?').run(logId, userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Log entry not found' });
    }

    res.json({ message: 'Food log deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

// GET /api/diet/history - Get diet history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = db.prepare(`
      SELECT log_date,
        SUM(calories) as total_calories,
        SUM(protein_g) as total_protein,
        SUM(carbs_g) as total_carbs,
        SUM(fats_g) as total_fats,
        COUNT(*) as items_logged
      FROM diet_logs
      WHERE user_id = ? AND log_date >= ?
      GROUP BY log_date
      ORDER BY log_date DESC
    `).all(userId, startDate.toISOString().split('T')[0]);

    res.json({ history, days });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch diet history' });
  }
});

module.exports = router;
