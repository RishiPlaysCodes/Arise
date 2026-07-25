const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const QuestEngine = require('../services/questEngine');

const router = express.Router();

// GET /api/quests/today - Get today's quests (generates if not exists)
router.get('/today', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const quests = QuestEngine.generateDailyQuests(userId);
    
    const completed = quests.filter(q => q.is_completed).length;
    const total = quests.length;

    res.json({
      date: new Date().toISOString().split('T')[0],
      quests,
      progress: {
        completed,
        total,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Quest fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch quests' });
  }
});

// PUT /api/quests/:questId/progress - Update quest progress
router.put('/:questId/progress', authenticateToken, (req, res) => {
  try {
    const { questId } = req.params;
    const { value } = req.body;
    const userId = req.user.userId;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'value is required' });
    }

    const result = QuestEngine.updateQuestProgress(questId, userId, value);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update quest' });
  }
});

// POST /api/quests/:questId/complete - Mark quest as complete
router.post('/:questId/complete', authenticateToken, (req, res) => {
  try {
    const { questId } = req.params;
    const userId = req.user.userId;

    const result = QuestEngine.completeQuest(questId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to complete quest' });
  }
});

// POST /api/quests/end-of-day - Process end of day
router.post('/end-of-day', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const result = QuestEngine.processEndOfDay(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to process end of day' });
  }
});

// GET /api/quests/history - Get quest history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const db = require('../config/database');
    const history = db.prepare(`
      SELECT quest_date, 
        COUNT(*) as total_quests,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed_quests,
        SUM(CASE WHEN is_completed = 1 THEN xp_reward ELSE 0 END) as xp_earned
      FROM daily_quests 
      WHERE user_id = ? AND quest_date >= ?
      GROUP BY quest_date
      ORDER BY quest_date DESC
    `).all(userId, startDateStr);

    res.json({ history, days });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quest history' });
  }
});

module.exports = router;
