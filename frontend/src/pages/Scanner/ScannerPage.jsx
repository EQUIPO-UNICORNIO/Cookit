import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { createWorker } from 'tesseract.js';
import RECIPE_DB from '../../data/recipeDb';
import { CATEGORIES, autoCategorize } from '../../utils/categories';

const units = ['unidad', 'kg', 'g', 'L', 'ml', 'paquete', 'lata', 'botella', 'cucharada', 'taza'];

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const IGNORE_WORDS = new Set([
  'total', 'iva', 'subtotal', 'efectivo', 'tarjeta', 'cambio', 'nif', 'cif', 'caja', 'sup', 'op',
  'telefono', 'paseo', 'calle', 'gracias', 'ticket', 'factura', 'cliente', 'importe', 'descuento',
  'redondo', 'base', 'unidades', 'euros', 'centimos', 'neto', 'bruto', 'resto', 'pagado', 'cobrado',
  'devuelta', 'vuelta', 'articulo', 'articulos', 'vendidos', 'cajero', 'cajg', 'dependiente',
  'fecha', 'hora', 'numero', 'compra', 'referencia', 'codigo', 'bultos', 'peso', 'valor',
  'tienda', 'tda', 'local', 'comercio', 'supermercado', 'market', 'socio', 'tpv',
  'visa', 'mastercard', 'bizum', 'contado', 'metalico', 'promocion', 'ahorro', 'ahorras',
  'dto', 'bono', 'cupon', 'puntos', 'saldo', 'disponible', 'consumicion', 'camara',
  'carnet', 'telf', 'movil', 'email', 'direccion', 'poblacion', 'provincia', 'codigo postal',
  'recargo', 'gastos', 'envio', 'portes', 'atendido', 'bolsa', 'bolsas', 'cuenta',
  'ambiente', 'medio', 'redondeo', 'eur', 'pvp', 'num', 'artic', 'nulo', 'despacho', 'tel',
]);

const IGNORE_STARTS = ['avda', 'calle', 'plaza', 'ctra', 'camino', 'paseo', 'ronda', 'carretera', 'c/', 'travesia'];

const TICKET_METADATA_RE = /p\.v\.p|atendido\s+por|num\.?\s*ticket|artic\.?\s*vendidos|artic\.?\s*por|unidades\s*vendidas|balance\s*venta|ventas\s*del|documento|justificante|original|duplicado|ticket\s*num/i;

function getSignificantWords(name) {
  return normalize(name).split(/\s+/).filter(w => w.length > 2);
}
function isDuplicateProduct(name1, name2) {
  const w1 = getSignificantWords(name1);
  const w2 = getSignificantWords(name2);
  if (!w1.length || !w2.length) return normalize(name1) === normalize(name2);
  const overlap = w1.filter(w => w2.includes(w)).length;
  return overlap / Math.min(w1.length, w2.length) >= 0.5;
}

function isProductLine(line) {
  const clean = line.replace(/\s+/g, ' ').trim();
  if (clean.length < 5) return false;

  // Debe tener un precio al final (formato español: nn,nn o europeo: nn.nn)
  const priceMatch = clean.match(/(\d{1,4}[.,]\d{2})\s*$/);
  if (!priceMatch) return false;
  const price = parseFloat(priceMatch[1].replace(',', '.'));
  if (isNaN(price) || price <= 0 || price > 9999) return false;

  // Extraer nombre quitando el precio del final
  let name = clean.substring(0, clean.length - priceMatch[0].length).trim();
  if (!name) return false;

  // Quitar prefijo numérico (cantidad inicial como "2 " o "2x ")
  name = name.replace(/^\d+\s*[xX*]?\s*/, '').trim();
  if (name.length < 2) return false;

  const lower = normalize(name);

  // Descartar si contiene palabras de IGNORE
  const words = lower.split(/\s+/);
  if (words.some(w => IGNORE_WORDS.has(w))) return false;

  // Descartar si empieza con patrones de direccion
  if (IGNORE_STARTS.some(s => lower.startsWith(s))) return false;

  // Descartar si son solo numeros
  if (/^[\d\s]+$/.test(name)) return false;

  // Descartar si no tiene letras
  if (!/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(name)) return false;

  // Descartar codigos mixtos como "tpv3" "caje1698" "tda" (pero permitir pesos como "255gr", "1kg")
  const mixto = name.split(/\s+/).filter(w => {
    if (!/\d/.test(w) || !/[a-z]/i.test(w) || w.length <= 3) return false;
    if (/^\d{1,4}\s*(kg|g|l|ml|gr|k|mg|cl|dl)$/i.test(w.trim())) return false;
    return true;
  });
  if (mixto.length > 0) return false;

  // Descartar lineas con mas digitos que letras (codigos de barras, referencias)
  const digitCount = (name.match(/\d/g) || []).length;
  const letterCount = (name.match(/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g) || []).length;
  if (digitCount > letterCount) return false;

  // Limpiar y normalizar nombre
  let cleaned = cleanProductName(name);
  if (!cleaned || cleaned.length < 2) return false;

  return true;
}

function cleanProductName(name) {
  let n = name.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  // Quitar pesos/medidas al final (ej: "1k", "1kg", "200g", "1l", "500ml")
  n = n.replace(/\s+\d+\s*(kg|g|l|ml|k|gr|litro|litros|mililitro|cc|kl)\s*$/i, '').trim();
  // Quitar envases y formatos al final
  n = n.replace(/\s+(envase|pack|botella|lata|bolsa|caja|brik|tarro|frasco|tubo|blister|unidad|unidades|paquete|sobre)\s*$/i, '').trim();
  // Quitar "con" y "de" al final si es solo una palabra sobrante
  n = n.replace(/\s+(de|con|en|sin|para)\s+\w{1,4}\s*$/i, '').trim();
  // Quitar el ultimo segmento si es 1 o 2 letras
  n = n.replace(/\s+\w{1,2}$/, '').trim();
  // Quitar caracteres no deseados
  n = n.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ0-9\s]/g, '').trim();
  return n || null;
}

function detectQuantityUnit(name) {
  const m = name.match(/^(\d+[.,]?\d*)\s*(l|L|ml|kg|g|unidad|unidades|pack|paquete|botella|lata|bolsa|caja|brik|tarro|frasco|tubo|blister|sobre)\s+(.+)$/);
  if (m) {
    let q = m[1].replace(',', '.');
    if (q.endsWith('.')) q = q.slice(0, -1);
    return { name: m[3].trim(), quantity: q, unit: m[2].toLowerCase() === 'unidades' ? 'unidad' : m[2].toLowerCase() };
  }
  const m2 = name.match(/^(.+?)\s+(\d+[.,]?\d*)\s*(l|L|ml|kg|g|unidad|unidades|pack|paquete|botella|lata|bolsa|caja|brik|tarro|frasco|tubo|blister|sobre)$/);
  if (m2) {
    let q = m2[2].replace(',', '.');
    if (q.endsWith('.')) q = q.slice(0, -1);
    return { name: m2[1].trim(), quantity: q, unit: m2[3].toLowerCase() === 'unidades' ? 'unidad' : m2[3].toLowerCase() };
  }
  return null;
}

function parseLineToProduct(line) {
  if (!isProductLine(line)) return null;
  const clean = line.replace(/\s+/g, ' ').trim();
  const priceMatch = clean.match(/(\d{1,4}[.,]\d{2})\s*$/);
  let namePart = priceMatch ? clean.substring(0, clean.length - priceMatch[0].length).trim() : clean;
  namePart = namePart.replace(/^\d+\s*[xX*]?\s*/, '').trim();
  const detected = detectQuantityUnit(namePart);
  if (detected) {
    const name = cleanProductName(detected.name);
    if (!name) return null;
    return { name, quantity: detected.quantity, unit: detected.unit };
  }
  const name = cleanProductName(namePart);
  if (!name) return null;
  return { name, quantity: '1', unit: 'unidad' };
}

function fallbackParseLines(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  const seen = new Set();
  for (const line of lines) {
    if (TICKET_METADATA_RE.test(line)) continue;
    let clean = line.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, '').trim();
    if (!clean || clean.length < 5) continue;
    const lower = normalize(clean);
    const words = lower.split(/\s+/).filter(w => w.length >= 3);
    if (words.length < 2) continue;
    if (words.some(w => IGNORE_WORDS.has(w))) continue;
    if (IGNORE_STARTS.some(s => lower.startsWith(s))) continue;
    if (lower.replace(/\s/g, '').length < 5) continue;
    if (!/[aeiouáéíóú]/i.test(clean)) continue;
    const digitCount = (clean.match(/\d/g) || []).length;
    const letterCount = (clean.match(/[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/g) || []).length;
    if (digitCount > letterCount) continue;
    if (words.length <= 3 && words.every(w => w.length <= 4)) continue;
    const key = normalize(clean);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({ name: clean, quantity: '1', unit: 'unidad' });
  }
  return items.slice(0, 50);
}

function preprocessImage(canvas) {
  const MIN_HEIGHT = 2000;
  let w = canvas.width, h = canvas.height;
  if (h < MIN_HEIGHT) {
    const scale = MIN_HEIGHT / h;
    w = Math.round(w * scale);
    h = MIN_HEIGHT;
    const scaled = document.createElement('canvas');
    scaled.width = w;
    scaled.height = h;
    scaled.getContext('2d').drawImage(canvas, 0, 0, w, h);
    canvas = scaled;
  }
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const gray = Math.round(r * 0.299 + g * 0.587 + b * 0.114);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

const matchIngredients = (itemNames, mealIngredients) => {
  const lowerItems = itemNames.map(n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  return mealIngredients.filter(ing => {
    const lowerIng = ing.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return lowerItems.some(item => item.includes(lowerIng) || lowerIng.includes(item));
  });
};

export default function ScannerPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  const resizeAndProcess = (canvas) => {
    const MAX = 1200;
    let { width, height } = canvas;
    if (width > MAX || height > MAX) {
      const scale = MAX / Math.max(width, height);
      const c = document.createElement('canvas');
      c.width = Math.round(width * scale);
      c.height = Math.round(height * scale);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
      canvas = c;
    }
    processImage(canvas);
  };

  const processImage = async (canvas) => {
    setProcessing(true);
      setOcrProgress(t('scanner.preprocessing'));
    setError('');
    try {
      const processed = preprocessImage(canvas);
      setOcrProgress(t('scanner.readingOCR'));
      const worker = await createWorker('spa+eng', 1, {
        logger: m => {
          if (m.status) setOcrProgress(m.status + (m.progress ? ` ${Math.round(m.progress * 100)}%` : ''));
        },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzáéíóúñüÁÉÍÓÚÑÜ0123456789., ',
        preserve_interword_spaces: '1',
      });
      const { data } = await worker.recognize(processed);
      const text = data.text.trim();
      worker.terminate();
      setRawText(text);

      if (!text || text.length < 5) {
        setError(t('scanner.errorReadTicket'));
        setStep('initial');
        setProcessing(false);
        return;
      }

      const lines = text.split('\n').filter(l => l.trim());
      const allProducts = [];
      const uniq = [];

      const addIfNotDup = (product) => {
        const dup = uniq.some(p => isDuplicateProduct(p.name, product.name));
        if (!dup) uniq.push(product);
        return !dup;
      };

      for (const line of lines) {
        if (TICKET_METADATA_RE.test(line)) continue;
        const product = parseLineToProduct(line);
        if (product) allProducts.push(product);
      }

      const fallbackItems = fallbackParseLines(text);
      for (const fb of fallbackItems) {
        fb.name = cleanProductName(fb.name) || fb.name;
        allProducts.push(fb);
      }

      for (const p of allProducts) {
        addIfNotDup(p);
        if (uniq.length >= 50) break;
      }

      if (uniq.length === 0) {
        setError(t('scanner.errorDetectProducts'));
        setStep('initial');
        setProcessing(false);
        return;
      }

      setParsedItems(uniq.map(i => ({ ...i, category: autoCategorize(i.name) })));
      setStep('review');
      findRecommendations(uniq);
    } catch (e) {
      setError(t('scanner.errorProcessImage') + e.message);
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
      resizeAndProcess(canvas);
    };
    img.onerror = () => setError(t('scanner.errorLoadImage'));
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
      for (const meal of [...allMeals, ...RECIPE_DB]) {
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
      setRecommendations(scored);
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

  const handleSaveToShopping = async () => {
    setSaving(true);
    try {
      const items = parsedItems.filter(i => i.name.trim());
      for (const item of items) {
        await api.addShoppingItem({ name: item.name, category: item.category, quantity: item.quantity, unit: item.unit });
      }
      setSuccessCount(items.length);
      setStep('success_shopping');
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
    setParsedItems(prev => [...prev, { name: '', quantity: '1', unit: 'unidad', category: 'Otros' }]);
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
      setError(t('scanner.errorOpenCamera'));
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
      setError(t('scanner.flashUnavailable'));
      return;
    }
    try {
      await track.applyConstraints({ advanced: [{ torch: !flashOn }] });
      setFlashOn(!flashOn);
    } catch {
      setError(t('scanner.errorFlash'));
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
    resizeAndProcess(canvas);
  };

  return (
    <div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{t('scanner.title')}</h1>
          <p className="text-sm text-gray-500 font-medium">{t('scanner.subtitle')}</p>
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
                  {t('scanner.ticketDesc')}
                </p>

                <button onClick={startCamera} className="neo-btn-primary text-base w-full mb-3">
                  <span className="material-symbols-outlined text-base align-text-bottom">photo_camera</span> {t('scanner.openCamera')}
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="neo-btn w-full mb-6">
                  <span className="material-symbols-outlined text-base align-text-bottom">add_a_photo</span> {t('scanner.uploadPhoto')}
                </button>

                <p className="text-xs text-gray-400">
                  {t('scanner.photoPrivacy')}
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
          <p className="text-primary-600 font-bold mb-1">{t('scanner.readingText')}</p>
          <p className="text-gray-400 text-sm">{ocrProgress || t('scanner.processingOCR')}</p>
        </div>
      )}

      {step === 'review' && !processing && (
        <div>
          <div className="neo-card mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-extrabold text-sm">{t('scanner.detectedProducts')}</h2>
                <p className="text-xs text-gray-500">{parsedItems.length} {t('scanner.productsReview')}</p>
              </div>
              <button onClick={addItem} className="neo-btn-primary !py-1.5 !px-3 !text-xs">
                <span className="material-symbols-outlined text-sm align-text-bottom">add</span> {t('scanner.addBtn')}
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
                      placeholder={t('scanner.productName')}
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
                        value={item.category || 'Otros'}
                        onChange={e => updateItem(i, 'category', e.target.value)}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
                  {t('scanner.rawOCR')}
                </summary>
                <pre className="text-xs text-gray-500 mt-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-2 border border-gray-200 dark:border-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">{rawText}</pre>
              </details>
            )}
          </div>

          {recommendations.length > 0 && (
            <div className="neo-card mb-4 !border-secondary-300 !bg-secondary-50">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-secondary-600">restaurant</span>
                <h2 className="font-extrabold text-sm text-secondary-800">{t('scanner.dishesYouCanMake')}</h2>
                {!loadingRecommendations && recommendations.length > 0 && (
                  <span className="text-xs font-bold text-secondary-500 ml-auto">{recommendations.length} {t('scanner.dishes')}</span>
                )}
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recommendations.map((meal, i) => (
                  <div key={i} className="bg-white dark:bg-gray-700 rounded-xl border border-secondary-200 dark:border-gray-600 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{meal.name}</h3>
                      <span className="text-xs font-bold text-secondary-600 bg-secondary-100 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                        {meal.matchCount}/{meal.totalIngredients} {t('scanner.ingredients')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {meal.ingredients.map((ing, j) => {
                        const isMatch = meal.matched.includes(ing);
                        return (
                          <span key={j} className={`text-xs px-2 py-0.5 rounded-full border ${isMatch ? 'bg-green-100 border-green-300 text-green-700' : 'bg-gray-100 dark:bg-gray-600 border-gray-200 dark:border-gray-500 text-gray-400'}`}>
                            {isMatch ? <span className="material-symbols-outlined text-xs align-text-bottom mr-0.5">check</span> : ''}{ing}
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
                      <span className="material-symbols-outlined text-sm">add_circle</span> {t('scanner.addToMealPlan')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingRecommendations && (
            <div className="text-center py-3 mb-4">
              <span className="material-symbols-outlined animate-spin text-secondary-500">sync</span>
              <span className="text-sm text-secondary-500 ml-2">{t('scanner.searchingDishes')}</span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || parsedItems.every(i => !i.name.trim())}
              className="neo-btn-primary flex-1 disabled:opacity-30"
            >
              {saving ? t('scanner.saving') : `${t('scanner.saveToPantry')} (${parsedItems.filter(i => i.name.trim()).length} ${t('common.items')})`}
            </button>
            <button
              onClick={handleSaveToShopping}
              disabled={saving || parsedItems.every(i => !i.name.trim())}
              className="neo-btn !bg-blue-50 !text-blue-700 !border-blue-400 flex-1 disabled:opacity-30"
            >
              {saving ? t('scanner.saving') : t('scanner.saveToShopping', { count: parsedItems.filter(i => i.name.trim()).length })}
            </button>
            <button onClick={resetAll} className="neo-btn !bg-gray-100 dark:!bg-gray-300 flex-shrink-0 !px-4 dark:!text-black">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-primary-100 border-2 border-primary-500 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-primary-600">check</span>
          </div>
          <h2 className="text-xl font-extrabold dark:text-white">{t('scanner.ticketScanned')}</h2>
          <p className="text-gray-500 dark:text-gray-300 mt-1">{successCount} {t('scanner.productsSaved')}</p>
          <div className="flex flex-col gap-2 mt-6">
            <button onClick={resetAll} className="neo-btn-primary">
              <span className="material-symbols-outlined text-base align-text-bottom">scan</span> {t('scanner.scanAnother')}
            </button>
            <button onClick={() => navigate('/pantry')} className="neo-btn !bg-gray-100 dark:!bg-gray-300 dark:!text-black">
              <span className="material-symbols-outlined text-base align-text-bottom">kitchen</span> {t('scanner.goToPantry')}
            </button>
          </div>
        </div>
      )}

      {step === 'success_shopping' && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-100 border-2 border-blue-500 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-blue-600">shopping_cart</span>
          </div>
          <h2 className="text-xl font-extrabold dark:text-white">{t('scanner.addedToShopping')}</h2>
          <p className="text-gray-500 dark:text-gray-300 mt-1">{successCount} {t('scanner.productsOnList')}</p>
          <div className="flex flex-col gap-2 mt-6">
            <button onClick={resetAll} className="neo-btn-primary">
              <span className="material-symbols-outlined text-base align-text-bottom">scan</span> {t('scanner.scanOther')}
            </button>
            <button onClick={() => navigate('/shopping')} className="neo-btn !bg-gray-100 dark:!bg-gray-300 dark:!text-black">
              <span className="material-symbols-outlined text-base align-text-bottom">shopping_cart</span> {t('scanner.goToShopping')}
            </button>
            <button onClick={() => navigate('/pantry')} className="neo-btn !bg-gray-100 dark:!bg-gray-300 dark:!text-black">
              <span className="material-symbols-outlined text-base align-text-bottom">kitchen</span> {t('scanner.goToPantry')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
