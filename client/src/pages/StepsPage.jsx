import { useState, useEffect } from 'react';
import { stepsAPI } from '../services/api';
import { Footprints, Plus, TrendingUp, MapPin, Flame, Clock } from 'lucide-react';

export default function StepsPage() {
  const [today, setToday] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [stepsInput, setStepsInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [todayRes, weeklyRes] = await Promise.all([
        stepsAPI.getToday(),
        stepsAPI.getWeekly()
      ]);
      setToday(todayRes.data);
      setWeekly(weeklyRes.data);
    } catch (err) {
      console.error('Steps load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSteps(e) {
    e.preventDefault();
    if (!stepsInput) return;
    try {
      await stepsAPI.addSteps(parseInt(stepsInput));
      setStepsInput('');
      await loadData();
    } catch (err) {
      console.error('Add steps error:', err);
    }
  }

  async function handleSetSteps(e) {
    e.preventDefault();
    if (!stepsInput) return;
    try {
      await stepsAPI.logSteps(parseInt(stepsInput));
      setStepsInput('');
      await loadData();
    } catch (err) {
      console.error('Set steps error:', err);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const progress = today?.progress || 0;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="font-game text-2xl text-gradient">STEP COUNTER</h1>
        <p className="text-gray-400 mt-1">Every step takes you closer to your goal.</p>
      </div>

      {/* Circular Progress */}
      <div className="sl-card flex flex-col items-center py-8">
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r="80" stroke="#1a1a2e" strokeWidth="12" fill="none" />
            <circle 
              cx="90" cy="90" r="80" 
              stroke="url(#stepGradient)" 
              strokeWidth="12" 
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Footprints className="w-6 h-6 text-sl-green mb-1" />
            <span className="text-3xl font-bold text-white">{(today?.steps || 0).toLocaleString()}</span>
            <span className="text-xs text-gray-400">/ {(today?.target || 10000).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-6 w-full max-w-md">
          <div className="text-center">
            <MapPin className="w-4 h-4 text-sl-blue-glow mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{today?.distance_km || 0}</p>
            <p className="text-xs text-gray-400">km</p>
          </div>
          <div className="text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{today?.calories_burned || 0}</p>
            <p className="text-xs text-gray-400">cal burned</p>
          </div>
          <div className="text-center">
            <Clock className="w-4 h-4 text-sl-purple-light mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{today?.active_minutes || 0}</p>
            <p className="text-xs text-gray-400">minutes</p>
          </div>
        </div>
      </div>

      {/* Log Steps */}
      <div className="sl-card">
        <h3 className="font-semibold text-white mb-4">Log Steps</h3>
        <form className="flex gap-3">
          <input
            type="number"
            value={stepsInput}
            onChange={e => setStepsInput(e.target.value)}
            className="sl-input flex-1"
            placeholder="Enter step count"
            min="0"
          />
          <button type="button" onClick={handleAddSteps} className="sl-button whitespace-nowrap">
            <Plus className="w-4 h-4 inline mr-1" /> Add
          </button>
          <button type="button" onClick={handleSetSteps} className="px-4 py-2 border border-sl-border rounded-lg text-gray-300 hover:border-sl-purple hover:text-white transition-all whitespace-nowrap">
            Set Total
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">Add: adds to current total. Set Total: replaces current total.</p>
      </div>

      {/* Weekly Summary */}
      {weekly && (
        <div className="sl-card">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-sl-green" />
            <h3 className="font-semibold text-white">Weekly Summary</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-400">Total Steps</p>
              <p className="text-xl font-bold">{weekly.totalSteps?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Daily Average</p>
              <p className="text-xl font-bold">{weekly.averageSteps?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Distance</p>
              <p className="text-xl font-bold">{weekly.totalDistanceKm} km</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Calories</p>
              <p className="text-xl font-bold">{weekly.totalCaloriesBurned}</p>
            </div>
          </div>

          {/* Daily breakdown */}
          {weekly.dailyLogs && weekly.dailyLogs.length > 0 && (
            <div className="space-y-2">
              {weekly.dailyLogs.map(log => (
                <div key={log.log_date} className="flex items-center justify-between p-2 bg-sl-darker rounded-lg">
                  <span className="text-sm text-gray-300">{new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">{log.steps.toLocaleString()} steps</span>
                    <div className="w-24 h-2 bg-sl-panel rounded-full overflow-hidden">
                      <div className="h-full bg-sl-green rounded-full" style={{ width: `${Math.min((log.steps / (today?.target || 10000)) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
