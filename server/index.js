require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/diet', require('./routes/diet'));
app.use('/api/steps', require('./routes/steps'));
app.use('/api/combat', require('./routes/combat'));
app.use('/api/punishment', require('./routes/punishment'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/sync', require('./routes/sync'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'alive',
    message: 'The System is online. Arise!',
    timestamp: new Date().toISOString()
  });
});

// Scheduled job: End of day processing (runs at 11:59 PM daily)
cron.schedule('59 23 * * *', () => {
  console.log('[SYSTEM] Running end-of-day processing...');
  const db = require('./config/database');
  const QuestEngine = require('./services/questEngine');
  const PunishmentSystem = require('./services/punishmentSystem');
  
  // Get all users with active profiles
  const users = db.prepare('SELECT user_id FROM player_profiles').all();
  
  for (const { user_id } of users) {
    try {
      QuestEngine.processEndOfDay(user_id);
      PunishmentSystem.processDailyCheck(user_id);
    } catch (error) {
      console.error(`[SYSTEM] Failed to process end-of-day for user ${user_id}:`, error.message);
    }
  }
  
  console.log('[SYSTEM] End-of-day processing complete.');
});

// Catch-all: serve React app for non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════════╗
  ║                                                      ║
  ║          ⚔️  SOLO LEVELLING SYSTEM  ⚔️               ║
  ║                                                      ║
  ║     Server running on port ${PORT}                    ║
  ║     Status: ONLINE                                   ║
  ║     Message: "Arise!"                                ║
  ║                                                      ║
  ╚══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
