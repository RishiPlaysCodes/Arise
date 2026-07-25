const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const CombatTraining = require('../services/combatTraining');

const router = express.Router();

// GET /api/combat/types - Get all combat sport types
router.get('/types', (req, res) => {
  res.json({ combatTypes: CombatTraining.getCombatTypes() });
});

// GET /api/combat/session - Generate a training session
router.get('/session', authenticateToken, (req, res) => {
  try {
    const { combatType, skillLevel, duration } = req.query;
    
    if (!combatType) {
      return res.status(400).json({ error: 'combatType is required (boxing, muay_thai, bjj, mma, wrestling, karate, kickboxing, krav_maga)' });
    }

    const session = CombatTraining.generateTrainingSession(
      combatType,
      skillLevel || 'beginner',
      parseInt(duration) || 30
    );

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to generate session' });
  }
});

// POST /api/combat/log - Log a combat training session
router.post('/log', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const result = CombatTraining.logSession(userId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to log combat session' });
  }
});

// GET /api/combat/history - Get combat training history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const days = parseInt(req.query.days) || 30;
    const history = CombatTraining.getHistory(userId, days);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combat history' });
  }
});

// GET /api/combat/stats - Get combat statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const stats = CombatTraining.getStats(userId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch combat stats' });
  }
});

module.exports = router;
