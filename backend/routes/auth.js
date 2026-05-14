const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, execute, getLastId, saveDb } = require('../config/database');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'El email ya está registrado' });

    const hashed = await bcrypt.hash(password, 10);
    await execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed]);
    const user = await queryOne('SELECT id, name, email, avatar FROM users WHERE email = ?', [email]);
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar || '' } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await queryOne('SELECT id, name, email, password, avatar FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar || '' } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await queryOne('SELECT id, name, email, avatar FROM users WHERE id = ?', [req.userId]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;
    await execute('UPDATE users SET avatar = ? WHERE id = ?', [avatar || '', req.userId]);
    saveDb();
    res.json({ success: true, avatar });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
