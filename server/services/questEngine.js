/**
 * QUEST ENGINE - Daily Quest Generation & Management
 * 
 * Generates progressive daily quests that adapt to player level,
 * body type, and transformation phase.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const TransformationEngine = require('./transformationEngine');
const { QUEST_CATEGORIES, getXPForLevel, getRankFromLevel } = require('../config/constants');

class QuestEngine {

  /**
   * Generate daily quests for a user
   */
  static generateDailyQuests(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if quests already exist for today
    const existingQuests = db.prepare(
      'SELECT COUNT(*) as count FROM daily_quests WHERE user_id = ? AND quest_date = ?'
    ).get(userId, today);

    if (existingQuests.count > 0) {
      return this.getTodayQuests(userId);
    }

    // Get player profile and body profile
    const playerProfile = db.prepare(
      'SELECT * FROM player_profiles WHERE user_id = ?'
    ).get(userId);

    const bodyProfile = db.prepare(
      'SELECT * FROM body_profiles WHERE user_id = ?'
    ).get(userId);

    if (!playerProfile || !bodyProfile) {
      throw new Error('Profile not complete. Set up your body profile first.');
    }

    // Get diet targets
    const dietTargets = db.prepare(
      'SELECT * FROM diet_targets WHERE user_id = ?'
    ).get(userId);

    // Generate transformation plan for quest context
    const plan = TransformationEngine.generateTransformationPlan({
      heightCm: bodyProfile.height_cm,
      currentWeightKg: bodyProfile.current_weight_kg,
      age: bodyProfile.age,
      gender: bodyProfile.gender,
      activityLevel: bodyProfile.activity_level,
      targetBodyType: bodyProfile.target_body_type,
      bodyFatPercentage: bodyProfile.body_fat_percentage
    });

    const dayOfWeek = new Date().getDay();
    const playerLevel = playerProfile.level;

    // Generate quests using transformation engine
    const questTemplates = TransformationEngine.generateDailyQuests(
      bodyProfile, plan, dayOfWeek, playerLevel
    );

    // Insert quests into database
    const insertStmt = db.prepare(`
      INSERT INTO daily_quests (id, user_id, quest_date, quest_type, quest_category, title, description, target_value, unit, xp_reward, difficulty, is_bonus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((quests) => {
      for (const quest of quests) {
        insertStmt.run(
          uuidv4(),
          userId,
          today,
          quest.type,
          quest.category,
          quest.title,
          quest.description,
          quest.targetValue,
          quest.unit,
          quest.xpReward,
          quest.difficulty,
          quest.isBonus ? 1 : 0
        );
      }
    });

    insertMany(questTemplates);

    return this.getTodayQuests(userId);
  }

  /**
   * Get today's quests for a user
   */
  static getTodayQuests(userId) {
    const today = new Date().toISOString().split('T')[0];
    return db.prepare(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? ORDER BY is_bonus ASC, quest_category ASC'
    ).all(userId, today);
  }

  /**
   * Update quest progress
   */
  static updateQuestProgress(questId, userId, value) {
    const quest = db.prepare(
      'SELECT * FROM daily_quests WHERE id = ? AND user_id = ?'
    ).get(questId, userId);

    if (!quest) {
      throw new Error('Quest not found');
    }

    if (quest.is_completed) {
      return { message: 'Quest already completed', quest };
    }

    const newValue = quest.current_value + value;
    const isCompleted = newValue >= quest.target_value;

    db.prepare(`
      UPDATE daily_quests 
      SET current_value = ?, is_completed = ?, completed_at = ?
      WHERE id = ?
    `).run(
      Math.min(newValue, quest.target_value),
      isCompleted ? 1 : 0,
      isCompleted ? new Date().toISOString() : null,
      questId
    );

    // Award XP if completed
    if (isCompleted) {
      this.awardXP(userId, quest.xp_reward);
    }

    return {
      questId,
      currentValue: Math.min(newValue, quest.target_value),
      targetValue: quest.target_value,
      isCompleted,
      xpAwarded: isCompleted ? quest.xp_reward : 0
    };
  }

  /**
   * Complete a quest directly (for binary quests)
   */
  static completeQuest(questId, userId) {
    const quest = db.prepare(
      'SELECT * FROM daily_quests WHERE id = ? AND user_id = ?'
    ).get(questId, userId);

    if (!quest) throw new Error('Quest not found');
    if (quest.is_completed) return { message: 'Already completed', quest };

    db.prepare(`
      UPDATE daily_quests 
      SET current_value = target_value, is_completed = 1, completed_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), questId);

    this.awardXP(userId, quest.xp_reward);

    return {
      questId,
      completed: true,
      xpAwarded: quest.xp_reward
    };
  }

  /**
   * Award XP and handle level ups
   */
  static awardXP(userId, xp) {
    const profile = db.prepare(
      'SELECT * FROM player_profiles WHERE user_id = ?'
    ).get(userId);

    if (!profile) return;

    let newXP = profile.experience + xp;
    let newLevel = profile.level;
    let newRank = profile.rank;
    let xpToNext = profile.experience_to_next_level;
    let leveledUp = false;

    // Check for level up
    while (newXP >= xpToNext) {
      newXP -= xpToNext;
      newLevel++;
      xpToNext = getXPForLevel(newLevel);
      leveledUp = true;
    }

    newRank = getRankFromLevel(newLevel);

    // Update stats on level up
    if (leveledUp) {
      db.prepare(`
        UPDATE player_stats 
        SET stat_points_available = stat_points_available + 3,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(userId);
    }

    // Get title based on rank
    const titles = {
      E: 'Weakest Hunter',
      D: 'Novice Hunter',
      C: 'Intermediate Hunter',
      B: 'Advanced Hunter',
      A: 'Elite Hunter',
      S: 'National Level Hunter',
      SS: 'Shadow Monarch'
    };

    db.prepare(`
      UPDATE player_profiles 
      SET experience = ?, level = ?, rank = ?, 
          experience_to_next_level = ?, title = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(newXP, newLevel, newRank, xpToNext, titles[newRank], userId);

    return { newLevel, newRank, newXP, xpToNext, leveledUp };
  }

  /**
   * Process end of day - check completions and apply punishments
   */
  static processEndOfDay(userId) {
    const today = new Date().toISOString().split('T')[0];
    
    const quests = db.prepare(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ?'
    ).all(userId, today);

    if (quests.length === 0) return null;

    const totalQuests = quests.filter(q => !q.is_bonus).length;
    const completedQuests = quests.filter(q => q.is_completed && !q.is_bonus).length;
    const failedQuests = totalQuests - completedQuests;

    const profile = db.prepare(
      'SELECT * FROM player_profiles WHERE user_id = ?'
    ).get(userId);

    // Update streak
    const completionRate = completedQuests / totalQuests;
    let newStreak = profile.streak_days;
    
    if (completionRate >= 0.7) {
      // 70% completion = streak maintained
      newStreak++;
      db.prepare(`
        UPDATE player_profiles 
        SET streak_days = ?, 
            longest_streak = MAX(longest_streak, ?),
            total_quests_completed = total_quests_completed + ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(newStreak, newStreak, completedQuests, userId);
    } else {
      // Streak broken
      newStreak = 0;
      db.prepare(`
        UPDATE player_profiles 
        SET streak_days = 0, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(userId);
    }

    // Determine punishments
    const punishments = TransformationEngine.determinePunishment(
      failedQuests, totalQuests, newStreak, profile.level
    );

    // Apply punishments
    if (punishments.length > 0 && completionRate < 0.7) {
      const insertPunishment = db.prepare(`
        INSERT INTO punishments (id, user_id, punishment_date, punishment_type, description, duration_hours, triggered_by, ends_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of punishments) {
        const endsAt = new Date();
        endsAt.setHours(endsAt.getHours() + (p.durationHours || 24));
        
        insertPunishment.run(
          uuidv4(), userId, today, p.type,
          p.reason, p.durationHours || 24,
          `Failed ${failedQuests}/${totalQuests} quests`,
          endsAt.toISOString()
        );
      }

      // Apply XP penalty if applicable
      const xpPenalty = punishments.find(p => p.type === 'XP_PENALTY');
      if (xpPenalty) {
        const currentXP = profile.experience;
        const newXP = Math.max(0, currentXP - (xpPenalty.xpLoss || 0));
        db.prepare('UPDATE player_profiles SET experience = ? WHERE user_id = ?').run(newXP, userId);
      }
    }

    return {
      date: today,
      totalQuests,
      completedQuests,
      failedQuests,
      completionRate: Math.round(completionRate * 100),
      streak: newStreak,
      punishments
    };
  }
}

module.exports = QuestEngine;
