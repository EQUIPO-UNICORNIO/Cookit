const express = require('express');
const { queryAll, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const subs = await queryAll('SELECT id, ingredient, substitute, reason FROM ingredient_substitutions WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(subs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { ingredient, substitute, reason } = req.body;
    if (!ingredient || !substitute) return res.status(400).json({ error: 'Ingrediente y sustituto requeridos' });
    await execute('INSERT INTO ingredient_substitutions (user_id, ingredient, substitute, reason) VALUES (?, ?, ?, ?)',
      [req.userId, ingredient, substitute, reason || '']);
    saveDb();
    res.status(201).json({ id: getLastId(), ingredient, substitute, reason: reason || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM ingredient_substitutions WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
