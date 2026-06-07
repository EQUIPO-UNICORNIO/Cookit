const express = require('express');
const supabase = require('../lib/supabase');
const { create, updateById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/process-ticket', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Imagen requerida' });
    res.json({ items: [] });
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
