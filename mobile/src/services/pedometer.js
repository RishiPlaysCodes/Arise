// ============================================================================
// PEDOMETER SERVICE - Battery-efficient, THROTTLED hardware step counting
//
// The device step sensor can fire many times per second while walking. Writing
// to SQLite (and syncing quests/XP) on EVERY tick jams the JS thread and causes
// "keeps stopping" / lag / race conditions. So we accumulate steps in memory
// and FLUSH to the database at most once every few seconds (or on a big delta).
// This keeps the UI smooth and the DB writes serialized.
// ============================================================================

import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StepRepo } from '../db/repositories';
import { todayStr } from '../engine/constants';

const KEY_SESSION_DATE = 'pedometer_session_date';
const FLUSH_MS = 6000;      // write to DB at most every 6s
const FORCE_DELTA = 40;     // ...or immediately after +40 steps

let subscription = null;
let listeners = [];
let dayBase = 0;            // steps already counted for today before this watch session
let currentTotal = 0;       // dayBase + steps-since-watch-start
let lastFlushed = 0;        // last total written to DB
let flushTimer = null;
let flushing = false;

export const PedometerService = {
  async isAvailable() {
    try { return await Pedometer.isAvailableAsync(); } catch { return false; }
  },

  async requestPermissions() {
    try {
      const { status } = await Pedometer.requestPermissionsAsync();
      return status === 'granted';
    } catch { return false; }
  },

  onUpdate(cb) {
    listeners.push(cb);
    return () => { listeners = listeners.filter((l) => l !== cb); };
  },

  _emit(data) {
    listeners.forEach((l) => { try { l(data); } catch (e) { /* noop */ } });
  },

  async _flush() {
    if (flushing) return;
    if (currentTotal === lastFlushed) return;
    flushing = true;
    const total = currentTotal;
    try {
      const saved = await StepRepo.setSteps(total);
      lastFlushed = total;
      this._emit(saved);
    } catch (e) {
      // swallow — will retry on next flush
    } finally {
      flushing = false;
    }
  },

  _scheduleFlush(immediate = false) {
    if (immediate) {
      if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
      this._flush();
      return;
    }
    if (flushTimer) return; // already scheduled
    flushTimer = setTimeout(() => {
      flushTimer = null;
      this._flush();
    }, FLUSH_MS);
  },

  async start() {
    if (subscription) return { already: true };
    const available = await this.isAvailable();
    if (!available) return { available: false };
    const granted = await this.requestPermissions();
    if (!granted) return { available: true, granted: false };

    const todayRow = await StepRepo.today();
    dayBase = todayRow.steps || 0;
    currentTotal = dayBase;
    lastFlushed = dayBase;
    await AsyncStorage.setItem(KEY_SESSION_DATE, todayStr());

    subscription = Pedometer.watchStepCount(async (result) => {
      try {
        const sessionSteps = result?.steps || 0;
        const nowDate = todayStr();
        const storedDate = await AsyncStorage.getItem(KEY_SESSION_DATE);
        if (storedDate !== nowDate) {
          // Day rolled over mid-session: offset so today's count restarts at 0.
          dayBase = -sessionSteps;
          lastFlushed = 0;
          await AsyncStorage.setItem(KEY_SESSION_DATE, nowDate);
        }
        currentTotal = Math.max(0, dayBase + sessionSteps);
        // Flush now if a big jump; otherwise batch on the timer.
        this._scheduleFlush(currentTotal - lastFlushed >= FORCE_DELTA);
      } catch (e) { /* ignore tick errors */ }
    });

    return { available: true, granted: true };
  },

  stop() {
    if (subscription) { subscription.remove(); subscription = null; }
    if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
    this._flush(); // persist whatever is pending
  },

  // iOS historical query (Android hardware counter has no ranged history)
  async syncHistorical() {
    try {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const result = await Pedometer.getStepCountAsync(start, end);
      if (result && typeof result.steps === 'number') {
        return StepRepo.setSteps(result.steps);
      }
    } catch { /* unsupported (e.g. Android) */ }
    return null;
  },
};

export default PedometerService;
