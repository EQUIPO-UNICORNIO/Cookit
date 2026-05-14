const express = require('express');
const { queryAll, queryOne, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const sessions = await queryAll('SELECT id, recipe_name, steps, current_step, completed FROM cooking_sessions WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(sessions.map(s => ({ ...s, steps: JSON.parse(s.steps || '[]'), completed: !!s.completed })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { recipe_name, steps } = req.body;
    if (!recipe_name) return res.status(400).json({ error: 'Nombre de receta requerido' });
    await execute('INSERT INTO cooking_sessions (user_id, recipe_name, steps) VALUES (?, ?, ?)',
      [req.userId, recipe_name, JSON.stringify(steps || [])]);
    saveDb();
    res.status(201).json({ id: getLastId(), recipe_name, steps: steps || [], current_step: 0, completed: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/step', async (req, res) => {
  try {
    const { current_step } = req.body;
    const session = await queryOne('SELECT steps FROM cooking_sessions WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!session) return res.status(404).json({ error: 'No encontrado' });
    const steps = JSON.parse(session.steps || '[]');
    const completed = current_step >= steps.length - 1 ? 1 : 0;
    await execute('UPDATE cooking_sessions SET current_step=?, completed=? WHERE id=? AND user_id=?',
      [current_step, completed, req.params.id, req.userId]);
    saveDb();
    res.json({ success: true, completed: !!completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM cooking_sessions WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
