import { Outlet, Link } from 'react-router-dom';
import BottomNav from './BottomNav';
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
          <div className="w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center text-base"
            style={{ backgroundColor: parsed.bg || '#006e2f' }}>
            {parsed.emoji}
          </div>
        );
      }
    } catch {}
    return <img src={avatar} alt="" className="w-8 h-8 rounded-xl border-2 border-black object-cover" />;
  }
  const initials = user.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  let hash = 0;
  for (let i = 0; i < (user.name || '').length; i++) hash = user.name.charCodeAt(i) + ((hash << 5) - hash);
  const color = fallbackColors[Math.abs(hash) % fallbackColors.length];
  return (
    <div className="w-8 h-8 rounded-xl border-2 border-black flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
}

export default function Layout() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-page font-jakarta">
      <header className="sticky top-0 z-40 bg-page/95 backdrop-blur-sm border-b-2 border-black">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/meals" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">restaurant</span>
            </div>
            <span className="font-extrabold text-lg text-gray-900 dark:text-white">CookIt</span>
          </Link>
          <Link to="/profile" className="flex items-center gap-2">
            <AvatarIcon user={user} />
          </Link>
        </div>
      </header>
      <main className="pb-24 max-w-lg mx-auto px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
