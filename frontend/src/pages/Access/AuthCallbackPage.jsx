import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (!accessToken) {
        setErrorMsg(t('access.googleLoading'));
        setStatus('error');
        return;
      }

      try {
        const data = await api.googleLogin(accessToken);
        localStorage.setItem('token', data.token);
        await refreshUser();
        navigate('/meals');
      } catch (e) {
        setErrorMsg(e.message || t('access.googleError'));
        setStatus('error');
      }
    };

    handleCallback();
  }, [navigate, refreshUser, t]);

  return (
    <div className="min-h-screen bg-page flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center max-w-sm">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('access.googleLoading')}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl text-red-600">error_outline</span>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-2">{t('access.googleError')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{errorMsg || t('access.googleErrorDesc')}</p>
            <button onClick={() => navigate('/access')} className="text-primary-600 font-bold underline text-sm">
              {t('access.goBack')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
