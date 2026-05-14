import { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function CookingPage() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [stepsText, setStepsText] = useState('');

  useEffect(() => { loadSessions(); }, []);

  const loadSessions = async () => {
    try { setSessions(await api.getSessions()); } catch (e) { console.error(e); }
  };

  const createSession = async (e) => {
    e.preventDefault();
    try {
      const steps = stepsText.split('\n').filter(Boolean);
      const session = await api.createSession({ recipe_name: recipeName, steps });
      setShowForm(false);
      setRecipeName('');
      setStepsText('');
      setActiveSession(session);
      loadSessions();
    } catch (e) { alert(e.message); }
  };

  const nextStep = async () => {
    if (!activeSession) return;
    const next = activeSession.current_step + 1;
    if (next >= activeSession.steps.length) return;
    try {
      await api.updateStep(activeSession.id, next);
      setActiveSession({ ...activeSession, current_step: next });
      loadSessions();
    } catch (e) { alert(e.message); }
  };

  const prevStep = async () => {
    if (!activeSession || activeSession.current_step <= 0) return;
    const prev = activeSession.current_step - 1;
    try {
      await api.updateStep(activeSession.id, prev);
      setActiveSession({ ...activeSession, current_step: prev });
      loadSessions();
    } catch (e) { alert(e.message); }
  };

  const completeSession = async () => {
    if (!activeSession) return;
    try {
      await api.updateStep(activeSession.id, activeSession.steps.length - 1);
      setActiveSession({ ...activeSession, current_step: activeSession.steps.length - 1, completed: true });
      loadSessions();
    } catch (e) { alert(e.message); }
  };

  const deleteSession = async (id) => {
    if (!confirm('¿Eliminar esta sesión?')) return;
    try {
      await api.deleteSession(id);
      if (activeSession?.id === id) setActiveSession(null);
      loadSessions();
    } catch (e) { alert(e.message); }
  };

  if (activeSession) {
    const { recipe_name, steps, current_step, completed } = activeSession;
    const progress = steps.length > 0 ? ((current_step + 1) / steps.length) * 100 : 0;

    return (
      <div>
        <button onClick={() => setActiveSession(null)} className="neo-btn !bg-gray-100 !py-2 !px-3 !text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> Volver
        </button>

        <div className="neo-card mb-4">
          <h1 className="text-xl font-extrabold">{recipe_name}</h1>
          <div className="mt-3 bg-gray-100 rounded-full h-3 border-2 border-black overflow-hidden">
            <div className="bg-primary-500 h-full transition-all duration-500 rounded-full" style={{ width: `${completed ? 100 : progress}%` }} />
          </div>
          <p className="text-xs font-bold text-gray-500 mt-1">{completed ? '¡Completado!' : `${current_step + 1} de ${steps.length} pasos`}</p>
        </div>

        {completed ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-primary-500">celebration</span>
            <h2 className="text-xl font-extrabold mt-4">¡Receta Completada!</h2>
            <p className="text-gray-500 mt-2">Buen trabajo, chef.</p>
            <button onClick={() => setActiveSession(null)} className="neo-btn-primary mt-6">Volver</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="neo-card !bg-primary-600 !text-white !border-primary-800">
              <span className="text-xs font-bold uppercase">Paso {current_step + 1}</span>
              <p className="text-lg font-extrabold mt-1">{steps[current_step] || '¡Listo!'}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={prevStep} disabled={current_step <= 0}
                className="neo-btn !bg-gray-100 flex-1 disabled:opacity-30">Anterior</button>
              {current_step < steps.length - 1 ? (
                <button onClick={nextStep} className="neo-btn-primary flex-1">Siguiente</button>
              ) : (
                <button onClick={completeSession} className="neo-btn-primary flex-1">Finalizar</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Modo Cocina</h1>
          <p className="text-sm text-gray-500 font-medium">{sessions.length} sesiones</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {sessions.length === 0 && !showForm && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">cooking</span>
          <p className="text-gray-400 font-bold mt-2">Sin sesiones activas</p>
          <p className="text-gray-300 text-sm">Inicia una nueva receta</p>
        </div>
      )}

      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="neo-card flex items-center gap-3 !p-3">
            <div className="w-10 h-10 rounded-xl bg-secondary-50 flex items-center justify-center border-2 border-black">
              <span className="material-symbols-outlined text-secondary-600">cooking</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">{s.recipe_name}</p>
              <p className="text-xs text-gray-500">{s.completed ? 'Completada' : `${s.current_step + 1}/${s.steps.length} pasos`}</p>
            </div>
            <button onClick={() => setActiveSession(s)} className="neo-btn-primary !py-1 !px-3 !text-xs">Cocinar</button>
            <button onClick={() => deleteSession(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold mb-4">Nueva Receta</h2>
            <form onSubmit={createSession} className="space-y-3">
              <input className="neo-input" placeholder="Nombre de la receta" value={recipeName} onChange={e => setRecipeName(e.target.value)} required />
              <textarea className="neo-input min-h-[150px]" placeholder="Pasos (uno por línea)" value={stepsText} onChange={e => setStepsText(e.target.value)} required />
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button type="submit" className="neo-btn-primary flex-1">Iniciar</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
