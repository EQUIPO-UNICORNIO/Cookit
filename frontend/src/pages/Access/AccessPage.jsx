import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AccessPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/meals');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-4 shadow-lg shadow-primary-600/20">
            <span className="material-symbols-outlined text-4xl text-white">restaurant</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">CookIt</h1>
          <p className="text-gray-500 text-sm mt-1">Bienvenido de nuevo</p>
          <p className="text-gray-400 text-xs mt-1">Inicia sesión para continuar</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1.5">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${isLogin ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${!isLogin ? 'bg-white dark:bg-gray-600 shadow-sm text-primary-600' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-xl p-3 mb-4">
              <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">person</span>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  required
                />
              </div>
            )}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">mail</span>
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                required
              />
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">lock</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-10 py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                minLength={6}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <span className="material-symbols-outlined text-lg">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-base transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setEmail('aronets2004@gmail.com'); setPassword('Cookit2026'); setIsLogin(true); }}
            className="text-xs text-primary-600 hover:text-primary-700 font-semibold underline underline-offset-2 transition-colors"
          >
            Acceso Desarrollador (aronets2004@gmail.com)
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
}
