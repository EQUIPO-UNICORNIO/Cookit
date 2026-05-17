import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'PASSWORD_RECOVERY' && event !== 'USER_UPDATED') {
      }
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-6xl text-primary-600 mb-4">check_circle</span>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">Contraseña actualizada</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tu contraseña se ha cambiado correctamente.</p>
          <button
            onClick={() => navigate('/access')}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl px-6 py-3 text-sm shadow-lg shadow-primary-600/25 transition-all"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-4 shadow-lg shadow-primary-600/20">
          <span className="material-symbols-outlined text-4xl text-white">lock_reset</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Nueva contraseña</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Escribe tu nueva contraseña</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              minLength={6}
              required
              autoFocus
            />
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              minLength={6}
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-base transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
