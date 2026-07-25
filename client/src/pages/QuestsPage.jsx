import { useState, useEffect } from 'react';
import { questsAPI, activityAPI } from '../services/api';
import { Target, CheckCircle2, Circle, Swords, Zap, Clock } from 'lucide-react';

export default function QuestsPage() {
  const [quests, setQuests] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQuests(); }, []);

  async function loadQuests() {
    try {
      const { data } = await questsAPI.getToday();
      setQuests(data);
    } catch (err) {
      console.error('Failed to load quests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(questId) {
    try {
      await questsAPI.completeQuest(questId);
      await loadQuests();
    } catch (err) {
      console.error('Complete failed:', err);
    }
  }

  async function handleLogActivity(quest) {
    try {
      await activityAPI.log({
        activityType: quest.quest_category,
        activityName: quest.title,
        durationMinutes: 45,
        intensity: 'moderate'
      });
      await loadQuests();
    } catch (err) {
      console.error('Activity log failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const difficultyColors = {
    easy: 'text-green-400 bg-green-400/10',
    normal: 'text-blue-400 bg-blue-400/10',
    hard: 'text-orange-400 bg-orange-400/10',
    extreme: 'text-red-400 bg-red-400/10'
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-game text-2xl text-gradient">DAILY QUESTS</h1>
          <p className="text-gray-400 mt-1">Complete your quests before midnight or face punishment.</p>
        </div>
        {quests && (
          <div className="sl-card !p-3 text-center">
            <p className="text-2xl font-bold text-white">{quests.progress.percentage}%</p>
            <p className="text-xs text-gray-400">Complete</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {quests && (
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>{quests.progress.completed} / {quests.progress.total} Quests</span>
            <span>{quests.progress.percentage >= 70 ? 'On Track' : 'Behind Schedule!'}</span>
          </div>
          <div className="sl-progress-bar h-4">
            <div 
              className={`sl-progress-fill ${quests.progress.percentage >= 70 ? 'bg-gradient-to-r from-sl-green to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
              style={{ width: `${quests.progress.percentage}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Quest List */}
      <div className="space-y-3">
        {quests?.quests.map((quest, index) => (
          <div 
            key={quest.id}
            className={`quest-card ${quest.is_completed ? 'completed' : ''} animate-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-4">
              {/* Status Icon */}
              <button
                onClick={() => !quest.is_completed && (quest.unit === 'session' ? handleLogActivity(quest) : handleComplete(quest.id))}
                className={`flex-shrink-0 mt-1 transition-all ${quest.is_completed ? 'text-sl-green' : 'text-gray-500 hover:text-sl-purple'}`}
                disabled={quest.is_completed}
              >
                {quest.is_completed 
                  ? <CheckCircle2 className="w-6 h-6" />
                  : <Circle className="w-6 h-6" />
                }
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold ${quest.is_completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                    {quest.title}
                  </h3>
                  {quest.is_bonus ? (
                    <span className="sl-badge bg-sl-gold/20 text-sl-gold text-[10px]">BONUS</span>
                  ) : null}
                  <span className={`sl-badge ${difficultyColors[quest.difficulty]} text-[10px]`}>
                    {quest.difficulty}
                  </span>
                </div>
                <p className={`text-sm mt-1 ${quest.is_completed ? 'text-gray-600' : 'text-gray-400'}`}>
                  {quest.description}
                </p>
                
                {/* Progress */}
                {!quest.is_completed && quest.unit !== 'session' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>{quest.current_value} / {quest.target_value} {quest.unit}</span>
                      <span>{Math.round((quest.current_value / quest.target_value) * 100)}%</span>
                    </div>
                    <div className="sl-progress-bar h-2">
                      <div 
                        className="sl-progress-fill bg-gradient-to-r from-sl-purple to-sl-blue"
                        style={{ width: `${(quest.current_value / quest.target_value) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* XP Reward */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-1 text-sl-gold">
                  <Zap className="w-4 h-4" />
                  <span className="font-bold text-sm">{quest.xp_reward}</span>
                </div>
                <p className="text-[10px] text-gray-500">XP</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
        <p className="text-sm text-red-300">
          <strong>System Warning:</strong> Failure to complete 70% of daily quests will result in punishment. 
          Social media access, entertainment, and device privileges may be revoked.
        </p>
      </div>
    </div>
  );
}
