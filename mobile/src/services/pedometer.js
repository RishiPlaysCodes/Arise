// ============================================================================
// PEDOMETER SERVICE - Battery-efficient hardware step counting
//
// Uses expo-sensors Pedometer which on Android maps to the hardware
// TYPE_STEP_COUNTER sensor. This sensor is maintained by a low-power
// co-processor - it does NOT keep the CPU awake and does NOT use GPS,
// so battery impact is negligible compared to accelerometer polling.
//
// Strategy:
//  - watchStepCount gives step deltas since subscription start.
//  - We persist a per-day cumulative total in SQLite.
//  - On day rollover, we reset the day's counter but keep sensor continuity.
// ============================================================================

import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepRepo } from '../db/repositories';
import { todayStr } from '../engine/constants';

const KEY_SESSION_BASE = 'pedometer_session_base';
const KEY_SESSION_DATE = 'pedometer_session_date';

let subscription = null;
let listeners = [];

export const PedometerService = {
  async isAvailable() {
    try {
      return await Pedometer.isAvailableAsync();
    } catch {
      return false;
    }
  },

  async requestPermissions() {
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  onUpdate(cb) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((l) => l !== cb);
    };
  },

  _emit(data) {
    listeners.forEach((l) => {
      try { l(data); } catch (e) { /* noop */ }
    });
  },

  // Start watching. `watchStepCount` reports steps since the subscription began.
  async start() {
    if (subscription) return;
    const available = await this.isAvailable();
    if (!available) return { available: false };

    const granted = await this.requestPermissions();
    if (!granted) return { available: true, granted: false };

    // Load today's existing steps as our accumulation base
    const todayRow = await StepRepo.today();
    let dayBase = todayRow.steps || 0;

    subscription = Pedometer.watchStepCount(async (result) => {
      // result.steps = steps counted since this watch subscription started
      const nowDate = todayStr();
      const storedDate = await AsyncStorage.getItem(KEY_SESSION_DATE);

      if (storedDate !== nowDate) {
        // Day rolled over while watching -> reset the day base
        dayBase = 0;
        await AsyncStorage.setItem(KEY_SESSION_DATE, nowDate);
        await AsyncStorage.setItem(KEY_SESSION_BASE, '0');
      }

      const total = dayBase + result.steps;
      const saved = await StepRepo.setSteps(total);
      this._emit(saved);
    });

    await AsyncStorage.setItem(KEY_SESSION_DATE, todayStr());
    return { available: true, granted: true };
  },

  stop() {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  },

  // For iOS historical query (Android hardware counter doesn't support ranged history)
  async syncHistorical() {
    try {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(start, end);
      if (result && typeof result.steps === 'number') {
        return StepRepo.setSteps(result.steps);
      }
    } catch {
      // Not supported on this platform (e.g. Android) - watchStepCount handles it
    }
    return null;
  },
};

export default PedometerService;
