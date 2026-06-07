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
      try {
        const mime = media_type || 'image/jpeg';
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: `Eres un asistente que extrae productos de tickets de supermercado.
Extrae SOLO los productos comprados, en el MISMO ORDEN en que aparecen en el ticket.
Ignora completamente: totales, subtotales, IVA, direcciones, fechas, TPV, resto a pagar, numeros de ticket, datos del establecimiento.
Devuelve SOLO JSON valido, sin texto extra, sin usar \`\`\`:
{"productos":[{"nombre":"NOMBRE","cantidad":"1","unidad":"unidad"}]}` },
                  { inline_data: { mime_type: mime, data: image } }
                ]
              }]
            })
          }
        );

        if (response.ok) {
          const json = await response.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const clean = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            items = (parsed.productos || []).filter(p => p.nombre?.trim());
          }
        } else {
          const errData = await response.json().catch(() => ({}));
          return res.json({ items: [], error: errData.error?.message || `HTTP ${response.status}` });
        }
      } catch (e) {
        return res.json({ items: [], error: e.message });
      }
    } else {
      return res.json({ items: [] });
    }

    res.json({ items });
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
