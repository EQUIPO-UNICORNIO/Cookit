const express = require('express');
const { queryAll, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const logs = await queryAll('SELECT id, type, value, description, created_at FROM impact_logs WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
    const totals = await queryAll('SELECT type, SUM(value) as total FROM impact_logs WHERE user_id = ? GROUP BY type', [req.userId]);
    const summary = {};
    totals.forEach(row => { summary[row.type] = row.total; });
    res.json({ logs, summary });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, value, description } = req.body;
    if (!type) return res.status(400).json({ error: 'Tipo requerido' });
    await execute('INSERT INTO impact_logs (user_id, type, value, description) VALUES (?, ?, ?, ?)',
      [req.userId, type, value || 0, description || '']);
    saveDb();
    res.status(201).json({ id: getLastId(), type, value: value || 0, description: description || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
