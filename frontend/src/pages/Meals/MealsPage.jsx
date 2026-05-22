import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';

const mealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const suggestions = [
  { name: 'Tortilla francesa', meal_type: 'desayuno', recipe: 'Tortilla francesa', ingredients: ['Huevos', 'Sal', 'Aceite de oliva'], instructions: '1. Bate los huevos con sal.\n2. Calienta aceite en una sartén antiadherente.\n3. Vierte los huevos y deja cuajar.\n4. Cuando la base esté firme, dobla por la mitad.\n5. Sirve inmediatamente.' },
  { name: 'Huevos revueltos', meal_type: 'desayuno', recipe: 'Huevos revueltos', ingredients: ['Huevos', 'Leche', 'Mantequilla', 'Sal', 'Pimienta'], instructions: '1. Bate los huevos con un poco de leche.\n2. Derrite la mantequilla en una sartén.\n3. Vierte los huevos y remueve suavemente.\n4. Cocina a fuego bajo hasta que cuajen.\n5. Sazona con sal y pimienta.' },
  { name: 'Tostada con tomate', meal_type: 'desayuno', recipe: 'Tostada con tomate', ingredients: ['Pan', 'Tomate', 'Aceite de oliva', 'Sal', 'Jamón'], instructions: '1. Tuesta las rebanadas de pan.\n2. Corta un tomate por la mitad.\n3. Restriega el tomate sobre el pan tostado.\n4. Añade aceite de oliva y sal.\n5. Coloca una loncha de jamón encima.' },
  { name: 'Ensalada César', meal_type: 'almuerzo', recipe: 'Ensalada César', ingredients: ['Lechuga', 'Pollo', 'Pan', 'Queso parmesano', 'Aceite de oliva', 'Limón', 'Ajo', 'Mostaza'], instructions: '1. Cocina el pollo a la plancha y corta en tiras.\n2. Corta el pan en cubos y tuéstalos en el horno.\n3. Prepara el aliño con aceite, limón, ajo y mostaza.\n4. Mezcla la lechuga con el pollo y los crutones.\n5. Añade el aliño y queso parmesano rallado.' },
  { name: 'Arroz blanco', meal_type: 'comida', recipe: 'Arroz blanco', ingredients: ['Arroz', 'Agua', 'Aceite de oliva', 'Sal', 'Ajo'], instructions: '1. Sofríe el ajo picado en aceite.\n2. Añade el arroz y remueve 1 minuto.\n3. Agrega el doble de agua que de arroz.\n4. Cocina a fuego bajo 18 minutos.\n5. Deja reposar 5 minutos antes de servir.' },
  { name: 'Lentejas estofadas', meal_type: 'comida', recipe: 'Lentejas estofadas', ingredients: ['Lentejas', 'Zanahoria', 'Patata', 'Cebolla', 'Ajo', 'Tomate', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Sofríe la cebolla, ajo y zanahoria picados.\n2. Añade el tomate y el pimentón.\n3. Incorpora las lentejas lavadas y la patata.\n4. Cubre con agua y sazona con sal.\n5. Cocina 40 minutos a fuego medio.' },
  { name: 'Puré de patatas', meal_type: 'comida', recipe: 'Puré de patatas', ingredients: ['Patatas', 'Leche', 'Mantequilla', 'Sal', 'Nuez moscada', 'Pimienta'], instructions: '1. Pela y corta las patatas en trozos.\n2. Hiérvelas en agua con sal hasta que estén tiernas.\n3. Escurre y aplasta las patatas.\n4. Añade mantequilla y leche caliente.\n5. Sazona con nuez moscada y pimienta.' },
];

const LOCAL_KEY = 'cookit_meals';
let localIdCounter = 0;

function getLocalMeals() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; } catch { return []; }
}

function saveLocalMeals(meals) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(meals)); } catch {}
}

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export default function MealsPage() {
  const location = useLocation();
  const { t } = useTranslation();
  const [meals, setMeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', day: '', meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '' });
  const [selectedDay, setSelectedDay] = useState(dayKeys[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [cookingStep, setCookingStep] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [fullPhoto, setFullPhoto] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadMeals(); }, []);

  useEffect(() => {
    if (location.state?.suggestedMeal) {
      const meal = location.state.suggestedMeal;
      setForm({
        name: meal.name || '',
        day: '',
        meal_type: meal.meal_type || 'comida',
        recipe: meal.recipe || '',
        ingredients: (meal.ingredients || []).join(', '),
        instructions: meal.instructions || '',
      });
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadMeals = async () => {
    let apiMeals = [];
    try { apiMeals = await api.getMeals(); } catch (e) { console.error(e); }
    let local = getLocalMeals();
    const before = local.length;
    local = local.filter(m => m.day);
    if (local.length !== before) saveLocalMeals(local);
    const merged = [...local, ...apiMeals];
    if (local.length > 0) {
      localIdCounter = Math.max(...local.map(m => parseInt(m.id.replace('local_', '')) || 0), 0) + 1;
    }
    setMeals(merged);
  };

  const generateSuggestion = () => {
    const s = suggestions[Math.floor(Math.random() * suggestions.length)];
    setForm(prev => ({ ...prev, name: s.name, day: selectedDay, meal_type: s.meal_type, recipe: s.recipe, ingredients: s.ingredients.join(', '), instructions: s.instructions || '' }));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, ingredients: form.ingredients.split(',').map(i => i.trim()).filter(Boolean) };
      if (editing) {
        if (typeof editing === 'string' && editing.startsWith('local_')) {
          const local = getLocalMeals().map(m => m.id === editing ? { ...m, ...data } : m);
          saveLocalMeals(local);
        } else {
          await api.updateMeal(editing, data);
        }
      } else {
        const id = `local_${localIdCounter++}`;
        const local = getLocalMeals();
        saveLocalMeals([...local, { id, ...data }]);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', day: '', meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '' });
      loadMeals();
      showToast('Receta guardada en tus menús');
    } catch (e) { showToast('Error al guardar: ' + e.message); }
  };

  const handleDelete = async (id) => {
    if (typeof id === 'string' && id.startsWith('local_')) {
      const local = getLocalMeals().filter(m => m.id !== id);
      saveLocalMeals(local);
      loadMeals();
      setConfirmDeleteId(null);
      return;
    }
    try { await api.deleteMeal(id); loadMeals(); setConfirmDeleteId(null); } catch (e) { alert(e.message); }
  };

  const confirmDelete = (id) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const handleOcrPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrLoading(true);
    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(r => { img.onload = r; });
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 1000);
      canvas.height = Math.min(img.height, 1000);
      canvas.getContext('2d').drawImage(img, 0, 0);

      const thumbCanvas = document.createElement('canvas');
      const maxSize = 400;
      let tw = img.width, th = img.height;
      if (tw > th) { if (tw > maxSize) { th = th * maxSize / tw; tw = maxSize; } }
      else { if (th > maxSize) { tw = tw * maxSize / th; th = maxSize; } }
      thumbCanvas.width = tw;
      thumbCanvas.height = th;
      thumbCanvas.getContext('2d').drawImage(canvas, 0, 0, tw, th);
      const photoData = thumbCanvas.toDataURL('image/jpeg', 0.7);

      URL.revokeObjectURL(img.src);
      setForm(prev => ({ ...prev, photo: photoData }));
    } catch (err) {
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  };

  const parseInstructions = (text) => text?.split('\n').filter(l => l.trim()) || [];

  const dayMeals = selectedDay === 'todas'
    ? meals
    : meals.filter(m => !m.day || m.day === selectedDay);

  if (selectedMeal) {
    const steps = parseInstructions(selectedMeal.instructions);
    return (
      <div>
        <button onClick={() => { setSelectedMeal(null); setCookingStep(0); }} className="neo-btn !bg-gray-100 dark:!text-black dark:!border-gray-400 !py-2 !px-3 !text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> Volver a menús
        </button>
        <button onClick={() => { const m = selectedMeal; setSelectedMeal(null); setEditing(m.id); setForm({ name: m.name, day: m.day, meal_type: m.meal_type, recipe: m.recipe, ingredients: (m.ingredients || []).join(', '), instructions: m.instructions || '', photo: m.photo }); setShowForm(true); }} className="neo-btn !bg-primary-50 !text-primary-600 !border-primary-300 !py-2 !px-3 !text-sm mb-4 ml-2">
          <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> Editar
        </button>

        <div className="neo-card mb-4">
          <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
            {selectedMeal.meal_type}
          </span>
          {selectedMeal.photo && (
            <img src={selectedMeal.photo} alt={selectedMeal.name} className="w-full h-48 object-cover rounded-xl mt-3 border-2 border-black cursor-pointer" onClick={() => setFullPhoto(selectedMeal.photo)} />
          )}
          <h2 className="text-xl font-extrabold mt-2">{selectedMeal.name}</h2>
          {selectedMeal.recipe && <p className="text-sm text-gray-500 font-medium mt-1">Receta: {selectedMeal.recipe}</p>}
          {selectedMeal.day && <p className="text-xs text-gray-400 mt-0.5">Día: {selectedMeal.day}</p>}

          {selectedMeal.ingredients?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">Ingredientes</p>
              <div className="flex flex-wrap gap-1">
                {selectedMeal.ingredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 font-medium dark:text-white">{ing}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {steps.length > 0 && (
          <div className="neo-card !bg-primary-600 !text-white !border-primary-800 mb-3">
            <span className="text-xs font-bold uppercase">Paso {cookingStep + 1} de {steps.length}</span>
            <p className="text-lg font-extrabold mt-1">{steps[cookingStep]}</p>
          </div>
        )}

        {steps.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => setCookingStep(Math.max(0, cookingStep - 1))} disabled={cookingStep <= 0}
              className="neo-btn !bg-gray-100 flex-1 disabled:opacity-30">Anterior</button>
            <button onClick={() => cookingStep < steps.length - 1 ? setCookingStep(cookingStep + 1) : null}
              className="neo-btn-primary flex-1">
              {cookingStep >= steps.length - 1 ? '¡Completado!' : 'Siguiente'}
            </button>
          </div>
        )}

        {steps.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-gray-300">info</span>
            <p className="text-gray-400 font-bold mt-2">Sin instrucciones</p>
            <p className="text-gray-300 text-sm">Este plato no tiene pasos definidos</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Mis Menús</h1>
          <p className="text-sm text-gray-500 font-medium">{meals.length} comidas planificadas</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', day: selectedDay, meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '' }); }}
          className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        <button key="todas"
          onClick={() => setSelectedDay('todas')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === 'todas' ? 'bg-primary-600 text-white neo-shadow-primary' : 'bg-white dark:bg-gray-300 border-2 border-black dark:text-black'}`}
        >
          Todas
        </button>
        {dayKeys.map(key => (
          <button key={key}
            onClick={() => setSelectedDay(key)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === key ? 'bg-primary-600 text-white neo-shadow-primary' : 'bg-white dark:bg-gray-300 border-2 border-black dark:text-black'}`}
          >
            {t(`meals.days.${key}`)}
          </button>
        ))}
      </div>

      {dayMeals.length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-300">restaurant_menu</span>
          <p className="text-gray-400 font-bold mt-2">{t('meals.noMealsForDay')} {selectedDay === 'todas' ? 'seleccionado' : t(`meals.days.${selectedDay}`)}</p>
          <button onClick={() => { setShowForm(true); setForm({ ...form, day: selectedDay }); generateSuggestion(); }} className="neo-btn-primary !py-2 !px-4 !text-sm mt-3">
            Sugerir comida
          </button>
        </div>
      )}

      <div className="space-y-3">
        {dayMeals.map(meal => (
          <div key={meal.id} className="neo-card relative cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMeal(meal)}>
            {meal.day && (
              <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border-2
                ${meal.meal_type === 'desayuno' ? 'bg-amber-100 text-amber-800 border-amber-400' : ''}
                ${meal.meal_type === 'almuerzo' ? 'bg-green-100 text-green-800 border-green-400' : ''}
                ${meal.meal_type === 'comida' ? 'bg-blue-100 text-blue-800 border-blue-400' : ''}
                ${meal.meal_type === 'merienda' ? 'bg-purple-100 text-purple-800 border-purple-400' : ''}
                ${meal.meal_type === 'cena' ? 'bg-indigo-100 text-indigo-800 border-indigo-400' : ''}
                ${!['desayuno','almuerzo','comida','merienda','cena'].includes(meal.meal_type) ? 'bg-gray-800 text-white border-black' : ''}`}>
                {t(`meals.days.${meal.day}`)}
              </span>
            )}
            <div className="flex gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                  {meal.meal_type}
                </span>
                <h3 className="font-extrabold text-base mt-1 truncate">{meal.name}</h3>
                {meal.recipe && <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">Receta: {meal.recipe}</p>}
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meal.ingredients.slice(0, 3).map((ing, i) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-0.5 font-medium dark:text-white">{ing}</span>
                    ))}
                    {meal.ingredients.length > 3 && <span className="text-xs text-gray-400 dark:text-gray-400 font-medium">+{meal.ingredients.length - 3}</span>}
                  </div>
                )}
              </div>
              {meal.photo && (
                <div className="flex-shrink-0">
                  <img src={meal.photo} alt={meal.name} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
              <button onClick={(e) => { e.stopPropagation(); setEditing(meal.id); setForm({ name: meal.name, day: meal.day, meal_type: meal.meal_type, recipe: meal.recipe, ingredients: (meal.ingredients || []).join(', '), instructions: meal.instructions || '', photo: meal.photo }); setShowForm(true); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-gray-300 text-gray-600">
                <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> Editar
              </button>
              <button onClick={(e) => { e.stopPropagation(); confirmDelete(meal.id); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-red-300 text-red-500">
                <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold">{editing ? 'Editar Menú' : 'Nuevo Menú'}</h2>
              <div className="flex gap-1">
                <button onClick={generateSuggestion} className="text-xs font-bold text-primary-600 neo-btn !py-1 !px-3 !border-primary-300">
                  Sugerencia
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}
                  className="text-xs font-bold neo-btn !py-1 !px-3 !border-secondary-300 text-secondary-600">
                  <span className="material-symbols-outlined text-sm align-text-bottom">{ocrLoading ? 'hourglass_top' : 'photo_camera'}</span> Foto
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleOcrPhoto} className="hidden" />
                {form.photo && <button type="button" onClick={() => setForm(prev => ({ ...prev, photo: '' }))} className="text-xs font-bold neo-btn !py-1 !px-3 !border-red-300 text-red-500">
                  <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> Foto
                </button>}
              </div>
            </div>
            {ocrLoading && <p className="text-xs text-primary-600 font-medium mb-2">Leyendo imagen...</p>}
            {form.photo && <img src={form.photo} alt="Preview" className="w-full h-20 object-cover rounded-xl mb-3 border-2 border-primary-300" />}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="neo-input" placeholder="Nombre del plato" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <div className="flex gap-2">
                <select className="neo-input flex-1" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                  <option value="">{t('meals.noDay')}</option>
                  {dayKeys.map(key => <option key={key} value={key}>{t(`meals.days.${key}`)}</option>)}
                </select>
                <select className="neo-input flex-1" value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
                  {mealTypes.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <input className="neo-input" placeholder="Nombre de receta" value={form.recipe} onChange={e => setForm({...form, recipe: e.target.value})} />
              <input className="neo-input" placeholder="Ingredientes (separados por coma)" value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} />
              <textarea className="neo-input min-h-[80px]" placeholder="Instrucciones (un paso por línea)" value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button type="submit" className="neo-btn-primary flex-1">{editing ? 'Guardar' : 'Agregar'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div className="bg-primary-600 text-white font-bold text-sm px-5 py-3 rounded-2xl border-2 border-primary-800 shadow-lg whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 z-[70] flex items-center justify-center p-4" onClick={cancelDelete}>
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-base text-gray-900 text-center mb-1">Eliminar este menú?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={cancelDelete} className="neo-btn !bg-gray-100 flex-1">Cancelar</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="neo-btn !bg-red-500 !text-white flex-1">Aceptar</button>
            </div>
          </div>
        </div>
      )}

      {fullPhoto && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center" onClick={() => setFullPhoto(null)}>
          <img src={fullPhoto} alt="Foto completa" className="relative max-w-[95vw] max-h-[95vh] object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}