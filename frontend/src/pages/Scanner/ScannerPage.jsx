import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

const units = ['unidad', 'kg', 'g', 'L', 'ml', 'paquete', 'lata', 'botella', 'cucharada', 'taza'];
const categoryOptions = ['proteina', 'carbohidrato', 'verdura', 'fruta', 'lacteo', 'grasa', 'otro'];

const SUGGESTED_MEALS = [
  { name: 'Tortilla francesa', recipe: 'Tortilla francesa', ingredients: ['Huevos', 'Sal', 'Aceite de oliva'], instructions: '1. Bate los huevos con sal.\n2. Calienta aceite en una sartén antiadherente.\n3. Vierte los huevos y deja cuajar.\n4. Cuando la base esté firme, dobla por la mitad.\n5. Sirve inmediatamente.' },
  { name: 'Huevos revueltos', recipe: 'Huevos revueltos', ingredients: ['Huevos', 'Leche', 'Mantequilla', 'Sal', 'Pimienta'], instructions: '1. Bate los huevos con un poco de leche.\n2. Derrite la mantequilla en una sartén.\n3. Vierte los huevos y remueve suavemente.\n4. Cocina a fuego bajo hasta que cuajen.\n5. Sazona con sal y pimienta.' },
  { name: 'Tostada con tomate', recipe: 'Tostada con tomate', ingredients: ['Pan', 'Tomate', 'Aceite de oliva', 'Sal', 'Jamón'], instructions: '1. Tuesta las rebanadas de pan.\n2. Corta un tomate por la mitad.\n3. Restriega el tomate sobre el pan tostado.\n4. Añade aceite de oliva y sal.\n5. Coloca una loncha de jamón encima.' },
  { name: 'Ensalada César', recipe: 'Ensalada César', ingredients: ['Lechuga', 'Pollo', 'Pan', 'Queso parmesano', 'Aceite de oliva', 'Limón', 'Ajo', 'Mostaza'], instructions: '1. Cocina el pollo a la plancha y corta en tiras.\n2. Corta el pan en cubos y tuéstalos en el horno.\n3. Prepara el aliño con aceite, limón, ajo y mostaza.\n4. Mezcla la lechuga con el pollo y los crutones.\n5. Añade el aliño y queso parmesano rallado.' },
  { name: 'Arroz blanco', recipe: 'Arroz blanco', ingredients: ['Arroz', 'Agua', 'Aceite de oliva', 'Sal', 'Ajo'], instructions: '1. Sofríe el ajo picado en aceite.\n2. Añade el arroz y remueve 1 minuto.\n3. Agrega el doble de agua que de arroz.\n4. Cocina a fuego bajo 18 minutos.\n5. Deja reposar 5 minutos antes de servir.' },
  { name: 'Lentejas estofadas', recipe: 'Lentejas estofadas', ingredients: ['Lentejas', 'Zanahoria', 'Patata', 'Cebolla', 'Ajo', 'Tomate', 'Pimentón', 'Aceite de oliva', 'Sal'], instructions: '1. Sofríe la cebolla, ajo y zanahoria picados.\n2. Añade el tomate y el pimentón.\n3. Incorpora las lentejas lavadas y la patata.\n4. Cubre con agua y sazona con sal.\n5. Cocina 40 minutos a fuego medio.' },
  { name: 'Puré de patatas', recipe: 'Puré de patatas', ingredients: ['Patatas', 'Leche', 'Mantequilla', 'Sal', 'Nuez moscada', 'Pimienta'], instructions: '1. Pela y corta las patatas en trozos.\n2. Hiérvelas en agua con sal hasta que estén tiernas.\n3. Escurre y aplasta las patatas.\n4. Añade mantequilla y leche caliente.\n5. Sazona con nuez moscada y pimienta.' },
];

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const matchIngredients = (itemNames, mealIngredients) => {
  const lowerItems = itemNames.map(n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  return mealIngredients.filter(ing => {
    const lowerIng = ing.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lowerItems.some(item => item.includes(lowerIng) || lowerIng.includes(item));
  });
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
  const [flashOn, setFlashOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const cameraStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const processImage = async (canvas) => {
    setProcessing(true);
    setOcrProgress('Analizando ticket con IA...');
    setError('');
    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.92).split(',')[1];

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_KEY}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'google/gemma-4-31b-it:free',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}` }
              },
              {
                type: 'text',
                text: `Eres un asistente que extrae productos de tickets de supermercado.
Extrae SOLO los productos comprados. 
Ignora completamente: totales, subtotales, IVA, direcciones, fechas, TPV, resto a pagar, artículos vendidos, números de ticket, nombres de cajeros, datos del establecimiento.
Para cada producto, intenta detectar la cantidad y unidad si aparece en el ticket (ej: "2 kg", "3 ud").
Responde ÚNICAMENTE con JSON válido, sin texto extra, sin bloques de código markdown:
{"productos": [{"nombre": "NOMBRE PRODUCTO", "cantidad": "1", "unidad": "unidad"}]}`
              }
            ]
          }],
          max_tokens: 1000,
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || `Error ${res.status}`);
      }

      const json = await res.json();
      const text = json.choices?.[0]?.message?.content || '';
      const usedModel = json.model || json.choices?.[0]?.model || 'unknown';
      setRawText(text + `\n\n[Modelo usado: ${usedModel}]`);

      const clean = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : clean;
      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        const preview = text.substring(0, 300);
        throw new Error(`La IA no devolvió JSON válido. Modelo: ${usedModel}. Respuesta: ${preview}...`);
      }

      const items = (parsed.productos || [])
        .filter(p => p.nombre && p.nombre.trim().length > 1)
        .map(p => ({
          name: p.nombre.trim(),
          quantity: p.cantidad || '1',
          unit: p.unidad || 'unidad',
          category: 'otro'
        }));

      if (items.length === 0) {
        setError('No se detectaron productos. Intenta con una foto más clara y bien encuadrada.');
        setStep('initial');
        setProcessing(false);
        return;
      }

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
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
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
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t => t.stop()); cameraStreamRef.current = null; }
    setCameraActive(false);
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

  useEffect(() => () => { cameraStreamRef.current?.getTracks().forEach(t => t.stop()); }, []);
  useEffect(() => { if (step !== 'initial') { cameraStreamRef.current?.getTracks().forEach(t => t.stop()); cameraStreamRef.current = null; setCameraActive(false); } }, [step]);

  const startCamera = async () => {
    setCameraActive(true);
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      cameraStreamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => { video.play().then(resolve).catch(reject); };
          video.onerror = reject;
        });
      }
    } catch {
      setCameraActive(false);
      setError('No se pudo abrir la camara. Usa la opcion de subir foto.');
    }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
  };

  const toggleFlash = async () => {
    if (!cameraStreamRef.current) return;
    const track = cameraStreamRef.current.getVideoTracks()[0];
    if (!track || !track.getCapabilities().torch) {
      setError('Flash no disponible en este dispositivo');
      return;
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn(!flashOn);
    } catch {
      setError('Error al cambiar el flash');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    cameraStreamRef.current = null;
    setCameraActive(false);
    setFlashOn(false);
    processImage(canvas);
  };

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Escaner de Tickets</h1>
          <p className="text-sm text-gray-500 font-medium">Sube tu ticket de compra</p>
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
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          {!cameraActive ? (
            <div className="text-center pt-4">
              <div className="w-36 h-36 mx-auto rounded-3xl border-4 border-dashed border-gray-300 flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-5xl text-gray-300">receipt_long</span>
              </div>
              <p className="text-gray-500 font-medium mb-6">
                Toma una foto de tu ticket de compra y los productos se guardaran automaticamente en tu despensa.
              </p>

              <button onClick={startCamera} className="neo-btn-primary text-base w-full mb-3">
                <span className="material-symbols-outlined text-base align-text-bottom">photo_camera</span> Abrir camara
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="neo-btn w-full mb-6">
                <span className="material-symbols-outlined text-base align-text-bottom">add_a_photo</span> Subir foto
              </button>

              <p className="text-xs text-gray-400">
                La imagen se analiza con IA para detectar los productos correctamente.
              </p>
            </div>
          ) : (
            <div className="relative -mx-4 rounded-none overflow-hidden border-0 bg-black mb-4" style={{ height: 'calc(100vh - 220px)' }}>
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center">
                <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-[5px] border-white bg-white/20 flex items-center justify-center hover:bg-white/30 active:scale-90 transition-all">
                  <div className="w-14 h-14 rounded-full bg-white shadow-md" />
                </button>
              </div>
              <button onClick={toggleFlash} className={`absolute top-4 right-4 p-2.5 rounded-full transition-colors ${flashOn ? 'bg-yellow-400 text-yellow-900' : 'bg-black/40 text-white hover:bg-black/60'}`}>
                <span className="material-symbols-outlined text-xl">{flashOn ? 'flash_on' : 'flash_off'}</span>
              </button>
              <button onClick={stopCamera} className="absolute top-4 left-4 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors">
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          )}
        </div>
      )}

      {processing && (
        <div className="text-center py-12">
          <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-primary-500 bg-primary-50 flex items-center justify-center mb-5 animate-pulse">
            <span className="material-symbols-outlined text-5xl text-primary-500 animate-spin">scan</span>
          </div>
          <p className="text-primary-600 font-bold mb-1">Analizando ticket...</p>
          <p className="text-gray-400 text-sm">{ocrProgress || 'La IA esta leyendo los productos'}</p>
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
                <span className="material-symbols-outlined text-sm align-text-bottom">add</span> Anadir
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
                  Respuesta cruda de la IA
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
                            {isMatch ? '? ' : ''}{ing}
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
          <h2 className="text-xl font-extrabold dark:text-white">?Ticket escaneado!</h2>
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
