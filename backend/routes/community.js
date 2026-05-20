const express = require('express');
const supabase = require('../lib/supabase');
const { create, deleteById } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('id, content, likes, meal_id, meal_name, photo, ingredients, instructions, created_at, user_id, users!inner(name, avatar)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);

    const enriched = await Promise.all((posts || []).map(async (post) => {
      const { data: liked } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', req.userId)
        .maybeSingle();

      const { data: comments } = await supabase
        .from('post_comments')
        .select('id, content, created_at, user_id, users!inner(name, avatar)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });

      return {
        id: post.id, content: post.content, likes: post.likes,
        meal_id: post.meal_id, meal_name: post.meal_name, photo: post.photo,
        ingredients: JSON.parse(post.ingredients || '[]'),
        instructions: post.instructions, created_at: post.created_at,
        user_name: post.users?.name || '', user_avatar: post.users?.avatar || '',
        liked: !!liked, comments: (comments || []).map(c => ({
          id: c.id, content: c.content, created_at: c.created_at,
          user_name: c.users?.name || '', user_avatar: c.users?.avatar || ''
        }))
      };
    }));
    res.json(enriched);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { content, photo, ingredients, instructions } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });
    const post = await create('community_posts', {
      user_id: req.userId, content, photo: photo || '',
      ingredients: JSON.stringify(ingredients || []), instructions: instructions || ''
    });
    res.status(201).json({ ...post, ingredients: ingredients || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/like', async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', req.params.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('post_likes').delete().eq('id', existing.id);
      await supabase.rpc('decrement_likes', { post_id: req.params.id });
    } else {
      await supabase.from('post_likes').insert({ post_id: parseInt(req.params.id), user_id: req.userId });
      await supabase.rpc('increment_likes', { post_id: req.params.id });
    }
    res.json({ success: true, liked: !existing });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/comments', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });
    const { data: post } = await supabase.from('community_posts').select('id').eq('id', req.params.id).maybeSingle();
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    const { data: inserted, error } = await supabase
      .from('post_comments')
      .insert({ post_id: parseInt(req.params.id), user_id: req.userId, content })
      .select('id, content, created_at');
    if (error) throw new Error(error.message);
    res.status(201).json(inserted[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/:id/save', async (req, res) => {
  try {
    const { data: post } = await supabase
      .from('community_posts')
      .select('id, content, photo, ingredients, instructions')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    const ingredients = JSON.parse(post.ingredients || '[]');
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
    await create('meal_plans', {
      user_id: req.userId, name: post.content, day: today, meal_type: 'comida',
      recipe: post.content, ingredients: JSON.stringify(ingredients),
      instructions: post.instructions || '', photo: post.photo || ''
    });
    res.json({ success: true, message: 'Receta guardada en tus menús' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await supabase.from('post_likes').delete().eq('post_id', req.params.id);
    await supabase.from('post_comments').delete().eq('post_id', req.params.id);
    await deleteById('community_posts', req.params.id, req.userId);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
