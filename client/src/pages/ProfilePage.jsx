import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profileAPI } from '../services/api';
import { User, TrendingUp, Award, Scale, Target, Plus, Minus } from 'lucide-react';

export default function ProfilePage() {
  const { profile, stats, bodyProfile, refreshProfile } = useAuth();
  const [plan, setPlan] = useState(null);
  const [weightInput, setWeightInput] = useState('');
  const [weightHistory, setWeightHistory] = useState([]);
  const [statAlloc, setStatAlloc] = useState({
    strength: 0, agility: 0, endurance: 0, vitality: 0,
    discipline: 0, combat_power: 0, intelligence: 0, perception: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    try {
      const [planRes, histRes] = await Promise.all([
        profileAPI.getTransformationPlan(),
        profileAPI.getWeightHistory()
      ]);
      setPlan(planRes.data);
      setWeightHistory(histRes.data.history || []);
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleWeightUpdate(e) {
    e.preventDefault();
    if (!weightInput) return;
    try {
      await profileAPI.updateWeight({ weightKg: parseFloat(weightInput) });
      setWeightInput('');
      await refreshProfile();
      await loadProfile();
    } catch (err) {
      console.error('Weight update error:', err);
    }
  }

  async function handleAllocateStats() {
    const total = Object.values(statAlloc).reduce((s, v) => s + v, 0);
    if (total === 0) return;
    try {
      await profileAPI.allocateStats(statAlloc);
      setStatAlloc({ strength: 0, agility: 0, endurance: 0, vitality: 0, discipline: 0, combat_power: 0, intelligence: 0, perception: 0 });
      await refreshProfile();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to allocate stats');
    }
  }

  const adjustStat = (stat, delta) => {
    const newVal = (statAlloc[stat] || 0) + delta;
    if (newVal < 0) return;
    const total = Object.values({...statAlloc, [stat]: newVal}).reduce((s, v) => s + v, 0);
    if (total > (stats?.stat_points_available || 0)) return;
    setStatAlloc({...statAlloc, [stat]: newVal});
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <h1 className="font-game text-2xl text-gradient">HUNTER PROFILE</h1>

      {/* Player Info */}
      {profile && (
        <div className="sl-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sl-purple to-sl-blue flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.hunter_name}</h2>
              <p className="text-sm text-gray-400">{profile.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={`font-game text-sm rank-${profile.rank}`}>{profile.rank}-Rank</span>
                <span className="text-sm text-gray-400">Level {profile.level}</span>
                <span className="text-sm text-orange-400">Streak: {profile.streak_days} days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Allocation */}
      {stats && stats.stat_points_available > 0 && (
        <div className="sl-card border-sl-gold/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sl-gold flex items-center gap-2">
              <Award className="w-5 h-5" />
              Allocate Stat Points
            </h3>
            <span className="sl-badge bg-sl-gold/20 text-sl-gold">{stats.stat_points_available} points available</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['strength', 'agility', 'endurance', 'vitality', 'discipline', 'combat_power', 'intelligence', 'perception'].map(stat => (
              <div key={stat} className="flex items-center justify-between p-2 bg-sl-darker rounded-lg">
                <span className="text-sm text-white capitalize">{stat.replace('_', ' ')}: {stats[stat]}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => adjustStat(stat, -1)} className="w-6 h-6 rounded bg-sl-panel flex items-center justify-center text-gray-400 hover:text-white">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-bold text-sl-gold w-4 text-center">{statAlloc[stat]}</span>
                  <button onClick={() => adjustStat(stat, 1)} className="w-6 h-6 rounded bg-sl-panel flex items-center justify-center text-gray-400 hover:text-white">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleAllocateStats} className="sl-button mt-4 w-full" disabled={Object.values(statAlloc).reduce((s,v) => s+v, 0) === 0}>
            Allocate Points
          </button>
        </div>
      )}

      {/* Body Profile */}
      {bodyProfile && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-sl-cyan" />
            Body Profile
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Height</p>
              <p className="text-lg font-bold">{bodyProfile.height_cm} cm</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Current Weight</p>
              <p className="text-lg font-bold">{bodyProfile.current_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target Weight</p>
              <p className="text-lg font-bold text-sl-green">{bodyProfile.target_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">BMI</p>
              <p className="text-lg font-bold">{bodyProfile.bmi}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Body Fat %</p>
              <p className="text-lg font-bold">{bodyProfile.body_fat_percentage || '--'}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">BMR</p>
              <p className="text-lg font-bold">{bodyProfile.bmr} cal</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">TDEE</p>
              <p className="text-lg font-bold">{bodyProfile.tdee} cal</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target Body</p>
              <p className="text-lg font-bold text-sl-purple-light capitalize">{bodyProfile.target_body_type?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          {/* Weight Update */}
          <form onSubmit={handleWeightUpdate} className="mt-4 flex gap-3">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              className="sl-input flex-1"
              placeholder="Update weight (kg)"
            />
            <button type="submit" className="sl-button">Update</button>
          </form>
        </div>
      )}

      {/* Transformation Plan */}
      {plan?.plan && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-sl-purple-light" />
            Transformation Plan
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400">Direction</p>
              <p className="text-lg font-bold capitalize text-sl-blue-glow">{plan.plan.direction}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Weekly Rate</p>
              <p className="text-lg font-bold">{plan.plan.weeklyRate > 0 ? '+' : ''}{plan.plan.weeklyRate} kg/week</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Days to Goal</p>
              <p className="text-lg font-bold text-sl-gold">{plan.plan.targets.estimatedDays}</p>
            </div>
          </div>

          {/* Phases */}
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Training Phases</h4>
          <div className="space-y-2">
            {plan.plan.training.phases.map((phase, i) => (
              <div key={i} className="p-3 bg-sl-darker rounded-lg">
                <p className="text-white font-medium text-sm">{phase.name}</p>
                <p className="text-xs text-gray-400">{phase.duration} | {phase.focus}</p>
                <p className="text-xs text-sl-purple-light">{phase.calorieAdjustment}</p>
              </div>
            ))}
          </div>

          {/* Training Split */}
          <h4 className="text-sm font-semibold text-gray-300 mt-4 mb-2">Weekly Split</h4>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
              <div key={day} className="text-center p-2 bg-sl-darker rounded-lg">
                <p className="text-[10px] text-gray-500">{day}</p>
                <p className="text-[10px] text-white mt-1 leading-tight">
                  {plan.plan.training.trainingSplit.split[i]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weight History */}
      {weightHistory.length > 0 && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sl-green" />
            Weight History
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {weightHistory.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-2 bg-sl-darker rounded-lg">
                <span className="text-sm text-gray-300">{new Date(entry.log_date).toLocaleDateString()}</span>
                <span className="text-sm font-bold text-white">{entry.weight_kg} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
