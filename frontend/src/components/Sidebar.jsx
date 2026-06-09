import { NavLink, Link } from 'react-router-dom';
import { getNavItems } from './navConfig';
import { useTranslation } from 'react-i18next';

export default function Sidebar() {
  const { t } = useTranslation();
  const navItems = getNavItems();
  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-0 md:h-full md:z-50 bg-surface border-r-2 border-black">
      <Link to="/meals" className="flex items-center gap-2 px-3 py-4 border-b-2 border-black lg:px-5">
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
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              } lg:px-4 lg:py-2.5 justify-center lg:justify-start p-2.5`
            }
          >
            <span className="material-symbols-outlined text-2xl shrink-0">{item.icon}</span>
            <span className="text-sm font-bold hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
