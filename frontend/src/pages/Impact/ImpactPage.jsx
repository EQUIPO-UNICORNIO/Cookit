import { useState, useEffect } from 'react';
import { api } from '../../api/client';

const impactTypes = [
  { type: 'co2', label: 'CO2 Ahorrado', unit: 'kg', icon: 'cloud', color: 'text-green-600' },
  { type: 'water', label: 'Agua Ahorrada', unit: 'L', icon: 'water_drop', color: 'text-blue-600' },
  { type: 'food_saved', label: 'Comida Salvada', unit: 'kg', icon: 'savings', color: 'text-secondary-600' },
  { type: 'meals_cooked', label: 'Comidas Cocinas', unit: 'platos', icon: 'restaurant', color: 'text-primary-600' },
  { type: 'plastic_saved', label: 'Plástico Evitado', unit: 'kg', icon: 'plastic', color: 'text-tertiary-600' },
];

export default function ImpactPage() {
  const [impact, setImpact] = useState({ logs: [], summary: {} });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'meals_cooked', value: '1', description: '' });

  useEffect(() => { loadImpact(); }, []);

  const loadImpact = async () => {
    try { setImpact(await api.getImpact()); } catch (e) { console.error(e); }
  };

  const addLog = async (e) => {
    e.preventDefault();
    try {
      await api.addImpact({ type: form.type, value: parseFloat(form.value) || 0, description: form.description });
      setShowForm(false);
      setForm({ type: 'meals_cooked', value: '1', description: '' });
      loadImpact();
    } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Tu Impacto</h1>
          <p className="text-sm text-gray-500 font-medium">Tu contribución al planeta</p>
        </div>
        <button onClick={() => setShowForm(true)} className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {impactTypes.map(({ type, label, unit, icon, color }) => (
          <div key={type} className="neo-card !p-4 text-center">
            <span className={`material-symbols-outlined text-3xl ${color}`}>{icon}</span>
            <p className="text-2xl font-extrabold mt-1">
              {impact.summary[type]?.toFixed(1) || 0}
              <span className="text-sm font-medium text-gray-400 ml-1">{unit}</span>
            </p>
            <p className="text-xs font-bold text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {impact.logs.length > 0 && (
        <div>
          <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider mb-2">Historial</h2>
          <div className="space-y-2">
            {impact.logs.slice(0, 20).map(log => {
              const t = impactTypes.find(i => i.type === log.type);
              return (
                <div key={log.id} className="neo-card flex items-center gap-3 !p-3">
                  <span className={`material-symbols-outlined ${t?.color || 'text-gray-500'}`}>{t?.icon || 'eco'}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{t?.label || log.type}: {log.value} {t?.unit || ''}</p>
                    {log.description && <p className="text-xs text-gray-500">{log.description}</p>}
                  </div>
                  <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-extrabold mb-4">Registrar Impacto</h2>
            <form onSubmit={addLog} className="space-y-3">
              <select className="neo-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                {impactTypes.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
              </select>
              <input className="neo-input" type="number" step="0.1" placeholder="Valor" value={form.value} onChange={e => setForm({...form, value: e.target.value})} required />
              <input className="neo-input" placeholder="Descripción (opcional)" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button type="submit" className="neo-btn-primary flex-1">Registrar</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
