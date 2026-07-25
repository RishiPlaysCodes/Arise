// ============================================================================
// BACKGROUND TASKS - periodic offline upkeep (battery-friendly)
//
// Registers an OS-scheduled background fetch (min ~15 min on Android, opportun-
// istic on iOS). On wake it:
//   - syncs the day's steps (iOS historical; Android best-effort),
//   - runs the day catch-up so streaks/punishments stay correct even if the
//     user rarely opens the app,
//   - flushes the offline sync queue if online sync is enabled.
//
// The OS controls timing to protect battery; we never hold wake locks or poll.
//
// HONEST LIMITATION (Android): Google's managed sandbox does not expose ranged
// historical step queries, and JS background execution is throttled. For
// perfectly continuous step capture while the app is fully killed, the optional
// native step module (see modules/) reads the hardware TYPE_STEP_COUNTER
// cumulative value. Without it, steps are captured whenever the app is open or
// a background fetch fires; manual adjustment covers any gap.
// ============================================================================

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform } from 'react-native';

export const STEP_SYNC_TASK = 'arise-step-sync';

// Defined at module load so the OS can invoke it after an app restart.
if (!TaskManager.isTaskDefined(STEP_SYNC_TASK)) {
  TaskManager.defineTask(STEP_SYNC_TASK, async () => {
    try {
      // Lazy requires to avoid pulling heavy modules at registration time.
      const { initDatabase } = require('../db/database');
      const { DayProcessor } = require('../db/repositories');
      const PedometerService = require('./pedometer').default;
      const SyncService = require('./sync').default;

      await initDatabase();
      await PedometerService.syncHistorical().catch(() => {});
      await DayProcessor.catchUp().catch(() => {});
      await SyncService.pushQueue().catch(() => {});
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export const BackgroundTasks = {
  async register() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      if (
        status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied
      ) {
        return { registered: false, reason: 'background fetch not permitted' };
      }
      await BackgroundFetch.registerTaskAsync(STEP_SYNC_TASK, {
        minimumInterval: 15 * 60, // 15 min (OS may extend to save battery)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      return { registered: true };
    } catch (e) {
      return { registered: false, reason: e?.message };
    }
  },

  async unregister() {
    try { await BackgroundFetch.unregisterTaskAsync(STEP_SYNC_TASK); } catch { /* noop */ }
  },
};

export default BackgroundTasks;
