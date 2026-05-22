const express = require('express');
const { getAll, create, updateById, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const meals = await getAll('meal_plans', { user_id: req.userId }, { orderBy: 'day', direction: 'asc' });
    res.json(meals.map(m => ({ ...m, videoUrl: m.video_url || '', ingredients: JSON.parse(m.ingredients || '[]') })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, day, meal_type, recipe, ingredients, instructions, photo, videoUrl } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const meal = await create('meal_plans', {
      user_id: req.userId, name, day: day || '', meal_type: meal_type || 'comida',
      recipe: recipe || '', ingredients: JSON.stringify(ingredients || []),
      instructions: instructions || '', photo: photo || '', video_url: videoUrl || ''
    });
    res.status(201).json({ ...meal, ingredients: ingredients || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, day, meal_type, recipe, ingredients, instructions, photo, videoUrl } = req.body;
    await updateById('meal_plans', req.params.id, {
      name, day, meal_type, recipe, ingredients: JSON.stringify(ingredients || []),
      instructions, photo: photo || '', video_url: videoUrl || ''
    }, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteById('meal_plans', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
