import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';

const builtInAvatars = [
  { emoji: '👨‍🍳', bg: '#006e2f', name: 'Chef' },
  { emoji: '🍕', bg: '#e63946', name: 'Pizza' },
  { emoji: '🌮', bg: '#9d4300', name: 'Taco' },
  { emoji: '🥗', bg: '#2d6a4f', name: 'Salad' },
  { emoji: '🍣', bg: '#d63384', name: 'Sushi' },
  { emoji: '🍰', bg: '#7c3aed', name: 'Cake' },
  { emoji: '☕', bg: '#6f4e37', name: 'Coffee' },
  { emoji: '🥑', bg: '#4f46e5', name: 'Avocado' },
  { emoji: '🍝', bg: '#db2777', name: 'Pasta' },
  { emoji: '🍔', bg: '#c2410c', name: 'Burger' },
  { emoji: '🥦', bg: '#059669', name: 'Broccoli' },
  { emoji: '🍩', bg: '#0891b2', name: 'Donut' },
];

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const currentAvatar = user?.avatar || '';
  const [builtIn, setBuiltIn] = useState(currentAvatar);

  const saveAvatar = async (data) => {
    try {
      await api.updateAvatar(data || '');
      await refreshUser();
    } catch (e) { console.error(e); }
  };

  const handleBuiltInSelect = async (av) => {
    const data = JSON.stringify(av);
    setBuiltIn(data);
    await saveAvatar(data);
  };

  let displayEmoji = null;
  let displayBg = '#006e2f';
  if (builtIn) {
    try {
      const parsed = JSON.parse(builtIn);
      displayEmoji = parsed.emoji;
      displayBg = parsed.bg;
    } catch { }
  }

  const handleLogout = () => {
    logout();
    navigate('/access');
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">Mi Perfil</h1>

      <div className="neo-card text-center p-6 mb-4">
        <div className="relative inline-block">
          {displayEmoji ? (
            <div
              className="w-24 h-24 rounded-3xl border-4 border-black flex items-center justify-center mx-auto text-4xl"
              style={{ backgroundColor: displayBg }}
            >
              {displayEmoji}
            </div>
          ) : (
            <div
              className="w-24 h-24 rounded-3xl border-4 border-black flex items-center justify-center mx-auto text-white text-3xl font-extrabold"
              style={{ backgroundColor: '#006e2f' }}
            >
              {user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'}
            </div>
          )}
        </div>

        <h2 className="text-xl font-extrabold mt-3">{user?.name || 'Usuario'}</h2>
        <p className="text-sm text-gray-500 font-medium">{user?.email || ''}</p>

        <p className="text-xs font-bold text-gray-500 mt-4 mb-2">Elige tu avatar</p>
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          {builtInAvatars.map(av => (
            <button
              key={av.name}
              onClick={() => handleBuiltInSelect(av)}
              className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg transition-all ${
                builtIn && JSON.parse(builtIn)?.name === av.name ? 'border-black scale-110 shadow-md' : 'border-gray-300'
              }`}
              style={{ backgroundColor: av.bg }}
              title={av.name}
            >
              {av.emoji}
            </button>
          ))}
        </div>
        <button onClick={() => { setBuiltIn(''); saveAvatar(''); }} className="text-xs font-medium text-gray-400 hover:text-red-500">
          Quitar avatar
        </button>
      </div>

      <div className="space-y-2">
        <div className="neo-card !p-4 cursor-pointer" onClick={toggle}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-primary-600">{dark ? 'light_mode' : 'dark_mode'}</span>
            </div>
            <div>
              <p className="font-bold text-sm">{dark ? 'Modo Claro' : 'Modo Oscuro'}</p>
              <p className="text-xs text-gray-500">Toca para cambiar</p>
            </div>
          </div>
        </div>

        <div className="neo-card !p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-primary-600">restaurant</span>
            </div>
            <div>
              <p className="font-bold text-sm">CookIt</p>
              <p className="text-xs text-gray-500">Smart Meal Planner v1.0</p>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="neo-card !p-4 w-full text-left flex items-center gap-3 !border-red-300 hover:bg-red-50">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border-2 border-red-300">
            <span className="material-symbols-outlined text-red-500">logout</span>
          </div>
          <div>
            <p className="font-bold text-sm text-red-600">Cerrar sesión</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
        </button>
      </div>

      <div className="text-center mt-6 space-x-3">
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Política de Privacidad</a>
        <span className="text-xs text-gray-300">·</span>
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Términos de Servicio</a>
      </div>
    </div>
  );
}
