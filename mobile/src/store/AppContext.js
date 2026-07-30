// ============================================================================
// APP CONTEXT - Global state (offline-first)
// ============================================================================

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { initDatabase } from '../db/database';
import {
  ProfileRepo, QuestRepo, DietRepo, StepRepo, ActivityRepo,
  CombatRepo, PunishmentRepo, DayProcessor,
  MeasurementRepo, CheckinRepo, WaterRepo, SleepRepo, SettingsRepo, AchievementRepo,
  StrengthRepo, PhotoRepo, ExportRepo,
} from '../db/repositories';
import PedometerService from '../services/pedometer';
import NotificationService from '../services/notifications';
import SyncService from '../services/sync';
import BackgroundTasks from '../services/backgroundTasks';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [body, setBody] = useState(null);
  const [punishmentStatus, setPunishmentStatus] = useState(null);
  const [pedometerAvailable, setPedometerAvailable] = useState(false);
  const [pendingLevelUp, setPendingLevelUp] = useState(null);
  const [bootstrapError, setBootstrapError] = useState(null);
  const bootstrapped = useRef(false);

  const refreshCore = useCallback(async () => {
    const [p, s, b, ps] = await Promise.all([
      ProfileRepo.get(), ProfileRepo.getStats(), ProfileRepo.getBody(), PunishmentRepo.status(),
    ]);
    setProfile(p);
    setStats(s);
    setBody(b);
    setPunishmentStatus(ps);
    return { profile: p, body: b };
  }, []);

  const [newAchievements, setNewAchievements] = useState([]);

  // Handle level-up feedback surfaced from any repo action
  const handleRewards = useCallback(async (rewards) => {
    if (rewards) {
      const arr = Array.isArray(rewards) ? rewards : [rewards];
      for (const r of arr) {
        const info = r?.levelInfo;
        if (info?.leveledUp) {
          setPendingLevelUp({ level: info.newLevel, rank: info.newRank });
          await NotificationService.notifyLevelUp(info.newLevel, info.newRank);
        }
      }
    }
    // Evaluate achievements after any progress event
    try {
      const earned = await AchievementRepo.check();
      if (earned.length) {
        setNewAchievements(earned);
        for (const a of earned) await NotificationService.notifyNow('Achievement Unlocked', `${a.name} — ${a.desc}`);
      }
    } catch (e) { /* noop */ }
    await refreshCore();
  }, [refreshCore]);

  // Run a best-effort step; never let it crash or block startup.
  const safe = async (label, fn) => {
    try { await fn(); } catch (e) { console.warn(`[bootstrap] ${label} failed:`, e?.message || e); }
  };

  const bootstrap = useCallback(async () => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // CRITICAL: the database must init. If this fails, show an error screen.
    try {
      await initDatabase();
    } catch (e) {
      setBootstrapError(`Database failed to initialize: ${e?.message || e}`);
      setReady(true);
      return;
    }

    let p = null, b = null;
    try {
      p = await ProfileRepo.get();
      b = await ProfileRepo.getBody();
    } catch (e) {
      console.warn('[bootstrap] profile read failed:', e?.message || e);
    }

    // Generate today's quests (important, but guarded).
    if (p && b) await safe('quests', () => QuestRepo.ensureToday());

    // Everything below is best-effort — failures must NOT block the app.
    await safe('catchUp', async () => {
      const caught = await DayProcessor.catchUp();
      for (const c of caught) {
        if (c?.punishments?.length) {
          await safe('notifyPunish', () => NotificationService.notifyPunishment('You missed quests. Punishment applied.'));
        }
      }
    });
    await safe('notifications.init', () => NotificationService.init());
    if (p && b) await safe('notifications.schedule', () => NotificationService.scheduleDailyReminders());

    await safe('pedometer', async () => {
      const available = await PedometerService.isAvailable();
      setPedometerAvailable(available);
      if (available && p && b) {
        await PedometerService.start();
        await PedometerService.syncHistorical().catch(() => {});
      }
    });

    if (p && b) safe('background', () => BackgroundTasks.register());
    safe('sync', () => SyncService.pushQueue());

    await safe('refresh', () => refreshCore());
    setReady(true);
  }, [refreshCore]);

  // ---- Onboarding ----
  const createHunter = useCallback(async (name) => {
    await ProfileRepo.createHunter(name);
    await refreshCore();
  }, [refreshCore]);

  const setupBody = useCallback(async (input) => {
    const res = await ProfileRepo.setupBody(input);      // critical
    await safe('quests', () => QuestRepo.ensureToday());  // important
    await safe('notif.init', () => NotificationService.init());
    await safe('notif.sched', () => NotificationService.scheduleDailyReminders());
    await safe('pedometer', async () => {
      const available = await PedometerService.isAvailable();
      setPedometerAvailable(available);
      if (available) await PedometerService.start();
    });
    await safe('bg', () => BackgroundTasks.register());
    await refreshCore();
    return res;
  }, [refreshCore]);

  const value = {
    ready, profile, stats, body, punishmentStatus, pedometerAvailable, bootstrapError,
    pendingLevelUp, clearLevelUp: () => setPendingLevelUp(null),
    bootstrap, refreshCore, handleRewards, createHunter, setupBody,
    newAchievements, clearAchievements: () => setNewAchievements([]),
    // expose repos for screens
    repos: {
      ProfileRepo, QuestRepo, DietRepo, StepRepo, ActivityRepo, CombatRepo, PunishmentRepo, DayProcessor,
      MeasurementRepo, CheckinRepo, WaterRepo, SleepRepo, SettingsRepo, AchievementRepo,
      StrengthRepo, PhotoRepo, ExportRepo,
    },
    services: { PedometerService, NotificationService, SyncService, BackgroundTasks },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
