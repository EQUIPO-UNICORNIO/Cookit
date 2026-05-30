import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';

const substitutionDB = {
  'huevo': ['puré de manzana', 'plátano maduro', 'semillas de lino + agua', 'tofu sedoso', 'yogurt'],
  'leche': ['leche de almendras', 'leche de avena', 'leche de soja', 'leche de coco', 'leche de arroz'],
  'harina': ['harina de almendras', 'harina de avena', 'harina de coco', 'harina de arroz'],
  'mantequilla': ['aceite de coco', 'puré de manzana', 'aceite de oliva', 'yogur griego'],
  'azúcar': ['miel', 'stevia', 'eritritol', 'dátiles', 'sirope de arce', 'azúcar de coco'],
  'queso': ['levadura nutricional', 'tofu', 'anacardos remojados', 'puré de patata'],
  'crema de leche': ['leche de coco espesa', 'anacardos remojados + agua', 'tofu sedoso'],
  'carne': ['tofu', 'tempeh', 'seitán', 'lentejas', 'hongos/portobello', 'garbanzos'],
  'pan': ['pan integral', 'pan de masa madre', 'pan sin gluten', 'tortillas de maíz', 'hojas de lechuga'],
  'mayonesa': ['yogur griego', 'hummus', 'aguacate', 'mostaza'],
};

export default function SubstitutionPage() {
  const { t } = useTranslation();
  const [substitutions, setSubstitutions] = useState([]);
  const [ingredient, setIngredient] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSub, setSelectedSub] = useState('');

  useEffect(() => { loadSubs(); }, []);

  const loadSubs = async () => {
    try { setSubstitutions(await api.getSubstitutions()); } catch (e) { console.error(e); }
  };

  const handleSearch = (value) => {
    setIngredient(value);
    const key = value.toLowerCase().trim();
    const found = Object.entries(substitutionDB).find(([k]) => k.includes(key) || key.includes(k));
    setSuggestions(found ? found[1] : []);
  };

  const saveSubstitution = async () => {
    if (!ingredient || !selectedSub) return;
    try {
      await api.addSubstitution({ ingredient: ingredient.toLowerCase(), substitute: selectedSub, reason: 'Recommended substitution' });
      setIngredient('');
      setSelectedSub('');
      setSuggestions([]);
      loadSubs();
    } catch (e) { alert(e.message); }
  };

  const handleDelete = async (id) => {
    try { await api.deleteSubstitution(id); loadSubs(); } catch (e) { alert(e.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('substitution.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('substitution.subtitle')}</p>
        </div>
      </div>

      <div className="neo-card mb-6">
        <h2 className="font-extrabold text-sm mb-3">{t('substitution.question')}</h2>
        <input
          type="text"
          placeholder={t('substitution.placeholder')}
          value={ingredient}
          onChange={e => handleSearch(e.target.value)}
          className="neo-input mb-3"
        />

        {suggestions.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">{t('substitution.suggestions')}</p>
            <div className="space-y-1 mb-3">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSub(s)}
                  className={`w-full text-left p-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    selectedSub === s ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {selectedSub && (
              <button onClick={saveSubstitution} className="neo-btn-primary w-full !text-sm !py-2">
                {t('substitution.saveSubstitution')}
              </button>
            )}
          </div>
        )}

        {ingredient && suggestions.length === 0 && (
          <p className="text-sm text-gray-400 font-medium">{t('substitution.noSubstitutions')} "{ingredient}"</p>
        )}
      </div>

      {substitutions.length > 0 && (
        <div>
          <h2 className="font-extrabold text-sm mb-3 text-gray-600">{t('substitution.savedSubstitutions')}</h2>
          <div className="space-y-2">
            {substitutions.map(sub => (
              <div key={sub.id} className="neo-card flex items-center gap-3 !p-3">
                <div className="flex-1">
                  <p className="font-bold text-sm">{sub.ingredient}</p>
                  <p className="text-xs text-gray-500">
                    <span className="material-symbols-outlined text-xs align-text-bottom">arrow_forward</span> {sub.substitute}
                  </p>
                </div>
                <button onClick={() => handleDelete(sub.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
