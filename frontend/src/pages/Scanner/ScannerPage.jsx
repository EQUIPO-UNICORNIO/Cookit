import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { createWorker } from 'tesseract.js';

const units = ['unidad', 'kg', 'g', 'L', 'ml', 'paquete', 'lata', 'botella', 'cucharada', 'taza'];
const categoryOptions = ['proteina', 'carbohidrato', 'verdura', 'fruta', 'lacteo', 'grasa', 'otro'];

const SUGGESTED_MEALS = [
  { name: 'Pollo al horno con verduras', recipe: 'Pollo al horno', ingredients: ['Pollo', 'Verduras', 'Aceite de oliva', 'Sal', 'Pimienta'], instructions: '1. Precalienta el horno a 200°C.\n2. Sazona el pollo con sal y pimienta.\n3. Corta las verduras en trozos.\n4. Coloca todo en una bandeja y hornea 45 min.' },
  { name: 'Ensalada César', recipe: 'Ensalada César', ingredients: ['Lechuga', 'Pollo', 'Crutones', 'Queso parmesano', 'Aderezo César'], instructions: '1. Cocina el pollo a la plancha.\n2. Corta la lechuga en trozos.\n3. Mezcla todos los ingredientes.\n4. Añade el aderezo y sirve.' },
  { name: 'Tacos de pescado', recipe: 'Tacos', ingredients: ['Pescado', 'Tortillas', 'Repollo', 'Crema', 'Limón'], instructions: '1. Cocina el pescado en sartén.\n2. Calienta las tortillas.\n3. Monta los tacos con repollo y crema.\n4. Exprime limón al gusto.' },
  { name: 'Smoothie verde', recipe: 'Smoothie', ingredients: ['Espinaca', 'Plátano', 'Manzana', 'Jengibre'], instructions: '1. Lava todos los ingredientes.\n2. Corta en trozos.\n3. Licúa todo hasta obtener textura suave.\n4. Sirve frío.' },
  { name: 'Omelette de claras', recipe: 'Omelette', ingredients: ['Claras de huevo', 'Espinaca', 'Tomate', 'Queso'], instructions: '1. Bate las claras.\n2. Saltea espinaca y tomate.\n3. Vierte las claras en sartén.\n4. Añade el relleno y dobla.' },
  { name: 'Pasta primavera', recipe: 'Pasta', ingredients: ['Pasta', 'Calabacín', 'Berenjena', 'Tomate', 'Albahaca'], instructions: '1. Cocina la pasta al dente.\n2. Saltea las verduras en aceite.\n3. Mezcla la pasta con las verduras.\n4. Sirve con albahaca fresca.' },
  { name: 'Arroz con pollo', recipe: 'Arroz con pollo', ingredients: ['Arroz', 'Pollo', 'Ajo', 'Cebolla', 'Pimiento'], instructions: '1. Dora el pollo en una olla.\n2. Agrega cebolla y ajo picados.\n3. Añade el arroz y caldo.\n4. Cocina 20 min y sirve.' },
  { name: 'Hamburguesa casera', recipe: 'Hamburguesa', ingredients: ['Carne molida', 'Pan de hamburguesa', 'Lechuga', 'Tomate', 'Queso'], instructions: '1. Forma las hamburguesas con la carne.\n2. Cocina a la plancha 4 min por lado.\n3. Tuesta el pan.\n4. Monta con lechuga, tomate y queso.' },
  { name: 'Ensalada de frutas', recipe: 'Ensalada de frutas', ingredients: ['Manzana', 'Plátano', 'Naranja', 'Fresa', 'Uva'], instructions: '1. Lava todas las frutas.\n2. Corta en trozos pequeños.\n3. Mezcla en un bol.\n4. Sirve frío.' },
  { name: 'Sopa de verduras', recipe: 'Sopa de verduras', ingredients: ['Zanahoria', 'Apio', 'Cebolla', 'Papa', 'Caldo de verduras'], instructions: '1. Corta todas las verduras en cubos.\n2. Sofríe la cebolla.\n3. Agrega el resto de verduras y caldo.\n4. Cocina 30 min y sirve caliente.' },
];

const matchIngredients = (itemNames, mealIngredients) => {
  const lowerItems = itemNames.map(n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  return mealIngredients.filter(ing => {
    const lowerIng = ing.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lowerItems.some(item => item.includes(lowerIng) || lowerIng.includes(item));
  });
};

const looksLikeTicket = (text) => {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return false;
  let priceLines = 0;
  let shortLines = 0;
  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ').trim();
    if (clean.match(/[\d.,]+\s*[€Ee]?\s*$/)) priceLines++;
    if (clean.length < 3) shortLines++;
  }
  return priceLines >= 2 && shortLines < lines.length * 0.5;
};

const isGarbage = (text) => {
  const cleanLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (cleanLines.length === 0) return true;
  const shortCount = cleanLines.filter(l => l.length < 3).length;
  const noVowelCount = cleanLines.filter(l => !/[aeiouáéíóú]/i.test(l)).length;
  return shortCount > cleanLines.length * 0.3 || noVowelCount > cleanLines.length * 0.5;
};

const parseTicketText = (text) => {
  const lines = text.split('\n').filter(l => l.trim());
  const items = [];
  const seen = new Set();

  for (const line of lines) {
    const clean = line.replace(/\s+/g, ' ').trim();
    const priceMatch = clean.match(/([\d.,]+)\s*[€Ee]?\s*$/);
    if (!priceMatch) continue;
    const rawPrice = priceMatch[1].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(rawPrice);
    if (isNaN(price) || price <= 0 || price > 9999) continue;
    let name = clean.substring(0, clean.indexOf(priceMatch[0])).trim();
    if (!name || name.length < 2) continue;
    name = name.replace(/^\d+\s*/, '');
    name = name.replace(/\s*\*+\s*$/, '').trim();
    if (!name || name.length < 2) continue;
    const lower = name.toLowerCase();
    if (['total', 'subtotal', 'iva', 'base', 'efectivo', 'tarjeta', 'cambio', 'gracias', 'ticket',
      'factura', 'nif', 'cif', 'cliente', 'importe', 'descuento', 'redondo', '€'].some(
      w => lower.includes(w))) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    let quantity = '1';
    let unit = 'unidad';
    const qtyMatch = name.match(/[xX]\s*([\d.,]+)\s*(kg|g|l|ml|ud|unidad|unidades|paq|pack|lata|botella|bolsa|pieza|tarro)?$/i);
    if (qtyMatch) {
      quantity = qtyMatch[1].replace(',', '.');
      name = name.substring(0, name.indexOf(qtyMatch[0])).trim();
      if (qtyMatch[2]) unit = qtyMatch[2].toLowerCase();
    } else {
      const unitMatch = name.match(/([\d.,]+)\s*(kg|g|l|ml|ud|unidad|unidades|paq|pack|lata|botella|bolsa|pieza|tarro)$/i);
      if (unitMatch) {
        quantity = unitMatch[1].replace(',', '.');
        unit = unitMatch[2].toLowerCase();
        name = name.substring(0, name.indexOf(unitMatch[0])).trim();
      }
    }
    if (name && name.length >= 2) {
      items.push({ name, quantity, unit, price });
    }
  }
  return items.slice(0, 50);
};

export default function ScannerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('initial');
  const [parsedItems, setParsedItems] = useState([]);
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step === 'camera' && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = streamRef.current;
      video.onloadedmetadata = () => video.play().catch(() => {});
      if (video.readyState >= 1) video.play().catch(() => {});
    }
  }, [step]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      }
      streamRef.current = stream;
      setStep('camera');
    } catch (e) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Permiso denegado. Para escanear necesitas permitir el acceso a la cámara. Cámbialo en los ajustes de tu navegador o en los permisos del sitio.');
      } else if (e.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setError('No se pudo abrir la cámara. En móvil, accede desde una conexión HTTPS.');
      }
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    stopCamera();
    processImage(canvas);
  }, [stopCamera]);

  const preprocessForOcr = (canvas) => {
    const src = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const data = src.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
      const contrast = ((gray - 128) * 1.5) + 128;
      const threshold = contrast > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = threshold;
    }
    const out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    out.getContext('2d').putImageData(src, 0, 0);
    return out;
  };

  const processImage = async (canvas) => {
    setProcessing(true);
    setOcrProgress('');
    setError('');
    try {
      const processed = preprocessForOcr(canvas);
      let ocrTimedOut = false;
      const worker = await createWorker('spa', 1, {
        logger: m => {
          if (m.status && !ocrTimedOut) setOcrProgress(m.status + (m.progress ? ` ${Math.round(m.progress * 100)}%` : ''));
        },
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => { ocrTimedOut = true; reject(new Error('timeout')); }, 30000)
      );
      const ocrPromise = worker.recognize(processed).then(({ data }) => {
        worker.terminate();
        return data.text.trim();
      }).catch(() => {
        worker.terminate();
        return '';
      });
      const textResult = await Promise.race([ocrPromise, timeoutPromise]).catch(() => '');
      setRawText(textResult);

      if (!textResult || isGarbage(textResult)) {
        setError(!textResult
          ? 'No se pudo leer ningún texto. Asegúrate de que el ticket esté bien iluminado y enfocado.'
          : 'No se encontró texto legible en la imagen.');
        setStep('initial');
        return;
      }

      const lines = textResult.split('\n').filter(l => {
        const t = l.trim();
        return t.length > 2 && /[aeiouáéíóú]/i.test(t) && !/^[A-Z0-9\s]{1,4}$/.test(t);
      });

      let items = parseTicketText(textResult);
      if (items.length === 0 && lines.length > 0) {
        items = lines.map(l => ({ name: l.trim(), quantity: '1', unit: 'unidad', category: 'otro' })).slice(0, 50);
      } else if (items.length === 0) {
        items = [{ name: textResult.slice(0, 50), quantity: '1', unit: 'unidad', category: 'otro' }];
      }
      items = items.map(i => ({ ...i, category: categoryOptions.includes(i.category) ? i.category : 'otro' }));
      setParsedItems(items);
      setStep('review');
      findRecommendations(items);
    } catch (e) {
      setError('Error al procesar la imagen: ' + e.message);
      setStep('initial');
    }
    setProcessing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(img.width, 1280);
      canvas.height = Math.min(img.height, 1280);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      processImage(canvas);
    };
    img.onerror = () => setError('Error al cargar la imagen');
    e.target.value = '';
  };

  const findRecommendations = async (items) => {
    setLoadingRecommendations(true);
    const itemNames = items.map(i => i.name).filter(Boolean);
    if (itemNames.length === 0) { setLoadingRecommendations(false); return; }
    try {
      const allMeals = (await api.getMeals()) || [];
      const scored = [];
      const seen = new Set();
      for (const meal of [...allMeals, ...SUGGESTED_MEALS]) {
        if (seen.has(meal.name)) continue;
        seen.add(meal.name);
        const ingList = meal.ingredients || [];
        if (ingList.length === 0) continue;
        const matched = matchIngredients(itemNames, ingList);
        const score = matched.length;
        if (score > 0) {
          scored.push({ ...meal, matched, matchCount: score, totalIngredients: ingList.length });
        }
      }
      scored.sort((a, b) => b.matchCount / b.totalIngredients - a.matchCount / a.totalIngredients);
      setRecommendations(scored.slice(0, 5));
    } catch { }
    setLoadingRecommendations(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.saveMerged(parsedItems.filter(i => i.name.trim()));
      setSuccessCount(result.count);
      setStep('success');
    } catch (e) {
      setError(e.message);
    }
    setSaving(false);
  };

  const resetAll = () => {
    stopCamera();
    setStep('initial');
    setParsedItems([]);
    setRawText('');
    setError('');
    setSuccessCount(0);
    setOcrProgress('');
    setRecommendations([]);
  };

  const updateItem = (index, field, value) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setParsedItems(prev => [...prev, { name: '', quantity: '1', unit: 'unidad', category: 'otro' }]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Escaner de Tickets</h1>
          <p className="text-sm text-gray-500 font-medium">Sube o captura tu ticket de compra</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-3 mb-4 relative">
          <p className="text-red-700 text-sm font-bold">{error}</p>
          <button onClick={() => setError('')} className="absolute top-2 right-2 text-red-400">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {step === 'initial' && (
        <div className="text-center pt-4">
          <div className="w-36 h-36 mx-auto rounded-3xl border-4 border-dashed border-gray-300 flex items-center justify-center mb-5">
            <span className="material-symbols-outlined text-5xl text-gray-300">receipt_long</span>
          </div>
          <p className="text-gray-500 font-medium mb-6">
            Sube una foto de tu ticket de compra y los productos se guardarán automáticamente en tu despensa.
          </p>

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />

          <button onClick={() => fileInputRef.current?.click()} className="neo-btn-primary text-base w-full mb-3">
            <span className="material-symbols-outlined text-base align-text-bottom">add_a_photo</span> Subir ticket de compra
          </button>

          <div className="relative mb-3">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center"><span className="bg-page px-2 text-xs text-gray-400 font-medium">o</span></div>
          </div>

          <button onClick={startCamera} className="neo-btn !bg-gray-100 dark:!bg-gray-300 dark:!text-black text-base w-full">
            <span className="material-symbols-outlined text-base align-text-bottom">scan</span> Usar cámara
          </button>

          <p className="text-xs text-gray-400 mt-6">
            La imagen se procesa localmente. No se envía a ningún servidor externo.
          </p>
        </div>
      )}

      {step === 'camera' && (
        <div>
          <div className="relative rounded-2xl border-2 border-black overflow-hidden bg-black mb-3">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-80 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 border-[3px] border-dashed border-white/40 pointer-events-none rounded-2xl m-4" />
          </div>
          <p className="text-center text-xs text-gray-500 mb-3 font-medium">Enfoca el ticket y procura buena iluminación</p>
          <div className="flex gap-2">
            <button onClick={capturePhoto} className="neo-btn-primary flex-1">
              <span className="material-symbols-outlined text-base align-text-bottom">camera</span> Capturar
            </button>
            <button onClick={resetAll} className="neo-btn !bg-gray-100 dark:!bg-gray-300 flex-shrink-0 !px-4 dark:!text-black">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {processing && (
        <div className="text-center py-12">
          <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-primary-500 bg-primary-50 flex items-center justify-center mb-5 animate-pulse">
            <span className="material-symbols-outlined text-5xl text-primary-500 animate-spin">scan</span>
          </div>
          <p className="text-primary-600 font-bold mb-1">Leyendo texto...</p>
          <p className="text-gray-400 text-sm">{ocrProgress || 'Procesando imagen con OCR'}</p>
        </div>
      )}

      {step === 'review' && !processing && (
        <div>
          <div className="neo-card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-extrabold text-sm">Productos detectados</h2>
                <p className="text-xs text-gray-500">{parsedItems.length} producto(s) — Revisa y edita antes de guardar</p>
              </div>
              <button onClick={addItem} className="neo-btn-primary !py-1.5 !px-3 !text-xs">
                <span className="material-symbols-outlined text-sm align-text-bottom">add</span> Añadir
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {parsedItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600">
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full text-sm font-bold bg-transparent border-b border-gray-200 dark:border-gray-600 pb-0.5 mb-1 focus:outline-none focus:border-primary-500 dark:text-white"
                      value={item.name}
                      onChange={e => updateItem(i, 'name', e.target.value)}
                      placeholder="Nombre del producto"
                    />
                    <div className="flex gap-1.5 items-center flex-wrap">
                      <input
                        className="w-14 text-xs bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-center dark:text-white"
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', e.target.value)}
                      />
                      <select
                        className="text-xs bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 px-1 py-0.5 dark:text-white"
                        value={item.unit || 'unidad'}
                        onChange={e => updateItem(i, 'unit', e.target.value)}
                      >
                        {units.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <select
                        className="text-xs bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 px-1 py-0.5 dark:text-white"
                        value={item.category || 'otro'}
                        onChange={e => updateItem(i, 'category', e.target.value)}
                      >
                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={() => removeItem(i)} className="p-1 rounded-lg hover:bg-red-50 text-red-400 flex-shrink-0 mt-1">
                    <span className="material-symbols-outlined text-lg">remove_circle</span>
                  </button>
                </div>
              ))}
            </div>

            {rawText && (
              <details className="mt-3">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 font-medium">
                  Texto crudo del OCR
                </summary>
                <pre className="text-xs text-gray-500 mt-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-2 border border-gray-200 dark:border-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">{rawText}</pre>
              </details>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="neo-card mb-4 !border-secondary-300 !bg-secondary-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary-600">restaurant</span>
                <h2 className="font-extrabold text-sm text-secondary-800">Platos que puedes preparar</h2>
              </div>
              <div className="space-y-2">
                {recommendations.map((meal, i) => (
                  <div key={i} className="bg-white dark:bg-gray-700 rounded-xl border border-secondary-200 dark:border-gray-600 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{meal.name}</h3>
                      <span className="text-xs font-bold text-secondary-600 bg-secondary-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                        {meal.matchCount}/{meal.totalIngredients} ingredientes
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {meal.ingredients.map((ing, j) => {
                        const isMatch = meal.matched.includes(ing);
                        return (
                          <span key={j} className={`text-xs px-2 py-0.5 rounded-full border ${isMatch ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-400'}`}>
                            {isMatch ? '✓ ' : ''}{ing}
                          </span>
                        );
                      })}
                    </div>
                    {meal.instructions && (
                      <p className="text-xs text-gray-500 dark:text-gray-300 line-clamp-2">{meal.instructions.split('\n')[0]}</p>
                    )}
                    <button
                      onClick={() => navigate('/meals', { state: { suggestedMeal: meal } })}
                      className="mt-2 text-xs font-bold text-secondary-600 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span> Agregar al plan de comidas
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingRecommendations && (
            <div className="text-center py-3 mb-4">
              <span className="material-symbols-outlined animate-spin text-secondary-500">sync</span>
              <span className="text-sm text-secondary-500 ml-2">Buscando platos recomendados...</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || parsedItems.every(i => !i.name.trim())}
              className="neo-btn-primary flex-1 disabled:opacity-30"
            >
              {saving ? 'Guardando...' : `Guardar en Despensa (${parsedItems.filter(i => i.name.trim()).length} items)`}
            </button>
            <button onClick={resetAll} className="neo-btn !bg-gray-100 dark:!bg-gray-300 flex-shrink-0 !px-4 dark:!text-black">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-primary-100 border-2 border-primary-500 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-primary-600">check</span>
          </div>
          <h2 className="text-xl font-extrabold dark:text-white">¡Ticket escaneado!</h2>
          <p className="text-gray-500 dark:text-gray-300 mt-1">{successCount} producto(s) guardado(s) en tu despensa</p>
          <div className="flex flex-col gap-2 mt-6">
            <button onClick={resetAll} className="neo-btn-primary">
              <span className="material-symbols-outlined text-base align-text-bottom">scan</span> Escanear otro ticket
            </button>
            <button onClick={() => navigate('/pantry')} className="neo-btn !bg-gray-100 dark:!bg-gray-300 dark:!text-black">
              <span className="material-symbols-outlined text-base align-text-bottom">kitchen</span> Ir a la despensa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
