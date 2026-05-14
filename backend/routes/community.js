const express = require('express');
const { queryAll, queryOne, execute, getLastId, saveDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const posts = await queryAll(
      `SELECT p.id, p.content, p.likes, p.meal_id, p.meal_name, p.photo, p.ingredients, p.instructions, p.created_at, u.name as user_name, u.avatar as user_avatar
       FROM community_posts p JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );
    const enriched = await Promise.all(posts.map(async (post) => {
      const liked = await queryOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, req.userId]);
      const comments = await queryAll(
        `SELECT c.id, c.content, c.created_at, u.name as user_name, u.avatar as user_avatar
         FROM post_comments c JOIN users u ON c.user_id = u.id
         WHERE c.post_id = ? ORDER BY c.created_at ASC`, [post.id]
      );
      return { ...post, liked: !!liked, comments, ingredients: JSON.parse(post.ingredients || '[]') };
    }));
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { content, photo, ingredients, instructions } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });
    await execute('INSERT INTO community_posts (user_id, content, photo, ingredients, instructions) VALUES (?, ?, ?, ?, ?)',
      [req.userId, content, photo || '', JSON.stringify(ingredients || []), instructions || '']);
    saveDb();
    res.status(201).json({ id: getLastId(), content, likes: 0, photo: photo || '', ingredients: ingredients || [], instructions: instructions || '' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', async (req, res) => {
  try {
    const existing = await queryOne('SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?', [req.params.id, req.userId]);
    if (existing) {
      await execute('DELETE FROM post_likes WHERE id = ?', [existing.id]);
      await execute('UPDATE community_posts SET likes = MAX(0, likes - 1) WHERE id = ?', [req.params.id]);
    } else {
      await execute('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [req.params.id, req.userId]);
      await execute('UPDATE community_posts SET likes = likes + 1 WHERE id = ?', [req.params.id]);
    }
    saveDb();
    res.json({ success: true, liked: !existing });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });
    const post = await queryOne('SELECT id FROM community_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    await execute('INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)', [req.params.id, req.userId, content]);
    saveDb();
    res.status(201).json({ id: getLastId(), content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/save', async (req, res) => {
  try {
    const post = await queryOne('SELECT id, user_id, content, photo, ingredients, instructions FROM community_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    const ingredients = JSON.parse(post.ingredients || '[]');
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    await execute('INSERT INTO meal_plans (user_id, name, day, meal_type, recipe, ingredients, instructions, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.userId, post.content, today, 'comida', post.content, JSON.stringify(ingredients), post.instructions || '', post.photo || '']);
    saveDb();
    res.json({ success: true, message: 'Receta guardada en tus menús' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await execute('DELETE FROM community_posts WHERE id=? AND user_id=?', [req.params.id, req.userId]);
    await execute('DELETE FROM post_likes WHERE post_id=?', [req.params.id]);
    await execute('DELETE FROM post_comments WHERE post_id=?', [req.params.id]);
    saveDb();
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
