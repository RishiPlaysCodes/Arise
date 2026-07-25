/**
 * COMBAT TRAINING SERVICE
 * 
 * Handles combat sports training plans, technique progression,
 * and integration with the quest/leveling system.
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { COMBAT_TYPES } = require('../config/constants');

class CombatTraining {

  /**
   * Get available combat sports
   */
  static getCombatTypes() {
    return COMBAT_TYPES;
  }

  /**
   * Generate combat training session based on skill level
   */
  static generateTrainingSession(combatType, skillLevel = 'beginner', durationMinutes = 30) {
    const sport = COMBAT_TYPES[combatType];
    if (!sport) throw new Error('Invalid combat type');

    const sessions = {
      beginner: {
        boxing: [
          { name: 'Warm-up Shadow Boxing', duration: 5, description: 'Light movement, practice stance and basic footwork' },
          { name: 'Jab Practice', duration: 5, description: '50 jabs each hand, focus on form and snap' },
          { name: 'Cross Practice', duration: 5, description: '50 crosses, rotate hips fully, guard up' },
          { name: 'Jab-Cross Combination', duration: 5, description: '1-2 combo, 30 reps each side' },
          { name: 'Footwork Drills', duration: 5, description: 'Forward, back, lateral movement with guard' },
          { name: 'Cool Down & Stretch', duration: 5, description: 'Light shadow boxing, stretch shoulders and hips' }
        ],
        muay_thai: [
          { name: 'Thai Warm-up', duration: 5, description: 'Skip rope or light bouncing' },
          { name: 'Basic Stance & Guard', duration: 5, description: 'Thai stance, hands up, weight distributed' },
          { name: 'Teep (Push Kick)', duration: 5, description: '25 each leg, push through the hip' },
          { name: 'Roundhouse Kick', duration: 5, description: '20 each leg, rotate on ball of foot' },
          { name: 'Knee Strikes', duration: 5, description: '20 each leg, drive hips forward' },
          { name: 'Cool Down', duration: 5, description: 'Light stretching, focus on hip flexibility' }
        ],
        bjj: [
          { name: 'Mat Warm-up', duration: 5, description: 'Shrimping, bridge, technical standup' },
          { name: 'Guard Retention', duration: 8, description: 'Practice keeping closed guard, hip movement' },
          { name: 'Basic Sweep: Scissor Sweep', duration: 7, description: 'Drill scissor sweep from closed guard' },
          { name: 'Escape: Mount Escape', duration: 7, description: 'Bridge and roll, elbow-knee escape' },
          { name: 'Cool Down', duration: 3, description: 'Stretch, focus on neck and back' }
        ],
        mma: [
          { name: 'MMA Warm-up', duration: 5, description: 'Shadow boxing with level changes' },
          { name: 'Striking Combinations', duration: 8, description: 'Jab-cross-hook-kick basic combo' },
          { name: 'Takedown Defense', duration: 7, description: 'Sprawl drill, 20 reps' },
          { name: 'Ground & Pound Position', duration: 5, description: 'Maintain mount, practice light strikes' },
          { name: 'Conditioning', duration: 5, description: 'Burpees with sprawl, 3x10' }
        ],
        wrestling: [
          { name: 'Wrestling Warm-up', duration: 5, description: 'Penetration steps, level changes' },
          { name: 'Stance & Motion', duration: 5, description: 'Wrestling stance, push-pull movement' },
          { name: 'Single Leg Takedown', duration: 8, description: 'Drill entry and finish, 20 reps' },
          { name: 'Sprawl Defense', duration: 7, description: 'React to shot with sprawl, 25 reps' },
          { name: 'Conditioning', duration: 5, description: 'Wrestling-specific conditioning circuit' }
        ],
        karate: [
          { name: 'Karate Warm-up', duration: 5, description: 'Traditional warm-up, joint rotations' },
          { name: 'Basic Stances', duration: 5, description: 'Front stance, back stance, horse stance holds' },
          { name: 'Straight Punch (Choku-zuki)', duration: 5, description: '50 reps, focus on hip rotation' },
          { name: 'Front Kick (Mae-geri)', duration: 5, description: '25 each leg, chamber knee first' },
          { name: 'Basic Kata', duration: 5, description: 'Practice Taikyoku Shodan or Heian Shodan' },
          { name: 'Cool Down', duration: 5, description: 'Flexibility work and meditation' }
        ],
        kickboxing: [
          { name: 'Kickboxing Warm-up', duration: 5, description: 'Jump rope or high knees' },
          { name: 'Jab-Cross-Hook', duration: 5, description: '30 combo reps, hands up' },
          { name: 'Roundhouse Kick', duration: 5, description: '20 each leg, pivot on support foot' },
          { name: 'Front Kick', duration: 5, description: '20 each leg, snap and retract' },
          { name: 'Combo: Punch-Kick', duration: 5, description: 'Jab-cross-roundhouse, 15 each side' },
          { name: 'Cool Down', duration: 5, description: 'Stretch legs and shoulders' }
        ],
        krav_maga: [
          { name: 'Combatives Warm-up', duration: 5, description: 'Stress drill - burpees into strikes' },
          { name: 'Palm Strike & Hammer Fist', duration: 5, description: '30 each, maximum aggression' },
          { name: 'Knee & Elbow Strikes', duration: 5, description: '20 each, close range power' },
          { name: 'Wrist Release', duration: 5, description: 'Basic wrist grab escapes' },
          { name: '360 Defense', duration: 5, description: 'Block outside attacks from various angles' },
          { name: 'Cool Down', duration: 5, description: 'Controlled breathing and stretch' }
        ]
      },
      intermediate: {
        boxing: [
          { name: 'Shadow Boxing Rounds', duration: 6, description: '2x3 min rounds, work all combinations' },
          { name: 'Heavy Bag Work', duration: 8, description: '3-4 punch combinations with movement' },
          { name: 'Speed Bag / Double End', duration: 5, description: 'Timing and rhythm development' },
          { name: 'Defensive Drills', duration: 5, description: 'Slip, roll, pull-back practice' },
          { name: 'Conditioning', duration: 6, description: 'Boxing-specific HIIT circuit' }
        ],
        muay_thai: [
          { name: 'Clinch Work', duration: 8, description: 'Clinch entry, knee strikes, sweeps' },
          { name: 'Combination Kicks', duration: 7, description: 'Jab-cross-kick, teep-cross-kick combos' },
          { name: 'Elbow Strikes', duration: 5, description: 'Horizontal, diagonal, spinning elbows' },
          { name: 'Pad Work Simulation', duration: 5, description: 'Shadow pad rounds with full combos' },
          { name: 'Conditioning', duration: 5, description: '200 kicks on bag' }
        ],
        bjj: [
          { name: 'Flow Rolling', duration: 8, description: 'Light positional sparring' },
          { name: 'Submission Chains', duration: 8, description: 'Armbar to triangle to omoplata flow' },
          { name: 'Guard Passing', duration: 7, description: 'Toreando and knee cut passes' },
          { name: 'Back Control', duration: 7, description: 'Seat belt, hooks, RNC setup' }
        ],
        mma: [
          { name: 'MMA Sparring Prep', duration: 6, description: 'Shadow MMA with transitions' },
          { name: 'Cage Work', duration: 7, description: 'Wall wrestling, dirty boxing' },
          { name: 'Ground & Pound', duration: 7, description: 'Positional control with strikes' },
          { name: 'Submission Defense', duration: 5, description: 'Defense from common positions' },
          { name: 'Conditioning', duration: 5, description: '5 min sustained MMA simulation' }
        ]
      },
      advanced: {
        boxing: [
          { name: 'Technical Sparring', duration: 8, description: 'Controlled rounds focusing on setups' },
          { name: 'Counter Punching', duration: 7, description: 'Pull counter, check hook, pivot' },
          { name: 'Pressure Fighting', duration: 7, description: 'Cut off ring, body shots, aggression' },
          { name: 'Championship Rounds', duration: 8, description: '3x3 min high intensity rounds' }
        ],
        muay_thai: [
          { name: 'Full Thai Sparring', duration: 10, description: '3x3 rounds with all weapons' },
          { name: 'Advanced Clinch', duration: 8, description: 'Sweeps, dumps, clinch striking' },
          { name: 'Fight Simulation', duration: 7, description: 'Full rounds simulating fight pace' },
          { name: 'Conditioning', duration: 5, description: '5 rounds heavy bag non-stop' }
        ]
      }
    };

    // Get appropriate session or default to beginner
    const level = sessions[skillLevel] || sessions.beginner;
    const workout = level[combatType] || level.boxing;

    // Scale to requested duration
    const totalPlannedMinutes = workout.reduce((sum, ex) => sum + ex.duration, 0);
    const scale = durationMinutes / totalPlannedMinutes;

    return {
      combatType: sport.name,
      skillLevel,
      totalDuration: durationMinutes,
      caloriesEstimate: Math.round(sport.caloriesPerMinute * durationMinutes),
      exercises: workout.map(ex => ({
        ...ex,
        duration: Math.round(ex.duration * scale)
      }))
    };
  }

  /**
   * Log a combat training session
   */
  static logSession(userId, sessionData) {
    const {
      combatType, techniqueName, rounds, durationMinutes,
      intensity, skillLevel, notes
    } = sessionData;

    const sport = COMBAT_TYPES[combatType];
    if (!sport) throw new Error('Invalid combat type');

    const caloriesBurned = Math.round(sport.caloriesPerMinute * durationMinutes * 
      (intensity === 'high' ? 1.3 : intensity === 'low' ? 0.7 : 1.0));

    const today = new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO combat_training (id, user_id, log_date, combat_type, technique_name, rounds, duration_minutes, intensity, calories_burned, skill_level, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, today, combatType, techniqueName || sport.name,
      rounds || 0, durationMinutes, intensity || 'moderate',
      caloriesBurned, skillLevel || 'beginner', notes || ''
    );

    // Update combat-related quests
    this.updateCombatQuests(userId, durationMinutes);

    // Log as activity too
    db.prepare(`
      INSERT INTO activity_logs (id, user_id, log_date, activity_type, activity_name, duration_minutes, calories_burned, intensity, notes, verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), userId, today, 'combat', `${sport.name} Training`,
      durationMinutes, caloriesBurned, intensity || 'moderate',
      notes || '', 1
    );

    return {
      logged: true,
      combatType: sport.name,
      duration: durationMinutes,
      caloriesBurned,
      date: today
    };
  }

  /**
   * Update combat-related quests
   */
  static updateCombatQuests(userId, minutes) {
    const today = new Date().toISOString().split('T')[0];
    
    const combatQuests = db.prepare(
      'SELECT * FROM daily_quests WHERE user_id = ? AND quest_date = ? AND quest_category = ? AND is_completed = 0'
    ).all(userId, today, 'combat');

    for (const quest of combatQuests) {
      const newValue = quest.current_value + minutes;
      const isCompleted = newValue >= quest.target_value;
      
      db.prepare(`
        UPDATE daily_quests 
        SET current_value = ?, is_completed = ?, completed_at = ?
        WHERE id = ?
      `).run(
        Math.min(newValue, quest.target_value),
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
   * Get combat training history
   */
  static getHistory(userId, days = 30) {
    return db.prepare(`
      SELECT * FROM combat_training 
      WHERE user_id = ? 
      ORDER BY log_date DESC, created_at DESC 
      LIMIT ?
    `).all(userId, days * 5); // Assume max 5 sessions per day
  }

  /**
   * Get combat stats summary
   */
  static getStats(userId) {
    const stats = db.prepare(`
      SELECT 
        combat_type,
        COUNT(*) as total_sessions,
        SUM(duration_minutes) as total_minutes,
        SUM(calories_burned) as total_calories,
        SUM(rounds) as total_rounds,
        MAX(skill_level) as highest_skill
      FROM combat_training
      WHERE user_id = ?
      GROUP BY combat_type
    `).all(userId);

    const overall = db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(duration_minutes) as total_minutes,
        SUM(calories_burned) as total_calories
      FROM combat_training
      WHERE user_id = ?
    `).get(userId);

    return { byType: stats, overall };
  }
}

module.exports = CombatTraining;
