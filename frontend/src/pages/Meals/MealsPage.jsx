import { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { translateIngredient } from '../../utils/ingredientTranslations';
import { autoCategorize } from '../../utils/categories';
import RECIPE_DB from '../../data/recipeDb';

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

const recipeLookup = Object.fromEntries(
  RECIPE_DB.map(r => [r.name, { difficulty: r.difficulty, time: r.time }])
);

function getRecipeMeta(name) {
  return recipeLookup[name] || {};
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
  const [mealVideoUrl, setMealVideoUrl] = useState(null);
  const [videoSteps, setVideoSteps] = useState(null);
  const [completedMeals, setCompletedMeals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cookit_completed_meals') || '[]').map(id => String(id)); } catch { return []; }
  });
  const [pantry, setPantry] = useState([]);
  const [mealThumbs, setMealThumbs] = useState({});
  const videoIdCache = useRef({});

  useEffect(() => { loadMeals(); loadPantry(); }, []);

  useEffect(() => {
    if (meals.length === 0) return;
    const results = {};
    Promise.all(meals.map(meal =>
      api.searchYoutube('receta ' + meal.name)
        .then(res => { if (res.videoId) { videoIdCache.current[meal.id] = res.videoId; results[meal.id] = res.videoId; } })
        .catch(() => {})
    )).then(() => setMealThumbs(results));
  }, [meals]);

  useEffect(() => {
    if (!selectedMeal) { setMealVideoUrl(null); setVideoSteps(null); return; }
    const cacheKey = selectedMeal.id;
    if (videoIdCache.current[cacheKey]) {
      setMealVideoUrl(`https://www.youtube.com/embed/${videoIdCache.current[cacheKey]}`);
      return;
    }
    api.searchYoutube('receta ' + selectedMeal.name).then(async (res) => {
      if (res.videoId) {
        videoIdCache.current[cacheKey] = res.videoId;
        setMealVideoUrl(`https://www.youtube.com/embed/${res.videoId}`);
        const details = await api.getYoutubeDetails(res.videoId).catch(() => ({ description: '' }));
        if (details.description) {
          const steps = details.description.split('\n').filter(l => /^\d+[\.\)]/.test(l.trim()));
          if (steps.length >= 2) setVideoSteps(steps.map(s => s.replace(/^\d+[\.\)]\s*/, '').trim()).filter(Boolean));
        }
      }
    }).catch(() => {});
  }, [selectedMeal]);

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

  const loadPantry = async () => {
    try { const data = await api.getPantry(); setPantry(data.map(i => i.name)); } catch {}
  };

  const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordMatch = (a, b) => {
    if (new RegExp(`\\b${escapeRegex(a)}\\b`).test(b)) return true;
    if (new RegExp(`\\b${escapeRegex(b)}\\b`).test(a)) return true;
    const stripS = (s) => s.replace(/s$/, '');
    const aS = stripS(a), bS = stripS(b);
    if (aS !== a && new RegExp(`\\b${escapeRegex(aS)}\\b`).test(b)) return true;
    if (bS !== b && new RegExp(`\\b${escapeRegex(bS)}\\b`).test(a)) return true;
    if (aS !== a && bS !== b && new RegExp(`\\b${escapeRegex(aS)}\\b`).test(bS)) return true;
    return false;
  };
  const matchIngredients = (haveList, recipeIngredients) => {
    const lowerHave = haveList.map(n => normalize(n));
    return recipeIngredients.filter(ing => {
      const lowerIng = normalize(ing);
      return lowerHave.some(h => wordMatch(h, lowerIng));
    });
  };

  const matchPercent = (ingredients) => {
    if (!ingredients?.length) return 0;
    const matched = matchIngredients(pantry, ingredients);
    return Math.round((matched.length / ingredients.length) * 100);
  };

  const addToShopping = async (ingredients, mealName) => {
    const toAdd = ingredients.filter(ing => matchIngredients(pantry, [ing]).length === 0);
    if (toAdd.length === 0) return;
    for (const name of toAdd) {
      try { await api.addShoppingItem({ name, category: autoCategorize(name), quantity: '1', unit: 'unidad' }); } catch {}
    }
    showToast(t('recipes.addedToShopping'));
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
      const id = String(selectedMeal.id);
      if (!isCompleted(id)) {
        const updated = [...completedMeals, id];
        setCompletedMeals(updated);
        localStorage.setItem('cookit_completed_meals', JSON.stringify(updated));
      }
      showToast(t('meals.completedMeal'));
      setSelectedMeal(null);
      setCookingStep(0);
    }
  };

  const parseInstructions = (text) => text?.split('\n').filter(l => l.trim()) || [];

  const isCompleted = (id) => completedMeals.some(cid => String(cid) === String(id));
  const completedDayMeals = meals.filter(m => isCompleted(m.id));
  const dayMeals = selectedDay === 'completed'
    ? completedDayMeals
    : (selectedDay === 'todas'
      ? meals
      : meals.filter(m => !m.day || m.day === selectedDay)).filter(m => !isCompleted(m.id));
  if (selectedMeal) {
    const steps = videoSteps || parseInstructions(selectedMeal.instructions);
    return (
      <div>
        <button onClick={() => { setSelectedMeal(null); setCookingStep(0); }} className="neo-btn !bg-gray-100 dark:!text-black dark:!border-gray-400 !py-2 !px-3 !text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> {t('meals.backToMeals')}
        </button>
        <button onClick={() => { const m = selectedMeal; setSelectedMeal(null); setEditing(m.id); setForm({ name: m.name, day: m.day, meal_type: m.meal_type, recipe: m.recipe, ingredients: (m.ingredients || []).join(', '), instructions: m.instructions || '', photo: m.photo, videoUrl: m.videoUrl || '' }); setShowForm(true); }} className="neo-btn !bg-primary-50 !text-primary-600 !border-primary-300 !py-2 !px-3 !text-sm mb-4 ml-2">
          <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> {t('common.edit')}
        </button>
        {!isCompleted(selectedMeal.id) && (
          <button onClick={() => { const updated = [...completedMeals, String(selectedMeal.id)]; setCompletedMeals(updated); localStorage.setItem('cookit_completed_meals', JSON.stringify(updated)); showToast(t('meals.completedMeal')); setSelectedMeal(null); }} className="neo-btn !bg-green-50 !text-green-700 !border-green-300 !py-2 !px-3 !text-sm mb-4 ml-2">
            <span className="material-symbols-outlined text-sm align-text-bottom">check_circle</span> {t('meals.completed')}
          </button>
        )}

        <div className="neo-card mb-4">
          <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
            {selectedMeal.meal_type}
          </span>
          {selectedMeal.photo && (
            <img src={selectedMeal.photo} alt={selectedMeal.name} className="w-full h-48 object-cover rounded-xl mt-3 border-2 border-black cursor-pointer" onClick={() => setFullPhoto(selectedMeal.photo)} />
          )}
          <h2 className="text-xl font-extrabold mt-2">{selectedMeal.name}</h2>
          {(() => { const meta = getRecipeMeta(selectedMeal.name); if (!meta.difficulty && !meta.time) return null; return (
            <div className="flex gap-2 mt-1">
              {meta.difficulty && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                  meta.difficulty === 'Fácil' ? 'text-green-600 bg-green-50 border-green-200' :
                  meta.difficulty === 'Media' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                  'text-red-600 bg-red-50 border-red-200'
                }`}>
                  <span className="material-symbols-outlined text-xs">fitness_center</span> {meta.difficulty}
                </span>
              )}
              {meta.time && (
                <span className="text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">schedule</span> {meta.time}
                </span>
              )}
            </div>
          ); })()}
          {selectedMeal.day && <p className="text-xs text-gray-400 mt-1">{t('meals.day')}: {t('meals.days.' + selectedMeal.day.toLowerCase()) || selectedMeal.day}</p>}

          {selectedMeal.ingredients?.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">{t('common.ingredients')} ({matchIngredients(pantry, selectedMeal.ingredients).length}/{selectedMeal.ingredients.length})</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  matchPercent(selectedMeal.ingredients) >= 70 ? 'bg-green-100 text-green-700 border border-green-300' :
                  matchPercent(selectedMeal.ingredients) >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                  'bg-orange-100 text-orange-700 border border-orange-300'
                }`}>{matchPercent(selectedMeal.ingredients)}%</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedMeal.ingredients.map((ing, i) => {
                  const has = matchIngredients(pantry, [ing]).length > 0;
                  return (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                      has ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                    }`}>
                      {has ? '✓ ' : ''}{translateIngredient(ing)}
                    </span>
                  );
                })}
              </div>
              <button onClick={() => addToShopping(selectedMeal.ingredients, selectedMeal.name)}
                className="mt-2 w-full text-xs font-bold neo-btn !py-1.5 !px-3 !bg-blue-50 !text-blue-600 !border-blue-300 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">shopping_cart</span> {t('common.addToShopping')}
              </button>
            </div>
          )}

        {steps.length > 0 && (
          <div className="mb-3 mt-4">
            {mealVideoUrl && (
              <div className="aspect-video rounded-xl overflow-hidden border-2 border-black mb-3">
                <iframe src={mealVideoUrl} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={t('common.video')} />
              </div>
            )}
            <div className="neo-card !bg-primary-600 !text-white !border-primary-800">
              <span className="text-xs font-bold uppercase">{t('meals.step')} {cookingStep + 1} {t('meals.of')} {steps.length}</span>
              <p className="text-lg font-extrabold mt-1">{steps[cookingStep]}</p>
            </div>
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
          <button key="completed"
            onClick={() => setSelectedDay('completed')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedDay === 'completed' ? 'bg-green-700 text-white neo-shadow-primary' : 'bg-white dark:bg-gray-300 border-2 border-green-400 text-green-700 dark:text-green-600'}`}
          >
            <span className="material-symbols-outlined text-xs align-text-bottom">check_circle</span> {t('meals.completed')}
          </button>
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
        <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
          {dayKeys.map(day => {
            const dayMealsFiltered = meals.filter(m => (!m.day || m.day === day) && !isCompleted(m.id));
            return (
              <div key={day} className="neo-card !p-2 min-h-[120px] min-w-[130px] flex-shrink-0">
                <p className="text-xs font-bold text-center uppercase text-gray-500 mb-1">{(t('meals.days.' + day) || day).slice(0, 3)}</p>
                <div className="space-y-1">
                  {dayMealsFiltered.slice(0, 4).map(m => (
                    <div key={m.id} className="text-xs rounded-md px-1.5 py-0.5 truncate font-medium cursor-pointer bg-primary-50 border border-primary-200" onClick={() => setSelectedMeal(m)}>
                      {m.name}
                    </div>
                  ))}
                  {dayMealsFiltered.length > 4 && <p className="text-xs text-gray-400 text-center">+{dayMealsFiltered.length - 4}</p>}
                </div>
              </div>
            );
          })}
          <div className="neo-card !p-2 min-h-[120px] min-w-[130px] flex-shrink-0 !bg-green-50 !border-green-300">
            <p className="text-xs font-bold text-center uppercase text-green-700 mb-1">{t('meals.completed')}</p>
            <div className="space-y-1">
              {completedDayMeals.slice(0, 4).map(m => (
                <div key={m.id} className="text-xs rounded-md px-1.5 py-0.5 truncate font-medium cursor-pointer bg-green-100 border border-green-300 line-through text-green-700" onClick={() => setSelectedMeal(m)}>
                  <span className="material-symbols-outlined text-[10px] align-text-bottom">check_circle</span> {m.name}
                </div>
              ))}
              {completedDayMeals.length > 4 && <p className="text-xs text-green-400 text-center">+{completedDayMeals.length - 4}</p>}
              {completedDayMeals.length === 0 && <p className="text-xs text-green-400 text-center italic">-</p>}
            </div>
          </div>
        </div>
      )}

      {dayMeals.length === 0 && (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-gray-300">restaurant_menu</span>
          <p className="text-gray-400 font-bold mt-2">{selectedDay === 'completed' ? t('meals.noCompleted') : (t('meals.noMealsForDay') + ' ' + (selectedDay === 'todas' ? t('meals.selectedDay') : (t('meals.days.' + selectedDay) || selectedDay)))}</p>
        </div>
      )}

      <div className="space-y-3">
        {dayMeals.map(meal => (
          <div key={meal.id} className={`neo-card cursor-pointer hover:shadow-lg transition-shadow ${selectedDay === 'completed' ? '!bg-green-50 !border-green-300' : ''}`} onClick={() => setSelectedMeal(meal)}>
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
                <h3 className={`font-extrabold text-base mt-1 truncate ${selectedDay === 'completed' ? 'line-through text-green-700' : ''}`}>{meal.name}</h3>
                {(() => { const meta = getRecipeMeta(meal.name); if (!meta.difficulty && !meta.time) return null; return (
                  <div className="flex gap-2 mt-0.5">
                    {meta.difficulty && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg border flex items-center gap-0.5 ${
                        meta.difficulty === 'Fácil' ? 'text-green-600 bg-green-50 border-green-200' :
                        meta.difficulty === 'Media' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                        'text-red-600 bg-red-50 border-red-200'
                      }`}>
                        <span className="material-symbols-outlined text-xs">fitness_center</span> {meta.difficulty}
                      </span>
                    )}
                    {meta.time && (
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">schedule</span> {meta.time}
                      </span>
                    )}
                  </div>
                ); })()}
                {isCompleted(meal.id) && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-100 border border-green-400 px-1.5 py-0.5 rounded-lg inline-flex items-center gap-0.5 mt-0.5">
                    <span className="material-symbols-outlined text-xs">check_circle</span> {t('meals.completed')}
                  </span>
                )}
                {meal.recipe && <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">{t('common.recipe')}: {meal.recipe}</p>}
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {meal.ingredients.slice(0, 3).map((ing, i) => {
                      const has = matchIngredients(pantry, [ing]).length > 0;
                      return (
                        <span key={i} className={`text-xs px-2 py-0.5 rounded-lg border font-medium ${
                          has ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                        }`}>
                          {has ? '✓ ' : ''}{translateIngredient(ing)}
                        </span>
                      );
                    })}
                    {meal.ingredients.length > 3 && <span className="text-xs text-gray-400 dark:text-gray-400 font-medium">+{meal.ingredients.length - 3}</span>}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-auto ${
                      matchPercent(meal.ingredients) >= 70 ? 'bg-green-100 text-green-700 border border-green-300' :
                      matchPercent(meal.ingredients) >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                      'bg-orange-100 text-orange-700 border border-orange-300'
                    }`}>{matchPercent(meal.ingredients)}%</span>
                  </div>
                )}
              </div>
              {(meal.photo || mealThumbs[meal.id]) && (
                <div className="flex-shrink-0 flex flex-col gap-1">
                  {meal.photo && (
                    <div className="cursor-pointer" onClick={(e) => { e.stopPropagation(); setFullPhoto(meal.photo); }}>
                      <img src={meal.photo} alt={meal.name} className="w-16 h-16 object-cover rounded-xl border border-gray-200" />
                    </div>
                  )}
                  {mealThumbs[meal.id] && (
                    <img src={`https://img.youtube.com/vi/${mealThumbs[meal.id]}/default.jpg`} alt="" className="w-16 h-12 object-cover rounded-lg border border-gray-200" />
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
              <button onClick={(e) => { e.stopPropagation(); setEditing(meal.id); setForm({ name: meal.name, day: meal.day, meal_type: meal.meal_type, recipe: meal.recipe, ingredients: (meal.ingredients || []).join(', '), instructions: meal.instructions || '', photo: meal.photo, videoUrl: meal.videoUrl || '' }); setShowForm(true); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-gray-300 text-gray-600">
                <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> {t('common.edit')}
              </button>
              <button onClick={(e) => { e.stopPropagation(); confirmDelete(meal.id); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-red-300 text-red-500">
                <span className="material-symbols-outlined text-sm align-text-bottom">delete</span> {t('common.delete')}
              </button>
              <button onClick={(e) => { e.stopPropagation(); openVideo(meal); }} className="text-xs font-bold neo-btn !py-1 !px-2.5 ml-auto !bg-red-50 !text-red-600 !border-red-300" disabled={loadingVideo === meal.id}>
                <span className="material-symbols-outlined text-sm align-text-bottom">play_circle</span>
              </button>
              <button onClick={async (e) => {
                e.stopPropagation();
                let videoUrl = meal.videoUrl || '';
                if (!videoUrl) {
                  try {
                    const res = await api.searchYoutube('receta ' + meal.name);
                    if (res.videoId) videoUrl = `https://www.youtube.com/embed/${res.videoId}`;
                  } catch {}
                }
                try { await api.createPost({ content: meal.name, photo: '', ingredients: meal.ingredients || [], instructions: meal.instructions || '', video_url: videoUrl }); showToast(t('community.postEdited')); } catch { showToast(t('community.errorPublish')); }
              }} className="text-xs font-bold neo-btn !py-1 !px-2.5 !bg-purple-50 !text-purple-700 !border-purple-300">
                <span className="material-symbols-outlined text-sm align-text-bottom">group_add</span>
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