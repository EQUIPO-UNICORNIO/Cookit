const express = require('express');
const supabase = require('../lib/supabase');
const { create, updateById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/process-ticket', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Imagen requerida' });

    const geminiKey = process.env.GEMINI_KEY;
    let items = [];

    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: `Eres un asistente que extrae productos de tickets de supermercado.
Extrae SOLO los productos comprados. 
Ignora completamente: totales, subtotales, IVA, direcciones, fechas, TPV, resto a pagar, numeros de ticket, datos del establecimiento.
Responde UNICAMENTE con JSON valido, sin texto extra:
{"productos":[{"nombre":"NOMBRE","cantidad":"1","unidad":"unidad"}]}` },
                  { inline_data: { mime_type: 'image/jpeg', data: image } }
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
          const err = await response.json().catch(() => ({}));
          const msg = err.error?.message || `HTTP ${response.status}`;
          return res.status(502).json({ error: 'Gemini falló: ' + msg });
        }
      } catch (e) {
        return res.status(502).json({ error: 'Error llamando a Gemini: ' + e.message });
      }
    } else {
      return res.status(500).json({ error: 'Falta GEMINI_KEY en el servidor' });
    }

    if (items.length === 0) {
      return res.json({ items: [], message: 'Gemini no detectó productos' });
    }

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/save-merged', async (req, res) => {
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
