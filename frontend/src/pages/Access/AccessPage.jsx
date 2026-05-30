import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useTranslation } from 'react-i18next';
import FloatingFoodAnimation from '../../components/FloatingFoodAnimation';

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-red-600 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
        <span className="material-symbols-outlined text-base">error_outline</span>
        {message}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
  );
}

export default function AccessPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = t('access.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('access.emailInvalid');
    }
    if (!password) {
      errors.password = t('access.passwordRequired');
    } else if (password.length < 6) {
      errors.password = t('access.passwordMin');
    }
    if (!isLogin && !name.trim()) {
      errors.name = t('access.nameRequired');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setToast(null);
    if (!validate()) return;
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/meals');
    } catch (err) {
      setToast(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
  };

  const inputClass = (field, hasToggle = false) => {
    const err = fieldErrors[field];
    return `w-full rounded-xl border-2 bg-white dark:bg-gray-700 pl-10 ${hasToggle ? 'pr-10' : 'pr-4'} py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 transition-all ${
      err
        ? 'border-red-400 dark:border-red-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
        : 'border-black dark:border-gray-600 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    }`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col relative overflow-hidden">
      <FloatingFoodAnimation />
      <button onClick={() => { const newLang = i18n.language === 'es' ? 'en' : 'es'; i18n.changeLanguage(newLang); localStorage.setItem('cookit_lang', newLang); }}
        className="fixed top-4 right-4 z-50 neo-btn !py-1.5 !px-3 !text-xs !rounded-xl">
        {i18n.language === 'es' ? 'EN' : 'ES'}
      </button>
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-4 shadow-lg shadow-primary-600/20">
            <span className="material-symbols-outlined text-4xl text-white">restaurant</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">CookIt</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{t('access.welcome')}</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{t('access.loginToContinue')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1.5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${isLogin ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              {t('access.login')}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${!isLogin ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              {t('access.register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">person</span>
                  <input
                    type="text"
                    placeholder={t('access.fullName')}
                    value={name}
                    onChange={e => { setName(e.target.value); clearError('name'); }}
                    className={inputClass('name')}
                  />
                </div>
                {fieldErrors.name && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.name}</p>}
              </div>
            )}
            <div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">mail</span>
                <input
                  type="email"
                  placeholder={t('access.email')}
                  value={email}
                  onChange={e => { setEmail(e.target.value); clearError('email'); }}
                  className={inputClass('email')}
                />
              </div>
              {fieldErrors.email && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('access.password')}
                  value={password}
                  onChange={e => { setPassword(e.target.value); clearError('password'); }}
                  className={inputClass('password', true)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.password}</p>}
              <div className="flex justify-end mt-1">
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors">
                  {t('access.forgotPassword')}
                </button>
              </div>
            </div>
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-base transition-all border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Spinner /> : (isLogin ? t('access.login') : t('access.register'))}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          {t('access.termsAccept')}
        </p>
      </div>
    </div>
  );
}
