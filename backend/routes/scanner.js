const express = require('express');
const supabase = require('../lib/supabase');
const { create, updateById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/process-ticket', async (req, res) => {
  try {
    const { image, media_type } = req.body;
    if (!image) return res.status(400).json({ error: 'Imagen requerida' });

    const geminiKey = process.env.GEMINI_KEY;
    let items = [];

    if (geminiKey) {
      const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
      for (const model of models) {
        try {
          const mime = media_type || 'image/jpeg';
          const body = {
            contents: [{
              parts: [
                { text: `Eres un asistente que extrae productos de tickets de supermercado.
Extrae SOLO los productos comprados, en el MISMO ORDEN en que aparecen en el ticket.
Ignora: totales, subtotales, IVA, direcciones, fechas, TPV, resto a pagar, numeros de ticket, datos del establecimiento.
Devuelve SOLO JSON valido con esta estructura exacta, sin texto extra:
{"productos":[{"nombre":"NOMBRE","cantidad":"1","unidad":"unidad"}]}` },
                { inline_data: { mime_type: mime, data: image } }
              ]
            }]
          };
          if (model === 'gemini-2.0-flash') {
            body.generationConfig = { response_mime_type: 'application/json' };
          }
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            }
          );
          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error(`Gemini ${model} falló:`, errData.error?.message || `HTTP ${response.status}`);
            continue;
          }
          const json = await response.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (!text) {
            return res.json({ items: [], engine: model, debug: 'Gemini no devolvió texto' });
          }
          const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              items = (parsed.productos || []).filter(p => p.nombre?.trim());
              if (items.length > 0) {
                return res.json({ items, engine: model });
              }
              return res.json({ items: [], engine: model, debug: 'Gemini devolvió JSON vacío: ' + clean.slice(0, 500) });
            } catch (e) {
              return res.json({ items: [], engine: model, debug: 'Error parseando JSON: ' + e.message + ' | Texto: ' + clean.slice(0, 500) });
            }
          }
          return res.json({ items: [], engine: model, debug: 'No encontró JSON en respuesta: ' + clean.slice(0, 500) });
        } catch (e) {
          return res.json({ items: [], engine: model, debug: 'Error: ' + e.message });
        }
      }
    }

    res.json({ items: [], engine: 'tesseract' });
  } catch (e) {
    res.json({ items: [] });
  }
});

router.post('/save-merged', authMiddleware, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Items requeridos' });

    const { data: existing } = await supabase
      .from('pantry_items')
      .select('id, name, quantity, unit, category')
      .eq('user_id', req.userId);

    let count = 0;
    for (const item of items) {
      if (!item.name?.trim()) continue;
      const name = item.name.trim();
      const qty = parseFloat(item.quantity) || 1;
      const unit = item.unit || 'unidad';
      const category = item.category || 'otro';

      const match = (existing || []).find(e => e.name.toLowerCase() === name.toLowerCase());
      if (match) {
        const newQty = (parseFloat(match.quantity) || 0) + qty;
        await updateById('pantry_items', match.id, {
          quantity: String(newQty), unit, category
        }, req.userId);
      } else {
        await create('pantry_items', {
          user_id: req.userId, name, category, quantity: String(qty), unit
        });
      }
      count++;
    }
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
