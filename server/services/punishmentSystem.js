/**
 * PUNISHMENT SYSTEM
 * 
 * Enforces discipline through consequences for failed quests.
 * Includes social media blocking, device restrictions, and XP penalties.
 * The system is strict but fair - just like the System in Solo Leveling.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { PUNISHMENT_TYPES } = require('../config/constants');

class PunishmentSystem {

  /**
   * Get all active punishments for a user
   */
  static getActivePunishments(userId) {
    const now = new Date().toISOString();
    
    // First, deactivate expired punishments
    db.prepare(`
      UPDATE punishments 
      SET is_active = 0 
      WHERE user_id = ? AND is_active = 1 AND ends_at <= ?
    `).run(userId, now);

    // Get current active punishments
    return db.prepare(`
      SELECT * FROM punishments 
      WHERE user_id = ? AND is_active = 1
      ORDER BY started_at DESC
    `).all(userId);
  }

  /**
   * Apply a punishment
   */
  static applyPunishment(userId, punishmentType, reason, durationHours = null) {
    const punishment = PUNISHMENT_TYPES[punishmentType];
    if (!punishment) throw new Error('Invalid punishment type');

    const duration = durationHours || punishment.defaultDurationHours;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const endsAt = new Date(now.getTime() + (duration * 60 * 60 * 1000));

    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO punishments (id, user_id, punishment_date, punishment_type, description, duration_hours, triggered_by, is_active, started_at, ends_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      id, userId, today, punishmentType,
      punishment.description, duration, reason,
      now.toISOString(), endsAt.toISOString()
    );

    // If it's a social media or device block, add to blocked apps
    if (punishmentType === 'SOCIAL_MEDIA_BLOCK' || punishmentType === 'FULL_DEVICE_BLOCK') {
      this.blockApps(userId, punishmentType, endsAt);
    }

    return {
      id,
      type: punishmentType,
      name: punishment.name,
      description: punishment.description,
      severity: punishment.severity,
      duration,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      reason
    };
  }

  /**
   * Block apps/social media
   */
  static blockApps(userId, blockType, blockedUntil) {
    const socialMediaApps = [
      'Instagram', 'Twitter/X', 'Facebook', 'TikTok', 'Snapchat',
      'Reddit', 'YouTube', 'WhatsApp Status', 'LinkedIn'
    ];

    const entertainmentApps = [
      'Netflix', 'Disney+', 'Amazon Prime', 'Spotify', 
      'Gaming (All)', 'Twitch', 'YouTube'
    ];

    const allApps = [
      ...socialMediaApps, ...entertainmentApps,
      'Browser (Non-essential)', 'App Store'
    ];

    let appsToBlock;
    if (blockType === 'FULL_DEVICE_BLOCK') {
      appsToBlock = allApps;
    } else if (blockType === 'SOCIAL_MEDIA_BLOCK') {
      appsToBlock = socialMediaApps;
    } else {
      appsToBlock = entertainmentApps;
    }

    const insertStmt = db.prepare(`
      INSERT INTO blocked_apps (id, user_id, app_name, blocked_until, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);

    const blockAll = db.transaction((apps) => {
      // Deactivate old blocks first
      db.prepare('UPDATE blocked_apps SET is_active = 0 WHERE user_id = ?').run(userId);
      
      for (const app of apps) {
        insertStmt.run(uuidv4(), userId, app, blockedUntil.toISOString());
      }
    });

    blockAll(appsToBlock);

    return appsToBlock;
  }

  /**
   * Get currently blocked apps
   */
  static getBlockedApps(userId) {
    const now = new Date().toISOString();
    
    // Deactivate expired blocks
    db.prepare(`
      UPDATE blocked_apps 
      SET is_active = 0 
      WHERE user_id = ? AND is_active = 1 AND blocked_until <= ?
    `).run(userId, now);

    return db.prepare(`
      SELECT * FROM blocked_apps 
      WHERE user_id = ? AND is_active = 1
      ORDER BY app_name ASC
    `).all(userId);
  }

  /**
   * Check if user has any active restrictions
   */
  static checkRestrictions(userId) {
    const activePunishments = this.getActivePunishments(userId);
    const blockedApps = this.getBlockedApps(userId);

    const hasRestrictions = activePunishments.length > 0;
    const severity = this.getHighestSeverity(activePunishments);

    return {
      isRestricted: hasRestrictions,
      activePunishments: activePunishments.length,
      blockedApps: blockedApps.length,
      highestSeverity: severity,
      punishments: activePunishments,
      blocked: blockedApps,
      message: hasRestrictions 
        ? this.getPunishmentMessage(severity)
        : 'No active punishments. Stay disciplined, Hunter.'
    };
  }

  /**
   * Get highest severity from active punishments
   */
  static getHighestSeverity(punishments) {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    let highest = 'low';

    for (const p of punishments) {
      const type = PUNISHMENT_TYPES[p.punishment_type];
      if (type && severityOrder.indexOf(type.severity) > severityOrder.indexOf(highest)) {
        highest = type.severity;
      }
    }

    return highest;
  }

  /**
   * Get punishment message based on severity
   */
  static getPunishmentMessage(severity) {
    const messages = {
      low: '⚠️ Minor penalty active. Complete your tasks to avoid escalation.',
      medium: '🔒 Restrictions active. Some apps are blocked. Prove your discipline.',
      high: '⛓️ Severe punishment active. Social media locked. Focus on redemption.',
      critical: '💀 SYSTEM LOCKDOWN. Critical failure detected. All non-essential access revoked.'
    };
    return messages[severity] || messages.low;
  }

  /**
   * Process daily punishment check
   * Called at end of day to evaluate quest completion
   */
  static processDailyCheck(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's quests
    const quests = db.prepare(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND is_bonus = 0'
    ).all(userId, today);

    if (quests.length === 0) return { noPunishment: true, reason: 'No quests for today' };

    const completed = quests.filter(q => q.is_completed).length;
    const total = quests.length;
    const completionRate = completed / total;

    // Get player profile for streak info
    const profile = db.prepare(
      'SELECT * FROM player_profiles WHERE user_id = ?'
    ).get(userId);

    const appliedPunishments = [];

    if (completionRate < 0.7) {
      // Failed day - apply punishments based on severity
      
      if (completionRate < 0.3) {
        // Critical failure
        const p = this.applyPunishment(userId, 'FULL_DEVICE_BLOCK', 
          `Catastrophic failure: Only ${completed}/${total} quests completed`, 24);
        appliedPunishments.push(p);

        const xpLoss = (profile?.level || 1) * 25;
        db.prepare(`
          UPDATE player_profiles 
          SET experience = MAX(0, experience - ?)
          WHERE user_id = ?
        `).run(xpLoss, userId);
        appliedPunishments.push({
          type: 'XP_PENALTY',
          xpLost: xpLoss,
          reason: 'Critical failure XP drain'
        });

      } else if (completionRate < 0.5) {
        // Major failure
        const p = this.applyPunishment(userId, 'SOCIAL_MEDIA_BLOCK',
          `Major failure: Only ${completed}/${total} quests completed`, 24);
        appliedPunishments.push(p);

        const p2 = this.applyPunishment(userId, 'EXTRA_WORKOUT',
          'Penalty workout required', 6);
        appliedPunishments.push(p2);

      } else {
        // Moderate failure
        const p = this.applyPunishment(userId, 'ENTERTAINMENT_BLOCK',
          `Moderate failure: ${completed}/${total} quests completed`, 12);
        appliedPunishments.push(p);
      }

      // Check consecutive failures for rank threat
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const yesterdayPunishments = db.prepare(
        'SELECT COUNT(*) as count FROM punishments WHERE user_id = ? AND punishment_date = ?'
      ).get(userId, yesterdayStr);

      if (yesterdayPunishments.count > 0) {
        appliedPunishments.push({
          type: 'RANK_THREAT',
          message: '⚠️ CONSECUTIVE FAILURE DETECTED. One more day of failure = RANK DEMOTION.',
          severity: 'critical'
        });
      }
    }

    return {
      date: today,
      completionRate: Math.round(completionRate * 100),
      questsCompleted: completed,
      questsTotal: total,
      punishmentsApplied: appliedPunishments,
      isPunished: appliedPunishments.length > 0
    };
  }

  /**
   * Get punishment history
   */
  static getHistory(userId, limit = 30) {
    return db.prepare(`
      SELECT * FROM punishments 
      WHERE user_id = ?
      ORDER BY started_at DESC
      LIMIT ?
    `).all(userId, limit);
  }

  /**
   * Emergency override - remove all active punishments (admin only)
   */
  static emergencyOverride(userId) {
    db.prepare('UPDATE punishments SET is_active = 0 WHERE user_id = ? AND is_active = 1').run(userId);
    db.prepare('UPDATE blocked_apps SET is_active = 0 WHERE user_id = ? AND is_active = 1').run(userId);
    return { message: 'All punishments cleared. Use wisely, Hunter.' };
  }
}

module.exports = PunishmentSystem;
