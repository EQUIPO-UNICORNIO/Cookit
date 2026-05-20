import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../api/client';

const mealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const suggestions = [
  { name: 'Pollo al horno con verduras', meal_type: 'comida', recipe: 'Pollo al horno', ingredients: ['Pollo', 'Patatas', 'Zanahoria', 'Aceite de oliva', 'Sal', 'Pimienta', 'Ajo'], instructions: '1. Precalienta el horno a 200°C.\n2. Sazona el pollo con sal, pimienta y ajo picado.\n3. Corta las patatas y zanahorias en trozos.\n4. Coloca todo en una bandeja con aceite de oliva.\n5. Hornea durante 45-50 minutos hasta que esté dorado.' },
  { name: 'Ensalada César', meal_type: 'almuerzo', recipe: 'Ensalada César', ingredients: ['Lechuga', 'Pollo', 'Pan', 'Queso parmesano', 'Aceite de oliva', 'Limón', 'Ajo', 'Mostaza'], instructions: '1. Cocina el pollo a la plancha.\n2. Corta el pan en cubos y tuéstalos.\n3. Mezcla la lechuga con el pollo.\n4. Añade el aliño y queso rallado.' },
  { name: 'Tacos de pescado', meal_type: 'cena', recipe: 'Tacos', ingredients: ['Pescado blanco', 'Tortillas de maíz', 'Col', 'Crema agria', 'Limón', 'Aguacate', 'Cebolla', 'Cilantro'], instructions: '1. Cocina el pescado en sartén.\n2. Calienta las tortillas.\n3. Monta los tacos con col y crema.\n4. Exprime limón al gusto.' },
  { name: 'Smoothie verde', meal_type: 'desayuno', recipe: 'Smoothie', ingredients: ['Espinacas', 'Plátano', 'Manzana', 'Jengibre', 'Agua', 'Miel'], instructions: '1. Lava todos los ingredientes.\n2. Corta en trozos.\n3. Licúa todo hasta obtener textura suave.\n4. Sirve frío.' },
  { name: 'Omelette de espinacas', meal_type: 'desayuno', recipe: 'Omelette', ingredients: ['Huevos', 'Espinacas', 'Tomate', 'Queso', 'Aceite de oliva', 'Sal'], instructions: '1. Bate los huevos.\n2. Saltea espinaca y tomate.\n3. Vierte las claras en sartén.\n4. Añade el relleno y dobla.' },
  { name: 'Pasta primavera', meal_type: 'comida', recipe: 'Pasta', ingredients: ['Pasta', 'Calabacín', 'Berenjena', 'Tomate', 'Albahaca', 'Aceite de oliva', 'Sal'], instructions: '1. Cocina la pasta al dente.\n2. Saltea las verduras en aceite.\n3. Mezcla la pasta con las verduras.\n4. Sirve con albahaca fresca.' },
  { name: 'Arroz con pollo', meal_type: 'comida', recipe: 'Arroz con pollo', ingredients: ['Arroz', 'Pollo', 'Cebolla', 'Ajo', 'Pimiento', 'Caldo de pollo', 'Aceite de oliva', 'Sal'], instructions: '1. Dora el pollo en una olla.\n2. Agrega cebolla y ajo picados.\n3. Añade el arroz y caldo.\n4. Cocina 20 min y sirve.' },
  { name: 'Hamburguesa casera', meal_type: 'cena', recipe: 'Hamburguesa', ingredients: ['Carne picada', 'Pan de hamburguesa', 'Lechuga', 'Tomate', 'Queso cheddar', 'Cebolla', 'Mostaza', 'Ketchup'], instructions: '1. Forma las hamburguesas con la carne.\n2. Cocina a la plancha 4 min por lado.\n3. Tuesta el pan.\n4. Monta con lechuga, tomate y queso.' },
  { name: 'Tortilla de patatas', meal_type: 'comida', recipe: 'Tortilla', ingredients: ['Patatas', 'Huevos', 'Cebolla', 'Aceite de oliva', 'Sal'], instructions: '1. Pela y corta las patatas en rodajas.\n2. Fríe las patatas y la cebolla.\n3. Bate los huevos con sal.\n4. Mezcla todo y cuaja por ambos lados.' },
  { name: 'Ensalada mixta', meal_type: 'almuerzo', recipe: 'Ensalada', ingredients: ['Lechuga', 'Tomate', 'Cebolla', 'Atún en lata', 'Aceite de oliva', 'Vinagre', 'Sal'], instructions: '1. Lava y corta la lechuga.\n2. Corta tomate y cebolla.\n3. Escurre el atún y desmenúzalo.\n4. Mezcla todo y aliña.' },
  { name: 'Macarrones con tomate', meal_type: 'comida', recipe: 'Macarrones', ingredients: ['Macarrones', 'Tomate triturado', 'Cebolla', 'Ajo', 'Aceite de oliva', 'Queso rallado', 'Sal', 'Orégano'], instructions: '1. Cocina los macarrones al dente.\n2. Sofríe cebolla y ajo.\n3. Añade tomate y orégano.\n4. Mezcla con la pasta y queso.' },
  { name: 'Pollo a la plancha', meal_type: 'comida', recipe: 'Pollo plancha', ingredients: ['Pollo', 'Aceite de oliva', 'Sal', 'Pimienta', 'Limón'], instructions: '1. Sazona el pollo con sal y pimienta.\n2. Calienta aceite en sartén.\n3. Cocina 5 min por cada lado.\n4. Añade limón al final.' },
  { name: 'Crema de calabaza', meal_type: 'comida', recipe: 'Crema', ingredients: ['Calabaza', 'Cebolla', 'Ajo', 'Caldo de verduras', 'Nata', 'Aceite de oliva', 'Sal'], instructions: '1. Pela y corta la calabaza.\n2. Sofríe cebolla y ajo.\n3. Añade calabaza y caldo.\n4. Cocina 25 min y tritura.' },
  { name: 'Wrap de atún', meal_type: 'almuerzo', recipe: 'Wrap', ingredients: ['Tortillas de trigo', 'Atún en lata', 'Lechuga', 'Tomate', 'Mayonesa', 'Maíz dulce', 'Sal'], instructions: '1. Escurre el atún y mezcla con mayonesa.\n2. Coloca lechuga sobre la tortilla.\n3. Añade atún, tomate y maíz.\n4. Enrolla bien apretado.' },
  { name: 'Yogur con granola', meal_type: 'desayuno', recipe: 'Yogur', ingredients: ['Yogur natural', 'Granola', 'Miel', 'Plátano', 'Fresas', 'Frutos secos'], instructions: '1. Coloca el yogur en un bol.\n2. Corta plátano y fresas.\n3. Añade granola y frutas.\n4. Rocía con miel.' },
  { name: 'Salmón al horno', meal_type: 'cena', recipe: 'Salmón', ingredients: ['Salmón', 'Limón', 'Eneldo', 'Aceite de oliva', 'Sal', 'Pimienta', 'Patatas'], instructions: '1. Precalienta horno a 180°C.\n2. Coloca salmón en bandeja.\n3. Sazona con limón y eneldo.\n4. Hornea 20 minutos.' },
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
        <button onClick={() => { setSelectedMeal(null); setCookingStep(0); }} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl py-2 px-3 text-sm transition-all active:scale-95 mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> Volver a menús
        </button>
        <button onClick={() => { const m = selectedMeal; setSelectedMeal(null); setEditing(m.id); setForm({ name: m.name, day: m.day, meal_type: m.meal_type, recipe: m.recipe, ingredients: (m.ingredients || []).join(', '), instructions: m.instructions || '', photo: m.photo }); setShowForm(true); }} className="bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold rounded-xl py-2 px-3 text-sm transition-all active:scale-95 mb-4 ml-2">
          <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> Editar
        </button>

        <div className="neo-card mb-4">
          <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
            {selectedMeal.meal_type}
          </span>
          {selectedMeal.photo && (
            <img src={selectedMeal.photo} alt={selectedMeal.name} className="w-full h-48 object-cover rounded-xl mt-3 shadow-[0_2px_8px_rgba(0,0,0,0.08)]" />
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl py-3 text-sm transition-all disabled:opacity-30 active:scale-[0.98]">Anterior</button>
            <button onClick={() => cookingStep < steps.length - 1 ? setCookingStep(cookingStep + 1) : null}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-[0_2px_8px_rgba(0,110,47,0.2)] active:scale-[0.98]">
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
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-3 transition-all shadow-[0_2px_8px_rgba(0,110,47,0.2)] active:scale-95">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {days.map(d => (
          <button key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === d ? 'bg-primary-600 text-white shadow-[0_2px_6px_rgba(0,110,47,0.25)]' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >
            {d}
          </button>
        ))}
      </div>

      {dayMeals.length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-300">restaurant_menu</span>
          <p className="text-gray-400 font-bold mt-2">Sin comidas para {selectedDay}</p>
          <button onClick={() => { setShowForm(true); setForm({ ...form, day: selectedDay }); generateSuggestion(); }} className="bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-2 px-4 text-sm transition-all shadow-[0_2px_8px_rgba(0,110,47,0.2)] active:scale-95 mt-3">
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
              <button onClick={(e) => { e.stopPropagation(); setEditing(meal.id); setForm({ name: meal.name, day: meal.day, meal_type: meal.meal_type, recipe: meal.recipe, ingredients: (meal.ingredients || []).join(', '), instructions: meal.instructions || '', photo: meal.photo }); setShowForm(true); }} className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-1.5 px-3 flex-1 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> Editar
              </button>
              <button onClick={(e) => { e.stopPropagation(); confirmDelete(meal.id); }} className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-1.5 px-3 flex-1 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 max-h-[85vh] overflow-y-auto shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold">{editing ? 'Editar Menú' : 'Nuevo Menú'}</h2>
              <div className="flex gap-1">
                <button onClick={generateSuggestion} className="text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-1.5 px-3 transition-all shadow-[0_2px_6px_rgba(0,110,47,0.2)] active:scale-95">
                  Sugerencia
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}
                  className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg py-1.5 px-3 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-sm align-text-bottom">{ocrLoading ? 'hourglass_top' : 'photo_camera'}</span> Foto
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleOcrPhoto} className="hidden" />
                {form.photo && <button type="button" onClick={() => setForm(prev => ({ ...prev, photo: '' }))} className="text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-1.5 px-3 transition-all active:scale-95">
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
                <button type="submit" className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-[0_2px_8px_rgba(0,110,47,0.2)] active:scale-[0.98]">{editing ? 'Guardar' : 'Agregar'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl py-3 text-sm transition-all active:scale-[0.98]">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div className="bg-primary-600 text-white font-bold text-sm px-5 py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,110,47,0.3)] whitespace-nowrap">
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
              <button onClick={cancelDelete} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl py-2.5 text-sm transition-all active:scale-[0.98]">Cancelar</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl py-2.5 text-sm transition-all shadow-[0_2px_6px_rgba(239,68,68,0.3)] active:scale-[0.98]">Aceptar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}