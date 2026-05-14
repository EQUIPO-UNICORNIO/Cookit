const express = require('express');
const { queryAll, queryOne, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const challenges = await queryAll('SELECT id, title, description, progress, goal, completed FROM challenges WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    res.json(challenges.map(c => ({ ...c, completed: !!c.completed })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, description, goal } = req.body;
    if (!title) return res.status(400).json({ error: 'Título requerido' });
    await execute('INSERT INTO challenges (user_id, title, description, goal) VALUES (?, ?, ?, ?)', [req.userId, title, description || '', goal || 1]);
    saveDb();
    res.status(201).json({ id: getLastId(), title, description: description || '', progress: 0, goal: goal || 1, completed: false });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/progress', async (req, res) => {
  try {
    const { progress } = req.body;
    const chal = await queryOne('SELECT goal FROM challenges WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    if (!chal) return res.status(404).json({ error: 'No encontrado' });
    const completed = progress >= chal.goal ? 1 : 0;
    await execute('UPDATE challenges SET progress=?, completed=? WHERE id=? AND user_id=?', [progress, completed, req.params.id, req.userId]);
    saveDb();
    res.json({ success: true, completed: !!completed });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM challenges WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
