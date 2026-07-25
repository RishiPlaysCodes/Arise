const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/activity/log - Log an activity/exercise
router.post('/log', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      activityType, activityName, durationMinutes,
      caloriesBurned, sets, reps, weightKg, distanceKm,
      intensity, notes
    } = req.body;

    if (!activityType || !activityName) {
      return res.status(400).json({ error: 'activityType and activityName are required' });
    }

    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO activity_logs (id, user_id, log_date, activity_type, activity_name, duration_minutes, calories_burned, sets, reps, weight_kg, distance_km, intensity, notes, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      uuidv4(), userId, today, activityType, activityName,
      durationMinutes || 0, caloriesBurned || 0,
      sets || null, reps || null, weightKg || null,
      distanceKm || null, intensity || 'moderate', notes || ''
    );

    // Update exercise quests
    updateExerciseQuests(userId, activityType, durationMinutes);

    res.json({
      message: 'Activity logged. Well done, Hunter!',
      activity: { activityType, activityName, durationMinutes, caloriesBurned }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

function updateExerciseQuests(userId, activityType, duration) {
  const today = new Date().toISOString().split('T')[0];
  
  // Complete exercise session quests
  const exerciseQuests = db.prepare(
    'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND quest_category = ? AND is_completed = 0'
  ).all(userId, today, 'exercise');

  for (const quest of exerciseQuests) {
    if (quest.unit === 'session') {
      // Binary - just complete it
      db.prepare(`
        UPDATE daily_quests SET current_value = target_value, is_completed = 1, completed_at = ? WHERE id = ?
      `).run(new Date().toISOString(), quest.id);
      
      const QuestEngine = require('../services/questEngine');
      QuestEngine.awardXP(userId, quest.xp_reward);
    } else if (quest.unit === 'minutes') {
      const newValue = quest.current_value + (duration || 0);
      const isCompleted = newValue >= quest.target_value;
      
      db.prepare(`
        UPDATE daily_quests SET current_value = ?, is_completed = ?, completed_at = ? WHERE id = ?
      `).run(
        Math.min(newValue, quest.target_value),
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
}

// GET /api/activity/today - Get today's activities
router.get('/today', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const activities = db.prepare(
      'SELECT * FROM activity_logs WHERE user_id = ? AND log_date = ? ORDER BY created_at DESC'
    ).all(userId, today);

    const totalCalories = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
    const totalMinutes = activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);

    res.json({
      date: today,
      activities,
      summary: {
        totalActivities: activities.length,
        totalCaloriesBurned: totalCalories,
        totalMinutes
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/activity/history - Get activity history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const history = db.prepare(`
      SELECT * FROM activity_logs
      WHERE user_id = ? AND log_date >= ?
      ORDER BY log_date DESC, created_at DESC
    `).all(userId, startDate.toISOString().split('T')[0]);

    res.json({ history, days });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity history' });
  }
});

module.exports = router;
