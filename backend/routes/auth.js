const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, create, updateById, saveDb } = require('../config/database');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');
const supabase = require('../lib/supabase');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    const existing = await getOne('users', { email });
    if (existing) return res.status(400).json({ error: 'El email ya está registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await create('users', { name, email, password: hashed });

    const { error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (authError) console.error('Error creating auth user:', authError.message);

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

    const user = await getOne('users', { email });
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
    const user = await getOne('users', { id: req.userId });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ id: user.id, name: user.name, email: user.email, avatar: user.avatar });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/avatar', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;
    await updateById('users', req.userId, { avatar: avatar || '' });
    res.json({ success: true, avatar });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
