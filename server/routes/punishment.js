const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const PunishmentSystem = require('../services/punishmentSystem');

const router = express.Router();

// GET /api/punishment/status - Check current restriction status
router.get('/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const status = PunishmentSystem.checkRestrictions(userId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check punishment status' });
  }
});

// GET /api/punishment/active - Get active punishments
router.get('/active', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const punishments = PunishmentSystem.getActivePunishments(userId);
    res.json({ punishments, count: punishments.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active punishments' });
  }
});

// GET /api/punishment/blocked-apps - Get blocked apps list
router.get('/blocked-apps', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const blockedApps = PunishmentSystem.getBlockedApps(userId);
    res.json({ 
      blockedApps, 
      count: blockedApps.length,
      message: blockedApps.length > 0 
        ? 'Apps are currently blocked due to quest failures. Complete your tasks to avoid future penalties.'
        : 'No apps currently blocked. Stay disciplined, Hunter.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blocked apps' });
  }
});

// POST /api/punishment/check-daily - Run daily punishment check
router.post('/check-daily', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const result = PunishmentSystem.processDailyCheck(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process daily check' });
  }
});

// GET /api/punishment/history - Get punishment history
router.get('/history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 30;
    const history = PunishmentSystem.getHistory(userId, limit);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch punishment history' });
  }
});

module.exports = router;
