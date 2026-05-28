import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import RECIPE_DB from '../../data/recipeDb';

const recipesWithIds = RECIPE_DB.map((r, i) => ({
  ...r,
  id: `r${i}`,
  videoUrl: r.videoUrl || null,
}));

const ingredientCategories = {
  'Proteínas': [
    'Pollo', 'Ternera', 'Cerdo', 'Carne picada', 'Pavo', 'Jamón', 'Salchichas',
    'Salmón', 'Pescado blanco', 'Merluza', 'Atún en lata', 'Sardinas', 'Gambas',
    'Huevos',
  ],
  'Frutas y Verduras': [
    'Tomate', 'Cebolla', 'Ajo', 'Pimiento', 'Zanahoria', 'Calabacín', 'Berenjena', 'Calabaza',
    'Lechuga', 'Espinacas', 'Col', 'Judías verdes', 'Champiñones', 'Pepino', 'Brócoli',
    'Patatas', 'Aguacate',
    'Plátano', 'Manzana', 'Fresas', 'Limón', 'Naranja', 'Uvas', 'Pera', 'Melón', 'Sandía', 'Kiwi',
  ],
  'Lácteos': [
    'Leche', 'Yogur natural', 'Queso', 'Queso cheddar', 'Queso parmesano', 'Queso mozzarella',
    'Nata', 'Mantequilla', 'Crema agria', 'Requesón',
  ],
  'Hidratos': [
    'Arroz', 'Pasta', 'Macarrones', 'Espaguetis', 'Pan', 'Pan de hamburguesa', 'Pan rallado',
    'Tortillas de trigo', 'Tortillas de maíz', 'Harina', 'Avena', 'Granola',
    'Lentejas', 'Garbanzos', 'Alubias', 'Garrofón', 'Quinoa', 'Cuscús',
    'Maíz dulce',
  ],
  'Conservas': [
    'Tomate triturado', 'Tomate frito', 'Caldo de pollo', 'Caldo de verduras',
    'Aceitunas', 'Pimientos asados', 'Alcachofas en conserva',
  ],
  'Condimentos': [
    'Aceite de oliva', 'Sal', 'Pimienta', 'Vinagre', 'Mostaza', 'Ketchup', 'Mayonesa', 'Miel',
    'Perejil', 'Albahaca', 'Cilantro', 'Eneldo', 'Azafrán', 'Comino', 'Pimentón', 'Pimentón picante',
    'Orégano', 'Nuez moscada', 'Jengibre', 'Canela', 'Laurel', 'Tomillo', 'Romero', 'Curry',
    'Semillas de sésamo', 'Frutos secos', 'Mantequilla de cacahuete', 'Cacao',
  ],
};

const PANTRY_INGREDIENTS = Object.values(ingredientCategories).flat();

const categories = ['Todas', 'desayuno', 'almuerzo', 'comida', 'cena'];
const difficulties = ['Todas', 'Fácil', 'Media', 'Difícil'];

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const matchIngredients = (haveList, recipeIngredients) => {
  const lowerHave = haveList.map(n => normalize(n));
  const matched = recipeIngredients.filter(ing => {
    const lowerIng = normalize(ing);
    return lowerHave.some(h => h.includes(lowerIng) || lowerIng.includes(h));
  });
  return matched;
};

export default function RecipesPage() {
  const { t } = useTranslation();
  const [pantryItems, setPantryItems] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [searchIngredient, setSearchIngredient] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterDifficulty, setFilterDifficulty] = useState('Todas');
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(null);
  const [toast, setToast] = useState(null);
  const videoIdCache = useRef({});

  const openVideo = useCallback(async (recipe) => {
    if (loadingVideo) return;
    setLoadingVideo(recipe.id);

    let embedUrl = recipe.videoUrl;

    if (!embedUrl) {
      const cacheKey = recipe.id;
      if (videoIdCache.current[cacheKey]) {
        embedUrl = `https://www.youtube.com/embed/${videoIdCache.current[cacheKey]}`;
      } else {
        try {
          const res = await api.searchYoutube('receta ' + recipe.name);
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
    if (embedUrl) setShowVideoModal(embedUrl);
    else showToast(t('recipes.videoNoFound'));
  }, [loadingVideo]);

  useEffect(() => {
    loadPantry();
    setRecipes(recipesWithIds);
  }, []);

  useEffect(() => {
    if (!recipes.length) return;
    if (selectedIngredients.length === 0) {
      setResults([]);
      setSearched(false);
      return;
    }
    let filtered = [...recipes];
    if (filterCategory !== 'Todas') filtered = filtered.filter(r => r.category === filterCategory);
    if (filterDifficulty !== 'Todas') filtered = filtered.filter(r => r.difficulty === filterDifficulty);
    const scored = filtered.map(recipe => {
      const matched = matchIngredients(selectedIngredients, recipe.ingredients);
      const matchPercent = Math.round((matched.length / recipe.ingredients.length) * 100);
      return { ...recipe, matched, missing: recipe.ingredients.filter(i => !matched.includes(i)), matchPercent };
    }).filter(r => r.matchPercent > 0);
    scored.sort((a, b) => {
      if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
      return b.matched.length - a.matched.length;
    });
    setResults(scored);
    setSearched(true);
  }, [selectedIngredients, filterCategory, filterDifficulty, recipes]);

  const loadPantry = async () => {
    try {
      const items = await api.getPantry();
      if (items?.length) {
        const names = items.map(i => i.name).filter(Boolean);
        setPantryItems(names);
      }
    } catch (e) { console.error(e); }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const toggleIngredient = (ing) => {
    setSelectedIngredients(prev =>
      prev.includes(ing) ? prev.filter(i => i !== ing) : [...prev, ing]
    );
  };

  const addCustomIngredient = () => {
    const trimmed = customIngredient.trim();
    if (trimmed && !selectedIngredients.includes(trimmed)) {
      setSelectedIngredients(prev => [...prev, trimmed]);
      setCustomIngredient('');
    }
  };

  const removeIngredient = (ing) => {
    setSelectedIngredients(prev => prev.filter(i => i !== ing));
  };

  const clearAll = () => {
    setSelectedIngredients([]);
    setResults([]);
    setSearched(false);
    setFilterCategory('Todas');
    setFilterDifficulty('Todas');
  };

  const addToMealPlan = async (recipe) => {
    try {
      await api.addMeal({
        name: recipe.name,
        day: '',
        meal_type: recipe.category || 'comida',
        recipe: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        videoUrl: recipe.videoUrl || '',
      });
      showToast(t('common.addedToMealPlan'));
    } catch (e) {
      showToast(t('common.errorAdding') + e.message);
    }
  };

  const filteredSuggestions = searchIngredient
    ? Object.fromEntries(
        Object.entries(ingredientCategories).map(([cat, ings]) => [
          cat,
          ings.filter(ing => normalize(ing).includes(normalize(searchIngredient))),
        ]).filter(([, ings]) => ings.length > 0)
      )
    : ingredientCategories;

  if (selectedRecipe) {
    const steps = selectedRecipe.instructions.split('\n').filter(l => l.trim());
    return (
      <div>
        <button onClick={() => setSelectedRecipe(null)} className="neo-btn !bg-gray-100 dark:!text-black dark:!border-gray-400 !py-2 !px-3 !text-sm mb-4">
          <span className="material-symbols-outlined text-sm align-text-bottom">arrow_back</span> {t('common.back')}
        </button>

        <div className="neo-card mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{selectedRecipe.name}</h1>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-xs font-bold text-primary-600 uppercase bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200">
                  {selectedRecipe.category || 'comida'}
                </span>
                {selectedRecipe.time && (
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span> {selectedRecipe.time}
                  </span>
                )}
                {selectedRecipe.difficulty && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                    selectedRecipe.difficulty === 'Fácil' ? 'text-green-600 bg-green-50 border-green-200' :
                    selectedRecipe.difficulty === 'Media' ? 'text-orange-600 bg-orange-50 border-orange-200' :
                    'text-red-600 bg-red-50 border-red-200'
                  }`}>
                    <span className="material-symbols-outlined text-xs">fitness_center</span> {selectedRecipe.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase mb-2">{t('common.ingredients')}</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedRecipe.ingredients.map((ing, i) => {
                const isAvailable = selectedIngredients.some(si => normalize(si).includes(normalize(ing)) || normalize(ing).includes(normalize(si)));
                return (
                  <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                    isAvailable
                      ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                      : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-500'
                  }`}>
                    {isAvailable ? '✓ ' : ''}{ing}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="neo-card !bg-primary-50 !border-primary-200 mb-4">
          <p className="text-xs font-bold text-primary-700 uppercase mb-3">{t('common.instructions')}</p>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-extrabold">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 dark:text-gray-200 pt-0.5">{step.replace(/^\d+\.\s*/, '')}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => addToMealPlan(selectedRecipe)} className="neo-btn-primary w-full">
          <span className="material-symbols-outlined text-sm align-text-bottom">playlist_add</span> {t('common.addToMealPlan')}
        </button>

        <button onClick={() => openVideo(selectedRecipe)} className="neo-btn !bg-red-50 !text-red-600 !border-red-300 w-full mt-2" disabled={loadingVideo === selectedRecipe.id}>
            <span className="material-symbols-outlined text-sm align-text-bottom">play_circle</span> {loadingVideo === selectedRecipe.id ? t('recipes.searching') : t('common.watchVideo')}
        </button>

        {showVideoModal && (
          <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4" onClick={() => setShowVideoModal(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">play_circle</span> {t('common.video')}
                </h3>
                <button onClick={() => setShowVideoModal(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="aspect-video">
                <iframe
                  src={showVideoModal}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={t('common.video')}
                />
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
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('recipes.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('recipes.subtitle')}</p>
        </div>
      </div>

      {!showIngredientPicker && !searched && (
        <div className="text-center py-8">
          <div className="w-28 h-28 mx-auto rounded-3xl bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-300 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-5xl text-primary-500">restaurant_menu</span>
          </div>
          <h2 className="text-lg font-extrabold text-gray-700 dark:text-gray-200 mb-2">{t('recipes.whatInKitchen')}</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">{t('recipes.kitchenDesc')}</p>
          <button onClick={() => setShowIngredientPicker(true)} className="neo-btn-primary !py-3 !px-6">
            <span className="material-symbols-outlined align-text-bottom">kitchen</span> {t('recipes.chooseIngredients')}
          </button>
        </div>
      )}

      {showIngredientPicker && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setShowIngredientPicker(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg p-6 pb-14 border-t-2 border-black max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-extrabold">{t('recipes.chooseYourIngredients')}</h2>
              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-200">
                {selectedIngredients.length} {t('recipes.selected')}
              </span>
            </div>

            {selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedIngredients.map((ing, i) => (
                  <span key={i} className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 rounded-full px-3 py-1 font-medium flex items-center gap-1">
                    {ing}
                    <button onClick={() => removeIngredient(ing)} className="ml-0.5 hover:text-red-500">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-3">
              <input
                className="neo-input flex-1"
                placeholder={t('recipes.addIngredient')}
                value={customIngredient}
                onChange={e => setCustomIngredient(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustomIngredient()}
              />
              <button onClick={addCustomIngredient} className="neo-btn-primary !px-4">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>

            <input
              className="neo-input mb-3"
              placeholder={t('recipes.searchIngredient')}
              value={searchIngredient}
              onChange={e => setSearchIngredient(e.target.value)}
            />

            <div className="space-y-4 mb-4">
              {Object.entries(filteredSuggestions).map(([category, ings]) => (
                <div key={category}>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">
                      {category === 'Proteínas' ? 'egg' :
                       category === 'Frutas y Verduras' ? 'egg_alt' :
                       category === 'Lácteos' ? 'water_drop' :
                       category === 'Hidratos' ? 'bakery_dining' :
                       category === 'Conservas' ? 'inventory_2' : 'spa'}
                    </span> {category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ings.map((ing, i) => {
                      const isSelected = selectedIngredients.includes(ing);
                      const inPantry = pantryItems.some(p => normalize(p).includes(normalize(ing)) || normalize(ing).includes(normalize(p)));
                      return (
                        <button
                          key={i}
                          onClick={() => toggleIngredient(ing)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-700'
                              : inPantry
                                ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-primary-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{ing}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button onClick={() => setShowIngredientPicker(false)} className="neo-btn-primary flex-1">
                <span className="material-symbols-outlined text-sm align-text-bottom">check</span> {t('common.done')}
              </button>
              <button onClick={() => setShowIngredientPicker(false)} className="neo-btn !bg-gray-100 dark:!bg-gray-700 flex-1">
                {t('recipes.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {searched && (
        <>
          <div className="neo-card mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-500">
                {selectedIngredients.length} {t('recipes.selected')}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setShowIngredientPicker(true)} className="text-xs font-bold neo-btn !py-1 !px-2 !border-primary-300 text-primary-600">
                  <span className="material-symbols-outlined text-sm align-text-bottom">edit</span> {t('common.edit')}
                </button>
                <button onClick={clearAll} className="text-xs font-bold neo-btn !py-1 !px-2 !border-red-300 text-red-500">
                  <span className="material-symbols-outlined text-sm align-text-bottom">close</span> {t('common.delete')}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedIngredients.slice(0, 8).map((ing, i) => (
                <span key={i} className="text-xs bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 font-medium dark:text-white">{ing}</span>
              ))}
              {selectedIngredients.length > 8 && (
                <span className="text-xs text-gray-400 font-medium">+{selectedIngredients.length - 8}</span>
              )}
            </div>
          </div>

          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <select className="neo-input !py-2 !text-xs !px-3" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c === 'Todas' ? t('recipes.allMeals') : c}</option>)}
            </select>
            <select className="neo-input !py-2 !text-xs !px-3" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
              {difficulties.map(d => <option key={d} value={d}>{d === 'Todas' ? t('recipes.allDifficulties') : d}</option>)}
            </select>
          </div>

          {results.length === 0 && (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-gray-300">search_off</span>
              <p className="text-gray-400 font-bold mt-2">{t('recipes.noRecipesFound')}</p>
              <p className="text-gray-300 text-sm">{t('recipes.tryOther')}</p>
            </div>
          )}

          <div className="space-y-3">
            {results.map((recipe, i) => (
              <div key={recipe.id} className="neo-card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedRecipe(recipe)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-base">{recipe.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        recipe.matchPercent >= 70 ? 'bg-green-100 text-green-700 border border-green-300' :
                        recipe.matchPercent >= 40 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                        'bg-orange-100 text-orange-700 border border-orange-300'
                      }`}>
                        {recipe.matchPercent}%
                      </span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {recipe.time && <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">schedule</span> {recipe.time}
                      </span>}
                      {recipe.difficulty && <span className="text-xs text-gray-400">{recipe.difficulty}</span>}
                      <span className="text-xs text-gray-400 capitalize">{recipe.category || 'comida'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xs font-bold text-gray-500 mb-1">{t('common.ingredients')} ({recipe.matched.length}/{recipe.ingredients.length})</p>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.slice(0, 5).map((ing, j) => {
                      const has = recipe.matched.includes(ing);
                      return (
                        <span key={j} className={`text-xs px-2 py-0.5 rounded-lg border ${
                          has ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400' : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-700 dark:border-gray-600'
                        }`}>
                          {has ? '✓ ' : ''}{ing}
                        </span>
                      );
                    })}
                    {recipe.ingredients.length > 5 && (
                      <span className="text-xs text-gray-400 font-medium">+{recipe.ingredients.length - 5}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={(e) => { e.stopPropagation(); setSelectedRecipe(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1">
                    <span className="material-symbols-outlined text-sm align-text-bottom">visibility</span> {t('recipes.viewRecipe')}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); addToMealPlan(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 flex-1 !border-primary-300 text-primary-600">
                    <span className="material-symbols-outlined text-sm align-text-bottom">playlist_add</span> {t('common.addToMealPlan')}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); openVideo(recipe); }} className="text-xs font-bold neo-btn !py-1 !px-3 !bg-red-50 !text-red-600 !border-red-300" disabled={loadingVideo === recipe.id}>
                      <span className="material-symbols-outlined text-sm align-text-bottom">play_circle</span>
                    </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showVideoModal && (
        <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4" onClick={() => setShowVideoModal(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500">play_circle</span> {t('common.video')}
              </h3>
              <button onClick={() => setShowVideoModal(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={showVideoModal}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={t('common.video')}
              />
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
