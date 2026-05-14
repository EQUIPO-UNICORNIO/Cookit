const express = require('express');
const { queryAll, queryOne, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const meals = await queryAll('SELECT id, name, day, meal_type, recipe, ingredients, instructions, photo FROM meal_plans WHERE user_id = ? ORDER BY day ASC', [req.userId]);
    res.json(meals.map(m => ({ ...m, ingredients: JSON.parse(m.ingredients || '[]') })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, day, meal_type, recipe, ingredients, instructions, photo } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    await execute('INSERT INTO meal_plans (user_id, name, day, meal_type, recipe, ingredients, instructions, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, name, day || '', meal_type || 'comida', recipe || '', JSON.stringify(ingredients || []), instructions || '', photo || '']);
    saveDb();
    res.status(201).json({ id: getLastId(), name, day: day || '', meal_type: meal_type || 'comida', recipe: recipe || '', ingredients: ingredients || [], instructions: instructions || '', photo: photo || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, day, meal_type, recipe, ingredients, instructions, photo } = req.body;
    await execute('UPDATE meal_plans SET name=?, day=?, meal_type=?, recipe=?, ingredients=?, instructions=?, photo=? WHERE id=? AND user_id=?',
      [name, day, meal_type, recipe, JSON.stringify(ingredients || []), instructions, photo || '', req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM meal_plans WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
