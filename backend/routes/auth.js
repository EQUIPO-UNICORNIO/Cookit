const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, create, updateById } = require('../config/database');
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

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (!authError && authData?.user?.id) {
      await supabase.from('users').update({ auth_id: authData.user.id }).eq('id', user.id);
    }
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

router.post('/google-login', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Token requerido' });

    const { data: { user: authUser }, error } = await supabase.auth.getUser(access_token);

    if (error || !authUser?.email) {
      console.error('Google login error:', error?.message || 'No email');
      return res.status(401).json({ error: 'Token de Google inválido' });
    }

    let user = await getOne('users', { email: authUser.email });

    if (!user) {
      const name = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
      user = await create('users', {
        name,
        email: authUser.email,
        password: '',
        email_confirmed: true,
        auth_id: authUser.id
      });
    } else if (!user.auth_id && authUser.id) {
      await supabase.from('users').update({ auth_id: authUser.id }).eq('id', user.id);
    }

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

router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nombre requerido' });
    await updateById('users', req.userId, { name: name.trim() });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Ambas contraseñas requeridas' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    const user = await getOne('users', { id: req.userId });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await updateById('users', req.userId, { password: hashed });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const user = await getOne('users', { id: req.userId });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const tables = ['recipe_history', 'meal_plans', 'community_posts', 'pantry_items', 'shopping_items', 'cooking_sessions', 'challenges', 'ingredient_substitutions', 'impact_logs', 'post_likes', 'post_comments'];
    for (const table of tables) {
      try { await supabase.from(table).delete().eq('user_id', req.userId); } catch (_) {}
    }

    await supabase.from('users').delete().eq('id', req.userId);

    let authId = user.auth_id;
    if (!authId) {
      try {
        const { data: listData } = await supabase.auth.admin.listUsers({ page: 0, perPage: 1000 });
        const match = listData?.users?.find(u => u.email === user.email);
        if (match) authId = match.id;
      } catch (_) {}
    }
    if (authId) {
      try { await supabase.auth.admin.deleteUser(authId); } catch (_) {}
    }

    res.json({ success: true, message: 'Cuenta eliminada' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/sync-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Token requerido' });
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
    if (error || !authUser) return res.status(401).json({ error: 'Token inválido' });
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Contraseña inválida' });
    const hashed = await bcrypt.hash(password, 10);
    await supabase.from('users').update({ password: hashed }).eq('email', authUser.email);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/reset-dev', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    const user = await getOne('users', { email });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const hashed = await bcrypt.hash(password, 10);
    await supabase.from('users').update({ password: hashed }).eq('email', email);
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
