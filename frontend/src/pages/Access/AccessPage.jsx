import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordModal from './ForgotPasswordModal';

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

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Correo no válido';
    }
    if (!password) {
      errors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      errors.password = 'Mínimo 6 caracteres';
    }
    if (!isLogin && !name.trim()) {
      errors.name = 'El nombre es requerido';
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
    return `w-full rounded-xl border bg-white dark:bg-gray-700 pl-10 ${hasToggle ? 'pr-10' : 'pr-4'} py-3 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 transition-all ${
      err
        ? 'border-red-400 dark:border-red-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
        : 'border-gray-200 dark:border-gray-600 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
    }`;
  };

  return (
    <div className="min-h-screen bg-page flex flex-col">
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-4 shadow-lg shadow-primary-600/20">
            <span className="material-symbols-outlined text-4xl text-white">restaurant</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">CookIt</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Bienvenido de nuevo</p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Inicia sesión para continuar</p>
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">person</span>
                  <input
                    type="text"
                    placeholder="Nombre completo"
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
                  placeholder="Correo electrónico"
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
                  placeholder="Contraseña"
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
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-base transition-all shadow-lg shadow-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? <Spinner /> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setEmail('aronets2004@gmail.com'); setPassword('Cookit2026'); setIsLogin(true); }}
            className="text-xs text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors"
          >
            Acceso Desarrollador (aronets2004@gmail.com)
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  );
}
