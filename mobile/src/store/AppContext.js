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

  const bootstrap = useCallback(async () => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    await initDatabase();

    // Process any missed days (offline catch-up) BEFORE generating today's quests
    const caught = await DayProcessor.catchUp();
    // Notify user of any punishments that were applied on catch-up
    for (const c of caught) {
      if (c?.punishments?.length) {
        await NotificationService.notifyPunishment('You missed quests. Punishment applied. Open the app to see details.');
      }
    }

    const p = await ProfileRepo.get();
    const b = await ProfileRepo.getBody();

    // Only generate quests if fully onboarded
    if (p && b) {
      await QuestRepo.ensureToday();
    }

    // Notifications + pedometer (best-effort; app works without them)
    await NotificationService.init();
    if (p && b) await NotificationService.scheduleDailyReminders();

    const available = await PedometerService.isAvailable();
    setPedometerAvailable(available);
    if (available && p && b) {
      await PedometerService.start();
      await PedometerService.syncHistorical().catch(() => {});
    }

    // Register OS background upkeep (steps sync + day catch-up + sync flush)
    if (p && b) BackgroundTasks.register().catch(() => {});

    // Best-effort background sync (no-op if disabled/offline)
    SyncService.pushQueue().catch(() => {});

    await refreshCore();
    setReady(true);
  }, [refreshCore]);

  // ---- Onboarding ----
  const createHunter = useCallback(async (name) => {
    await ProfileRepo.createHunter(name);
    await refreshCore();
  }, [refreshCore]);

  const setupBody = useCallback(async (input) => {
    const res = await ProfileRepo.setupBody(input);
    await QuestRepo.ensureToday();
    await NotificationService.init();
    await NotificationService.scheduleDailyReminders();
    const available = await PedometerService.isAvailable();
    setPedometerAvailable(available);
    if (available) await PedometerService.start();
    await refreshCore();
    return res;
  }, [refreshCore]);

  const value = {
    ready, profile, stats, body, punishmentStatus, pedometerAvailable,
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
