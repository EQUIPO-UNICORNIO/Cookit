import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/meals', icon: 'today', label: 'Menús' },
  { path: '/pantry', icon: 'kitchen', label: 'Despensa' },
  { path: '/scanner', icon: 'document_scanner', label: 'Escaner' },
  { path: '/community', icon: 'forum', label: 'Comunidad' },
  { path: '/profile', icon: 'account_circle', label: 'Perfil' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-black z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <span className="material-symbols-outlined text-2xl">{item.icon}</span>
            <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
