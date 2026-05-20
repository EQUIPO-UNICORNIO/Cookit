import { NavLink, Link } from 'react-router-dom';
import { navItems } from './navConfig';
import { useAuth } from '../context/AuthContext';

const fallbackColors = ['#006e2f', '#9d4300', '#735c00', '#4f46e5', '#0891b2', '#be185d', '#7c3aed', '#db2777'];

function AvatarIcon({ user }) {
  if (!user) return null;
  const avatar = user.avatar;
  if (avatar) {
    try {
      const parsed = JSON.parse(avatar);
      if (parsed.emoji) {
        return (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: parsed.bg || '#006e2f' }}>
            {parsed.emoji}
          </div>
        );
      }
    } catch {}
    return <img src={avatar} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />;
  }
  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  let hash = 0;
  for (let i = 0; i < (user.name || '').length; i++) hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
  const color = fallbackColors[Math.abs(hash) % fallbackColors.length];
  return (
    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:z-50 bg-[#f9fafb] shadow-[1px_0_6px_rgba(0,0,0,0.06)]">
      <Link to="/meals" className="flex items-center gap-2 px-3 py-4 lg:px-5">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-white text-lg">restaurant</span>
        </div>
        <span className="font-extrabold text-lg text-gray-900 dark:text-white hidden lg:block">CookIt</span>
      </Link>
      <nav className="flex-1 flex flex-col gap-1 p-2 lg:p-3">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              } lg:px-4 lg:py-2.5 justify-center lg:justify-start p-2.5`
            }
          >
            <span className="material-symbols-outlined text-2xl shrink-0">{item.icon}</span>
            <span className="text-sm font-bold hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="p-3 lg:p-4">
          <Link to="/profile" className="flex items-center gap-3 justify-center lg:justify-start">
            <AvatarIcon user={user} />
            <div className="hidden lg:block min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
