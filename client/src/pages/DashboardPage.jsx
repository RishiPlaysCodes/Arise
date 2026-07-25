import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { questsAPI, stepsAPI, dietAPI, punishmentAPI } from '../services/api';
import { 
  Flame, Footprints, Target, Trophy, Zap, 
  TrendingUp, Shield, AlertTriangle
} from 'lucide-react';

export default function DashboardPage() {
  const { profile, stats, bodyProfile } = useAuth();
  const [quests, setQuests] = useState(null);
  const [steps, setSteps] = useState(null);
  const [diet, setDiet] = useState(null);
  const [punishment, setPunishment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [questsRes, stepsRes, dietRes, punishRes] = await Promise.all([
        questsAPI.getToday().catch(() => null),
        stepsAPI.getToday().catch(() => null),
        dietAPI.getToday().catch(() => null),
        punishmentAPI.getStatus().catch(() => null)
      ]);

      if (questsRes) setQuests(questsRes.data);
      if (stepsRes) setSteps(stepsRes.data);
      if (dietRes) setDiet(dietRes.data);
      if (punishRes) setPunishment(punishRes.data);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const rankColors = { E: 'text-gray-400', D: 'text-green-400', C: 'text-blue-400', B: 'text-purple-400', A: 'text-orange-400', S: 'text-red-500', SS: 'text-yellow-300' };

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-game text-2xl text-gradient">HUNTER STATUS</h1>
          <p className="text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {profile && (
          <div className="flex items-center gap-4">
            <div className="sl-card !p-3 flex items-center gap-3">
              <Flame className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-xs text-gray-400">Streak</p>
                <p className="font-bold text-white">{profile.streak_days} days</p>
              </div>
            </div>
            <div className="sl-card !p-3 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Quests Done</p>
                <p className="font-bold text-white">{profile.total_quests_completed}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Punishment Alert */}
      {punishment?.isRestricted && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-semibold">PUNISHMENT ACTIVE</p>
            <p className="text-red-300/70 text-sm">{punishment.message}</p>
          </div>
        </div>
      )}

      {/* Player Card */}
      {profile && (
        <div className="sl-card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-sl-purple/10 to-transparent rounded-bl-full"></div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Avatar/Rank */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sl-purple to-sl-blue flex items-center justify-center mx-auto">
                <span className="font-game text-2xl text-white">{profile.rank}</span>
              </div>
              <p className={`font-game text-sm mt-2 ${rankColors[profile.rank]}`}>{profile.title}</p>
            </div>

            {/* Stats */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Level</p>
                <p className="text-2xl font-bold text-white">{profile.level}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Rank</p>
                <p className={`text-2xl font-bold ${rankColors[profile.rank]}`}>{profile.rank}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">XP</p>
                <p className="text-lg font-bold text-sl-purple-light">{profile.experience}/{profile.experience_to_next_level}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Best Streak</p>
                <p className="text-2xl font-bold text-orange-400">{profile.longest_streak}</p>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Level {profile.level}</span>
              <span>Level {profile.level + 1}</span>
            </div>
            <div className="sl-progress-bar">
              <div 
                className="sl-progress-fill bg-gradient-to-r from-sl-purple to-sl-blue"
                style={{ width: `${(profile.experience / profile.experience_to_next_level) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'STR', value: stats.strength, color: 'from-red-500 to-red-700' },
            { label: 'AGI', value: stats.agility, color: 'from-green-500 to-green-700' },
            { label: 'END', value: stats.endurance, color: 'from-blue-500 to-blue-700' },
            { label: 'VIT', value: stats.vitality, color: 'from-pink-500 to-pink-700' },
            { label: 'DIS', value: stats.discipline, color: 'from-yellow-500 to-yellow-700' },
            { label: 'CMB', value: stats.combat_power, color: 'from-orange-500 to-orange-700' },
            { label: 'INT', value: stats.intelligence, color: 'from-cyan-500 to-cyan-700' },
            { label: 'PER', value: stats.perception, color: 'from-purple-500 to-purple-700' },
          ].map(stat => (
            <div key={stat.label} className="bg-sl-panel border border-sl-border rounded-lg p-3">
              <p className="text-xs text-gray-400 font-game">{stat.label}</p>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <div className="stat-bar mt-2">
                <div className={`stat-bar-fill bg-gradient-to-r ${stat.color}`} style={{ width: `${Math.min(stat.value, 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quest Progress */}
        <div className="sl-card">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-5 h-5 text-sl-purple-light" />
            <h3 className="font-semibold">Today's Quests</h3>
          </div>
          {quests ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{quests.progress.completed}</span>
                <span className="text-gray-400">/ {quests.progress.total}</span>
              </div>
              <div className="sl-progress-bar mt-3">
                <div 
                  className={`sl-progress-fill ${quests.progress.percentage >= 70 ? 'bg-gradient-to-r from-sl-green to-emerald-500' : 'bg-gradient-to-r from-sl-purple to-sl-blue'}`}
                  style={{ width: `${quests.progress.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{quests.progress.percentage}% complete</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">Loading...</p>
          )}
        </div>

        {/* Steps */}
        <div className="sl-card">
          <div className="flex items-center gap-3 mb-3">
            <Footprints className="w-5 h-5 text-sl-green" />
            <h3 className="font-semibold">Steps Today</h3>
          </div>
          {steps ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{(steps.steps || 0).toLocaleString()}</span>
                <span className="text-gray-400">/ {(steps.target || 10000).toLocaleString()}</span>
              </div>
              <div className="sl-progress-bar mt-3">
                <div 
                  className="sl-progress-fill bg-gradient-to-r from-sl-green to-emerald-500"
                  style={{ width: `${Math.min(steps.progress || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400 mt-2">{steps.distance_km || 0} km walked</p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No steps yet today</p>
          )}
        </div>

        {/* Diet */}
        <div className="sl-card">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-sl-gold" />
            <h3 className="font-semibold">Calories Today</h3>
          </div>
          {diet?.totals ? (
            <>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{Math.round(diet.totals.total_calories)}</span>
                <span className="text-gray-400">/ {diet.targets?.daily_calories || '---'}</span>
              </div>
              {diet.progress && (
                <div className="sl-progress-bar mt-3">
                  <div 
                    className={`sl-progress-fill ${diet.progress.calories > 110 ? 'bg-red-500' : 'bg-gradient-to-r from-sl-gold to-amber-500'}`}
                    style={{ width: `${Math.min(diet.progress.calories, 100)}%` }}
                  ></div>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">
                P: {Math.round(diet.totals.total_protein)}g | C: {Math.round(diet.totals.total_carbs)}g | F: {Math.round(diet.totals.total_fats)}g
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No food logged yet</p>
          )}
        </div>
      </div>

      {/* Body Progress */}
      {bodyProfile && (
        <div className="sl-card">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-sl-cyan" />
            <h3 className="font-semibold">Transformation Progress</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-400">Current</p>
              <p className="text-xl font-bold">{bodyProfile.current_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Target</p>
              <p className="text-xl font-bold text-sl-green">{bodyProfile.target_weight_kg} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Remaining</p>
              <p className="text-xl font-bold text-sl-purple-light">
                {Math.abs(bodyProfile.target_weight_kg - bodyProfile.current_weight_kg).toFixed(1)} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Est. Days Left</p>
              <p className="text-xl font-bold text-sl-blue-glow">{bodyProfile.estimated_days_to_goal || '---'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
