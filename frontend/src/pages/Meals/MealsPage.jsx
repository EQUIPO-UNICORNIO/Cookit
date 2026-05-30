import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { translateIngredient } from '../../utils/ingredientTranslations';

const mealTypes = ['desayuno', 'almuerzo', 'comida', 'merienda', 'cena'];

const dayKeys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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
  const { t } = useTranslation();
  const [meals, setMeals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', day: '', meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '', videoUrl: '' });
  const [selectedDay, setSelectedDay] = useState(dayKeys[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [cookingStep, setCookingStep] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [fullPhoto, setFullPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showVideo, setShowVideo] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(null);
  const videoIdCache = useRef({});

  useEffect(() => { loadMeals(); }, []);

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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const openVideo = async (meal) => {
    if (loadingVideo) return;
    setLoadingVideo(meal.id);

    let embedUrl = meal.videoUrl;

    if (!embedUrl || embedUrl.includes('listType=search')) {
      const cacheKey = meal.id;
      if (videoIdCache.current[cacheKey]) {
        embedUrl = `https://www.youtube.com/embed/${videoIdCache.current[cacheKey]}`;
      } else {
        try {
          const res = await api.searchYoutube('receta ' + meal.name);
          if (res.videoId) {
            videoIdCache.current[cacheKey] = res.videoId;
            embedUrl = `https://www.youtube.com/embed/${res.videoId}`;
          }
        } catch (e) {
          console.error('YouTube search error', e);
        }
      }
    }

    setLoadingVideo(null);
    if (embedUrl && !embedUrl.includes('listType=search')) setShowVideo(embedUrl);
    else showToast(t('meals.videoNoFound'));
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
      setForm({ name: '', day: '', meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '', videoUrl: '' });
      loadMeals();
      showToast(t('common.savedToMealPlan'));
    } catch (e) { showToast(t('common.errorSaving') + ' ' + e.message); }
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

  const handleStepClick = (steps) => {
    if (cookingStep < steps.length - 1) {
      setCookingStep(cookingStep + 1);
    } else {
      showToast(t('meals.completedMeal'));
      setSelectedMeal(null);
      setCookingStep(0);
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
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> {t('meals.backToMeals')}
        </button>
        <button onClick={() => { const m = selectedMeal; setSelectedMeal(null); setEditing(m.id); setForm({ name: m.name, day: m.day, meal_type: m.meal_type, recipe: m.recipe, ingredients: (m.ingredients || []).join(', '), instructions: m.instructions || '', photo: m.photo, videoUrl: m.videoUrl || '' }); setShowForm(true); }} className="neo-btn !bg-primary-50 !text-primary-600 !border-primary-300 !py-2 !px-3 !text-sm mb-4 ml-2">
          <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> {t('common.edit')}
        </button>

        <div className="neo-card mb-4">
          <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
            {selectedMeal.meal_type}
          </span>
          {selectedMeal.photo && (
            <img src={selectedMeal.photo} alt={selectedMeal.name} className="w-full h-48 object-cover rounded-xl mt-3 border-2 border-black cursor-pointer" onClick={() => setFullPhoto(selectedMeal.photo)} />
          )}
          <h2 className="text-xl font-extrabold mt-2">{selectedMeal.name}</h2>
          {selectedMeal.day && <p className="text-xs text-gray-400 mt-0.5">{t('meals.day')}: {t('meals.days.' + selectedMeal.day.toLowerCase()) || selectedMeal.day}</p>}

          <button onClick={() => openVideo(selectedMeal)} className="neo-btn !bg-red-50 !text-red-600 !border-red-300 w-full mt-3" disabled={loadingVideo === selectedMeal.id}>
            <span className="material-symbols-outlined text-sm align-text-bottom">play_circle</span> {t('common.watchVideo')}
          </button>
          {selectedMeal.ingredients?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-1">{t('common.ingredients')}</p>
              <div className="flex flex-wrap gap-1">
                {selectedMeal.ingredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 font-medium dark:text-white">{translateIngredient(ing)}</span>
                ))}
              </div>
            </div>
          )}

        {steps.length > 0 && (
          <div className="neo-card !bg-primary-600 !text-white !border-primary-800 mb-3 mt-4">
            <span className="text-xs font-bold uppercase">{t('meals.step')} {cookingStep + 1} {t('meals.of')} {steps.length}</span>
            <p className="text-lg font-extrabold mt-1">{steps[cookingStep]}</p>
          </div>
        )}
        </div>

        {steps.length > 0 && (
          <div className="flex gap-2">
            <button onClick={() => setCookingStep(Math.max(0, cookingStep - 1))} disabled={cookingStep <= 0}
              className="neo-btn !bg-gray-100 flex-1 disabled:opacity-30">{t('meals.previous')}</button>
            <button onClick={() => handleStepClick(steps)}
              className="neo-btn-primary flex-1">
              {cookingStep >= steps.length - 1 ? t('meals.completed') : t('meals.next')}
            </button>
          </div>
        )}

        {steps.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-gray-300">info</span>
            <p className="text-gray-400 font-bold mt-2">{t('meals.noInstructions')}</p>
            <p className="text-gray-300 text-sm">{t('meals.noStepsDefined')}</p>
          </div>
        )}

        {showVideo && (
          <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center p-4" onClick={() => setShowVideo(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">play_circle</span> {t('common.video')}
                </h3>
                <button onClick={() => setShowVideo(null)} className="text-gray-500 hover:text-gray-700">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="aspect-video">
                <iframe src={showVideo} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={t('common.video')} />
              </div>
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
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('meals.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{meals.length} {t('meals.plannedMeals')}</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', day: selectedDay, meal_type: 'comida', recipe: '', ingredients: '', instructions: '', photo: '', videoUrl: '' }); }}
          className="neo-btn-primary !p-3 !rounded-xl">
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
          <button key="todas"
            onClick={() => setSelectedDay('todas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === 'todas' ? 'bg-primary-600 text-white neo-shadow-primary' : 'bg-white dark:bg-gray-300 border-2 border-black dark:text-black'}`}
          >
            {t('meals.allDays')}
          </button>
          {dayKeys.map(key => (
            <button key={key}
              onClick={() => setSelectedDay(key)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === key ? 'bg-primary-600 text-white neo-shadow-primary' : 'bg-white dark:bg-gray-300 border-2 border-black dark:text-black'}`}
            >
              {t('meals.days.' + key) || key}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 border-2 border-black flex-shrink-0">
          <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded-lg text-xs font-bold ${viewMode === 'list' ? 'bg-white text-primary-600 border-2 border-black' : 'text-gray-500'}`}>
            <span className="material-symbols-outlined text-sm align-text-bottom">list</span>
          </button>
          <button onClick={() => setViewMode('calendar')} className={`px-2 py-1 rounded-lg text-xs font-bold ${viewMode === 'calendar' ? 'bg-white text-primary-600 border-2 border-black' : 'text-gray-500'}`}>
            <span className="material-symbols-outlined text-sm align-text-bottom">calendar_view_week</span>
          </button>
        </div>
      </div>

      {viewMode === 'calendar' && (
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayKeys.map(day => {
            const dayMealsFiltered = meals.filter(m => !m.day || m.day === day);
            return (
              <div key={day} className="neo-card !p-2 min-h-[100px]">
                <p className="text-[10px] font-bold text-center uppercase text-gray-500 mb-1">{(t('meals.days.' + day) || day).slice(0, 3)}</p>
                <div className="space-y-1">
                  {dayMealsFiltered.slice(0, 3).map(m => (
                    <div key={m.id} className="text-[10px] bg-primary-50 border border-primary-200 rounded-md px-1 py-0.5 truncate font-medium cursor-pointer" onClick={() => setSelectedMeal(m)}>
                      {m.name}
                    </div>
                  ))}
                  {dayMealsFiltered.length > 3 && <p className="text-[10px] text-gray-400 text-center">+{dayMealsFiltered.length - 3}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dayMeals.length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-300">restaurant_menu</span>
          <p className="text-gray-400 font-bold mt-2">{t('meals.noMealsForDay')} {selectedDay === 'todas' ? t('meals.selectedDay') : (t('meals.days.' + selectedDay) || selectedDay)}</p>
        </div>
      )}

      <div className="space-y-3">
        {dayMeals.map(meal => (
          <div key={meal.id} className="neo-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedMeal(meal)}>
            <div className="flex gap-3 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1">
                <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                  {t('meals.types.' + meal.meal_type) || meal.meal_type}
                </span>
                {meal.day && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border-2
                    ${meal.meal_type === 'desayuno' ? 'bg-amber-100 text-amber-800 border-amber-400' : ''}
                    ${meal.meal_type === 'almuerzo' ? 'bg-green-100 text-green-800 border-green-400' : ''}
                    ${meal.meal_type === 'comida' ? 'bg-blue-100 text-blue-800 border-blue-400' : ''}
                    ${meal.meal_type === 'merienda' ? 'bg-purple-100 text-purple-800 border-purple-400' : ''}
                    ${meal.meal_type === 'cena' ? 'bg-indigo-100 text-indigo-800 border-indigo-400' : ''}
                    ${!['desayuno','almuerzo','comida','merienda','cena'].includes(meal.meal_type) ? 'bg-gray-800 text-white border-black' : ''}`}>
                    {t('meals.days.' + meal.day.toLowerCase()) || meal.day}
                  </span>
                )}
                </div>
                <h3 className="font-extrabold text-base mt-1 truncate">{meal.name}</h3>
                {meal.recipe && <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{t('common.recipe')}: {meal.recipe}</p>}
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meal.ingredients.slice(0, 3).map((ing, i) => (
                  <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-0.5 font-medium dark:text-white">{translateIngredient(ing)}</span>
                    ))}
                    {meal.ingredients.length > 3 && <span className="text-xs text-gray-400 dark:text-gray-400 font-medium">+{meal.ingredients.length - 3}</span>}
                  </div>
                )}
              </div>
              {meal.photo && (
                <div className="flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setFullPhoto(meal.photo); }}>
                  <img src={meal.photo} alt={meal.name} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
              <button onClick={(e) => { e.stopPropagation(); openVideo(meal); }} className="text-xs font-bold neo-btn !py-1 !px-3 !bg-red-50 !text-red-600 !border-red-300" disabled={loadingVideo === meal.id}>
                <span className="material-symbols-outlined text-sm align-text-bottom">play_circle</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setEditing(meal.id); setForm({ name: meal.name, day: meal.day, meal_type: meal.meal_type, recipe: meal.recipe, ingredients: (meal.ingredients || []).join(', '), instructions: meal.instructions || '', photo: meal.photo, videoUrl: meal.videoUrl || '' }); setShowForm(true); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-gray-300 text-gray-600">
                <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> {t('common.edit')}
              </button>
              <button onClick={(e) => { e.stopPropagation(); confirmDelete(meal.id); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-red-300 text-red-500">
                <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold">{editing ? t('meals.editMenu') : t('meals.newMenu')}</h2>
              <div className="flex gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={ocrLoading}
                  className="text-xs font-bold neo-btn !py-1 !px-3 !border-secondary-300 text-secondary-600">
                  <span className="material-symbols-outlined text-sm align-text-bottom">{ocrLoading ? 'hourglass_top' : 'photo_camera'}</span> {t('common.photo')}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleOcrPhoto} className="hidden" />
                {form.photo && <button type="button" onClick={() => setForm(prev => ({ ...prev, photo: '' }))} className="text-xs font-bold neo-btn !py-1 !px-3 !border-red-300 text-red-500">
                  <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> {t('common.photo')}
                </button>}
              </div>
            </div>
            {ocrLoading && <p className="text-xs text-primary-600 font-medium mb-2">{t('meals.readingImage')}</p>}
            {form.photo && <img src={form.photo} alt="Preview" className="w-full h-20 object-cover rounded-xl mb-3 border-2 border-primary-300" />}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="neo-input" placeholder={t('meals.dishName')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
              <div className="flex gap-2">
                <select className="neo-input flex-1" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                  <option value="">{t('meals.noDay')}</option>
                  {dayKeys.map(key => <option key={key} value={key}>{t('meals.days.' + key) || key}</option>)}
                </select>
                <select className="neo-input flex-1" value={form.meal_type} onChange={e => setForm({...form, meal_type: e.target.value})}>
                  {mealTypes.map(m => <option key={m} value={m}>{t('meals.types.' + m) || m}</option>)}
                </select>
              </div>
              <input className="neo-input" placeholder={t('meals.ingredientsPlaceholder')} value={form.ingredients} onChange={e => setForm({...form, ingredients: e.target.value})} />
              <textarea className="neo-input min-h-[80px]" placeholder={t('meals.instructionsPlaceholder')} value={form.instructions} onChange={e => setForm({...form, instructions: e.target.value})} />
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <button type="submit" className="neo-btn-primary flex-1">{editing ? t('common.save') : t('common.add')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
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
            <h3 className="font-extrabold text-base text-gray-900 text-center mb-1">{t('meals.deleteMenu')}</h3>
            <p className="text-sm text-gray-500 text-center mb-5">{t('common.cannotUndo')}</p>
            <div className="flex gap-2">
              <button onClick={cancelDelete} className="neo-btn !bg-gray-100 flex-1">{t('common.cancel')}</button>
              <button onClick={() => handleDelete(confirmDeleteId)} className="neo-btn !bg-red-500 !text-white flex-1">{t('common.accept')}</button>
            </div>
          </div>
        </div>
      )}

      {fullPhoto && (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center" onClick={() => setFullPhoto(null)}>
          <img src={fullPhoto} alt="Foto completa" className="relative max-w-[95vw] max-h-[95vh] object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {showVideo && (
        <div className="fixed inset-0 bg-black/70 z-[90] flex items-center justify-center p-4" onClick={() => setShowVideo(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">play_circle</span> {t('common.video')}
              </h3>
              <button onClick={() => setShowVideo(null)} className="text-gray-500 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="aspect-video">
              <iframe src={showVideo} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={t('common.video')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}