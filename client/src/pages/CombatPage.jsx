import { useState, useEffect } from 'react';
import { combatAPI } from '../services/api';
import { Swords, Play, CheckCircle, Clock, Flame, Dumbbell } from 'lucide-react';

export default function CombatPage() {
  const [combatTypes, setCombatTypes] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [typesRes, statsRes] = await Promise.all([
        combatAPI.getTypes(),
        combatAPI.getStats()
      ]);
      setCombatTypes(typesRes.data.combatTypes);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Combat load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateSession() {
    if (!selectedType) return;
    try {
      const { data } = await combatAPI.getSession(selectedType, skillLevel, duration);
      setSession(data);
    } catch (err) {
      console.error('Generate session error:', err);
    }
  }

  async function logSession() {
    if (!session) return;
    try {
      await combatAPI.logSession({
        combatType: selectedType,
        techniqueName: session.combatType,
        rounds: session.exercises.length,
        durationMinutes: duration,
        intensity: 'moderate',
        skillLevel,
        notes: `Completed ${session.exercises.length} exercises`
      });
      setSession(null);
      await loadData();
      alert('Combat training logged! XP awarded.');
    } catch (err) {
      console.error('Log session error:', err);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-game text-2xl text-gradient">COMBAT TRAINING</h1>
        <p className="text-gray-400 mt-1">Train your body for battle. A true hunter masters combat.</p>
      </div>

      {/* Combat Type Selection */}
      <div className="sl-card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-red-400" />
          Choose Your Art
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {combatTypes && Object.entries(combatTypes).map(([key, type]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`p-3 rounded-lg border text-center transition-all ${
                selectedType === key
                  ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'border-sl-border bg-sl-panel hover:border-red-500/50'
              }`}
            >
              <p className="font-medium text-sm text-white">{type.name}</p>
              <p className="text-[10px] text-gray-400 mt-1">{type.caloriesPerMinute} cal/min</p>
            </button>
          ))}
        </div>

        {/* Config */}
        {selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Skill Level</label>
              <select value={skillLevel} onChange={e => setSkillLevel(e.target.value)} className="sl-select">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Duration (minutes)</label>
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value) || 30)} className="sl-input" min="10" max="120" />
            </div>
            <div className="flex items-end">
              <button onClick={generateSession} className="sl-button w-full flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Generate Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Training Session */}
      {session && (
        <div className="sl-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white">{session.combatType} Training</h3>
              <p className="text-sm text-gray-400">{session.skillLevel} | {session.totalDuration} min | ~{session.caloriesEstimate} cal</p>
            </div>
            <button onClick={logSession} className="sl-button flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Complete & Log
            </button>
          </div>

          <div className="space-y-2">
            {session.exercises.map((exercise, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-sl-darker rounded-lg">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{exercise.name}</p>
                  <p className="text-xs text-gray-400">{exercise.description}</p>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs">{exercise.duration} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combat Stats */}
      {stats?.overall && stats.overall.total_sessions > 0 && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-sl-gold" />
            Combat Stats
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.overall.total_sessions}</p>
              <p className="text-xs text-gray-400">Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.overall.total_minutes}</p>
              <p className="text-xs text-gray-400">Minutes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-400">{stats.overall.total_calories}</p>
              <p className="text-xs text-gray-400">Calories</p>
            </div>
          </div>

          {stats.byType && stats.byType.length > 0 && (
            <div className="space-y-2">
              {stats.byType.map(s => (
                <div key={s.combat_type} className="flex items-center justify-between p-2 bg-sl-darker rounded-lg">
                  <span className="text-sm text-white capitalize">{s.combat_type.replace('_', ' ')}</span>
                  <span className="text-sm text-gray-400">{s.total_sessions} sessions | {s.total_minutes} min</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
