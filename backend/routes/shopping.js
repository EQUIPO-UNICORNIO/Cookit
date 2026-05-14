const express = require('express');
const { queryAll, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await queryAll('SELECT id, name, category, quantity, unit, checked FROM shopping_items WHERE user_id = ? ORDER BY checked ASC, created_at DESC', [req.userId]);
    res.json(items.map(i => ({ ...i, checked: !!i.checked })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, quantity, unit } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    await execute('INSERT INTO shopping_items (user_id, name, category, quantity, unit) VALUES (?, ?, ?, ?, ?)',
      [req.userId, name, category || 'Otros', quantity || '1', unit || 'unidad']);
    saveDb();
    res.status(201).json({ id: getLastId(), name, category: category || 'Otros', quantity: quantity || '1', unit: unit || 'unidad', checked: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, quantity, unit, checked } = req.body;
    await execute('UPDATE shopping_items SET name=?, category=?, quantity=?, unit=?, checked=? WHERE id=? AND user_id=?',
      [name, category, quantity, unit, checked ? 1 : 0, req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM shopping_items WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
