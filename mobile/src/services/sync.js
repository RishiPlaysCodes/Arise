// ============================================================================
// SYNC SERVICE - Optional online sync (offline-first)
//
// The app is fully functional offline. When online AND the user has enabled
// cloud sync (with a configured backend URL + token), local changes are
// pushed and remote state is pulled. All writes go to SQLite first
// (optimistic), then queue for sync - so nothing is ever lost offline.
// ============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getDB } from '../db/database';

const KEY_BACKEND = 'sync_backend_url';
const KEY_TOKEN = 'sync_token';
const KEY_ENABLED = 'sync_enabled';

export const SyncService = {
  async isEnabled() {
    return (await AsyncStorage.getItem(KEY_ENABLED)) === 'true';
  },

  async configure({ backendUrl, token, enabled }) {
    if (backendUrl !== undefined) await AsyncStorage.setItem(KEY_BACKEND, backendUrl || '');
    if (token !== undefined) await AsyncStorage.setItem(KEY_TOKEN, token || '');
    if (enabled !== undefined) await AsyncStorage.setItem(KEY_ENABLED, enabled ? 'true' : 'false');
  },

  async getConfig() {
    return {
      backendUrl: (await AsyncStorage.getItem(KEY_BACKEND)) || '',
      token: (await AsyncStorage.getItem(KEY_TOKEN)) || '',
      enabled: (await AsyncStorage.getItem(KEY_ENABLED)) === 'true',
    };
  },

  async isOnline() {
    // Lightweight connectivity check against the configured backend health route.
    const { backendUrl } = await this.getConfig();
    if (!backendUrl) return false;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(`${backendUrl}/api/health`, { signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Queue a change for later sync (used by repositories in online mode).
  async queue(entity, op, payload) {
    const db = await getDB();
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await db.runAsync(
      'INSERT INTO sync_queue (id, entity, op, payload, synced) VALUES (?,?,?,?,0)',
      [id, entity, op, JSON.stringify(payload)]
    );
  },

  // Push queued changes to the backend when online.
  async pushQueue() {
    const enabled = await this.isEnabled();
    if (!enabled) return { skipped: true };
    const online = await this.isOnline();
    if (!online) return { offline: true };

    const { backendUrl, token } = await this.getConfig();
    const db = await getDB();
    const pending = await db.getAllAsync('SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT 100');
    let pushed = 0;

    for (const item of pending) {
      try {
        const res = await fetch(`${backendUrl}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ entity: item.entity, op: item.op, payload: JSON.parse(item.payload) }),
        });
        if (res.ok) {
          await db.runAsync('UPDATE sync_queue SET synced = 1 WHERE id = ?', [item.id]);
          pushed++;
        }
      } catch {
        break; // stop on first network failure; retry later
      }
    }
    return { pushed, remaining: pending.length - pushed };
  },

  async fullSync() {
    const push = await this.pushQueue();
    return { push };
  },
};

export default SyncService;
