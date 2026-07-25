import { useState, useEffect } from 'react';
import { punishmentAPI, questsAPI } from '../services/api';
import { Skull, Lock, AlertTriangle, Shield, Clock, Ban } from 'lucide-react';

export default function PunishmentPage() {
  const [status, setStatus] = useState(null);
  const [blockedApps, setBlockedApps] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [statusRes, appsRes, histRes] = await Promise.all([
        punishmentAPI.getStatus(),
        punishmentAPI.getBlockedApps(),
        punishmentAPI.getHistory()
      ]);
      setStatus(statusRes.data);
      setBlockedApps(appsRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Punishment load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDailyCheck() {
    try {
      const { data } = await punishmentAPI.checkDaily();
      alert(data.isPunished 
        ? `Punishment applied! Completion: ${data.completionRate}%` 
        : `Good work! Completion: ${data.completionRate}%`
      );
      await loadData();
    } catch (err) {
      console.error('Daily check error:', err);
    }
  }

  async function handleEndOfDay() {
    try {
      const { data } = await questsAPI.endOfDay();
      alert(`Day processed! Completed: ${data.completedQuests}/${data.totalQuests}. Streak: ${data.streak}`);
      await loadData();
    } catch (err) {
      console.error('End of day error:', err);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const severityColors = {
    low: 'border-yellow-500/30 bg-yellow-500/5',
    medium: 'border-orange-500/30 bg-orange-500/5',
    high: 'border-red-500/30 bg-red-500/5',
    critical: 'border-red-700/50 bg-red-700/10'
  };

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-game text-2xl text-gradient">PUNISHMENT SYSTEM</h1>
        <p className="text-gray-400 mt-1">The System enforces discipline. Fail your quests, face consequences.</p>
      </div>

      {/* Current Status */}
      <div className={`sl-card ${status?.isRestricted ? 'border-red-500/50' : 'border-sl-green/30'}`}>
        <div className="flex items-center gap-4">
          {status?.isRestricted ? (
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-400" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-sl-green/20 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-sl-green" />
            </div>
          )}
          <div>
            <h3 className={`font-semibold ${status?.isRestricted ? 'text-red-400' : 'text-sl-green'}`}>
              {status?.isRestricted ? 'RESTRICTIONS ACTIVE' : 'NO ACTIVE PUNISHMENTS'}
            </h3>
            <p className="text-sm text-gray-400">{status?.message}</p>
          </div>
        </div>

        {status?.isRestricted && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="bg-sl-darker p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{status.activePunishments}</p>
              <p className="text-xs text-gray-400">Active Penalties</p>
            </div>
            <div className="bg-sl-darker p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400">{status.blockedApps}</p>
              <p className="text-xs text-gray-400">Blocked Apps</p>
            </div>
            <div className="bg-sl-darker p-3 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-400 uppercase">{status.highestSeverity}</p>
              <p className="text-xs text-gray-400">Severity</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleDailyCheck} className="sl-button-danger flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Run Daily Check
        </button>
        <button onClick={handleEndOfDay} className="sl-button flex items-center gap-2">
          <Clock className="w-4 h-4" /> Process End of Day
        </button>
      </div>

      {/* Blocked Apps */}
      {blockedApps?.blockedApps && blockedApps.blockedApps.length > 0 && (
        <div className="sl-card border-red-500/20">
          <h3 className="font-semibold text-red-400 mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5" />
            Blocked Applications ({blockedApps.count})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {blockedApps.blockedApps.map(app => (
              <div key={app.id} className="flex items-center gap-2 p-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <Lock className="w-3 h-3 text-red-400" />
                <span className="text-sm text-gray-300">{app.app_name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Blocked until: {blockedApps.blockedApps[0] && new Date(blockedApps.blockedApps[0].blocked_until).toLocaleString()}
          </p>
        </div>
      )}

      {/* Active Punishments */}
      {status?.punishments && status.punishments.length > 0 && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-400" />
            Active Punishments
          </h3>
          <div className="space-y-3">
            {status.punishments.map(p => (
              <div key={p.id} className={`p-4 rounded-lg border ${severityColors[p.severity] || severityColors.medium}`}>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-white">{p.punishment_type.replace(/_/g, ' ')}</h4>
                  <span className="text-xs text-gray-400">
                    Ends: {new Date(p.ends_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{p.description}</p>
                <p className="text-xs text-gray-500 mt-1">Triggered by: {p.triggered_by}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Punishment History */}
      {history?.history && history.history.length > 0 && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4">Punishment History</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {history.history.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-sl-darker rounded-lg">
                <div>
                  <span className="text-sm text-white">{p.punishment_type.replace(/_/g, ' ')}</span>
                  <p className="text-xs text-gray-500">{p.triggered_by}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs ${p.is_active ? 'text-red-400' : 'text-gray-500'}`}>
                    {p.is_active ? 'Active' : 'Expired'}
                  </span>
                  <p className="text-[10px] text-gray-500">{new Date(p.started_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="sl-card border-sl-purple/20">
        <h3 className="font-semibold text-sl-purple-light mb-3">System Rules</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2"><span className="text-red-400">&#x2022;</span> Complete less than 70% quests = Punishment activated</li>
          <li className="flex items-start gap-2"><span className="text-red-400">&#x2022;</span> 50%+ failure = Social media blocked for 24 hours</li>
          <li className="flex items-start gap-2"><span className="text-red-400">&#x2022;</span> 80%+ failure = FULL DEVICE LOCKDOWN</li>
          <li className="flex items-start gap-2"><span className="text-red-400">&#x2022;</span> Consecutive failures = Rank demotion threat</li>
          <li className="flex items-start gap-2"><span className="text-red-400">&#x2022;</span> Breaking streak = Ice penalty (cold shower)</li>
          <li className="flex items-start gap-2"><span className="text-red-400">&#x2022;</span> No cheating. No bypassing. The System sees all.</li>
        </ul>
      </div>
    </div>
  );
}
