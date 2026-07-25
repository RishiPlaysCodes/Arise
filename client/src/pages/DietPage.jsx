import { useState, useEffect } from 'react';
import { dietAPI } from '../services/api';
import { Plus, Trash2, UtensilsCrossed, Flame, Beef, Wheat, Droplets } from 'lucide-react';

export default function DietPage() {
  const [todayData, setTodayData] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({
    mealType: 'breakfast', foodName: '', calories: '', protein: '', carbs: '', fats: '', quantity: 1
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [todayRes, planRes] = await Promise.all([
        dietAPI.getToday(),
        dietAPI.getMealPlan()
      ]);
      setTodayData(todayRes.data);
      setMealPlan(planRes.data);
    } catch (err) {
      console.error('Diet load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogFood(e) {
    e.preventDefault();
    try {
      await dietAPI.logFood({
        ...logForm,
        calories: parseFloat(logForm.calories) || 0,
        protein: parseFloat(logForm.protein) || 0,
        carbs: parseFloat(logForm.carbs) || 0,
        fats: parseFloat(logForm.fats) || 0
      });
      setShowLog(false);
      setLogForm({ mealType: 'breakfast', foodName: '', calories: '', protein: '', carbs: '', fats: '', quantity: 1 });
      await loadData();
    } catch (err) {
      console.error('Log food error:', err);
    }
  }

  async function handleDelete(logId) {
    try {
      await dietAPI.deleteLog(logId);
      await loadData();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-sl-purple border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-game text-2xl text-gradient">NUTRITION TRACKER</h1>
          <p className="text-gray-400 mt-1">Fuel your body for maximum gains.</p>
        </div>
        <button onClick={() => setShowLog(!showLog)} className="sl-button flex items-center gap-2">
          <Plus className="w-4 h-4" /> Log Food
        </button>
      </div>

      {/* Macro Overview */}
      {todayData?.targets && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="sl-card !p-4 text-center">
            <Flame className="w-5 h-5 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(todayData.totals?.total_calories || 0)}</p>
            <p className="text-xs text-gray-400">/ {todayData.targets.daily_calories} cal</p>
            <div className="sl-progress-bar mt-2 h-2">
              <div className="sl-progress-fill bg-orange-400" style={{ width: `${Math.min((todayData.totals?.total_calories || 0) / todayData.targets.daily_calories * 100, 100)}%` }}></div>
            </div>
          </div>
          <div className="sl-card !p-4 text-center">
            <Beef className="w-5 h-5 text-red-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(todayData.totals?.total_protein || 0)}g</p>
            <p className="text-xs text-gray-400">/ {todayData.targets.protein_g}g protein</p>
            <div className="sl-progress-bar mt-2 h-2">
              <div className="sl-progress-fill bg-red-400" style={{ width: `${Math.min((todayData.totals?.total_protein || 0) / todayData.targets.protein_g * 100, 100)}%` }}></div>
            </div>
          </div>
          <div className="sl-card !p-4 text-center">
            <Wheat className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(todayData.totals?.total_carbs || 0)}g</p>
            <p className="text-xs text-gray-400">/ {todayData.targets.carbs_g}g carbs</p>
            <div className="sl-progress-bar mt-2 h-2">
              <div className="sl-progress-fill bg-yellow-400" style={{ width: `${Math.min((todayData.totals?.total_carbs || 0) / todayData.targets.carbs_g * 100, 100)}%` }}></div>
            </div>
          </div>
          <div className="sl-card !p-4 text-center">
            <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{Math.round(todayData.totals?.total_fats || 0)}g</p>
            <p className="text-xs text-gray-400">/ {todayData.targets.fats_g}g fats</p>
            <div className="sl-progress-bar mt-2 h-2">
              <div className="sl-progress-fill bg-blue-400" style={{ width: `${Math.min((todayData.totals?.total_fats || 0) / todayData.targets.fats_g * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Log Food Form */}
      {showLog && (
        <form onSubmit={handleLogFood} className="sl-card space-y-4">
          <h3 className="font-semibold text-white">Log Food</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <select value={logForm.mealType} onChange={e => setLogForm({...logForm, mealType: e.target.value})} className="sl-select">
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Snack</option>
              <option value="dinner">Dinner</option>
            </select>
            <input value={logForm.foodName} onChange={e => setLogForm({...logForm, foodName: e.target.value})} className="sl-input" placeholder="Food name" required />
            <input type="number" value={logForm.calories} onChange={e => setLogForm({...logForm, calories: e.target.value})} className="sl-input" placeholder="Calories" />
            <input type="number" value={logForm.protein} onChange={e => setLogForm({...logForm, protein: e.target.value})} className="sl-input" placeholder="Protein (g)" />
            <input type="number" value={logForm.carbs} onChange={e => setLogForm({...logForm, carbs: e.target.value})} className="sl-input" placeholder="Carbs (g)" />
            <input type="number" value={logForm.fats} onChange={e => setLogForm({...logForm, fats: e.target.value})} className="sl-input" placeholder="Fats (g)" />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="sl-button">Save</button>
            <button type="button" onClick={() => setShowLog(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
          </div>
        </form>
      )}

      {/* Today's Meals */}
      <div className="sl-card">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-sl-purple-light" />
          Today's Food Log
        </h3>
        {todayData?.meals && todayData.meals.length > 0 ? (
          <div className="space-y-2">
            {todayData.meals.map(meal => (
              <div key={meal.id} className="flex items-center justify-between p-3 bg-sl-darker rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="sl-badge bg-sl-purple/20 text-sl-purple-light text-[10px]">{meal.meal_type}</span>
                    <span className="text-white font-medium text-sm">{meal.food_name}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {meal.calories}cal | P:{meal.protein_g}g | C:{meal.carbs_g}g | F:{meal.fats_g}g
                  </p>
                </div>
                <button onClick={() => handleDelete(meal.id)} className="text-gray-500 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center py-4">No food logged yet today. Start tracking!</p>
        )}
      </div>

      {/* AI Meal Plan */}
      {mealPlan && (
        <div className="sl-card">
          <h3 className="font-semibold text-white mb-4">AI Meal Plan Suggestion</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mealPlan.meals.map((meal, i) => (
              <div key={i} className="bg-sl-darker rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="sl-badge bg-sl-blue/20 text-sl-blue-glow text-[10px] uppercase">{meal.mealType}</span>
                  <span className="text-xs text-gray-400">{meal.time}</span>
                </div>
                <h4 className="text-white font-medium">{meal.name}</h4>
                <p className="text-xs text-gray-400 mt-1">
                  {meal.calories} cal | P:{meal.protein}g | C:{meal.carbs}g | F:{meal.fats}g
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Total: {mealPlan.totalCalories} cal | {mealPlan.totalProtein}g protein
          </p>
        </div>
      )}
    </div>
  );
}
