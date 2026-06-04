const express = require('express');
const { getAll, create, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const items = await getAll('recipe_history', { user_id: req.userId }, { orderBy: 'date', direction: 'desc' });
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { recipe_id, name, category } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const existing = await getAll('recipe_history', { user_id: req.userId, recipe_id: recipe_id || '' });
    if (existing.length > 0) return res.json(existing[0]);
    const item = await create('recipe_history', {
      user_id: req.userId, recipe_id: recipe_id || '', name, category: category || '',
      date: new Date().toISOString()
    });
    res.status(201).json(item);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteById('recipe_history', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
