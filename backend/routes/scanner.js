const express = require('express');
const { queryAll, execute, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.post('/process-ticket', async (req, res) => {
  try {
    const { image, media_type } = req.body;
    if (!image) return res.status(400).json({ error: 'Imagen requerida' });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key de Anthropic no configurada. Configura ANTHROPIC_API_KEY en el entorno.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: media_type || 'image/jpeg', data: image } },
            { type: 'text', text: 'Extrae los productos de este ticket de compra. Devuelve SOLO un JSON válido sin markdown ni texto extra con esta estructura exacta: {"items":[{"name":"nombre del producto","quantity":1,"unit":"kg","category":"proteina"}]}. Categorías permitidas: proteina, carbohidrato, verdura, fruta, lacteo, grasa, otro.' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Error al procesar con Claude' });
    }

    const text = data.content?.[0]?.text || '';
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(Array.isArray(parsed.items) ? parsed : { items: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/save-merged', async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'Items requeridos' });

    const existing = await queryAll('SELECT id, name, quantity, unit, category FROM pantry_items WHERE user_id = ?', [req.userId]);

    let count = 0;
    for (const item of items) {
      if (!item.name?.trim()) continue;
      const name = item.name.trim();
      const qty = parseFloat(item.quantity) || 1;
      const unit = item.unit || 'unidad';
      const category = item.category || 'otro';

      const match = existing.find(e => e.name.toLowerCase() === name.toLowerCase());
      if (match) {
        const newQty = (parseFloat(match.quantity) || 0) + qty;
        await execute('UPDATE pantry_items SET quantity=?, unit=?, category=? WHERE id=? AND user_id=?',
          [String(newQty), unit, category, match.id, req.userId]);
      } else {
        await execute('INSERT INTO pantry_items (user_id, name, category, quantity, unit) VALUES (?, ?, ?, ?, ?)',
          [req.userId, name, category, String(qty), unit]);
      }
      count++;
    }
    saveDb();
    res.json({ success: true, count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
