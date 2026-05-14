import { useState, useEffect } from 'react';
import { api } from '../../api/client';

const challengeTemplates = [
  { title: 'Cocina 5 recetas nuevas', description: 'Prueba 5 recetas que nunca hayas hecho', goal: 5 },
  { title: 'Reduce el desperdicio', description: 'Usa todos los ingredientes de tu despensa', goal: 7 },
  { title: 'Semana sin carne', description: 'Platos vegetarianos por 7 días', goal: 7 },
  { title: 'Desayunos saludables', description: 'Prepara desayunos nutritivos', goal: 5 },
  { title: 'Hidratación diaria', description: 'Bebe 2L de agua al día', goal: 7 },
];

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => { loadChallenges(); }, []);

  const loadChallenges = async () => {
    try { setChallenges(await api.getChallenges()); } catch (e) { console.error(e); }
  };

  const addChallenge = async (template) => {
    try {
      await api.addChallenge(template);
      loadChallenges();
    } catch (e) { alert(e.message); }
  };

  const updateProgress = async (id, progress) => {
    try {
      await api.updateChallengeProgress(id, progress);
      loadChallenges();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este reto?')) return;
    try { await api.deleteChallenge(id); loadChallenges(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-4">Retos y Logros</h1>

      <div className="mb-6">
        <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Retos Disponibles</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {challengeTemplates.map((t, i) => (
            <button
              key={i}
              onClick={() => addChallenge(t)}
              className="flex-shrink-0 neo-card !p-3 w-44 text-left hover:bg-primary-50 transition-colors"
            >
              <span className="material-symbols-outlined text-primary-600 mb-1">emoji_events</span>
              <p className="font-bold text-xs">{t.title}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {challenges.length > 0 && (
        <div>
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Tus Retos Activos</h2>
          <div className="space-y-3">
            {challenges.map(challenge => {
              const progress = Math.min((challenge.progress / challenge.goal) * 100, 100);
              return (
                <div key={challenge.id} className="neo-card">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-extrabold text-sm">{challenge.title}</h3>
                      <p className="text-xs text-gray-500">{challenge.description}</p>
                    </div>
                    <button onClick={() => handleDelete(challenge.id)} className="p-1 rounded-lg hover:bg-red-50 text-red-500">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>

                  {challenge.completed ? (
                    <div className="bg-primary-50 border-2 border-primary-500 rounded-xl p-3 text-center">
                      <span className="material-symbols-outlined text-primary-600">celebration</span>
                      <p className="font-bold text-primary-700 text-sm">¡Completado!</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-100 rounded-full h-3 border-2 border-black overflow-hidden mb-2">
                        <div className="bg-primary-500 h-full transition-all rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-500">{challenge.progress} / {challenge.goal}</p>
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateProgress(challenge.id, Math.max(0, challenge.progress - 1))}
                            className="w-7 h-7 rounded-lg bg-gray-100 border-2 border-black flex items-center justify-center text-sm font-bold"
                          >-</button>
                          <button
                            onClick={() => updateProgress(challenge.id, challenge.progress + 1)}
                            className="w-7 h-7 rounded-lg bg-primary-100 border-2 border-primary-500 flex items-center justify-center text-sm font-bold text-primary-700"
                          >+</button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-5xl text-gray-300">emoji_events</span>
          <p className="text-gray-400 font-bold mt-2">Sin retos activos</p>
          <p className="text-gray-300 text-sm">Selecciona un reto de arriba para empezar</p>
        </div>
      )}
    </div>
  );
}
