const express = require('express');
const { getAll, getOne, create, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const history = await getAll('recipe_history', { user_id: req.userId }, { orderBy: 'created_at' });
    res.json(history);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { recipe_id, recipe_name, recipe_category, date } = req.body;
    if (recipe_id === undefined || recipe_id === null || !recipe_name) return res.status(400).json({ error: 'recipe_id y recipe_name requeridos' });
    const existing = await getOne('recipe_history', { user_id: req.userId, recipe_id });
    if (existing) return res.status(200).json(existing);
    const entry = await create('recipe_history', {
      user_id: req.userId, recipe_id, recipe_name, recipe_category: recipe_category || '', date: date || new Date().toLocaleDateString('es-ES')
    });
    res.status(201).json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:recipeId', async (req, res) => {
  try {
    const entry = await getOne('recipe_history', { user_id: req.userId, recipe_id: req.params.recipeId });
    if (entry) await deleteById('recipe_history', entry.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
