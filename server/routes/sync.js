const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/sync  { entity, op, payload }
// Stores a change record from the mobile app's offline sync queue.
router.post('/', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const { entity, op, payload } = req.body;
    if (!entity || !op) {
      return res.status(400).json({ error: 'entity and op are required' });
    }
    db.prepare(
      `INSERT INTO sync_data (id, user_id, entity, op, payload, client_ts)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(uuidv4(), userId, entity, op, JSON.stringify(payload || {}), payload?.ts || null);

    res.json({ ok: true, message: 'Change synced' });
  } catch (error) {
    console.error('Sync push error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/sync/pull?since=ISO  -> changes since a timestamp (for multi-device)
router.get('/pull', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const since = req.query.since || '1970-01-01';
    const rows = db.prepare(
      `SELECT entity, op, payload, created_at FROM sync_data
       WHERE user_id = ? AND created_at > ? ORDER BY created_at ASC LIMIT 1000`
    ).all(userId, since);
    res.json({
      changes: rows.map((r) => ({ entity: r.entity, op: r.op, payload: JSON.parse(r.payload), ts: r.created_at })),
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Sync pull failed' });
  }
});

// GET /api/sync/status
router.get('/status', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const count = db.prepare('SELECT COUNT(*) as c FROM sync_data WHERE user_id = ?').get(userId);
    res.json({ synced: count.c, serverTime: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Status failed' });
  }
});

module.exports = router;
