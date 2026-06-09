import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useTranslation } from 'react-i18next';
import { PaddleOcrService } from 'ppu-paddle-ocr/web';
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

let paddleOcrInstance = null;
async function getPaddleOcr() {
  if (!paddleOcrInstance) {
    paddleOcrInstance = new PaddleOcrService({ processing: { engine: 'canvas-native' }, debugging: { verbose: false } });
    await paddleOcrInstance.initialize();
  }
  return paddleOcrInstance;
}

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
  // Quitar prefijos de 1-2 letras sueltas al inicio (OCR artifacts como "Ee", "ma", "a ")
  n = n.replace(/^[a-zA-Záéíóúñü]{1,2}\s+/, '').trim();
  // Quitar cualquier palabra de 1 letra en toda la cadena (ej: "e ENSALADILLA" → "ENSALADILLA")
  n = n.replace(/\s[a-zA-Záéíóúñü]\s/g, ' ').trim();
  // Quitar caracteres raros o repetidos al inicio (p.ej. "= ", "- ", "| ")
  n = n.replace(/^[=\-|_#*~^'"`]+/, '').trim();
  // Quitar pesos/medidas al final (ej: "1k", "1kg", "200g", "1l", "500ml")
  n = n.replace(/\s+\d+\s*(kg|g|l|ml|k|gr|litro|litros|mililitro|cc|kl)\s*$/i, '').trim();
  // Quitar envases y formatos al final
  n = n.replace(/\s+(envase|pack|botella|lata|bolsa|caja|brik|tarro|frasco|tubo|blister|unidad|unidades|paquete|sobre)\s*$/i, '').trim();
  // Quitar "con" y "de" al final si es solo una palabra sobrante
  n = n.replace(/\s+(de|con|en|sin|para)\s+\w{1,4}\s*$/i, '').trim();
  // Quitar el ultimo segmento si es 1 o 2 letras
  n = n.replace(/\s+\w{1,2}$/, '').trim();
  // Quitar caracteres no deseados (solo letras, sin numeros)
  n = n.replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, '').trim();
  // Eliminar palabras sueltas de 1 letra que hayan quedado (ej: "e", "a")
  n = n.split(/\s+/).filter(w => w.length > 1).join(' ');
  // Si después de limpiar quedan menos de 3 letras, descartar
  if (n.replace(/\s/g, '').length < 3) return null;
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
  // Strip a unit price that precedes the total price (e.g., "0,63 1,26" → "1,26" matches priceMatch, leaving "2 AGUA MINERAL 0,63")
  namePart = namePart.replace(/\s+\d{1,4}[.,]\d{2}\s*$/, '').trim();
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

function rejoinLines(text) {
  return text.replace(/,(\s*)\n(\d{2})(?!\d)/g, ',$1$2');
}

function splitProductLines(text) {
  text = text.replace(/(\d{1,4}[.,]\d{2})\s+(?=[A-ZÁÉÍÓÚÑ])/g, '$1\n');
  text = text.replace(/\b(?=\d{1,2}\s+(?!(?:CIF|SUBTOTAL|TOTAL|EUR|IMPORTE|DESCUENTO|BANCARIA)\b)[A-ZÁÉÍÓÚÑ])/g, '\n');
  return text.trimStart();
}

function preprocessImage(canvas) {
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    let gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    gray = gray < 128 ? Math.max(0, gray - 40) : Math.min(255, gray + 40);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

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
  const [progressPct, setProgressPct] = useState(0);
  const progressTimerRef = useRef(null);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const resizeAndProcess = (canvas) => {
    const MAX = 2400;
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
    const done = () => {
      clearInterval(progressTimerRef.current);
      setProgressPct(100);
      setTimeout(() => setProcessing(false), 300);
    };
    setProcessing(true);
    setProgressPct(0);
    setOcrProgress('');
    setError('');
    progressTimerRef.current = setInterval(() => {
      setProgressPct(p => Math.min(90, p + Math.random() * 8));
    }, 300);
    try {
      setOcrProgress(t('scanner.readingOCR'));
      canvas = preprocessImage(canvas);
      const service = await getPaddleOcr();
      const result = await service.recognize(canvas, { flatten: true });
      const text = splitProductLines(rejoinLines(result.text.trim()));
      setRawText(text);

      if (!text || text.length < 5) {
        setError(t('scanner.errorReadTicket'));
        setStep('initial');
        return;
      }

      const cleanText = text.split('\n').map(l => {
        let s = l.trim();
        s = s.replace(/^[|=_\-*~^'"`#@]+/, '').trim();
        s = s.replace(/[|=_\-*^'"`#@]+$/, '').trim();
        return s;
      }).filter(l => l.length > 2);
      const lines = cleanText;
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
        setOcrProgress(text.slice(0, 500));
        setStep('initial');
        return;
      }

      setParsedItems(uniq.map(i => ({ ...i, category: autoCategorize(i.name) })));
      setStep('review');
    } catch (e) {
      setError(t('scanner.errorProcessImage') + e.message);
      setStep('initial');
    } finally {
      done();
    }
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
    setStep('initial');
    setParsedItems([]);
    setRawText('');
    setError('');
    setSuccessCount(0);
    setOcrProgress('');
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

  const openCamera = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => handleFileUpload(e);
    input.click();
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
          {rawText && (
            <details className="mt-2">
              <summary className="text-xs text-red-500 cursor-pointer">Ver texto OCR crudo</summary>
              <pre className="text-xs text-red-600 mt-1 whitespace-pre-wrap max-h-40 overflow-y-auto bg-red-100/50 p-2 rounded">{rawText}</pre>
            </details>
          )}
          <button onClick={() => setError('')} className="absolute top-2 right-2 text-red-400">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {step === 'initial' && (
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

          <div className="text-center pt-4">
            <div className="w-36 h-36 mx-auto rounded-3xl border-4 border-dashed border-gray-300 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-5xl text-gray-300">receipt_long</span>
            </div>
            <p className="text-gray-500 font-medium mb-6">
              {t('scanner.ticketDesc')}
            </p>

            <button onClick={openCamera} className="neo-btn-primary text-base w-full mb-3">
              <span className="material-symbols-outlined text-base align-text-bottom">photo_camera</span> {t('scanner.openCamera')}
            </button>

            <button onClick={() => fileInputRef.current?.click()} className="neo-btn w-full mb-6">
              <span className="material-symbols-outlined text-base align-text-bottom">add_a_photo</span> {t('scanner.uploadPhoto')}
            </button>

            <p className="text-xs text-gray-400">
              {t('scanner.photoPrivacy')}
            </p>
          </div>
        </div>
      )}

      {processing && (
        <div className="text-center py-12">
          <div className="w-32 h-32 mx-auto rounded-3xl border-4 border-primary-500 bg-primary-50 flex items-center justify-center mb-5 animate-pulse">
            <span className="material-symbols-outlined text-5xl text-primary-500 animate-spin">scan</span>
          </div>
          <p className="text-primary-600 font-bold mb-1">{t('scanner.readingText')}</p>
          <p className="text-gray-400 text-sm mb-3">{ocrProgress || t('scanner.processingOCR')}</p>
          <div className="w-48 mx-auto bg-gray-200 rounded-full h-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.round(progressPct)}%` }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">{Math.round(progressPct)}%</p>
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
                        {units.map(u => <option key={u} value={u}>{t('units.' + u) || u}</option>)}
                      </select>
                      <select
                        className="text-xs bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 px-1 py-0.5 dark:text-white"
                        value={item.category || 'Otros'}
                        onChange={e => updateItem(i, 'category', e.target.value)}
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{t('categories.' + c) || c}</option>)}
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

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || parsedItems.every(i => !i.name.trim())}
              className="neo-btn-primary flex-1 disabled:opacity-30"
            >
              {saving ? t('scanner.saving') : `${t('scanner.saveToPantry')} (${parsedItems.filter(i => i.name.trim()).length} ${t('common.items')})`}
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
    </div>
  );
}
