import { NavLink } from 'react-router-dom';
import { getNavItems } from './navConfig';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const { t } = useTranslation();
  const navItems = getNavItems();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t-2 border-black z-50 md:hidden">
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
