import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function ForgotPasswordModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('access.validEmail'));
      return;
    }
    setLoading(true);
    try {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://cookit-delta.vercel.app/reset-password',
      });
      if (supaError) throw supaError;
      setSent(true);
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        {sent ? (
          <div className="text-center py-4">
            <span className="material-symbols-outlined text-5xl text-primary-600 mb-3">mark_email_read</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('access.emailSent')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('access.emailSentDesc')}
            </p>
            <button
              onClick={onClose}
              className="mt-5 text-sm text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              {t('access.backToLogin')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t('access.recoverPassword')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              {t('access.recoverSubtitle')}
            </p>
            <div className="relative mb-4">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">mail</span>
              <input
                type="email"
                placeholder={t('access.yourEmail')}
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                className={`w-full rounded-xl border bg-white dark:bg-gray-700 pl-10 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 transition-all ${
                  error
                    ? 'border-red-400 dark:border-red-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'border-gray-200 dark:border-gray-600 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                }`}
                autoFocus
              />
            </div>
            {error && <p className="text-red-500 text-xs -mt-2 mb-4 ml-1">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : t('access.sendRecoveryLink')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
            >
              {t('access.backToLogin')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
