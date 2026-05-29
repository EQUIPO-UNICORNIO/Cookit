import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/i18n';

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
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const currentAvatar = user?.avatar || '';
  const [builtIn, setBuiltIn] = useState(currentAvatar);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); } }, [toast]);

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

  const handleLangChange = (lng) => {
    setLanguage(lng);
  };

  const saveName = async () => {
    if (!newName.trim() || newName.trim() === user?.name) { setEditingName(false); return; }
    try {
      await api.updateUser({ name: newName.trim() });
      await refreshUser();
      setEditingName(false);
    } catch (e) { console.error(e); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setToast(t('profile.passwordMinLength')); return; }
    try {
      await api.changePassword(oldPassword, newPassword);
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setToast(t('profile.passwordChanged'));
    } catch (e) { setToast(e.message); }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      logout();
      navigate('/access');
    } catch (e) { setToast(e.message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">{t('profile.title')}</h1>

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

        <div className="flex items-center justify-center gap-2 mt-3">
          {editingName ? (
            <input
              className="neo-input text-center !py-1 !text-base !w-48"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setEditingName(false); setNewName(user?.name || ''); } }}
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-extrabold cursor-pointer hover:text-primary-600 transition-colors" onClick={() => { setEditingName(true); setNewName(user?.name || ''); }}>
              {user?.name || 'Usuario'}
              <span className="material-symbols-outlined text-base align-text-bottom ml-1 text-gray-400">edit</span>
            </h2>
          )}
        </div>
        <p className="text-sm text-gray-500 font-medium">{user?.email || ''}</p>

        <p className="text-xs font-bold text-gray-500 mt-4 mb-2">{t('profile.chooseAvatar')}</p>
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
          {t('profile.removeAvatar')}
        </button>
      </div>

      <div className="space-y-2">
        <div className="neo-card !p-4 cursor-pointer" onClick={toggle}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-primary-600">{dark ? 'light_mode' : 'dark_mode'}</span>
            </div>
            <div>
              <p className="font-bold text-sm">{dark ? t('profile.lightMode') : t('profile.darkMode')}</p>
              <p className="text-xs text-gray-500">{t('profile.tapToChange')}</p>
            </div>
          </div>
        </div>

        <div className="neo-card !p-4 cursor-pointer" onClick={() => handleLangChange(i18n.language === 'es' ? 'en' : 'es')}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-primary-600">language</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{t('profile.language')}: {i18n.language === 'es' ? t('profile.spanish') : t('profile.english')}</p>
              <p className="text-xs text-gray-500">{i18n.language === 'es' ? 'Cambiar a ' + t('profile.english') : 'Switch to ' + t('profile.spanish')}</p>
            </div>
            <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200">
              {i18n.language === 'es' ? 'ES' : 'EN'}
            </span>
          </div>
        </div>

        <div className="neo-card !p-4 cursor-pointer" onClick={() => setShowPasswordForm(true)}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-primary-600">lock</span>
            </div>
            <div>
              <p className="font-bold text-sm">{t('profile.changePassword')}</p>
              <p className="text-xs text-gray-500">{t('profile.updatePassword')}</p>
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
            <p className="font-bold text-sm text-red-600">{t('profile.logout')}</p>
            <p className="text-xs text-gray-500">{user?.email || ''}</p>
          </div>
        </button>

        <button onClick={() => setShowDeleteConfirm(true)} className="neo-card !p-4 w-full text-left flex items-center gap-3 !border-red-400 hover:bg-red-50">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center border-2 border-red-400">
            <span className="material-symbols-outlined text-red-600">delete_forever</span>
          </div>
          <div>
            <p className="font-bold text-sm text-red-600">{t('profile.deleteAccount')}</p>
            <p className="text-xs text-gray-500">{t('profile.deleteAccountDesc')}</p>
          </div>
        </button>
      </div>

      <div className="text-center mt-6 space-x-3">
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{t('profile.privacyPolicy')}</a>
        <span className="text-xs text-gray-300">·</span>
        <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{t('profile.termsOfService')}</a>
      </div>

      {showPasswordForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowPasswordForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold mb-4">{t('profile.changePassword')}</h2>
            <form onSubmit={savePassword} className="space-y-3">
              <input className="neo-input" type="password" placeholder={t('profile.currentPassword')} value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
              <input className="neo-input" type="password" placeholder={t('profile.newPassword')} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
              <div className="flex gap-2">
                <button type="submit" className="neo-btn-primary flex-1">{t('common.save')}</button>
                <button type="button" onClick={() => setShowPasswordForm(false)} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border-2 border-black" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-lg text-center mb-2">{t('profile.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">{t('profile.confirmDeleteDesc')}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
              <button onClick={handleDeleteAccount} className="neo-btn !bg-red-500 !text-white flex-1">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] animate-slide-up">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-bold px-5 py-3 rounded-2xl border-2 border-black shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
