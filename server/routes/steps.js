const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const StepTracker = require('../services/stepTracker');

const router = express.Router();

// POST /api/steps/log - Log steps (set total)
router.post('/log', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { steps } = req.body;

    if (!steps || steps < 0) {
      return res.status(400).json({ error: 'Valid step count is required' });
    }

    const result = StepTracker.logSteps(userId, steps);
    res.json({ message: 'Steps logged', ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log steps' });
  }
});

// POST /api/steps/add - Add incremental steps
router.post('/add', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { steps } = req.body;

    if (!steps || steps < 0) {
      return res.status(400).json({ error: 'Valid step count is required' });
    }

    const result = StepTracker.addSteps(userId, steps);
    res.json({ message: 'Steps added', ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add steps' });
  }
});

// GET /api/steps/today - Get today's steps
router.get('/today', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const data = StepTracker.getTodaySteps(userId);
    
    // Get step target from body profile
    const db = require('../config/database');
    const bodyProfile = db.prepare('SELECT * FROM body_profiles WHERE user_id = ?').get(userId);
    
    let target = 10000; // default
    if (bodyProfile) {
      const TransformationEngine = require('../services/transformationEngine');
      target = TransformationEngine.calculateDailyStepTarget(
        bodyProfile.activity_level, bodyProfile.target_body_type
      );
    }

    res.json({
      ...data,
      target,
      progress: data.steps ? Math.round((data.steps / target) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s steps' });
  }
});

// GET /api/steps/history - Get step history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;
    const history = StepTracker.getStepHistory(userId, days);
    res.json({ history, days });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch step history' });
  }
});

// GET /api/steps/weekly - Get weekly summary
router.get('/weekly', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const summary = StepTracker.getWeeklySummary(userId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weekly summary' });
  }
});

module.exports = router;
