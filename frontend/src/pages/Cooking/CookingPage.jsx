import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client';

export default function CookingPage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [timers, setTimers] = useState({});
  const [timerInputs, setTimerInputs] = useState({});

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
    if (!confirm(t('cooking.deleteSession'))) return;
    try {
      await api.deleteSession(id);
      if (activeSession?.id === id) setActiveSession(null);
      loadSessions();
    } catch (e) { alert(e.message); }
  };

  const startTimer = (stepIdx, seconds) => {
    if (timers[stepIdx]?.interval) return;
    const endTime = Date.now() + seconds * 1000;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setTimers(prev => ({ ...prev, [stepIdx]: { ...prev[stepIdx], remaining } }));
      if (remaining <= 0) { clearInterval(interval); setTimers(prev => ({ ...prev, [stepIdx]: { ...prev[stepIdx], interval: null, done: true } })); }
    }, 1000);
    setTimers(prev => ({ ...prev, [stepIdx]: { seconds, remaining: seconds, interval, done: false } }));
  };

  const stopTimer = (stepIdx) => {
    if (timers[stepIdx]?.interval) { clearInterval(timers[stepIdx].interval); }
    setTimers(prev => ({ ...prev, [stepIdx]: null }));
  };

  const formatTime = (s) => { const m = Math.floor(s / 60); const sec = s % 60; return `${m}:${sec.toString().padStart(2, '0')}`; };

  if (activeSession) {
    const { recipe_name, steps, current_step, completed } = activeSession;
    const progress = steps.length > 0 ? ((current_step + 1) / steps.length) * 100 : 0;

    return (
      <div>
        <button onClick={() => setActiveSession(null)} className="neo-btn !bg-gray-100 !py-2 !px-3 !text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> {t('cooking.back')}
        </button>

        <div className="neo-card mb-4">
          <h1 className="text-xl font-extrabold">{recipe_name}</h1>
          <div className="mt-3 bg-gray-100 rounded-full h-3 border-2 border-black overflow-hidden">
            <div className="bg-primary-500 h-full transition-all duration-500 rounded-full" style={{ width: `${completed ? 100 : progress}%` }} />
          </div>
          <p className="text-xs font-bold text-gray-500 mt-1">{completed ? t('cooking.completed') : `${t('cooking.step')} ${current_step + 1} ${t('cooking.of')} ${steps.length} ${t('cooking.steps')}`}</p>
        </div>

        {completed ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-primary-500">celebration</span>
            <h2 className="text-xl font-extrabold mt-4">{t('cooking.recipeCompleted')}</h2>
            <p className="text-gray-500 mt-2">{t('cooking.greatJob')}</p>
            <button onClick={() => setActiveSession(null)} className="neo-btn-primary mt-6">{t('cooking.back')}</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="neo-card !bg-primary-600 !text-white !border-primary-800">
              <span className="text-xs font-bold uppercase">{t('cooking.step')} {current_step + 1}</span>
              <p className="text-lg font-extrabold mt-1">{steps[current_step] || t('cooking.ready')}</p>
            </div>
            <div className="neo-card">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('cooking.timer')}</p>
              <div className="flex gap-2 items-center">
                <input
                  className="neo-input !py-1.5 !text-sm w-20 text-center"
                  type="number"
                  placeholder={t('cooking.min')}
                  value={timerInputs[current_step] || ''}
                  onChange={e => setTimerInputs(prev => ({ ...prev, [current_step]: e.target.value }))}
                />
                <span className="text-sm font-bold text-gray-500">{t('cooking.min')}</span>
                <button
                  onClick={() => { const v = parseInt(timerInputs[current_step]); if (v > 0) { startTimer(current_step, v * 60); setTimerInputs(prev => ({ ...prev, [current_step]: '' })); } }}
                  className="neo-btn !py-1.5 !px-3 !text-xs"
                >
                  {t('cooking.start')}
                </button>
                {timers[current_step] && (
                  <span className={`text-lg font-extrabold ml-auto ${timers[current_step].done ? 'text-green-600 animate-pulse' : ''}`}>
                    {timers[current_step].done ? t('cooking.timeUp') : formatTime(timers[current_step].remaining)}
                  </span>
                )}
                {timers[current_step] && !timers[current_step].done && (
                  <button onClick={() => stopTimer(current_step)} className="text-red-500">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={prevStep} disabled={current_step <= 0}
                className="neo-btn !bg-gray-100 flex-1 disabled:opacity-30">{t('cooking.previous')}</button>
              {current_step < steps.length - 1 ? (
                <button onClick={nextStep} className="neo-btn-primary flex-1">{t('cooking.next')}</button>
              ) : (
                <button onClick={completeSession} className="neo-btn-primary flex-1">{t('cooking.finish')}</button>
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
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('cooking.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{sessions.length} {t('cooking.sessions')}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      {sessions.length === 0 && !showForm && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">cooking</span>
          <p className="text-gray-400 font-bold mt-2">{t('cooking.noActiveSessions')}</p>
          <p className="text-gray-300 text-sm">{t('cooking.startNewRecipe')}</p>
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
              <p className="text-xs text-gray-500">{s.completed ? t('cooking.completedSession') : `${s.current_step + 1}/${s.steps.length} ${t('cooking.steps')}`}</p>
            </div>
            <button onClick={() => setActiveSession(s)} className="neo-btn-primary !py-1 !px-3 !text-xs">{t('cooking.cook')}</button>
            <button onClick={() => deleteSession(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold mb-4">{t('cooking.newRecipe')}</h2>
            <form onSubmit={createSession} className="space-y-3">
              <input className="neo-input" placeholder={t('cooking.recipeName')} value={recipeName} onChange={e => setRecipeName(e.target.value)} required />
              <textarea className="neo-input min-h-[150px]" placeholder={t('cooking.stepsPlaceholder')} value={stepsText} onChange={e => setStepsText(e.target.value)} required />
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button type="submit" className="neo-btn-primary flex-1">{t('cooking.start')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">{t('cooking.cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
