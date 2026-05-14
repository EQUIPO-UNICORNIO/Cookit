const express = require('express');
const { queryAll, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await queryAll('SELECT id, name, category, quantity, unit, expiry_date, notes, created_at FROM pantry_items WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit, expiry_date, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    await execute('INSERT INTO pantry_items (user_id, name, category, quantity, unit, expiry_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, name, category || 'Otros', quantity || '1', unit || 'unidad', expiry_date || '', notes || '']);
    saveDb();
    const id = getLastId();
    res.status(201).json({ id, name, category: category || 'Otros', quantity: quantity || '1', unit: unit || 'unidad', expiry_date: expiry_date || '', notes: notes || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, quantity, unit, expiry_date, notes } = req.body;
    await execute('UPDATE pantry_items SET name=?, category=?, quantity=?, unit=?, expiry_date=?, notes=? WHERE id=? AND user_id=?',
      [name, category, quantity, unit, expiry_date, notes, req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM pantry_items WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
