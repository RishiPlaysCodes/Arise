// ============================================================================
// COMBAT ENGINE (Pure) - generates combat training sessions on-device
// ============================================================================

import { COMBAT_TYPES } from './constants';

const SESSIONS = {
  beginner: {
    boxing: [
      { name: 'Warm-up Shadow Boxing', duration: 5, description: 'Light movement, stance & footwork' },
      { name: 'Jab Practice', duration: 5, description: '50 jabs each hand, focus on snap' },
      { name: 'Cross Practice', duration: 5, description: '50 crosses, rotate hips, guard up' },
      { name: 'Jab-Cross Combo', duration: 5, description: '1-2 combo, 30 reps each side' },
      { name: 'Footwork Drills', duration: 5, description: 'Forward, back, lateral with guard' },
      { name: 'Cool Down & Stretch', duration: 5, description: 'Light shadow boxing, stretch' },
    ],
    muay_thai: [
      { name: 'Thai Warm-up', duration: 5, description: 'Skip rope or light bouncing' },
      { name: 'Stance & Guard', duration: 5, description: 'Thai stance, hands up' },
      { name: 'Teep (Push Kick)', duration: 5, description: '25 each leg, push through hip' },
      { name: 'Roundhouse Kick', duration: 5, description: '20 each leg, rotate on ball of foot' },
      { name: 'Knee Strikes', duration: 5, description: '20 each leg, drive hips forward' },
      { name: 'Cool Down', duration: 5, description: 'Stretch, hip flexibility' },
    ],
    bjj: [
      { name: 'Mat Warm-up', duration: 5, description: 'Shrimping, bridge, technical standup' },
      { name: 'Guard Retention', duration: 8, description: 'Keep closed guard, hip movement' },
      { name: 'Scissor Sweep', duration: 7, description: 'Drill from closed guard' },
      { name: 'Mount Escape', duration: 7, description: 'Bridge and roll, elbow-knee escape' },
      { name: 'Cool Down', duration: 3, description: 'Stretch neck and back' },
    ],
    mma: [
      { name: 'MMA Warm-up', duration: 5, description: 'Shadow boxing with level changes' },
      { name: 'Striking Combos', duration: 8, description: 'Jab-cross-hook-kick basic combo' },
      { name: 'Takedown Defense', duration: 7, description: 'Sprawl drill, 20 reps' },
      { name: 'Ground Position', duration: 5, description: 'Maintain mount, light strikes' },
      { name: 'Conditioning', duration: 5, description: 'Burpees with sprawl, 3x10' },
    ],
    wrestling: [
      { name: 'Wrestling Warm-up', duration: 5, description: 'Penetration steps, level changes' },
      { name: 'Stance & Motion', duration: 5, description: 'Push-pull movement' },
      { name: 'Single Leg Takedown', duration: 8, description: 'Entry and finish, 20 reps' },
      { name: 'Sprawl Defense', duration: 7, description: 'React to shot, 25 reps' },
      { name: 'Conditioning', duration: 5, description: 'Wrestling circuit' },
    ],
    karate: [
      { name: 'Karate Warm-up', duration: 5, description: 'Joint rotations' },
      { name: 'Basic Stances', duration: 5, description: 'Front, back, horse stance holds' },
      { name: 'Straight Punch', duration: 5, description: '50 reps, hip rotation' },
      { name: 'Front Kick', duration: 5, description: '25 each leg, chamber knee' },
      { name: 'Basic Kata', duration: 5, description: 'Taikyoku Shodan' },
      { name: 'Cool Down', duration: 5, description: 'Flexibility & meditation' },
    ],
    kickboxing: [
      { name: 'Warm-up', duration: 5, description: 'Jump rope / high knees' },
      { name: 'Jab-Cross-Hook', duration: 5, description: '30 combo reps' },
      { name: 'Roundhouse Kick', duration: 5, description: '20 each leg, pivot' },
      { name: 'Front Kick', duration: 5, description: '20 each leg, snap & retract' },
      { name: 'Punch-Kick Combo', duration: 5, description: 'Jab-cross-roundhouse, 15 each' },
      { name: 'Cool Down', duration: 5, description: 'Stretch legs & shoulders' },
    ],
    krav_maga: [
      { name: 'Combatives Warm-up', duration: 5, description: 'Burpees into strikes' },
      { name: 'Palm & Hammer Fist', duration: 5, description: '30 each, aggression' },
      { name: 'Knee & Elbow', duration: 5, description: '20 each, close range power' },
      { name: 'Wrist Release', duration: 5, description: 'Basic grab escapes' },
      { name: '360 Defense', duration: 5, description: 'Block outside attacks' },
      { name: 'Cool Down', duration: 5, description: 'Breathing & stretch' },
    ],
  },
  intermediate: {
    boxing: [
      { name: 'Shadow Boxing Rounds', duration: 6, description: '2x3 min, all combos' },
      { name: 'Heavy Bag Work', duration: 8, description: '3-4 punch combos with movement' },
      { name: 'Speed/Double-End', duration: 5, description: 'Timing and rhythm' },
      { name: 'Defensive Drills', duration: 5, description: 'Slip, roll, pull-back' },
      { name: 'Conditioning', duration: 6, description: 'Boxing HIIT circuit' },
    ],
    muay_thai: [
      { name: 'Clinch Work', duration: 8, description: 'Entry, knees, sweeps' },
      { name: 'Combination Kicks', duration: 7, description: 'Jab-cross-kick combos' },
      { name: 'Elbow Strikes', duration: 5, description: 'Horizontal, diagonal, spinning' },
      { name: 'Pad Simulation', duration: 5, description: 'Full combo rounds' },
      { name: 'Conditioning', duration: 5, description: '200 kicks on bag' },
    ],
  },
  advanced: {
    boxing: [
      { name: 'Technical Sparring', duration: 8, description: 'Controlled rounds, setups' },
      { name: 'Counter Punching', duration: 7, description: 'Pull counter, check hook, pivot' },
      { name: 'Pressure Fighting', duration: 7, description: 'Cut off ring, body shots' },
      { name: 'Championship Rounds', duration: 8, description: '3x3 min high intensity' },
    ],
    muay_thai: [
      { name: 'Full Thai Sparring', duration: 10, description: '3x3 rounds, all weapons' },
      { name: 'Advanced Clinch', duration: 8, description: 'Sweeps, dumps, striking' },
      { name: 'Fight Simulation', duration: 7, description: 'Full rounds at fight pace' },
      { name: 'Conditioning', duration: 5, description: '5 rounds heavy bag non-stop' },
    ],
  },
};

export const CombatEngine = {
  getCombatTypes() {
    return COMBAT_TYPES;
  },

  generateSession(combatType, skillLevel = 'beginner', durationMinutes = 30) {
    const sport = COMBAT_TYPES[combatType];
    if (!sport) throw new Error('Invalid combat type');
    const level = SESSIONS[skillLevel] || SESSIONS.beginner;
    const workout = level[combatType] || SESSIONS.beginner[combatType] || SESSIONS.beginner.boxing;
    const planned = workout.reduce((s, e) => s + e.duration, 0);
    const scale = durationMinutes / planned;
    return {
      combatType: sport.name,
      combatKey: combatType,
      skillLevel,
      totalDuration: durationMinutes,
      caloriesEstimate: Math.round(sport.caloriesPerMinute * durationMinutes),
      exercises: workout.map((e) => ({ ...e, duration: Math.max(1, Math.round(e.duration * scale)) })),
    };
  },

  caloriesFor(combatType, durationMinutes, intensity = 'moderate') {
    const sport = COMBAT_TYPES[combatType];
    if (!sport) return 0;
    const mult = intensity === 'high' ? 1.3 : intensity === 'low' ? 0.7 : 1.0;
    return Math.round(sport.caloriesPerMinute * durationMinutes * mult);
  },
};

export default CombatEngine;
