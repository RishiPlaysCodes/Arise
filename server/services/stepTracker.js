/**
 * STEP TRACKER SERVICE
 * 
 * Handles step counting, distance calculation, and calorie burn estimation.
 * Integrates with the quest system for verification.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

class StepTracker {

  /**
   * Calculate distance from steps (average stride length)
   * Male average stride: 0.78m, Female: 0.70m
   */
  static calculateDistance(steps, gender = 'male', heightCm = 175) {
    // Stride length is approximately 0.415 * height in cm
    const strideLengthM = (0.415 * heightCm) / 100;
    return Math.round((steps * strideLengthM) / 1000 * 100) / 100; // km
  }

  /**
   * Calculate calories burned from steps
   * Based on MET values and body weight
   */
  static calculateCaloriesBurned(steps, weightKg, heightCm = 175) {
    const distanceKm = this.calculateDistance(steps, 'male', heightCm);
    // Walking burns approximately 0.57 kcal per kg per km
    return Math.round(0.57 * weightKg * distanceKm);
  }

  /**
   * Calculate active minutes from steps (assuming 100 steps/minute average walking pace)
   */
  static calculateActiveMinutes(steps) {
    return Math.round(steps / 100);
  }

  /**
   * Log steps for a user
   */
  static logSteps(userId, steps) {
    const today = new Date().toISOString().split('T')[0];
    
    // Get user's body profile for accurate calculations
    const bodyProfile = db.prepare(
      'SELECT * FROM body_profiles WHERE user_id = ?'
    ).get(userId);

    const heightCm = bodyProfile?.height_cm || 175;
    const weightKg = bodyProfile?.current_weight_kg || 70;
    const gender = bodyProfile?.gender || 'male';

    const distance = this.calculateDistance(steps, gender, heightCm);
    const caloriesBurned = this.calculateCaloriesBurned(steps, weightKg, heightCm);
    const activeMinutes = this.calculateActiveMinutes(steps);

    // Upsert step log (update if exists for today)
    const existing = db.prepare(
      'SELECT * FROM step_logs WHERE user_id = ? AND log_date = ?'
    ).get(userId, today);

    if (existing) {
      db.prepare(`
        UPDATE step_logs 
        SET steps = ?, distance_km = ?, calories_burned = ?, active_minutes = ?, last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ? AND log_date = ?
      `).run(steps, distance, caloriesBurned, activeMinutes, userId, today);
    } else {
      db.prepare(`
        INSERT INTO step_logs (id, user_id, log_date, steps, distance_km, calories_burned, active_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, today, steps, distance, caloriesBurned, activeMinutes);
    }

    // Update step-related quests
    this.updateStepQuests(userId, steps);

    return {
      date: today,
      steps,
      distance,
      caloriesBurned,
      activeMinutes
    };
  }

  /**
   * Add incremental steps
   */
  static addSteps(userId, additionalSteps) {
    const today = new Date().toISOString().split('T')[0];
    
    const existing = db.prepare(
      'SELECT * FROM step_logs WHERE user_id = ? AND log_date = ?'
    ).get(userId, today);

    const currentSteps = existing ? existing.steps : 0;
    const newTotal = currentSteps + additionalSteps;

    return this.logSteps(userId, newTotal);
  }

  /**
   * Update step-related quests
   */
  static updateStepQuests(userId, totalSteps) {
    const today = new Date().toISOString().split('T')[0];
    
    const stepQuests = db.prepare(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND quest_type = ? AND is_completed = 0'
    ).all(userId, today, 'steps');

    for (const quest of stepQuests) {
      const isCompleted = totalSteps >= quest.target_value;
      db.prepare(`
        UPDATE daily_quests 
        SET current_value = ?, is_completed = ?, completed_at = ?
        WHERE id = ?
      `).run(
        Math.min(totalSteps, quest.target_value),
        isCompleted ? 1 : 0,
        isCompleted ? new Date().toISOString() : null,
        quest.id
      );

      if (isCompleted) {
        const QuestEngine = require('./questEngine');
        QuestEngine.awardXP(userId, quest.xp_reward);
      }
    }
  }

  /**
   * Get step history
   */
  static getStepHistory(userId, days = 30) {
    return db.prepare(`
      SELECT * FROM step_logs 
      WHERE user_id = ? 
      ORDER BY log_date DESC 
      LIMIT ?
    `).all(userId, days);
  }

  /**
   * Get today's steps
   */
  static getTodaySteps(userId) {
    const today = new Date().toISOString().split('T')[0];
    return db.prepare(
      'SELECT * FROM step_logs WHERE user_id = ? AND log_date = ?'
    ).get(userId, today) || { steps: 0, distance_km: 0, calories_burned: 0, active_minutes: 0 };
  }

  /**
   * Get weekly summary
   */
  static getWeeklySummary(userId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const logs = db.prepare(`
      SELECT * FROM step_logs 
      WHERE user_id = ? AND log_date >= ?
      ORDER BY log_date ASC
    `).all(userId, startDate);

    const totalSteps = logs.reduce((sum, l) => sum + l.steps, 0);
    const totalDistance = logs.reduce((sum, l) => sum + l.distance_km, 0);
    const totalCalories = logs.reduce((sum, l) => sum + l.calories_burned, 0);
    const avgSteps = logs.length > 0 ? Math.round(totalSteps / logs.length) : 0;

    return {
      days: logs.length,
      totalSteps,
      averageSteps: avgSteps,
      totalDistanceKm: Math.round(totalDistance * 100) / 100,
      totalCaloriesBurned: totalCalories,
      dailyLogs: logs
    };
  }
}

module.exports = StepTracker;
