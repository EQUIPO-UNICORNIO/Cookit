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
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-4 neo-shadow-primary">
            <span className="material-symbols-outlined text-4xl text-white">restaurant</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">CookIt</h1>
          <p className="text-gray-500 font-bold mt-1">¡Bienvenido a CookIt!</p>
          <p className="text-gray-400 text-xs mt-1 italic">"Cocinar es un acto de amor propio.<br/>Empecemos tu viaje culinario hoy mismo"</p>
        </div>

        <div className="neo-card p-6">
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${isLogin ? 'bg-white neo-shadow text-primary-600' : 'text-gray-500'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${!isLogin ? 'bg-white neo-shadow text-primary-600' : 'text-gray-500'}`}
            >
              Crear Cuenta
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3 mb-4">
              <p className="text-red-700 text-sm font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Nombre completo"
                value={name}
                onChange={e => setName(e.target.value)}
                className="neo-input"
                required
              />
            )}
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="neo-input"
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="neo-input"
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="neo-btn-primary w-full text-base"
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

        <p className="text-center text-xs text-gray-400 mt-4">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
}
