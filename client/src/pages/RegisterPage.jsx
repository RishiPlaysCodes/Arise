import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', hunterName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(form);
      navigate('/setup');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sl-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sl-purple/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sl-blue/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-sl-purple to-sl-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sl-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-game text-2xl text-gradient">BECOME A HUNTER</h1>
          <p className="text-gray-400 mt-2">Your journey to become the strongest begins here.</p>
        </div>

        <form onSubmit={handleSubmit} className="sl-card space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-2">Hunter Name</label>
            <input
              type="text"
              name="hunterName"
              value={form.hunterName}
              onChange={handleChange}
              className="sl-input"
              placeholder="Your hunter alias"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="sl-input"
              placeholder="Choose a username"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="sl-input"
              placeholder="hunter@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="sl-input pr-12"
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="sl-button w-full disabled:opacity-50"
          >
            {loading ? 'Awakening...' : 'Awaken as a Hunter'}
          </button>

          <p className="text-center text-gray-400 text-sm">
            Already a Hunter?{' '}
            <Link to="/login" className="text-sl-purple-light hover:text-sl-purple underline">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
