import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  Swords, Target, UtensilsCrossed, Footprints, Shield, 
  User, LayoutDashboard, Skull, LogOut 
} from 'lucide-react';

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/quests', icon: Target, label: 'Quests' },
    { path: '/diet', icon: UtensilsCrossed, label: 'Diet' },
    { path: '/steps', icon: Footprints, label: 'Steps' },
    { path: '/combat', icon: Swords, label: 'Combat' },
    { path: '/punishment', icon: Skull, label: 'System' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-sl-dark flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-sl-darker border-r border-sl-border flex flex-col fixed h-full z-50">
        {/* Logo */}
        <div className="p-4 border-b border-sl-border flex items-center justify-center lg:justify-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sl-purple to-sl-blue rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-game text-sm text-sl-purple-light">SOLO</h1>
            <h1 className="font-game text-sm text-white">LEVELLING</h1>
          </div>
        </div>

        {/* Player Info */}
        {profile && (
          <div className="p-4 border-b border-sl-border hidden lg:block">
            <p className="text-xs text-gray-400">Hunter</p>
            <p className="font-semibold text-white truncate">{profile.hunter_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`sl-badge bg-sl-panel text-xs rank-${profile.rank}`}>
                {profile.rank}-Rank
              </span>
              <span className="text-xs text-gray-400">Lv.{profile.level}</span>
            </div>
            {/* XP Bar */}
            <div className="mt-2">
              <div className="sl-progress-bar">
                <div 
                  className="sl-progress-fill bg-gradient-to-r from-sl-purple to-sl-blue"
                  style={{ width: `${(profile.experience / profile.experience_to_next_level) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {profile.experience}/{profile.experience_to_next_level} XP
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-sl-purple/20 text-sl-purple-light border border-sl-purple/30' 
                  : 'text-gray-400 hover:text-white hover:bg-sl-panel'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="hidden lg:block text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-sl-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:block text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
