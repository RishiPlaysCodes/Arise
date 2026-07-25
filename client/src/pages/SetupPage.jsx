import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profileAPI } from '../services/api';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

export default function SetupPage() {
  const [step, setStep] = useState(1);
  const [bodyTypes, setBodyTypes] = useState([]);
  const [form, setForm] = useState({
    heightCm: '', currentWeightKg: '', age: '', gender: 'male',
    activityLevel: 'sedentary', targetBodyType: '', bodyFatPercentage: ''
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadBodyTypes();
  }, []);

  async function loadBodyTypes() {
    try {
      const { data } = await profileAPI.getBodyTypes();
      setBodyTypes(data.bodyTypes);
    } catch (err) {
      console.error('Failed to load body types');
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        heightCm: parseFloat(form.heightCm),
        currentWeightKg: parseFloat(form.currentWeightKg),
        age: parseInt(form.age),
        bodyFatPercentage: form.bodyFatPercentage ? parseFloat(form.bodyFatPercentage) : undefined
      };
      const { data } = await profileAPI.setup(payload);
      setPlan(data.plan);
      setStep(4);
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.error || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sl-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-sl-purple/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-3 h-3 rounded-full transition-all ${s <= step ? 'bg-sl-purple scale-110' : 'bg-sl-border'}`}></div>
          ))}
        </div>

        {step === 1 && (
          <div className="sl-card animate-in">
            <h2 className="font-game text-xl text-gradient mb-2">BODY ASSESSMENT</h2>
            <p className="text-gray-400 mb-6">Enter your current body measurements. Be honest - the System sees all.</p>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mb-4">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Height (cm)</label>
                <input type="number" name="heightCm" value={form.heightCm} onChange={handleChange} className="sl-input" placeholder="175" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Current Weight (kg)</label>
                <input type="number" name="currentWeightKg" value={form.currentWeightKg} onChange={handleChange} className="sl-input" placeholder="70" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Age</label>
                <input type="number" name="age" value={form.age} onChange={handleChange} className="sl-input" placeholder="25" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="sl-select">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Body Fat % (optional)</label>
                <input type="number" name="bodyFatPercentage" value={form.bodyFatPercentage} onChange={handleChange} className="sl-input" placeholder="20" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Activity Level</label>
                <select name="activityLevel" value={form.activityLevel} onChange={handleChange} className="sl-select">
                  <option value="sedentary">Sedentary (Desk job)</option>
                  <option value="lightly_active">Lightly Active (1-3 days/week)</option>
                  <option value="moderately_active">Moderately Active (3-5 days/week)</option>
                  <option value="very_active">Very Active (6-7 days/week)</option>
                  <option value="extremely_active">Extremely Active (Athlete)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => {
                if (form.heightCm && form.currentWeightKg && form.age) setStep(2);
                else setError('Fill in all required fields');
              }} className="sl-button flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="sl-card animate-in">
            <h2 className="font-game text-xl text-gradient mb-2">CHOOSE YOUR DESTINY</h2>
            <p className="text-gray-400 mb-6">Select your target body type. The System will forge the path.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {bodyTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setForm({ ...form, targetBodyType: type.id })}
                  className={`text-left p-4 rounded-lg border transition-all duration-200 ${
                    form.targetBodyType === type.id
                      ? 'border-sl-purple bg-sl-purple/10 shadow-sl'
                      : 'border-sl-border bg-sl-panel hover:border-sl-purple/50'
                  }`}
                >
                  <h3 className="font-semibold text-white text-sm">{type.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{type.description}</p>
                  <p className="text-[10px] text-sl-purple-light mt-1">{type.example}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-400 hover:text-white flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => {
                if (form.targetBodyType) setStep(3);
                else setError('Select a body type');
              }} className="sl-button flex items-center gap-2">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sl-card animate-in">
            <h2 className="font-game text-xl text-gradient mb-2">CONFIRM AWAKENING</h2>
            <p className="text-gray-400 mb-6">Review your details. Once confirmed, the System activates.</p>

            <div className="bg-sl-darker rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Height</span>
                <span className="text-white font-medium">{form.heightCm} cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Weight</span>
                <span className="text-white font-medium">{form.currentWeightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Age</span>
                <span className="text-white font-medium">{form.age}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gender</span>
                <span className="text-white font-medium capitalize">{form.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Activity Level</span>
                <span className="text-white font-medium capitalize">{form.activityLevel.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Body</span>
                <span className="text-sl-purple-light font-medium">
                  {bodyTypes.find(b => b.id === form.targetBodyType)?.name}
                </span>
              </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm mt-4">{error}</div>}

            <div className="flex justify-between mt-6">
              <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-400 hover:text-white flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={handleSubmit} disabled={loading} className="sl-button flex items-center gap-2">
                {loading ? 'Awakening...' : 'Activate System'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && plan && (
          <div className="sl-card animate-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-sl-green to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-game text-xl text-gradient">SYSTEM ACTIVATED</h2>
              <p className="text-gray-400 mt-2">Your transformation plan is ready.</p>
            </div>

            <div className="bg-sl-darker rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Target Weight</span>
                <span className="text-sl-green font-bold">{plan.targets.weight} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Target Body Fat</span>
                <span className="text-sl-green font-bold">{plan.targets.bodyFat}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Time</span>
                <span className="text-sl-blue-glow font-bold">{plan.targets.estimatedWeeks} weeks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Calories</span>
                <span className="text-white font-bold">{plan.nutrition.dailyCalories} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Steps Target</span>
                <span className="text-white font-bold">{plan.training.dailyStepTarget.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="sl-button w-full mt-6"
            >
              Enter the System
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
