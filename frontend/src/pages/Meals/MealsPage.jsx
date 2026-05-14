import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api/client';

const mealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const suggestions = [
  { name: 'Pollo al horno con verduras', meal_type: 'comida', recipe: 'Pollo al horno', ingredients: ['Pollo', 'Verduras', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Precalienta el horno a 200°C.\n2. Sazona el pollo con sal y pimienta.\n3. Corta las verduras en trozos.\n4. Coloca todo en una bandeja y hornea 45 min.' },
  { name: 'Ensalada César', meal_type: 'almuerzo', recipe: 'Ensalada César', ingredients: ['Lechuga', 'Pollo', 'Crutones', 'Queso parmesano', 'Aderezo César'], instructions: '1. Cocina el pollo a la plancha.\n2. Corta la lechuga en trozos.\n3. Mezcla todos los ingredientes.\n4. Añade el aderezo y sirve.' },
  { name: 'Tacos de pescado', meal_type: 'cena', recipe: 'Tacos', ingredients: ['Pescado', 'Tortillas', 'Repollo', 'Crema', 'Limón'], instructions: '1. Cocina el pescado en sartén.\n2. Calienta las tortillas.\n3. Monta los tacos con repollo y crema.\n4. Exprime limón al gusto.' },
  { name: 'Smoothie verde', meal_type: 'desayuno', recipe: 'Smoothie', ingredients: ['Espinaca', 'Plátano', 'Manzana', 'Jengibre'], instructions: '1. Lava todos los ingredientes.\n2. Corta en trozos.\n3. Licúa todo hasta obtener textura suave.\n4. Sirve frío.' },
  { name: 'Omelette de claras', meal_type: 'desayuno', recipe: 'Omelette', ingredients: ['Claras de huevo', 'Espinaca', 'Tomate', 'Queso'], instructions: '1. Bate las claras.\n2. Saltea espinaca y tomate.\n3. Vierte las claras en sartén.\n4. Añade el relleno y dobla.' },
  { name: 'Pasta primavera', meal_type: 'comida', recipe: 'Pasta', ingredients: ['Pasta', 'Calabacín', 'Berenjena', 'Tomate', 'Albahaca'], instructions: '1. Cocina la pasta al dente.\n2. Saltea las verduras en aceite.\n3. Mezcla la pasta con las verduras.\n4. Sirve con albahaca fresca.' },
];

export default function MealsPage() {
  const location = useLocation();
  const [meals, setMeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', day: '', meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '' });
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [cookingStep, setCookingStep] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
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
    try { setMeals(await api.getMeals()); } catch (e) { console.error(e); }
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
        await api.updateMeal(editing, data);
      } else {
        await api.addMeal(data);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', day: '', meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '' });
      loadMeals();
      showToast('Receta guardada en tus menús');
    } catch (e) { showToast('Error al guardar: ' + e.message); }
  };

  const handleDelete = async (id) => {
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

  const dayMeals = meals.filter(m => m.day === selectedDay);

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
            <img src={selectedMeal.photo} alt={selectedMeal.name} className="w-full h-48 object-cover rounded-xl mt-3 border-2 border-black" />
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
        {days.map(d => (
          <button key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === d ? 'bg-primary-600 text-white neo-shadow-primary' : 'bg-white dark:bg-gray-300 border-2 border-black dark:text-black'}`}
          >
            {d}
          </button>
        ))}
      </div>

      {dayMeals.length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-300">restaurant_menu</span>
          <p className="text-gray-400 font-bold mt-2">Sin comidas para {selectedDay}</p>
          <button onClick={() => { setShowForm(true); setForm({ ...form, day: selectedDay }); generateSuggestion(); }} className="neo-btn-primary !py-2 !px-4 !text-sm mt-3">
            Sugerir comida
          </button>
        </div>
      )}

      <div className="space-y-3">
        {dayMeals.map(meal => (
          <div key={meal.id} className="neo-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMeal(meal)}>
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
                  <option value="">Sin día</option>
                  {days.map(d => <option key={d}>{d}</option>)}
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
    </div>
  );
}