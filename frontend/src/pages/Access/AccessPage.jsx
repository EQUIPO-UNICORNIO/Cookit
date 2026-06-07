import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import ForgotPasswordModal from './ForgotPasswordModal';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';

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

    const commonTlds = ['com', 'es', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'it', 'br', 'mx', 'ar', 'cl', 'pe', 'uy', 'pt', 'cat', 'info', 'biz', 'app', 'dev', 'me', 'tv', 'eu', 'jp', 'cn', 'au', 'nz', 'za', 'in', 'ru', 'se', 'no', 'dk', 'fi', 'pl', 'cz', 'hu', 'gr', 'tr', 'il', 'ae', 'sa', 'sg', 'hk', 'tw', 'kr'];
  const blockedEmailPatterns = [
    /\.con$/i, /\.cmo$/i, /\.ocm$/i, /\.vom$/i, /\.xom$/i, /\.col$/i, /\.co,$/i,
    /\.prg$/i, /\.ogr$/i, /\.nte$/i, /\.ede$/i, /\.gob$/i,
    /\.com\.[a-z]{2,}$/i,
    /@[^\s@]+\.[a-z]{2,}\.[a-z]{2,}$/i,
  ];
  const tldTypos = {
    'con': 'com', 'cmo': 'com', 'ocm': 'com', 'vom': 'com', 'xom': 'com', 'col': 'com', 'cim': 'com', 'cpm': 'com', 'c0m': 'com', 'coj': 'com', 'cok': 'com', 'coi': 'com', 'co,': 'com', 'co.': 'com', 'como': 'com', 'comm': 'com', 'comk': 'com',
    'prg': 'org', 'ogr': 'org', 'orgn': 'org', 'or': 'org',
    'nte': 'net', 'ne': 'net', 'met': 'net', 'nrt': 'net',
    'ede': 'edu', 'edd': 'edu', 'edu.': 'edu',
    'gob': 'gov', 'govr': 'gov',
    'ov': 'io', 'oi': 'io',
    'couk': 'co.uk', 'co.ik': 'co.uk', 'co.ukk': 'co.uk',
    'esx': 'es', 'ess': 'es', 'se': 'es',
    'frn': 'fr', 'frf': 'fr',
    'dee': 'de', 'ded': 'de',
  };

  const suggestEmailFix = (raw) => {
    const atIdx = raw.lastIndexOf('@');
    if (atIdx === -1) return null;
    const local = raw.slice(0, atIdx);
    const domain = raw.slice(atIdx + 1);
    const dotIdx = domain.lastIndexOf('.');
    if (dotIdx === -1) return null;
    const tld = domain.slice(dotIdx + 1).toLowerCase();
    const domainName = domain.slice(0, dotIdx);
    const fixed = tldTypos[tld];
    if (fixed) {
      return local + '@' + domainName + '.' + fixed;
    }
    if (!commonTlds.includes(tld)) {
      let best = null, bestScore = 0;
      for (const known of commonTlds) {
        let score = 0;
        for (let i = 0; i < Math.min(tld.length, known.length); i++) {
          if (tld[i] === known[i]) score++;
        }
        if (score > bestScore) { bestScore = score; best = known; }
      }
      if (best && bestScore >= 2 && tld.length < 6) {
        return local + '@' + domainName + '.' + best;
      }
    }
    return null;
  };

  const validate = () => {
    const errors = {};
    let suggestion = null;
    if (!email.trim()) {
      errors.email = t('access.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      errors.email = t('access.emailBlocked');
    } else if (blockedEmailPatterns.some(p => p.test(email))) {
      errors.email = t('access.emailBlocked');
    } else {
      const tld = email.slice(email.lastIndexOf('.') + 1).toLowerCase();
      if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
        errors.email = t('access.emailBlocked');
      }
      if (!errors.email) {
        suggestion = suggestEmailFix(email);
      }
    }
    if (!password) {
      errors.password = t('access.passwordRequired');
    } else if (password.length < 6) {
      errors.password = t('access.passwordMin');
    }
    if (!isLogin && !name.trim()) {
      errors.name = t('access.nameRequired');
    }
    if (suggestion && suggestion !== email) {
      errors.emailSuggestion = suggestion;
    }
    setFieldErrors(errors);
    const hasBlockingError = Object.keys(errors).length > 0;
    return !hasBlockingError;
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'https://cookit-delta.vercel.app/auth/callback' }
      });
      if (error) setToast(error.message);
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy[field];
      if (field === 'email') delete copy.emailSuggestion;
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
    <div className="min-h-screen bg-page flex flex-col">
      <button onClick={() => { const newLang = i18n.language === 'es' ? 'en' : 'es'; i18n.changeLanguage(newLang); localStorage.setItem('cookit_lang', newLang); }}
        className="fixed top-4 right-4 z-50 neo-btn !py-1.5 !px-3 !text-xs !rounded-xl">
        {i18n.language === 'es' ? 'EN' : 'ES'}
      </button>
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full pt-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-4 shadow-lg shadow-primary-600/20">
            <span className="material-symbols-outlined text-4xl text-white">restaurant</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">CookIt</h1>
          <p className="text-primary-600 dark:text-primary-400 font-bold text-sm mt-2 tracking-wide">{t('access.slogan')}</p>
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
                {fieldErrors.emailSuggestion ? (
                  <button type="button" onClick={() => { setEmail(fieldErrors.emailSuggestion); clearError('email'); setFieldErrors(prev => { const copy = { ...prev }; delete copy.email; delete copy.emailSuggestion; return copy; }); }} className="text-primary-600 text-xs mt-1 ml-1 underline hover:text-primary-700 font-medium">
                    {t('access.emailSuggest', { suggestion: fieldErrors.emailSuggestion })}
                  </button>
                ) : fieldErrors.email && <p className="text-red-500 text-xs mt-1 ml-1">{fieldErrors.email}</p>}
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-800 px-3 text-sm text-gray-400 dark:text-gray-500 font-medium">O</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-xl py-3 text-sm transition-all border border-gray-300 dark:border-gray-500 active:scale-[0.98] flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t('access.googleLogin')}
            </button>
          </div>

        <div className="mt-6 text-center">
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4 pb-8">
          {t('access.termsAccept')}
        </p>
      </div>
    </div>
  );
}
